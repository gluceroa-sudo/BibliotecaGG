const { beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const { reiniciarEstado } = require("../../src/bootstrap");
const { cacheAside } = require("../../src/services/patrones/cacheAside");
const redisGateway = require("../../src/services/gateways/redisGateway");
const { getStores } = require("../../src/config/stores");

beforeEach(() => {
    reiniciarEstado();
});

test("cache-aside consulta el origen solo en el primer acceso", async () => {
    let lecturas = 0;
    const cargar = async () => {
        lecturas += 1;
        return [{ id: 1, titulo: "Clean Code" }];
    };

    const primero = await cacheAside("libros:test", 60, cargar, "postgresql");
    const segundo = await cacheAside("libros:test", 60, cargar, "postgresql");

    assert.equal(primero.cache, "miss");
    assert.equal(primero.fuente, "postgresql");
    assert.equal(segundo.cache, "hit");
    assert.equal(segundo.fuente, "redis");
    assert.equal(lecturas, 1);
});

test("una entrada con TTL agotado deja de ser un acierto", async () => {
    await redisGateway.guardar("clave", { ok: true }, 0);
    const valor = await redisGateway.obtener("clave");
    assert.equal(valor, null);
    assert.equal(getStores().cache.has("clave"), false);
});
