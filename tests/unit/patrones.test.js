const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calcularDevolucion, obtenerPolitica } = require("../../src/services/patrones/strategy");
const { CircuitBreaker } = require("../../src/services/patrones/circuitBreaker");

test("la política de estudiante presta 7 días y máximo 2 libros", () => {
    const politica = obtenerPolitica("Estudiante");
    assert.equal(politica.dias, 7);
    assert.equal(politica.maxActivos, 2);
});

test("la política de docente presta 21 días", () => {
    const resultado = calcularDevolucion("Docente", "2026-10-22T00:00:00.000Z");
    assert.equal(resultado.fechaDevolucion, "2026-11-12T00:00:00.000Z");
    assert.equal(resultado.dias, 21);
});

test("un rol desconocido usa la política de estudiante", () => {
    const resultado = calcularDevolucion("Visitante", "2026-10-01T00:00:00.000Z");
    assert.equal(resultado.politica, "Estudiante");
    assert.equal(resultado.fechaDevolucion, "2026-10-08T00:00:00.000Z");
});

test("el circuit breaker abre tras el umbral y usa la alternativa", async () => {
    const circuito = new CircuitBreaker({ nombre: "prueba", umbralFallos: 2, tiempoReintentoMs: 60000 });
    await assert.rejects(() => circuito.ejecutar(async () => {
        throw new Error("fallo");
    }));
    const resultado = await circuito.ejecutar(async () => {
        throw new Error("fallo");
    }, async () => "respaldo");
    assert.equal(resultado, "respaldo");
    assert.equal(circuito.estado, "abierto");
    const mientrasAbierto = await circuito.ejecutar(async () => "no debe correr", async () => "abierto");
    assert.equal(mientrasAbierto, "abierto");
});
