-- Biblioteca GG
-- Fuente relacional de verdad (PostgreSQL)
-- La réplica documental, la caché y el grafo se describen al final.

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    correo VARCHAR(160) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(40) NOT NULL DEFAULT 'Estudiante',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    isbn VARCHAR(32) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(160) NOT NULL,
    editorial VARCHAR(160),
    anio INTEGER,
    estado VARCHAR(40) NOT NULL DEFAULT 'Disponible',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prestamos (
    id SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL REFERENCES usuarios(id),
    "libroId" INTEGER NOT NULL REFERENCES libros(id),
    "fechaPrestamo" TIMESTAMPTZ NOT NULL,
    "fechaDevolucion" TIMESTAMPTZ,
    estado VARCHAR(40) NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO usuarios (nombre, correo, password, rol)
VALUES
    ('Giovanni Francia', 'giovanni@bibliotecagg.edu', '<hash-bcrypt>', 'Administrador'),
    ('Gerardo Lucero', 'gerardo@bibliotecagg.edu', '<hash-bcrypt>', 'Bibliotecario')
ON CONFLICT (correo) DO NOTHING;

-- MongoDB (documental): colección catalogo
-- { libroId, titulo, resumen, etiquetas[], actualizadoEn }
-- colección actividades
-- { tipo, detalle, referencia, destino, ocurridoEn }

-- Redis (caché Cache-Aside)
-- libros:{titulo}:{estado}  TTL 60 s
-- libro:{id}                TTL 120 s

-- Neo4j (grafo)
-- (Libro)-[:ESCRITO_POR]->(Autor)
-- (Usuario)-[:PRESTO {prestamoId}]->(Libro)
-- CREATE CONSTRAINT libro_id IF NOT EXISTS FOR (l:Libro) REQUIRE l.id IS UNIQUE;
-- CREATE CONSTRAINT usuario_id IF NOT EXISTS FOR (u:Usuario) REQUIRE u.id IS UNIQUE;
