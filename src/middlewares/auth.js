const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { problemaNoAutorizado, problemaProhibido } = require("../domain/problemas");

function autenticar(req, res, next) {
    const encabezado = req.headers.authorization || "";
    const [esquema, token] = encabezado.split(" ");
    if (esquema !== "Bearer" || !token) {
        return next(problemaNoAutorizado("Debe enviar un token Bearer vigente."));
    }

    try {
        req.usuario = jwt.verify(token, env.jwtSecret);
        return next();
    } catch (error) {
        return next(problemaNoAutorizado("El token es inválido o expiró."));
    }
}

function requerirRol(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.rol)) {
            return next(problemaProhibido());
        }
        return next();
    };
}

module.exports = {
    autenticar,
    requerirRol
};
