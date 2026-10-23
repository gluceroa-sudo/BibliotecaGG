const { beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const { createApp } = require("../../src/app");
const { reiniciarEstado } = require("../../src/bootstrap");
const { getStores } = require("../../src/config/stores");
const { circuitoNeo4j } = require("../../src/services/patrones/circuitBreaker");

let app;

beforeEach(() => {
    reiniciarEstado();
    app = createApp();
});

async function tokenDe(correo, password) {
    const respuesta = await request(app).post("/api/v1/auth/login").send({ correo, password });
    assert.equal(respuesta.status, 200);
    return respuesta.body.datos.token;
}

test("el login correcto emite JWT y el incorrecto responde problem+json", async () => {
    const ok = await request(app).post("/api/v1/auth/login").send({
        correo: "gerardo@bibliotecagg.edu",
        password: "Biblioteca123!"
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.datos.usuario.rol, "Bibliotecario");
    assert.equal(typeof ok.body.datos.token, "string");
    assert.equal(ok.body.datos.usuario.password, undefined);

    const mal = await request(app).post("/api/v1/auth/login").send({
        correo: "gerardo@bibliotecagg.edu",
        password: "clave-incorrecta"
    });
    assert.equal(mal.status, 401);
    assert.match(mal.headers["content-type"], /application\/problem\+json/);
    assert.equal(mal.body.title, "No autorizado");
    assert.equal(mal.body.status, 401);
});

test("el catálogo usa caché y el alta replica en el grafo", async () => {
    const primero = await request(app).get("/api/v1/libros");
    assert.equal(primero.status, 200);
    assert.equal(primero.body.meta.cache, "miss");
    assert.equal(primero.body.meta.total, 3);

    const segundo = await request(app).get("/api/v1/libros");
    assert.equal(segundo.body.meta.cache, "hit");
    assert.equal(segundo.body.meta.fuente, "redis");

    const filtrado = await request(app).get("/api/v1/libros").query({ titulo: "Quijote" });
    assert.equal(filtrado.body.datos.length, 1);
    assert.equal(filtrado.body.datos[0].autor, "Miguel de Cervantes");

    const token = await tokenDe("gerardo@bibliotecagg.edu", "Biblioteca123!");
    const creado = await request(app)
        .post("/api/v1/libros")
        .set("Authorization", `Bearer ${token}`)
        .send({
            isbn: "9780134685991",
            titulo: "Effective Java",
            autor: "Joshua Bloch",
            editorial: "Addison-Wesley",
            anio: 2018,
            resumen: "Oficio en Java.",
            etiquetas: ["java"]
        });
    assert.equal(creado.status, 201);
    assert.equal(creado.body.meta.postgresql, "confirmado");
    assert.equal(creado.body.meta.mongodb, "replicado");
    assert.equal(creado.body.meta.neo4j, "relacion-autor-creada");
    assert.equal(creado.body.meta.consistencia, "eventual");

    const detalle = await request(app).get(`/api/v1/libros/${creado.body.datos.id}`);
    assert.equal(detalle.status, 200);
    assert.equal(detalle.body.datos.titulo, "Effective Java");
    assert.deepEqual(detalle.body.datos.etiquetas, ["java"]);

    const duplicado = await request(app)
        .post("/api/v1/libros")
        .set("Authorization", `Bearer ${token}`)
        .send({ isbn: "9780134685991", titulo: "Otro", autor: "Otro" });
    assert.equal(duplicado.status, 409);
    assert.match(duplicado.headers["content-type"], /application\/problem\+json/);

    const incompleto = await request(app)
        .post("/api/v1/libros")
        .set("Authorization", `Bearer ${token}`)
        .send({ titulo: "Sin isbn" });
    assert.equal(incompleto.status, 400);
    assert.ok(incompleto.body.errors.some((item) => item.campo === "isbn"));
});

test("el préstamo aplica la política, marca el libro y rechaza uno inexistente", async () => {
    const token = await tokenDe("gerardo@bibliotecagg.edu", "Biblioteca123!");
    const prestamo = await request(app)
        .post("/api/v1/prestamos")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuarioId: 3, libroId: 1, fechaPrestamo: "2026-10-22T00:00:00.000Z" });

    assert.equal(prestamo.status, 201);
    assert.equal(prestamo.body.meta.politica, "Estudiante");
    assert.equal(prestamo.body.meta.dias, 7);
    assert.equal(prestamo.body.datos.fechaDevolucion, "2026-10-29T00:00:00.000Z");
    assert.equal(prestamo.body.datos.Libro.estado, "Prestado");

    const detalle = await request(app).get("/api/v1/libros/1");
    assert.equal(detalle.body.datos.estado, "Prestado");
    assert.ok(getStores().relaciones.some((item) => item.tipo === "PRESTO" && item.prestamoId === prestamo.body.datos.id));
    assert.ok(getStores().actividades.some((item) => item.tipo === "PRESTAMO_REGISTRADO"));

    const ocupado = await request(app)
        .post("/api/v1/prestamos")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuarioId: 3, libroId: 1 });
    assert.equal(ocupado.status, 409);

    const fantasma = await request(app)
        .post("/api/v1/prestamos")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuarioId: 3, libroId: 999 });
    assert.equal(fantasma.status, 404);
    assert.equal(fantasma.body.title, "Recurso no encontrado");

    const sinToken = await request(app).post("/api/v1/prestamos").send({ usuarioId: 3, libroId: 2 });
    assert.equal(sinToken.status, 401);
});

test("el tope de la política de estudiante bloquea el tercer préstamo activo", async () => {
    const token = await tokenDe("gerardo@bibliotecagg.edu", "Biblioteca123!");
    for (const libroId of [1, 2]) {
        const respuesta = await request(app)
            .post("/api/v1/prestamos")
            .set("Authorization", `Bearer ${token}`)
            .send({ usuarioId: 3, libroId });
        assert.equal(respuesta.status, 201);
    }
    const tercero = await request(app)
        .post("/api/v1/prestamos")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuarioId: 3, libroId: 3 });
    assert.equal(tercero.status, 409);
    assert.match(tercero.body.detail, /máximo 2/);
});

test("si Neo4j falla el préstamo se confirma y la relación queda pendiente", async () => {
    circuitoNeo4j.umbralFallos = 1;
    getStores().neo4jDisponible = false;
    const token = await tokenDe("gerardo@bibliotecagg.edu", "Biblioteca123!");
    const respuesta = await request(app)
        .post("/api/v1/prestamos")
        .set("Authorization", `Bearer ${token}`)
        .send({ usuarioId: 4, libroId: 2 });

    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.body.meta.neo4j, "pendiente");
    assert.equal(respuesta.body.meta.consistencia, "eventual");
    assert.equal(circuitoNeo4j.estado, "abierto");
    assert.equal(getStores().libros.find((libro) => libro.id === 2).estado, "Prestado");
    assert.ok(getStores().actividades.some((item) => item.tipo === "CONSISTENCIA_PENDIENTE"));
});

test("el administrador registra usuarios y rechaza un correo duplicado", async () => {
    const token = await tokenDe("giovanni@bibliotecagg.edu", "Admin123!");
    const creado = await request(app)
        .post("/api/v1/usuarios")
        .set("Authorization", `Bearer ${token}`)
        .send({
            nombre: "Maria Lectora",
            correo: "Maria@BibliotecaGG.edu",
            password: "Lectora123!",
            rol: "Estudiante"
        });
    assert.equal(creado.status, 201);
    assert.equal(creado.body.datos.correo, "maria@bibliotecagg.edu");
    assert.equal(creado.body.datos.password, undefined);

    const duplicado = await request(app)
        .post("/api/v1/usuarios")
        .set("Authorization", `Bearer ${token}`)
        .send({
            nombre: "Otra Maria",
            correo: "maria@bibliotecagg.edu",
            password: "Lectora123!"
        });
    assert.equal(duplicado.status, 409);

    const lista = await request(app)
        .get("/api/v1/usuarios")
        .set("Authorization", `Bearer ${token}`);
    assert.equal(lista.status, 200);
    assert.equal(lista.body.datos.some((usuario) => usuario.password), false);
});
