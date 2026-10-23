const env = require("./env");

let driver = null;
let modo = "memory";

async function conectarNeo4j() {
    if (!env.neo4jUri) {
        modo = "memory";
        console.log("Neo4j: grafo en memoria (autoría y préstamos).");
        return { modo };
    }

    try {
        const neo4j = require("neo4j-driver");
        driver = neo4j.driver(env.neo4jUri, neo4j.auth.basic(env.neo4jUser, env.neo4jPassword));
        await driver.verifyConnectivity();
        modo = "neo4j";
        console.log("Neo4j conectado correctamente.");
        return { modo };
    } catch (error) {
        console.error("Neo4j no disponible. Se usa el grafo en memoria.", error.message);
        driver = null;
        modo = "memory";
        return { modo, error: error.message };
    }
}

function estaNeo4jActivo() {
    return modo === "neo4j";
}

function obtenerDriverNeo4j() {
    return driver;
}

module.exports = {
    conectarNeo4j,
    obtenerDriverNeo4j,
    estaNeo4jActivo
};
