const { getStores } = require("../../config/stores");
const { obtenerDriverNeo4j } = require("../../config/neo4j");
const { circuitoNeo4j } = require("../patrones/circuitBreaker");
const mongoGateway = require("./mongoGateway");

async function ejecutar(operacion, contexto) {
    return circuitoNeo4j.ejecutar(operacion, async (error) => {
        await mongoGateway.registrarActividad({
            tipo: "CONSISTENCIA_PENDIENTE",
            destino: "neo4j",
            detalle: error.message,
            referencia: contexto
        });
        return false;
    });
}

async function relacionarAutor(libro) {
    return ejecutar(async () => {
        const driver = obtenerDriverNeo4j();
        if (driver) {
            const sesion = driver.session();
            try {
                await sesion.run(
                    "MERGE (l:Libro {id: $id}) SET l.titulo = $titulo MERGE (a:Autor {nombre: $autor}) MERGE (l)-[:ESCRITO_POR]->(a)",
                    { id: libro.id, titulo: libro.titulo, autor: libro.autor }
                );
            } finally {
                await sesion.close();
            }
            return true;
        }

        const stores = getStores();
        if (!stores.neo4jDisponible) {
            throw new Error("Neo4j no disponible");
        }
        stores.relaciones.push({
            id: stores.relaciones.length + 1,
            tipo: "ESCRITO_POR",
            desde: `Libro:${libro.id}`,
            hacia: `Autor:${libro.autor}`
        });
        return true;
    }, `libro:${libro.id}`);
}

async function vincularPrestamo({ prestamoId, usuarioId, libroId }) {
    return ejecutar(async () => {
        const driver = obtenerDriverNeo4j();
        if (driver) {
            const sesion = driver.session();
            try {
                await sesion.run(
                    "MERGE (u:Usuario {id: $usuarioId}) MERGE (l:Libro {id: $libroId}) MERGE (u)-[:PRESTO {prestamoId: $prestamoId}]->(l)",
                    { usuarioId, libroId, prestamoId }
                );
            } finally {
                await sesion.close();
            }
            return true;
        }

        const stores = getStores();
        if (!stores.neo4jDisponible) {
            throw new Error("Neo4j no disponible");
        }
        stores.relaciones.push({
            id: stores.relaciones.length + 1,
            tipo: "PRESTO",
            desde: `Usuario:${usuarioId}`,
            hacia: `Libro:${libroId}`,
            prestamoId
        });
        return true;
    }, `prestamo:${prestamoId}`);
}

function listarRelaciones() {
    return getStores().relaciones.map((item) => ({ ...item }));
}

module.exports = {
    relacionarAutor,
    vincularPrestamo,
    listarRelaciones
};
