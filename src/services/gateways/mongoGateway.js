const { getStores } = require("../../config/stores");
const { obtenerColeccion } = require("../../config/mongo");

function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
}

async function guardarDocumentoCatalogo(libro, extra = {}) {
    const coleccion = obtenerColeccion();
    const documento = {
        coleccion: "catalogo",
        libroId: libro.id,
        titulo: libro.titulo,
        resumen: extra.resumen || "",
        etiquetas: extra.etiquetas || [],
        actualizadoEn: new Date().toISOString()
    };

    if (coleccion) {
        await coleccion.updateOne({ libroId: libro.id }, { $set: documento }, { upsert: true });
        return documento;
    }

    const stores = getStores();
    if (!stores.mongoDisponible) {
        throw new Error("MongoDB no disponible");
    }
    const previo = stores.documentos.find((item) => item.coleccion === "catalogo" && item.libroId === libro.id);
    if (previo) {
        Object.assign(previo, documento);
        return clonar(previo);
    }
    const nuevo = { id: stores.seq.documento++, ...documento };
    stores.documentos.push(nuevo);
    return clonar(nuevo);
}

async function buscarCatalogo() {
    const coleccion = obtenerColeccion();
    if (coleccion) {
        const documentos = await coleccion.find({ coleccion: "catalogo" }).toArray();
        return documentos.map((documento) => ({
            libroId: documento.libroId,
            titulo: documento.titulo,
            resumen: documento.resumen || "",
            etiquetas: documento.etiquetas || []
        }));
    }
    return getStores().documentos.filter((item) => item.coleccion === "catalogo").map(clonar);
}

async function registrarActividad(evento) {
    const actividad = {
        tipo: evento.tipo,
        detalle: evento.detalle || "",
        referencia: evento.referencia || null,
        destino: evento.destino || "bitacora",
        ocurridoEn: new Date().toISOString()
    };
    const coleccion = obtenerColeccion();
    if (coleccion) {
        await coleccion.db.collection("actividades").insertOne(actividad);
        return actividad;
    }

    const stores = getStores();
    const registro = { id: stores.seq.actividad++, ...actividad };
    stores.actividades.push(registro);
    return clonar(registro);
}

module.exports = {
    guardarDocumentoCatalogo,
    buscarCatalogo,
    registrarActividad
};
