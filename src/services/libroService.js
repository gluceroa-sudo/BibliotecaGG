const env = require("../config/env");
const libroRepository = require("./repositorios/libroRepository");
const mongoGateway = require("./gateways/mongoGateway");
const redisGateway = require("./gateways/redisGateway");
const neo4jGateway = require("./gateways/neo4jGateway");
const { cacheAside } = require("./patrones/cacheAside");
const { busEventos } = require("./patrones/observer");
const { problemaValidacion, problemaNoEncontrado, problemaConflicto } = require("../domain/problemas");

function claveListado(titulo, estado) {
    return `libros:${(titulo || "").toLowerCase()}:${estado || ""}`;
}

async function enriquecer(libros) {
    const documentos = await mongoGateway.buscarCatalogo();
    return libros.map((libro) => {
        const documento = documentos.find((item) => item.libroId === libro.id);
        return {
            ...libro,
            resumen: documento ? documento.resumen : null,
            etiquetas: documento ? documento.etiquetas : []
        };
    });
}

async function listar({ titulo, estado } = {}) {
    const resultado = await cacheAside(
        claveListado(titulo, estado),
        env.cacheTtlSegundos,
        async () => enriquecer(await libroRepository.buscar({ titulo, estado })),
        "postgresql+mongodb"
    );
    return {
        datos: resultado.datos,
        meta: {
            cache: resultado.cache,
            fuente: resultado.fuente,
            ttlSegundos: resultado.ttlSegundos,
            total: resultado.datos.length
        }
    };
}

async function obtenerPorId(id) {
    const numerico = Number(id);
    if (!Number.isInteger(numerico) || numerico <= 0) {
        throw problemaValidacion("El identificador del libro no es válido.", [
            { campo: "id", mensaje: "Debe ser un entero positivo." }
        ]);
    }

    const resultado = await cacheAside(
        `libro:${numerico}`,
        env.cacheDetalleTtlSegundos,
        async () => {
            const libro = await libroRepository.buscarPorId(numerico);
            if (!libro) {
                return null;
            }
            const [enriquecido] = await enriquecer([libro]);
            return enriquecido;
        },
        "postgresql+mongodb"
    );

    if (!resultado.datos) {
        throw problemaNoEncontrado(`No existe un libro con el identificador ${numerico}.`);
    }

    return {
        datos: resultado.datos,
        meta: {
            cache: resultado.cache,
            fuente: resultado.fuente,
            ttlSegundos: resultado.ttlSegundos
        }
    };
}

async function crear(datos) {
    const errores = [];
    const isbn = datos.isbn ? String(datos.isbn).trim() : "";
    const titulo = datos.titulo ? String(datos.titulo).trim() : "";
    const autor = datos.autor ? String(datos.autor).trim() : "";
    if (!isbn) {
        errores.push({ campo: "isbn", mensaje: "El ISBN es obligatorio." });
    }
    if (!titulo) {
        errores.push({ campo: "titulo", mensaje: "El título es obligatorio." });
    }
    if (!autor) {
        errores.push({ campo: "autor", mensaje: "El autor es obligatorio." });
    }
    if (datos.anio !== undefined && datos.anio !== null && !Number.isInteger(Number(datos.anio))) {
        errores.push({ campo: "anio", mensaje: "El año debe ser numérico." });
    }
    if (errores.length > 0) {
        throw problemaValidacion("No se puede registrar el libro.", errores);
    }

    const duplicado = await libroRepository.buscarPorIsbn(isbn);
    if (duplicado) {
        throw problemaConflicto(`Ya existe un libro con el ISBN ${isbn}.`);
    }

    const libro = await libroRepository.crear({
        isbn,
        titulo,
        autor,
        editorial: datos.editorial ? String(datos.editorial).trim() : null,
        anio: datos.anio ? Number(datos.anio) : null
    });

    let mongo = "replicado";
    try {
        await mongoGateway.guardarDocumentoCatalogo(libro, {
            resumen: datos.resumen || "",
            etiquetas: Array.isArray(datos.etiquetas) ? datos.etiquetas : []
        });
    } catch (error) {
        mongo = "pendiente";
        await mongoGateway.registrarActividad({
            tipo: "CONSISTENCIA_PENDIENTE",
            destino: "mongodb",
            detalle: error.message,
            referencia: libro.id
        });
    }

    const neo4j = await neo4jGateway.relacionarAutor(libro);
    await redisGateway.eliminarPorPrefijo("libros:");
    await redisGateway.eliminarPorPrefijo("libro:");
    await busEventos.publicar("libro.creado", { libro });

    return {
        datos: (await enriquecer([libro]))[0],
        meta: {
            postgresql: "confirmado",
            mongodb: mongo,
            neo4j: neo4j ? "relacion-autor-creada" : "pendiente",
            consistencia: "eventual"
        }
    };
}

module.exports = {
    listar,
    obtenerPorId,
    crear
};
