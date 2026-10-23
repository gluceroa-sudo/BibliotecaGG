const prestamoRepository = require("./repositorios/prestamoRepository");
const libroRepository = require("./repositorios/libroRepository");
const usuarioRepository = require("./repositorios/usuarioRepository");
const redisGateway = require("./gateways/redisGateway");
const { calcularDevolucion } = require("./patrones/strategy");
const { busEventos } = require("./patrones/observer");
const { problemaValidacion, problemaNoEncontrado, problemaConflicto } = require("../domain/problemas");

function publicoUsuario(usuario) {
    if (!usuario) {
        return null;
    }
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
    };
}

async function crear({ usuarioId, libroId, fechaPrestamo }) {
    const errores = [];
    if (!Number.isInteger(Number(usuarioId)) || Number(usuarioId) <= 0) {
        errores.push({ campo: "usuarioId", mensaje: "Debe indicar un usuario válido." });
    }
    if (!Number.isInteger(Number(libroId)) || Number(libroId) <= 0) {
        errores.push({ campo: "libroId", mensaje: "Debe indicar un libro válido." });
    }
    if (errores.length > 0) {
        throw problemaValidacion("No se puede registrar el préstamo.", errores);
    }

    const usuario = await usuarioRepository.buscarPorId(Number(usuarioId));
    if (!usuario) {
        throw problemaNoEncontrado("El usuario del préstamo no existe.");
    }
    const libro = await libroRepository.buscarPorId(Number(libroId));
    if (!libro) {
        throw problemaNoEncontrado("El libro solicitado no existe.");
    }
    if (libro.estado !== "Disponible") {
        throw problemaConflicto("El libro no está disponible para préstamo.");
    }

    let politica;
    try {
        politica = calcularDevolucion(usuario.rol, fechaPrestamo || new Date().toISOString());
    } catch (error) {
        throw problemaValidacion("La fecha de préstamo no es válida.", [
            { campo: "fechaPrestamo", mensaje: "Use una fecha ISO 8601." }
        ]);
    }

    const activos = await prestamoRepository.contarActivos(usuario.id);
    if (activos >= politica.maxActivos) {
        throw problemaConflicto(
            `La política ${politica.politica} permite como máximo ${politica.maxActivos} préstamos activos.`
        );
    }

    const prestamo = await prestamoRepository.crear({
        usuarioId: usuario.id,
        libroId: libro.id,
        fechaPrestamo: new Date(fechaPrestamo || Date.now()).toISOString(),
        fechaDevolucion: politica.fechaDevolucion,
        estado: "Activo"
    });

    const erroresEvento = await busEventos.publicar("prestamo.registrado", { prestamo, libro, usuario });
    await redisGateway.eliminarPorPrefijo("libros:");
    await redisGateway.eliminarPorPrefijo(`libro:${libro.id}`);

    return {
        datos: {
            ...prestamo,
            Usuario: publicoUsuario(usuario),
            Libro: { ...libro, estado: "Prestado" }
        },
        meta: {
            postgresql: "confirmado",
            politica: politica.politica,
            dias: politica.dias,
            neo4j: erroresEvento.length > 0 ? "pendiente" : "relacion-prestamo-creada",
            consistencia: "eventual",
            avisos: erroresEvento
        }
    };
}

async function listar() {
    const prestamos = await prestamoRepository.listar();
    const datos = prestamos.map((prestamo) => {
        if (!prestamo.Usuario) {
            return prestamo;
        }
        return {
            ...prestamo,
            Usuario: publicoUsuario(prestamo.Usuario)
        };
    });
    return {
        datos,
        meta: { fuente: "postgresql", total: datos.length }
    };
}

module.exports = {
    crear,
    listar
};
