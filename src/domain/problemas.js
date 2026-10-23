class ProblemaHttp extends Error {
    constructor({ status, titulo, detalle, tipo, errores }) {
        super(detalle);
        this.name = "ProblemaHttp";
        this.status = status;
        this.titulo = titulo;
        this.detalle = detalle;
        this.tipo = tipo;
        this.errores = errores;
    }
}

const base = "https://bibliotecagg.local/problems";

function problemaValidacion(detalle, errores) {
    return new ProblemaHttp({
        status: 400,
        titulo: "Solicitud inválida",
        detalle,
        tipo: `${base}/solicitud-invalida`,
        errores
    });
}

function problemaNoAutorizado(detalle = "Credenciales inválidas o token ausente.") {
    return new ProblemaHttp({
        status: 401,
        titulo: "No autorizado",
        detalle,
        tipo: `${base}/no-autorizado`
    });
}

function problemaProhibido(detalle = "El rol autenticado no puede realizar esta operación.") {
    return new ProblemaHttp({
        status: 403,
        titulo: "Prohibido",
        detalle,
        tipo: `${base}/prohibido`
    });
}

function problemaNoEncontrado(detalle) {
    return new ProblemaHttp({
        status: 404,
        titulo: "Recurso no encontrado",
        detalle,
        tipo: `${base}/no-encontrado`
    });
}

function problemaConflicto(detalle) {
    return new ProblemaHttp({
        status: 409,
        titulo: "Conflicto de negocio",
        detalle,
        tipo: `${base}/conflicto`
    });
}

module.exports = {
    ProblemaHttp,
    problemaValidacion,
    problemaNoAutorizado,
    problemaProhibido,
    problemaNoEncontrado,
    problemaConflicto
};
