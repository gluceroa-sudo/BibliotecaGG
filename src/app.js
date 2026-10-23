const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const yaml = require("js-yaml");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const { getStores } = require("./config/stores");
const { conectarDB, estaPostgresActivo } = require("./config/database");
const { conectarMongo, estaMongoActivo } = require("./config/mongo");
const { conectarRedis, estaRedisActivo } = require("./config/redis");
const { conectarNeo4j, estaNeo4jActivo } = require("./config/neo4j");
const { registrarObservadores } = require("./services/observadores");
const { manejadorErrores, recursoNoEncontrado } = require("./middlewares/errorHandler");
const guiaSwagger = require("./swagger/guia");
const authRoutes = require("./routes/authRoutes");
const libroRoutes = require("./routes/libroRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const prestamoRoutes = require("./routes/prestamoRoutes");

function cargarOpenApi() {
    const ruta = path.join(__dirname, "..", "docs", "api", "openapi.yaml");
    return yaml.load(fs.readFileSync(ruta, "utf8"));
}

function createApp() {
    registrarObservadores();
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get("/", (req, res) => {
        res.json({
            mensaje: "API Biblioteca GG funcionando",
            documentacion: "/api/docs",
            salud: "/api/v1/salud"
        });
    });

    app.get("/api/v1/salud", async (req, res, next) => {
        try {
            const stores = getStores();
            const conteos = {
                usuarios: stores.usuarios.length,
                libros: stores.libros.length,
                prestamos: stores.prestamos.length,
                documentos: stores.documentos.length,
                actividades: stores.actividades.length,
                claves: stores.cache.size,
                relaciones: stores.relaciones.length
            };

            if (estaPostgresActivo()) {
                const { Usuario, Libro, Prestamo } = require("./models");
                conteos.usuarios = await Usuario.count();
                conteos.libros = await Libro.count();
                conteos.prestamos = await Prestamo.count();
            }
            if (estaMongoActivo()) {
                const { obtenerColeccion } = require("./config/mongo");
                const coleccion = obtenerColeccion();
                conteos.documentos = await coleccion.countDocuments();
                conteos.actividades = await coleccion.db.collection("actividades").countDocuments();
            }
            if (estaRedisActivo()) {
                const { obtenerClienteRedis } = require("./config/redis");
                conteos.claves = await obtenerClienteRedis().dbSize();
            }
            if (estaNeo4jActivo()) {
                const { obtenerDriverNeo4j } = require("./config/neo4j");
                const sesion = obtenerDriverNeo4j().session();
                try {
                    const resultado = await sesion.run("MATCH ()-[relacion]->() RETURN count(relacion) AS total");
                    conteos.relaciones = resultado.records[0].get("total").toNumber();
                } finally {
                    await sesion.close();
                }
            }

            res.json({
                sistema: "Biblioteca GG",
                persistencia: {
                    postgresql: {
                        modo: estaPostgresActivo() ? "postgresql" : "memoria-embebida",
                        usuarios: conteos.usuarios,
                        libros: conteos.libros,
                        prestamos: conteos.prestamos
                    },
                    mongodb: {
                        modo: estaMongoActivo() ? "mongodb" : "memoria-embebida",
                        documentos: conteos.documentos,
                        actividades: conteos.actividades
                    },
                    redis: {
                        modo: estaRedisActivo() ? "redis" : "memoria-embebida",
                        claves: conteos.claves
                    },
                    neo4j: {
                        modo: estaNeo4jActivo() ? "neo4j" : "memoria-embebida",
                        relaciones: conteos.relaciones
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    });

    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(cargarOpenApi(), {
        customSiteTitle: "Biblioteca GG",
        customCss: guiaSwagger.css,
        swaggerOptions: {
            docExpansion: "list",
            filter: true,
            persistAuthorization: true,
            tryItOutEnabled: true,
            displayRequestDuration: true,
            defaultModelsExpandDepth: -1,
            defaultModelExpandDepth: 0,
            tagsSorter: "alpha",
            operationsSorter: "alpha"
        }
    }));
    app.use("/api/v1/auth", authRoutes);
    app.use("/api/v1/libros", libroRoutes);
    app.use("/api/v1/usuarios", usuarioRoutes);
    app.use("/api/v1/prestamos", prestamoRoutes);

    app.use(recursoNoEncontrado);
    app.use(manejadorErrores);
    return app;
}

async function iniciar() {
    require("./models");
    await conectarDB();
    await conectarMongo();
    await conectarRedis();
    await conectarNeo4j();

    if (env.dbMode === "postgres") {
        const { sequelize, estaPostgresActivo } = require("./config/database");
        if (estaPostgresActivo()) {
            await sequelize.sync();
            console.log("Tablas relacionales sincronizadas.");
        }
    }

    const app = createApp();
    app.listen(env.port, () => {
        console.log(`Servidor ejecutándose en puerto ${env.port}`);
    });
    return app;
}

if (require.main === module) {
    iniciar();
}

module.exports = {
    createApp,
    iniciar
};
