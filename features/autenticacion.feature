# language: es
Característica: Autenticación de usuarios en Biblioteca GG
  Como administrador o bibliotecario
  Quiero autenticarme con correo y contraseña
  Para operar el sistema con un token JWT

  Escenario: Inicio de sesión correcto
    Dado que existe el usuario "gerardo@bibliotecagg.edu" con rol "Bibliotecario"
    Cuando envía POST "/api/v1/auth/login" con la contraseña "Biblioteca123!"
    Entonces la respuesta tiene estado 200
    Y el cuerpo incluye un token Bearer
    Y el cuerpo no incluye la contraseña

  Escenario: Contraseña incorrecta
    Dado que existe el usuario "gerardo@bibliotecagg.edu"
    Cuando envía POST "/api/v1/auth/login" con una contraseña distinta
    Entonces la respuesta tiene estado 401
    Y el contenido es "application/problem+json"
    Y el título del problema es "No autorizado"

  Esquema del escenario: Registro de usuarios según el correo
    Dado que un administrador autenticado registra un usuario
    Cuando envía el correo "<correo>" y el nombre "<nombre>"
    Entonces el sistema responde con estado <estado>
    Y el detalle contiene "<resultado>"

    Ejemplos:
      | correo                     | nombre         | estado | resultado                                      |
      | maria@bibliotecagg.edu     | Maria Lectora  | 201    | maria@bibliotecagg.edu                         |
      | gerardo@bibliotecagg.edu   | Otro Gerardo   | 409    | Ya existe un usuario registrado con ese correo |
      | correo-invalido            | Ana            | 400    | no son válidos                                 |
