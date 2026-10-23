const env = require("./env");

let cliente = null;
let coleccionCatalogo = null;
let modo = "memory";

async function conectarMongo() {
    if (!env.mongoUrl) {
        modo = "memory";
        console.log("MongoDB: modo documental en memoria.");
        return { modo };
    }

    try {
        const { MongoClient } = require("mongodb");
        cliente = new MongoClient(env.mongoUrl);
        await cliente.connect();
        coleccionCatalogo = cliente.db().collection("catalogo");
        modo = "mongo";
        console.log("MongoDB conectado correctamente.");
        return { modo };
    } catch (error) {
        cliente = null;
        coleccionCatalogo = null;
        modo = "memory";
        console.error("MongoDB no disponible. Se usa el almacén documental en memoria.", error.message);
        return { modo, error: error.message };
    }
}

function estaMongoActivo() {
    return modo === "mongo";
}

function obtenerColeccion() {
    return coleccionCatalogo;
}

module.exports = {
    conectarMongo,
    obtenerColeccion,
    estaMongoActivo
};
