const env = require("./env");

let cliente = null;
let modo = "memory";

async function conectarRedis() {
    if (!env.redisUrl) {
        modo = "memory";
        console.log("Redis: caché en memoria con TTL (Cache-Aside).");
        return { modo };
    }

    try {
        const { createClient } = require("redis");
        cliente = createClient({ url: env.redisUrl });
        cliente.on("error", (error) => {
            console.error("Redis:", error.message);
        });
        await cliente.connect();
        modo = "redis";
        console.log("Redis conectado correctamente.");
        return { modo };
    } catch (error) {
        console.error("Redis no disponible. Se usa la caché en memoria.", error.message);
        cliente = null;
        modo = "memory";
        return { modo, error: error.message };
    }
}

function estaRedisActivo() {
    return modo === "redis";
}

function obtenerClienteRedis() {
    return cliente;
}

module.exports = {
    conectarRedis,
    obtenerClienteRedis,
    estaRedisActivo
};
