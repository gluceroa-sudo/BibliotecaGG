const bcrypt = require("bcryptjs");
const env = require("../src/config/env");
const { sequelize } = require("../src/config/database");
const { Usuario, Libro } = require("../src/models");

const cuentas = [
    ["Giovanni Francia", "giovanni@bibliotecagg.edu", "Admin123!", "Administrador"],
    ["Gerardo Lucero", "gerardo@bibliotecagg.edu", "Biblioteca123!", "Bibliotecario"],
    ["Ana Estudiante", "ana@bibliotecagg.edu", "Estudiante123!", "Estudiante"],
    ["Luis Docente", "luis@bibliotecagg.edu", "Docente123!", "Docente"]
];

const libros = [
    ["9780132350884", "Clean Code", "Robert C. Martin", "Prentice Hall", 2008],
    ["9788420471839", "Don Quijote de la Mancha", "Miguel de Cervantes", "Alfaguara", 1605],
    ["9780307474728", "Cien años de soledad", "Gabriel García Márquez", "Sudamericana", 1967]
];

async function sembrar() {
    if (env.dbMode !== "postgres") {
        console.error("En el archivo .env, DB_MODE tiene que ser postgres. Ahora vale:", env.dbMode);
        process.exit(1);
    }

    await sequelize.authenticate();
    await sequelize.sync();

    for (const [nombre, correo, password, rol] of cuentas) {
        const [usuario, creado] = await Usuario.findOrCreate({
            where: { correo },
            defaults: {
                nombre,
                password: bcrypt.hashSync(password, 8),
                rol
            }
        });
        console.log(creado ? "Usuario creado:" : "Usuario ya existía:", usuario.correo);
    }

    for (const [isbn, titulo, autor, editorial, anio] of libros) {
        const [libro, creado] = await Libro.findOrCreate({
            where: { isbn },
            defaults: { titulo, autor, editorial, anio, estado: "Disponible" }
        });
        console.log(creado ? "Libro creado:" : "Libro ya existía:", libro.titulo);
    }

    console.log("Datos guardados en PostgreSQL.");
    const librosGuardados = await Libro.findAll();
    await sembrarMongo(librosGuardados);
    await sembrarNeo4j(librosGuardados);
    await sequelize.close();
}

async function sembrarMongo(librosGuardados) {
    if (!env.mongoUrl) {
        console.log("MongoDB: no hay MONGO_URL en .env. Se omite.");
        return;
    }
    const { MongoClient } = require("mongodb");
    const cliente = new MongoClient(env.mongoUrl);
    await cliente.connect();
    const catalogo = cliente.db().collection("catalogo");
    for (const libro of librosGuardados) {
        await catalogo.updateOne(
            { libroId: libro.id },
            {
                $set: {
                    coleccion: "catalogo",
                    libroId: libro.id,
                    titulo: libro.titulo,
                    resumen: "",
                    etiquetas: [],
                    actualizadoEn: new Date().toISOString()
                }
            },
            { upsert: true }
        );
        console.log("Ficha en MongoDB:", libro.titulo);
    }
    await cliente.close();
}

async function sembrarNeo4j(librosGuardados) {
    if (!env.neo4jUri) {
        console.log("Neo4j: no hay NEO4J_URI en .env. Se omite.");
        return;
    }
    const neo4j = require("neo4j-driver");
    const driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword));
    const sesion = driver.session();
    try {
        for (const libro of librosGuardados) {
            await sesion.run(
                "MERGE (l:Libro {id: $id}) SET l.titulo = $titulo MERGE (a:Autor {nombre: $autor}) MERGE (l)-[:ESCRITO_POR]->(a)",
                { id: libro.id, titulo: libro.titulo, autor: libro.autor }
            );
            console.log("Relación en Neo4j:", libro.titulo);
        }
    } finally {
        await sesion.close();
        await driver.close();
    }
}

sembrar().catch((error) => {
    console.error("No se pudo guardar en PostgreSQL.");
    console.error(error.message);
    process.exit(1);
});
