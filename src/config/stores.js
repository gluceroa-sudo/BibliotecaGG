const bcrypt = require("bcryptjs");

const HASH = {
    admin: bcrypt.hashSync("Admin123!", 8),
    bibliotecario: bcrypt.hashSync("Biblioteca123!", 8),
    estudiante: bcrypt.hashSync("Estudiante123!", 8),
    docente: bcrypt.hashSync("Docente123!", 8)
};

function crearEstadoVacio() {
    return {
        usuarios: [],
        libros: [],
        prestamos: [],
        documentos: [],
        relaciones: [],
        actividades: [],
        cache: new Map(),
        seq: { usuario: 1, libro: 1, prestamo: 1, documento: 1, actividad: 1 },
        redisDisponible: true,
        neo4jDisponible: true,
        mongoDisponible: true,
        postgresDisponible: true
    };
}

function sembrar(estado) {
    estado.usuarios.push(
        {
            id: estado.seq.usuario++,
            nombre: "Giovanni Francia",
            correo: "giovanni@bibliotecagg.edu",
            password: HASH.admin,
            rol: "Administrador"
        },
        {
            id: estado.seq.usuario++,
            nombre: "Gerardo Lucero",
            correo: "gerardo@bibliotecagg.edu",
            password: HASH.bibliotecario,
            rol: "Bibliotecario"
        },
        {
            id: estado.seq.usuario++,
            nombre: "Ana Estudiante",
            correo: "ana@bibliotecagg.edu",
            password: HASH.estudiante,
            rol: "Estudiante"
        },
        {
            id: estado.seq.usuario++,
            nombre: "Luis Docente",
            correo: "luis@bibliotecagg.edu",
            password: HASH.docente,
            rol: "Docente"
        }
    );

    const libros = [
        {
            isbn: "9780132350884",
            titulo: "Clean Code",
            autor: "Robert C. Martin",
            editorial: "Prentice Hall",
            anio: 2008,
            resumen: "Guía de oficio para escribir código legible y mantenible.",
            etiquetas: ["software", "oficio"]
        },
        {
            isbn: "9788420471839",
            titulo: "Don Quijote de la Mancha",
            autor: "Miguel de Cervantes",
            editorial: "Alfaguara",
            anio: 1605,
            resumen: "Novela clásica de la literatura en español.",
            etiquetas: ["literatura", "clasico"]
        },
        {
            isbn: "9780307474728",
            titulo: "Cien años de soledad",
            autor: "Gabriel García Márquez",
            editorial: "Sudamericana",
            anio: 1967,
            resumen: "Relato del realismo mágico y la familia Buendía.",
            etiquetas: ["literatura", "latinoamerica"]
        }
    ];

    for (const item of libros) {
        const id = estado.seq.libro++;
        estado.libros.push({
            id,
            isbn: item.isbn,
            titulo: item.titulo,
            autor: item.autor,
            editorial: item.editorial,
            anio: item.anio,
            estado: "Disponible"
        });
        estado.documentos.push({
            id: estado.seq.documento++,
            coleccion: "catalogo",
            libroId: id,
            titulo: item.titulo,
            resumen: item.resumen,
            etiquetas: item.etiquetas,
            actualizadoEn: new Date().toISOString()
        });
        estado.relaciones.push({
            id: estado.relaciones.length + 1,
            tipo: "ESCRITO_POR",
            desde: `Libro:${id}`,
            hacia: `Autor:${item.autor}`
        });
    }

    return estado;
}

let estado = sembrar(crearEstadoVacio());

function getStores() {
    return estado;
}

function resetStores() {
    estado = sembrar(crearEstadoVacio());
    return estado;
}

module.exports = {
    getStores,
    resetStores,
    HASH
};
