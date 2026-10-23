const libroRepository = require("./repositorios/libroRepository");
const mongoGateway = require("./gateways/mongoGateway");
const neo4jGateway = require("./gateways/neo4jGateway");
const { busEventos } = require("./patrones/observer");

function registrarObservadores() {
    busEventos.limpiar();

    busEventos.suscribir("prestamo.registrado", async ({ libro }) => {
        await libroRepository.actualizar(libro.id, { estado: "Prestado" });
    });

    busEventos.suscribir("prestamo.registrado", async ({ prestamo, libro, usuario }) => {
        await mongoGateway.registrarActividad({
            tipo: "PRESTAMO_REGISTRADO",
            detalle: `${usuario.nombre} recibió «${libro.titulo}»`,
            referencia: prestamo.id,
            destino: "mongodb"
        });
    });

    busEventos.suscribir("prestamo.registrado", async ({ prestamo, usuario, libro }) => {
        const ok = await neo4jGateway.vincularPrestamo({
            prestamoId: prestamo.id,
            usuarioId: usuario.id,
            libroId: libro.id
        });
        if (!ok) {
            throw new Error("La relación de préstamo quedó pendiente en el grafo.");
        }
    });

    busEventos.suscribir("libro.creado", async ({ libro }) => {
        await mongoGateway.registrarActividad({
            tipo: "LIBRO_REGISTRADO",
            detalle: `Alta de catálogo: ${libro.titulo}`,
            referencia: libro.id,
            destino: "mongodb"
        });
    });
}

module.exports = {
    registrarObservadores
};
