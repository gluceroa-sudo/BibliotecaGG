const postgresGateway = require("../gateways/postgresGateway");

module.exports = {
    buscar: postgresGateway.buscarLibros,
    buscarPorId: postgresGateway.buscarLibroPorId,
    buscarPorIsbn: postgresGateway.buscarLibroPorIsbn,
    crear: postgresGateway.crearLibro,
    actualizar: postgresGateway.actualizarLibro
};
