const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const usuarioRepository = require("./repositorios/usuarioRepository");
const { problemaValidacion, problemaNoAutorizado, problemaConflicto } = require("../domain/problemas");

const ROLES = ["Administrador", "Bibliotecario", "Docente", "Estudiante"];

function publico(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
    };
}

function validarCorreo(correo) {
    return typeof correo === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

async function login({ correo, password }) {
    const errores = [];
    if (!validarCorreo(correo)) {
        errores.push({ campo: "correo", mensaje: "Debe ser un correo válido." });
    }
    if (!password || String(password).length < 8) {
        errores.push({ campo: "password", mensaje: "La contraseña es obligatoria." });
    }
    if (errores.length > 0) {
        throw problemaValidacion("Los datos de autenticación no son válidos.", errores);
    }

    const usuario = await usuarioRepository.buscarPorCorreo(String(correo).trim().toLowerCase());
    const coincide = usuario ? await bcrypt.compare(String(password), usuario.password) : false;
    if (!usuario || !coincide) {
        throw problemaNoAutorizado("Correo o contraseña incorrectos.");
    }

    const token = jwt.sign(
        { sub: usuario.id, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre },
        env.jwtSecret,
        { expiresIn: env.jwtExpires }
    );

    return {
        datos: {
            token,
            tipo: "Bearer",
            expiraEn: env.jwtExpires,
            usuario: publico(usuario)
        },
        meta: { fuente: "postgresql" }
    };
}

async function registrar({ nombre, correo, password, rol }) {
    const errores = [];
    if (!nombre || String(nombre).trim().length < 3) {
        errores.push({ campo: "nombre", mensaje: "El nombre debe tener al menos 3 caracteres." });
    }
    if (!validarCorreo(correo)) {
        errores.push({ campo: "correo", mensaje: "Debe ser un correo válido." });
    }
    if (!password || String(password).length < 8) {
        errores.push({ campo: "password", mensaje: "La contraseña debe tener al menos 8 caracteres." });
    }
    const rolFinal = rol || "Estudiante";
    if (!ROLES.includes(rolFinal)) {
        errores.push({ campo: "rol", mensaje: `El rol debe ser uno de: ${ROLES.join(", ")}.` });
    }
    if (errores.length > 0) {
        throw problemaValidacion("No se puede registrar el usuario.", errores);
    }

    const correoNormalizado = String(correo).trim().toLowerCase();
    const existente = await usuarioRepository.buscarPorCorreo(correoNormalizado);
    if (existente) {
        throw problemaConflicto("Ya existe un usuario registrado con ese correo.");
    }

    const usuario = await usuarioRepository.crear({
        nombre: String(nombre).trim(),
        correo: correoNormalizado,
        password: await bcrypt.hash(String(password), 8),
        rol: rolFinal
    });

    return {
        datos: publico(usuario),
        meta: { fuente: "postgresql" }
    };
}

async function listar() {
    const usuarios = await usuarioRepository.listar();
    return {
        datos: usuarios.map(publico),
        meta: { fuente: "postgresql", total: usuarios.length }
    };
}

module.exports = {
    login,
    registrar,
    listar,
    publico,
    ROLES
};
