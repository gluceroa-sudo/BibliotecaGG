const { getStores } = require("../../config/stores");
const { obtenerClienteRedis } = require("../../config/redis");
const { circuitoRedis } = require("../patrones/circuitBreaker");

async function obtener(clave) {
    return circuitoRedis.ejecutar(async () => {
        const cliente = obtenerClienteRedis();
        if (cliente) {
            const valor = await cliente.get(clave);
            return valor ? JSON.parse(valor) : null;
        }

        const stores = getStores();
        if (!stores.redisDisponible) {
            throw new Error("Redis no disponible");
        }
        const item = stores.cache.get(clave);
        if (!item) {
            return null;
        }
        if (Date.now() >= item.expiresAt) {
            stores.cache.delete(clave);
            return null;
        }
        return item.value;
    }, async () => null);
}

async function guardar(clave, valor, ttlSegundos) {
    return circuitoRedis.ejecutar(async () => {
        const cliente = obtenerClienteRedis();
        if (cliente) {
            await cliente.set(clave, JSON.stringify(valor), { EX: ttlSegundos });
            return true;
        }
        const stores = getStores();
        if (!stores.redisDisponible) {
            throw new Error("Redis no disponible");
        }
        stores.cache.set(clave, {
            value: valor,
            expiresAt: Date.now() + (ttlSegundos * 1000)
        });
        return true;
    }, async () => false);
}

async function eliminarPorPrefijo(prefijo) {
    const cliente = obtenerClienteRedis();
    if (cliente) {
        const claves = await cliente.keys(`${prefijo}*`);
        if (claves.length > 0) {
            await cliente.del(claves);
        }
        return;
    }
    const cache = getStores().cache;
    for (const clave of cache.keys()) {
        if (clave.startsWith(prefijo)) {
            cache.delete(clave);
        }
    }
}

module.exports = {
    obtener,
    guardar,
    eliminarPorPrefijo
};
