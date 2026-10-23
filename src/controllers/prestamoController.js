const prestamoService = require("../services/prestamoService");

async function listar(req, res, next) {
    try {
        res.json(await prestamoService.listar());
    } catch (error) {
        next(error);
    }
}

async function crear(req, res, next) {
    try {
        res.status(201).json(await prestamoService.crear(req.body || {}));
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listar,
    crear
};
