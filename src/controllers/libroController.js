const libroService = require("../services/libroService");

async function listar(req, res, next) {
    try {
        res.json(await libroService.listar({
            titulo: req.query.titulo,
            estado: req.query.estado
        }));
    } catch (error) {
        next(error);
    }
}

async function obtener(req, res, next) {
    try {
        res.json(await libroService.obtenerPorId(req.params.id));
    } catch (error) {
        next(error);
    }
}

async function crear(req, res, next) {
    try {
        res.status(201).json(await libroService.crear(req.body || {}));
    } catch (error) {
        next(error);
    }
}

module.exports = {
    listar,
    obtener,
    crear
};
