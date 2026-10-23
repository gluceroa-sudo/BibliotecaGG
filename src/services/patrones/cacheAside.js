const redisGateway = require("../gateways/redisGateway");

async function cacheAside(clave, ttlSegundos, cargar, fuenteOrigen = "postgresql") {
    const cacheado = await redisGateway.obtener(clave);
    if (cacheado !== null && cacheado !== undefined) {
        return {
            datos: cacheado,
            cache: "hit",
            fuente: "redis",
            ttlSegundos
        };
    }

    const datos = await cargar();
    await redisGateway.guardar(clave, datos, ttlSegundos);
    return {
        datos,
        cache: "miss",
        fuente: fuenteOrigen,
        ttlSegundos
    };
}

module.exports = {
    cacheAside
};
