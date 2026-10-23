require("dotenv").config();

module.exports = {
    port: Number(process.env.PORT || 3000),
    dbMode: process.env.DB_MODE || "memory",
    dbName: process.env.DB_NAME || "bibliotecagg",
    dbUser: process.env.DB_USER || "postgres",
    dbPassword: process.env.DB_PASSWORD || "",
    dbHost: process.env.DB_HOST || "localhost",
    dbPort: Number(process.env.DB_PORT || 5432),
    mongoUrl: process.env.MONGO_URL || "",
    redisUrl: process.env.REDIS_URL || "",
    neo4jUri: process.env.NEO4J_URI || "",
    neo4jUser: process.env.NEO4J_USER || "neo4j",
    neo4jPassword: process.env.NEO4J_PASSWORD || "",
    jwtSecret: process.env.JWT_SECRET || "dev-bibliotecagg-cambiar-en-produccion",
    jwtExpires: process.env.JWT_EXPIRES || "8h",
    cacheTtlSegundos: Number(process.env.CACHE_TTL_SECONDS || 60),
    cacheDetalleTtlSegundos: Number(process.env.CACHE_DETAIL_TTL_SECONDS || 120)
};
