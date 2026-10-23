# Product Backlog - Biblioteca GG

## Proyecto

Sistema de gestión de biblioteca para el curso Análisis de Sistemas II, Universidad Mariano Gálvez.

## Integrantes

- Giovanni Francia
- Gerardo Lucero

## Tablero ágil

Repositorio: https://github.com/gluceroa-sudo/BibliotecaGG

Tablero: el backlog de esta entrega está versionado en este archivo para que viaje con el código. El tablero visual del equipo es un proyecto de GitHub asociado a ese repositorio (vista Kanban: Listo, En curso, Hecho). Si el enlace del proyecto aún no está publicado, este archivo es la fuente del backlog.

## Marco y rol del Product Owner

El equipo trabaja con Scrum en iteraciones cortas y mueve las historias en un tablero Kanban. El Product Owner prioriza el backlog, acepta o devuelve una historia según la Definición de Hecho y representa a bibliotecario, lector y administrador. En este equipo el rol lo ejerce quien consolida la prioridad del entregable; el otro integrante desarrolla y contrasta los criterios de aceptación. El rol no escribe código de producción como sustituto de la revisión de negocio.

## Definición de Preparado (DoR)

Una historia entra al sprint solo si:

1. Tiene identificador, épica, prioridad y valor de negocio.
2. Cabe en la Card, la Conversation y la Confirmation.
3. Cumple INVEST: independiente, negociable, valiosa, estimable, pequeña y comprobable.
4. Sus criterios de aceptación se pueden ejecutar en la API o en un escenario Gherkin.
5. Están identificados el requerimiento ISO 29148 y el endpoint OpenAPI que la cubren.
6. El equipo entiende las reglas de negocio y las dependencias de datos.

## Definición de Hecho (DoD)

Una historia está hecha solo si:

1. El endpoint responde el contrato OpenAPI 3.0.3.
2. Los errores de esa historia usan `application/problem+json`.
3. Existe escenario Gherkin y prueba automatizada en `tests/`.
4. La fuente de verdad queda en el repositorio relacional y, si aplica, la réplica o la caché está descrita en `meta`.
5. El README o la colección Postman permiten repetir el caso.
6. No se devuelve la contraseña y el alta protegida exige JWT del rol indicado.

## Épicas

1. Gestión de identidad y acceso.
2. Gestión del catálogo bibliográfico.
3. Gestión de préstamos.
4. Calidad del contrato y de la operación.

## Historias de usuario

### HU-01 Autenticar al personal

- Card: como bibliotecario quiero iniciar sesión con correo y contraseña para recibir un token y operar el sistema.
- Conversation: el token es JWT, dura 8 horas y no sustituye la contraseña en las respuestas. Un fallo de credenciales no revela si el correo existe.
- Confirmation: POST `/api/v1/auth/login` con datos válidos responde 200 y token; con contraseña incorrecta responde 401 Problem Details.
- Épica: identidad. Prioridad: Must. Puntos: 3. Requerimiento: REQ-FN-001.
- INVEST: independiente del alta de libros; negociable el tiempo de expiración; valiosa para cerrar el acceso; estimable en un servicio; pequeña; comprobable con `autenticacion.feature`.

### HU-02 Registrar un libro

- Card: como bibliotecario quiero registrar un libro con ISBN único para mantener el catálogo.
- Conversation: el alta confirma PostgreSQL, replica la ficha en el documental y crea la relación de autoría. El ISBN repetido es conflicto, no un error interno.
- Confirmation: POST `/api/v1/libros` con rol Bibliotecario o Administrador responde 201; ISBN duplicado responde 409; datos incompletos responden 400.
- Épica: catálogo. Prioridad: Must. Puntos: 5. Requerimiento: REQ-FN-002.

### HU-03 Consultar el catálogo

- Card: como lector quiero consultar libros por título o estado para saber qué puedo solicitar, sin percibir la demora de cuatro almacenes.
- Conversation: la primera lectura miss guarda la respuesta con TTL de 60 segundos. La siguiente, dentro del TTL, es hit de Redis. El detalle usa TTL de 120 segundos.
- Confirmation: GET `/api/v1/libros` expone `meta.cache` miss y luego hit. GET `/api/v1/libros/{id}` devuelve la ficha o 404.
- Épica: catálogo. Prioridad: Must. Puntos: 5. Requerimientos: REQ-FN-003 y REQ-FN-004.

### HU-04 Registrar un préstamo

- Card: como bibliotecario quiero prestar un libro disponible a un usuario existente para controlar la salida del ejemplar.
- Conversation: no hay préstamo sin usuario ni sin libro. El ejemplar pasa a Prestado. Si el libro no existe, la respuesta es 404. Si ya está prestado, 409.
- Confirmation: POST `/api/v1/prestamos` responde 201 y el detalle del libro queda en Prestado.
- Épica: préstamos. Prioridad: Must. Puntos: 5. Requerimiento: REQ-FN-005.

### HU-05 Aplicar la política según el rol

- Card: como bibliotecario quiero que la fecha de devolución y el tope de préstamos dependan del rol del lector para aplicar el reglamento sin calcularlo a mano.
- Conversation: estudiante 7 días y 2 activos; docente 21 días y 5; bibliotecario 14 días y 4; administrador 30 días y 10. La política es intercambiable (Strategy).
- Confirmation: un préstamo de estudiante fechado el 2026-10-22 vence el 2026-10-29. El tercer activo del estudiante responde 409.
- Épica: préstamos. Prioridad: Must. Puntos: 3. Requerimiento: REQ-FN-006.

### HU-06 Errores uniformes y usuarios

- Card: como administrador quiero registrar usuarios con correo único y recibir siempre el mismo formato de error para integrar clientes sin casos especiales.
- Conversation: solo el administrador crea usuarios. El correo se normaliza en minúsculas. La contraseña no viaja de vuelta.
- Confirmation: correo duplicado 409; cuerpo `type`, `title`, `status`, `detail`, `instance`.
- Épica: calidad del contrato. Prioridad: Must. Puntos: 3. Requerimientos: REQ-FN-007 y REQ-NF-001.

## Priorización MoSCoW

- Must: HU-01 a HU-06.
- Should: devolución del ejemplar y tablero publicado en GitHub Projects.
- Could: vista GraphQL del grafo y canal gRPC interno.
- Won't (esta entrega): aplicación móvil nativa, pasarela de pagos y multas automáticas.

## Reglas de negocio

1. Cada usuario se registra con un correo único.
2. Cada libro tiene ISBN, título y autor.
3. No existe un préstamo sin usuario y sin libro registrados.
4. Solo se presta un libro en estado Disponible.
5. La fecha de devolución la calcula la política del rol, no el cliente.
6. PostgreSQL se confirma antes de responder. MongoDB y Neo4j pueden alcanzarlo después.
7. La caché del catálogo expira a los 60 segundos y se invalida al escribir.
