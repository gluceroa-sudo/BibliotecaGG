const politicas = {
    Estudiante: { dias: 7, maxActivos: 2, nombre: "Estudiante" },
    Docente: { dias: 21, maxActivos: 5, nombre: "Docente" },
    Bibliotecario: { dias: 14, maxActivos: 4, nombre: "Bibliotecario" },
    Administrador: { dias: 30, maxActivos: 10, nombre: "Administrador" }
};

function obtenerPolitica(rol) {
    return politicas[rol] || politicas.Estudiante;
}

function calcularDevolucion(rol, fechaPrestamo) {
    const politica = obtenerPolitica(rol);
    const inicio = new Date(fechaPrestamo);
    if (Number.isNaN(inicio.getTime())) {
        const error = new Error("Fecha de préstamo inválida");
        error.esFecha = true;
        throw error;
    }
    const fin = new Date(inicio.getTime());
    fin.setUTCDate(fin.getUTCDate() + politica.dias);
    return {
        fechaDevolucion: fin.toISOString(),
        politica: politica.nombre,
        dias: politica.dias,
        maxActivos: politica.maxActivos
    };
}

module.exports = {
    politicas,
    obtenerPolitica,
    calcularDevolucion
};
