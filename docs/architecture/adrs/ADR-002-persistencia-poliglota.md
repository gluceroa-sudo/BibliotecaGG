# ADR-002: Persistencia políglota

- Estado: Aceptado
- Fecha: 2026-10-22
- Decisores: Giovanni Francia, Gerardo Lucero
- Estándar: ISO/IEC/IEEE 42010:2011

## Contexto

El dominio mezcla datos transaccionales, fichas de lectura flexibles, consultas repetidas del catálogo y relaciones de autoría y préstamo. Un solo motor relacional puede almacenarlo todo, pero obliga a modelar mal las fichas abiertas, la caché y los recorridos del grafo.

## Opciones

1. Solo PostgreSQL. Máxima consistencia y una sola operación. Las etiquetas, la bitácora y las rutas de autoría quedan forzadas en tablas.
2. PostgreSQL + Redis. Mejora el desempeño de lectura y no cubre documentos ni grafos.
3. Persistencia políglota: PostgreSQL, MongoDB, Redis y Neo4j, con adaptadores en memoria si el motor externo no está instalado.

## Opción elegida

Se adopta la opción 3.

- PostgreSQL guarda usuarios, libros y préstamos. Es la fuente de verdad y se confirma antes de responder.
- MongoDB guarda el resumen, las etiquetas y la bitácora de actividades.
- Redis guarda el catálogo (TTL 60 segundos) y el detalle (TTL 120 segundos) con Cache-Aside.
- Neo4j guarda `ESCRITO_POR` y `PRESTO`.

Si no hay URL de conexión, cada gateway usa un almacén en memoria con la misma responsabilidad. Así la aplicación responde sin instalar cuatro servidores y el código de integración permanece listo para el motor real. El script `docs/database/scripts_ddl.sql` describe el esquema físico.

## Consecuencias

- Cada escritura de negocio confirma PostgreSQL y luego replica. Si MongoDB o Neo4j fallan, la operación HTTP se acepta y la actividad queda como `CONSISTENCIA_PENDIENTE`.
- Redis se protege con circuit breaker: si la caché cae, la lectura sigue contra la fuente de verdad.
- Neo4j se protege con circuit breaker: al abrirse, no se bloquea el préstamo.
- Hay que invalidar las claves `libros:` y `libro:{id}` después de un alta o un préstamo para no servir un estado vencido dentro del TTL.
- La operación es más rica y también más exigente de explicar. Los ADR y el modelo C4 existen para esa explicación.

## Estado de implementación

`src/config/database.js`, `src/config/mongo.js`, `src/config/redis.js` y `src/config/neo4j.js` abren la conexión externa cuando la variable correspondiente está definida. Los gateways en `src/services/gateways/` ejecutan el patrón.
