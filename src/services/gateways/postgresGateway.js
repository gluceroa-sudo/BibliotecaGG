const { getStores } = require("../../config/stores");
const { estaPostgresActivo } = require("../../config/database");
const { Op } = require("sequelize");

function clonar(valor) {
    return JSON.parse(JSON.stringify(valor));
}

function usarPostgres() {
    return estaPostgresActivo();
}

function modelos() {
    return require("../../models");
}

async function buscarLibros({ titulo, estado } = {}) {
    if (usarPostgres()) {
        const { Libro } = modelos();
        const where = {};
        if (estado) {
            where.estado = estado;
        }
        if (titulo) {
            where.titulo = { [Op.iLike]: `%${titulo}%` };
        }
        const filas = await Libro.findAll({ where, order: [["id", "ASC"]] });
        return filas.map((fila) => fila.get({ plain: true }));
    }

    return getStores().libros
        .filter((libro) => {
            if (estado && libro.estado !== estado) {
                return false;
            }
            if (titulo && !libro.titulo.toLowerCase().includes(String(titulo).toLowerCase())) {
                return false;
            }
            return true;
        })
        .map(clonar);
}

async function buscarLibroPorId(id) {
    if (usarPostgres()) {
        const { Libro } = modelos();
        const fila = await Libro.findByPk(id);
        return fila ? fila.get({ plain: true }) : null;
    }
    const libro = getStores().libros.find((item) => item.id === Number(id));
    return libro ? clonar(libro) : null;
}

async function buscarLibroPorIsbn(isbn) {
    if (usarPostgres()) {
        const { Libro } = modelos();
        const fila = await Libro.findOne({ where: { isbn } });
        return fila ? fila.get({ plain: true }) : null;
    }
    const libro = getStores().libros.find((item) => item.isbn === isbn);
    return libro ? clonar(libro) : null;
}

async function crearLibro(datos) {
    const registro = {
        isbn: datos.isbn,
        titulo: datos.titulo,
        autor: datos.autor,
        editorial: datos.editorial || null,
        anio: datos.anio || null,
        estado: "Disponible"
    };

    if (usarPostgres()) {
        const { Libro } = modelos();
        const fila = await Libro.create(registro);
        return fila.get({ plain: true });
    }

    const stores = getStores();
    const libro = { id: stores.seq.libro++, ...registro };
    stores.libros.push(libro);
    return clonar(libro);
}

async function actualizarLibro(id, cambios) {
    if (usarPostgres()) {
        const { Libro } = modelos();
        await Libro.update(cambios, { where: { id } });
        return buscarLibroPorId(id);
    }

    const libro = getStores().libros.find((item) => item.id === Number(id));
    if (!libro) {
        return null;
    }
    Object.assign(libro, cambios);
    return clonar(libro);
}

async function buscarUsuarioPorCorreo(correo) {
    if (usarPostgres()) {
        const { Usuario } = modelos();
        const fila = await Usuario.findOne({ where: { correo } });
        return fila ? fila.get({ plain: true }) : null;
    }
    const usuario = getStores().usuarios.find((item) => item.correo === correo);
    return usuario ? clonar(usuario) : null;
}

async function buscarUsuarioPorId(id) {
    if (usarPostgres()) {
        const { Usuario } = modelos();
        const fila = await Usuario.findByPk(id);
        return fila ? fila.get({ plain: true }) : null;
    }
    const usuario = getStores().usuarios.find((item) => item.id === Number(id));
    return usuario ? clonar(usuario) : null;
}

async function listarUsuarios() {
    if (usarPostgres()) {
        const { Usuario } = modelos();
        const filas = await Usuario.findAll({ order: [["id", "ASC"]] });
        return filas.map((fila) => fila.get({ plain: true }));
    }
    return getStores().usuarios.map(clonar);
}

async function crearUsuario(datos) {
    if (usarPostgres()) {
        const { Usuario } = modelos();
        const fila = await Usuario.create(datos);
        return fila.get({ plain: true });
    }
    const stores = getStores();
    const usuario = { id: stores.seq.usuario++, ...datos };
    stores.usuarios.push(usuario);
    return clonar(usuario);
}

async function crearPrestamo(datos) {
    if (usarPostgres()) {
        const { Prestamo } = modelos();
        const fila = await Prestamo.create(datos);
        return fila.get({ plain: true });
    }
    const stores = getStores();
    const prestamo = { id: stores.seq.prestamo++, ...datos };
    stores.prestamos.push(prestamo);
    return clonar(prestamo);
}

async function listarPrestamos() {
    if (usarPostgres()) {
        const { Prestamo, Usuario, Libro } = modelos();
        const filas = await Prestamo.findAll({
            include: [Usuario, Libro],
            order: [["id", "ASC"]]
        });
        return filas.map((fila) => fila.get({ plain: true }));
    }

    const stores = getStores();
    return stores.prestamos.map((prestamo) => ({
        ...clonar(prestamo),
        Usuario: clonar(stores.usuarios.find((usuario) => usuario.id === prestamo.usuarioId) || null),
        Libro: clonar(stores.libros.find((libro) => libro.id === prestamo.libroId) || null)
    }));
}

async function contarPrestamosActivos(usuarioId) {
    if (usarPostgres()) {
        const { Prestamo } = modelos();
        return Prestamo.count({ where: { usuarioId, estado: "Activo" } });
    }
    return getStores().prestamos.filter((item) => item.usuarioId === Number(usuarioId) && item.estado === "Activo").length;
}

module.exports = {
    buscarLibros,
    buscarLibroPorId,
    buscarLibroPorIsbn,
    crearLibro,
    actualizarLibro,
    buscarUsuarioPorCorreo,
    buscarUsuarioPorId,
    listarUsuarios,
    crearUsuario,
    crearPrestamo,
    listarPrestamos,
    contarPrestamosActivos
};
