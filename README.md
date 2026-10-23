# Biblioteca GG

Sistema de gestión de biblioteca para Análisis de Sistemas II, Universidad Mariano Gálvez.

Integrantes: Giovanni Francia y Gerardo Lucero.

Repositorio: https://github.com/gluceroa-sudo/BibliotecaGG

## Qué hace

La API autentica con JWT, consulta el catálogo con caché, registra libros y registra préstamos con una política según el rol. PostgreSQL es la fuente de verdad. MongoDB guarda la ficha y la bitácora. Redis guarda la caché. Neo4j guarda la autoría y el préstamo. Si esos motores no están instalados, la misma aplicación responde con almacenes en memoria.

## Ejecución local

Requisito: Node.js 20 o superior.

```bash
npm install
npm start
```

La API queda en http://localhost:3000 y la documentación interactiva en http://localhost:3000/api/docs.

Pruebas:

```bash
npm test
```

Variables opcionales: copia `.env.example` a `.env`. Con `DB_MODE=memory` (el valor por defecto) no hace falta PostgreSQL. Para el motor real usa `DB_MODE=postgres` y el script `docs/database/scripts_ddl.sql`. `MONGO_URL`, `REDIS_URL` y `NEO4J_URI` activan el driver correspondiente cuando el paquete está instalado.

## Cuentas de demostración

| Correo | Contraseña | Rol |
| --- | --- | --- |
| giovanni@bibliotecagg.edu | Admin123! | Administrador |
| gerardo@bibliotecagg.edu | Biblioteca123! | Bibliotecario |
| ana@bibliotecagg.edu | Estudiante123! | Estudiante |
| luis@bibliotecagg.edu | Docente123! | Docente |

## Endpoints

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | /api/v1/auth/login | Token JWT |
| GET | /api/v1/libros | Catálogo. La segunda lectura dentro del TTL responde `meta.cache = hit` |
| GET | /api/v1/libros/:id | Detalle |
| POST | /api/v1/libros | Alta. Requiere rol Bibliotecario o Administrador |
| POST | /api/v1/prestamos | Préstamo. Calcula la devolución según el rol del lector |
| GET | /api/v1/prestamos | Listado de préstamos |
| POST | /api/v1/usuarios | Alta de usuario. Solo Administrador |
| GET | /api/v1/salud | Conteos de los cuatro almacenes |

Los errores usan `application/problem+json`. La colección para repetir estos llamados está en `docs/api/postman_collection.json`.

Política de préstamo: estudiante 7 días y 2 activos; docente 21 días y 5; bibliotecario 14 días y 4; administrador 30 días y 10.

## Prototipo

Abre `docs/ui/prototipo/index.html` en el navegador. Con la API encendida usa los endpoints reales. El reporte de uso y accesibilidad está en `docs/ui/reporte_ux_ui.pdf`.

## Mapa de la entrega

| Tema | Dónde |
| --- | --- |
| Informe consolidado | `docs/Informe_Proyecto_Final_GrupoGG.pdf` y `informe/informe_proyecto_final.pdf` |
| SRS ISO/IEC/IEEE 29148 | `docs/requirements/srs_ieee_29148.pdf` |
| Fichas IEEE 1016 | `docs/requirements/fichas_diseno_ieee1016.pdf` |
| UML 2.5.1 | `docs/uml/*.puml` y `docs/uml/*.png` |
| Backlog, INVEST, 3C, DoR y DoD | `docs/agile/backlog.md` |
| ADR ISO/IEC/IEEE 42010 | `docs/architecture/adrs/` |
| ISO/IEC 25010 | `docs/architecture/escenarios_iso25010.pdf` |
| C4 niveles 1 a 4 | `docs/c4/` |
| Persistencia y DDL | `docs/database/` |
| OpenAPI 3.0.3 | `docs/api/openapi.yaml` |
| Escenarios Gherkin | `features/` |
| Pruebas | `tests/unit` y `tests/integration` |
| Plan SQA IEEE 730 | `docs/qa/plan_sqa_ieee730.pdf` |
| Casos ISO/IEC/IEEE 29119-3 | `docs/qa/casos_prueba_ieee29119.pdf` |
| Defectos IEEE 1044 | `docs/qa/reporte_defectos_ieee1044.pdf` |
| Trazabilidad | `docs/qa/trazabilidad.pdf` |

## Código

`src/config` conecta los motores. `src/controllers` expone los endpoints. `src/services` contiene los casos de uso, los repositorios, los gateways y los patrones. `src/middlewares` autentica y traduce los errores. `src/models` conserva el modelo Sequelize de la fase anterior para `DB_MODE=postgres`.
