const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    dialect: "postgres",
    port: env.dbPort,
    logging: false
});

let postgresActivo = false;

const conectarDB = async () => {
    if (env.dbMode !== "postgres") {
        console.log("PostgreSQL: modo embebido en memoria (fuente de verdad lógica).");
        postgresActivo = false;
        return { modo: "memory" };
    }

    try {
        await sequelize.authenticate();
        postgresActivo = true;
        console.log("PostgreSQL conectado correctamente.");
        return { modo: "postgres" };
    } catch (error) {
        postgresActivo = false;
        console.error("No se pudo conectar a PostgreSQL. Se usa la fuente relacional en memoria.", error.message);
        return { modo: "memory", error: error.message };
    }
};

function estaPostgresActivo() {
    return postgresActivo && env.dbMode === "postgres";
}

module.exports = {
    sequelize,
    conectarDB,
    estaPostgresActivo
};
