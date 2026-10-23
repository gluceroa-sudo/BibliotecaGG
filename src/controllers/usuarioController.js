const authController = require("./authController");

module.exports = {
    obtenerUsuarios: authController.listar,
    crearUsuario: authController.crear
};
