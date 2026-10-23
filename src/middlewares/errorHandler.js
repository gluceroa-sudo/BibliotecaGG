function manejadorErrores(err, req, res, next) {
    const status = err.status || 500;
    const cuerpo = {
        type: err.tipo || "https://bibliotecagg.local/problems/error-interno",
        title: err.titulo || "Error interno",
        status,
        detail: status === 500
            ? "Ocurrió un error inesperado al procesar la solicitud."
            : (err.detalle || err.message),
        instance: req.originalUrl
    };

    if (err.errores) {
        cuerpo.errors = err.errores;
    }

    if (status === 500) {
        console.error(err);
    }

    res.status(status).type("application/problem+json").json(cuerpo);
}

function recursoNoEncontrado(req, res) {
    res.status(404).type("application/problem+json").json({
        type: "https://bibliotecagg.local/problems/ruta-no-encontrada",
        title: "Ruta no encontrada",
        status: 404,
        detail: `No existe un endpoint para ${req.method} ${req.originalUrl}.`,
        instance: req.originalUrl
    });
}

module.exports = {
    manejadorErrores,
    recursoNoEncontrado
};
