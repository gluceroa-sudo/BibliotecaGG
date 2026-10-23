const authService = require("../services/authService");

async function login(req, res, next) {
    try {
        res.json(await authService.login(req.body || {}));
    } catch (error) {
        next(error);
    }
}

async function crear(req, res, next) {
    try {
        res.status(201).json(await authService.registrar(req.body || {}));
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        res.json(await authService.listar());
    } catch (error) {
        next(error);
    }
}

module.exports = {
    login,
    crear,
    listar
};
