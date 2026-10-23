const postgresGateway = require("../gateways/postgresGateway");

module.exports = {
    crear: postgresGateway.crearPrestamo,
    listar: postgresGateway.listarPrestamos,
    contarActivos: postgresGateway.contarPrestamosActivos
};
