const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");


const Libro = sequelize.define("Libro", {

    id:{
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },

    isbn:{
        type: DataTypes.STRING,
        allowNull:false,
        unique:true
    },

    titulo:{
        type: DataTypes.STRING,
        allowNull:false
    },

    autor:{
        type: DataTypes.STRING,
        allowNull:false
    },

    editorial:{
        type: DataTypes.STRING
    },

    anio:{
        type: DataTypes.INTEGER
    },

    estado:{
        type: DataTypes.STRING,
        defaultValue:"Disponible"
    }

});


module.exports = Libro;