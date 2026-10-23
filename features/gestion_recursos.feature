# language: es
Característica: Gestión de libros y préstamos en Biblioteca GG
  Como bibliotecario
  Quiero administrar el catálogo y los préstamos
  Para controlar los recursos disponibles

  Escenario: Consultar el catálogo con caché
    Dado que existen libros registrados
    Cuando un lector consulta GET "/api/v1/libros" por segunda vez dentro del TTL
    Entonces la primera respuesta indica cache "miss"
    Y la segunda respuesta indica cache "hit" y fuente "redis"

  Esquema del escenario: Alta de libros
    Dado que el bibliotecario tiene un token vigente
    Cuando registra un libro con ISBN "<isbn>", título "<titulo>" y autor "<autor>"
    Entonces el sistema responde con estado <estado>
    Y el mensaje contiene "<resultado>"

    Ejemplos:
      | isbn          | titulo          | autor        | estado | resultado                  |
      | 9780134685991 | Effective Java  | Joshua Bloch | 201    | confirmado                 |
      | 9780132350884 | Clean Code      | Robert Martin| 409    | Ya existe un libro         |
      |               | Sin ISBN        | Anónimo      | 400    | ISBN es obligatorio        |

  Esquema del escenario: Registro de préstamos según disponibilidad y política
    Dado que el usuario <usuarioId> tiene rol "<rol>"
    Y el libro <libroId> está "<disponibilidad>"
    Cuando el bibliotecario registra el préstamo el "2026-10-22T00:00:00.000Z"
    Entonces el sistema responde con estado <estado>
    Y la consecuencia es "<consecuencia>"

    Ejemplos:
      | usuarioId | rol        | libroId | disponibilidad | estado | consecuencia                          |
      | 3         | Estudiante | 1       | Disponible     | 201    | devolución 2026-10-29 y estado Prestado |
      | 4         | Docente    | 2       | Disponible     | 201    | política Docente de 21 días           |
      | 3         | Estudiante | 999     | Inexistente    | 404    | El libro solicitado no existe         |
      | 3         | Estudiante | 1       | Prestado       | 409    | no está disponible                    |
