const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");


const Prestamo = sequelize.define("Prestamo", {

    id:{
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },

    fechaPrestamo:{
        type: DataTypes.DATE,
        allowNull:false
    },

    fechaDevolucion:{
        type: DataTypes.DATE
    },

    estado:{
        type: DataTypes.STRING,
        defaultValue:"Activo"
    }

});


module.exports = Prestamo;