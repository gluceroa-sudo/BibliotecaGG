const Libro = require("./Libro");
const Usuario = require("./Usuario");
const Prestamo = require("./Prestamo");



Usuario.hasMany(Prestamo, {
    foreignKey: "usuarioId"
});

Prestamo.belongsTo(Usuario, {
    foreignKey: "usuarioId"
});


Libro.hasMany(Prestamo, {
    foreignKey: "libroId"
});

Prestamo.belongsTo(Libro, {
    foreignKey: "libroId"
});


module.exports = {
    Libro,
    Usuario,
    Prestamo
};