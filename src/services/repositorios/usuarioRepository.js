const postgresGateway = require("../gateways/postgresGateway");

module.exports = {
    buscarPorCorreo: postgresGateway.buscarUsuarioPorCorreo,
    buscarPorId: postgresGateway.buscarUsuarioPorId,
    listar: postgresGateway.listarUsuarios,
    crear: postgresGateway.crearUsuario
};
