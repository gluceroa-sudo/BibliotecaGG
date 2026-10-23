from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

RAIZ = Path(__file__).resolve().parents[1]
DESTINO = RAIZ / "Instrucciones_instalacion_y_demostracion.docx"
VERDE = RGBColor(0x1F, 0x4D, 0x3A)


def sombrear(parrafo, color):
    propiedades = parrafo._p.get_or_add_pPr()
    fondo = OxmlElement("w:shd")
    fondo.set(qn("w:fill"), color)
    fondo.set(qn("w:val"), "clear")
    propiedades.append(fondo)


def encabezado_tabla(celda, texto):
    celda.text = ""
    parrafo = celda.paragraphs[0]
    run = parrafo.add_run(texto)
    run.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)
    run.font.size = Pt(10)
    run.font.name = "Calibri"
    sombrear(parrafo, "1F4D3A")


def celda_texto(celda, texto):
    celda.text = ""
    parrafo = celda.paragraphs[0]
    run = parrafo.add_run(texto)
    run.font.size = Pt(10)
    run.font.name = "Calibri"


def agregar_tabla(documento, columnas, filas):
    tabla = documento.add_table(rows=1, cols=len(columnas))
    tabla.style = "Table Grid"
    for indice, titulo in enumerate(columnas):
        encabezado_tabla(tabla.rows[0].cells[indice], titulo)
    for fila in filas:
        celdas = tabla.add_row().cells
        for indice, valor in enumerate(fila):
            celda_texto(celdas[indice], valor)
    documento.add_paragraph()
    return tabla


def codigo(documento, lineas):
    for linea in lineas:
        parrafo = documento.add_paragraph()
        parrafo.paragraph_format.space_before = Pt(0)
        parrafo.paragraph_format.space_after = Pt(0)
        parrafo.paragraph_format.left_indent = Cm(0.4)
        run = parrafo.add_run(linea if linea else " ")
        run.font.name = "Consolas"
        run.font.size = Pt(10)
        sombrear(parrafo, "F4F1EA")
    documento.add_paragraph()


def titulo(documento, texto, nivel):
    encabezado = documento.add_heading(texto, level=nivel)
    for run in encabezado.runs:
        run.font.color.rgb = VERDE
    return encabezado


def parrafo(documento, texto, negrita=False):
    bloque = documento.add_paragraph()
    run = bloque.add_run(texto)
    run.bold = negrita
    run.font.size = Pt(12)
    run.font.name = "Calibri"
    bloque.paragraph_format.space_after = Pt(8)
    return bloque


def viñeta(documento, texto):
    bloque = documento.add_paragraph(texto, style="List Bullet")
    for run in bloque.runs:
        run.font.size = Pt(12)
        run.font.name = "Calibri"
    return bloque


def numero(documento, texto):
    bloque = documento.add_paragraph(texto, style="List Number")
    for run in bloque.runs:
        run.font.size = Pt(12)
        run.font.name = "Calibri"
    return bloque


def construir():
    documento = Document()
    seccion = documento.sections[0]
    seccion.top_margin = Cm(1.8)
    seccion.bottom_margin = Cm(1.8)
    seccion.left_margin = Cm(2)
    seccion.right_margin = Cm(2)
    normal = documento.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(12)

    portada = documento.add_paragraph()
    portada.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = portada.add_run("Universidad Mariano Gálvez\nAnálisis de Sistemas II")
    run.font.size = Pt(14)
    run.font.color.rgb = VERDE
    run.bold = True

    principal = documento.add_paragraph()
    principal.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = principal.add_run("Biblioteca GG\nInstalación en otra PC y guía de demostración")
    run.bold = True
    run.font.size = Pt(22)
    run.font.color.rgb = VERDE

    datos = documento.add_paragraph()
    datos.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = datos.add_run("Giovanni Francia y Gerardo Lucero\n22 de octubre de 2026")
    run.font.size = Pt(12)

    parrafo(
        documento,
        "Este documento explica cómo instalar el proyecto en una computadora nueva y cómo demostrarle al profesor que la aplicación funciona. Sigue los pasos en orden. No hace falta instalar PostgreSQL, MongoDB, Redis ni Neo4j.",
    )

    titulo(documento, "1. Qué copiar a la otra computadora", 1)
    parrafo(
        documento,
        "Copia la carpeta completa del proyecto. Su nombre es BibliotecaGG-main. Puedes llevarla en una memoria USB, en Drive o en un archivo comprimido .zip.",
    )
    parrafo(
        documento,
        "Dentro de esa carpeta deben viajar, como mínimo, estos elementos: package.json, package-lock.json, la carpeta src, la carpeta docs, la carpeta features, la carpeta tests, el archivo README.md y este instructivo.",
    )
    parrafo(
        documento,
        "Puedes borrar la carpeta node_modules antes de copiar. Esa carpeta se vuelve a crear con npm install y suele ser muy pesada. No copies un archivo llamado .env si contiene una contraseña personal.",
    )

    titulo(documento, "2. Instalar Node.js", 1)
    parrafo(
        documento,
        "Node.js es el único programa que hay que instalar. La versión debe ser 20 o superior. La versión LTS de la página oficial es la adecuada.",
    )
    numero(documento, "Entra a https://nodejs.org y descarga el instalador Windows de la versión LTS.")
    numero(documento, "Ejecuta el instalador. Acepta la ruta de instalación que propone.")
    numero(documento, "En la pantalla de herramientas deja marcada la opción que agrega Node.js al PATH. Si el instalador pregunta por herramientas adicionales de compilación, no son necesarias: puedes omitirlas.")
    numero(documento, "Termina el instalador y cierra cualquier terminal que ya estuviera abierta.")
    numero(documento, "Abre una terminal nueva. En Windows pulsa la tecla Windows, escribe PowerShell y ábrelo.")
    numero(documento, "Escribe los dos comandos siguientes, uno por uno, y pulsa Enter después de cada uno.")
    codigo(documento, ["node -v", "npm -v"])
    parrafo(
        documento,
        "El primer comando debe mostrar v20 o un número mayor, por ejemplo v22 o v24. El segundo debe mostrar un número de npm, por ejemplo 10 o 11. Si Windows dice que node no se reconoce, cierra la terminal, ábrela de nuevo y repite. Si sigue igual, reinstala Node.js y revisa que la opción de PATH haya quedado marcada.",
    )

    titulo(documento, "3. Instalar las dependencias del proyecto", 1)
    numero(documento, "Abre la carpeta BibliotecaGG-main en el Explorador de archivos.")
    numero(documento, "Haz clic en la barra de dirección, copia la ruta y, en PowerShell, entra con este comando. Cambia la ruta por la de tu computadora y conserva las comillas.")
    codigo(documento, ['cd "C:\\ruta\\donde\\copiaste\\BibliotecaGG-main"'])
    numero(documento, "Confirma que estás en la carpeta correcta. Este comando debe mostrar el archivo package.json.")
    codigo(documento, ["dir"])
    numero(documento, "Instala las librerías del proyecto. Necesitas internet. La primera vez puede tardar un par de minutos.")
    codigo(documento, ["npm install"])
    parrafo(
        documento,
        "Al terminar no debe aparecer un error en rojo que diga npm ERR. Los avisos que dicen npm warn se pueden ignorar. Al final tiene que existir la carpeta node_modules.",
    )

    titulo(documento, "4. Comprobar la instalación", 1)
    parrafo(documento, "En la misma terminal ejecuta:")
    codigo(documento, ["npm test"])
    parrafo(
        documento,
        "El resultado correcto es 12 pruebas pasadas y 0 fallidas. La línea importante se parece a pass 12 y fail 0. Si una prueba falla, no sigas a la demostración: vuelve a ejecutar npm install dentro de la carpeta del proyecto y repite npm test.",
    )

    titulo(documento, "5. Encender la aplicación", 1)
    parrafo(documento, "En la misma terminal ejecuta:")
    codigo(documento, ["npm start"])
    parrafo(
        documento,
        "Espera el mensaje Servidor ejecutándose en puerto 3000. Deja esa ventana abierta. Si la cierras, la aplicación se apaga.",
    )
    parrafo(documento, "Abre el navegador y comprueba estas dos direcciones:")
    viñeta(documento, "http://localhost:3000  — debe decir que la API Biblioteca GG está funcionando.")
    viñeta(documento, "http://localhost:3000/api/docs  — abre Swagger, la pantalla para probar los endpoints.")
    viñeta(documento, "http://localhost:3000/api/v1/salud  — muestra PostgreSQL, MongoDB, Redis y Neo4j con datos ya cargados.")
    parrafo(
        documento,
        "Esos cuatro nombres aparecen aunque no hayas instalado esos programas. En esta entrega funcionan en memoria, dentro de la misma aplicación, para que la demostración no dependa de servidores adicionales.",
    )

    titulo(documento, "6. Cuentas para entrar", 1)
    agregar_tabla(
        documento,
        ["Correo", "Contraseña", "Uso en la demostración"],
        [
            ["gerardo@bibliotecagg.edu", "Biblioteca123!", "Registrar libros y préstamos"],
            ["giovanni@bibliotecagg.edu", "Admin123!", "Crear usuarios, además de libros y préstamos"],
            ["ana@bibliotecagg.edu", "Estudiante123!", "Lectora de prueba. Su id es 3"],
            ["luis@bibliotecagg.edu", "Docente123!", "Lector de prueba. Su id es 4"],
        ],
    )
    parrafo(
        documento,
        "Escribe las contraseñas tal como aparecen, con mayúsculas y el signo de admiración. El correo puede ir en minúsculas.",
    )

    titulo(documento, "7. Orden de la demostración", 1)
    parrafo(
        documento,
        "Haz la demostración en Swagger, en http://localhost:3000/api/docs. En cada endpoint pulsa Try it out, pega el cuerpo cuando se indique y pulsa Execute.",
    )

    titulo(documento, "Paso A. Mostrar que el servidor está vivo", 2)
    parrafo(documento, "Abre http://localhost:3000 y después http://localhost:3000/api/v1/salud. En salud deben verse usuarios, libros y los cuatro almacenes en modo memoria-embebida.")

    titulo(documento, "Paso B. Iniciar sesión", 2)
    parrafo(documento, "Abre POST /api/v1/auth/login y envía este cuerpo:")
    codigo(
        documento,
        [
            "{",
            '  "correo": "gerardo@bibliotecagg.edu",',
            '  "password": "Biblioteca123!"',
            "}",
        ],
    )
    parrafo(documento, "La respuesta correcta es 200 y un campo token. Copia solo el token, sin comillas.")
    parrafo(documento, "Arriba en Swagger pulsa Authorize. En el cuadro escribe la palabra Bearer, un espacio y el token. Queda así:")
    codigo(documento, ["Bearer eyJhbGciOi..."])
    parrafo(documento, "Pulsa Authorize y luego Close.")
    parrafo(documento, "Vuelve a ejecutar el login cambiando la contraseña por incorrecta. La respuesta correcta es 401. El cuerpo debe incluir title, status, detail e instance. Ese formato es el error estándar de la entrega.")

    titulo(documento, "Paso C. Consultar el catálogo y la caché", 2)
    parrafo(documento, "Ejecuta GET /api/v1/libros dos veces, sin cambiar nada.")
    viñeta(documento, "Primera respuesta: cache vale miss.")
    viñeta(documento, "Segunda respuesta: cache vale hit y fuente vale redis.")
    parrafo(documento, "Después ejecuta GET /api/v1/libros/1. Debe mostrar Clean Code, su autor, un resumen y el estado Disponible, siempre que todavía no lo hayas prestado.")

    titulo(documento, "Paso D. Registrar un libro", 2)
    parrafo(documento, "Con el token del bibliotecario, abre POST /api/v1/libros y envía:")
    codigo(
        documento,
        [
            "{",
            '  "isbn": "9780134685991",',
            '  "titulo": "Effective Java",',
            '  "autor": "Joshua Bloch",',
            '  "editorial": "Addison-Wesley",',
            '  "anio": 2018',
            "}",
        ],
    )
    parrafo(documento, "La respuesta correcta es 201. En meta deben aparecer postgresql confirmado, mongodb replicado y neo4j relacion-autor-creada.")
    parrafo(documento, "Envía otra vez el mismo cuerpo. La respuesta correcta es 409, porque el ISBN ya existe.")
    parrafo(documento, "Envía un libro sin isbn, solo con titulo. La respuesta correcta es 400 y debe mencionar el campo isbn.")

    titulo(documento, "Paso E. Registrar un préstamo", 2)
    parrafo(documento, "Abre POST /api/v1/prestamos y envía:")
    codigo(
        documento,
        [
            "{",
            '  "usuarioId": 3,',
            '  "libroId": 1,',
            '  "fechaPrestamo": "2026-10-22T00:00:00.000Z"',
            "}",
        ],
    )
    parrafo(documento, "La respuesta correcta es 201. La política debe decir Estudiante, los días deben ser 7 y la fecha de devolución debe ser 2026-10-29. El usuario 3 es Ana Estudiante.")
    parrafo(documento, "Ejecuta de nuevo GET /api/v1/libros/1. El estado del libro debe ser Prestado.")
    parrafo(documento, "Intenta prestar otra vez el libro 1 al mismo usuario. La respuesta correcta es 409.")
    parrafo(documento, "Cambia libroId a 999. La respuesta correcta es 404.")
    parrafo(documento, "Pulsa Authorize, cierra la sesión del token y vuelve a intentar el préstamo. La respuesta correcta es 401.")

    titulo(documento, "Paso F. Mostrar el tope de préstamos del estudiante", 2)
    parrafo(
        documento,
        "Si el profesor quiere ver la regla completa, presta tres libros distintos al usuario 3. Los dos primeros responden 201. El tercero responde 409 y el mensaje indica que el máximo es 2. Si el libro 1 ya quedó Prestado en el paso anterior, usa los libros que sigan Disponibles y, si hace falta, reinicia el servidor con Ctrl+C y otra vez npm start para recuperar los datos iniciales.",
    )

    titulo(documento, "Paso G. Mostrar la pantalla", 2)
    parrafo(
        documento,
        "Con el servidor todavía encendido, abre en el navegador el archivo docs/ui/prototipo/index.html. Está dentro de la carpeta del proyecto. Entra con gerardo@bibliotecagg.edu y Biblioteca123!, busca un título y registra un préstamo. El estado del libro se lee con palabras, no solo con un color.",
    )

    titulo(documento, "Paso H. Mostrar las pruebas", 2)
    parrafo(
        documento,
        "Abre una segunda terminal en la misma carpeta. No cierres la terminal donde está npm start. En la segunda ejecuta npm test. Deben pasar 12 pruebas. Esas pruebas cubren login, caché, alta de libro, préstamo, el tope del estudiante y el caso en el que el grafo falla sin perder el préstamo.",
    )

    titulo(documento, "8. Documentos que puedes abrir si el profesor pregunta", 1)
    agregar_tabla(
        documento,
        ["Si pregunta por", "Archivo"],
        [
            ["El informe completo", "docs/Informe_Proyecto_Final_GrupoGG.pdf"],
            ["Requerimientos", "docs/requirements/srs_ieee_29148.pdf"],
            ["Diseño de componentes", "docs/requirements/fichas_diseno_ieee1016.pdf"],
            ["Diagramas UML", "carpeta docs/uml"],
            ["Diagramas C4", "carpeta docs/c4"],
            ["Decisiones de arquitectura", "carpeta docs/architecture/adrs"],
            ["Calidad ISO 25010", "docs/architecture/escenarios_iso25010.pdf"],
            ["Contrato de la API", "docs/api/openapi.yaml o la pantalla /api/docs"],
            ["Historias, DoR y DoD", "docs/agile/backlog.md"],
            ["Casos de prueba", "docs/qa/casos_prueba_ieee29119.pdf"],
            ["Trazabilidad", "docs/qa/trazabilidad.pdf"],
            ["Plan de calidad", "docs/qa/plan_sqa_ieee730.pdf"],
            ["Defectos", "docs/qa/reporte_defectos_ieee1044.pdf"],
            ["Usabilidad y accesibilidad", "docs/ui/reporte_ux_ui.pdf"],
            ["Colección Postman", "docs/api/postman_collection.json"],
        ],
    )
    parrafo(
        documento,
        "Si usas Postman, importa docs/api/postman_collection.json. Ejecuta primero la petición Login bibliotecario. La colección guarda el token y las demás peticiones lo reutilizan.",
    )

    titulo(documento, "9. Problemas frecuentes", 1)
    agregar_tabla(
        documento,
        ["Qué ocurre", "Qué hacer"],
        [
            ["node no se reconoce", "Cierra PowerShell, ábrelo de nuevo. Si continúa, reinstala Node.js con la opción PATH marcada."],
            ["npm ERR en npm install", "Revisa el internet y que el comando se haya ejecutado dentro de BibliotecaGG-main, donde está package.json."],
            ["El puerto 3000 ya está en uso", "Cierra la otra ventana donde corriste npm start, o la aplicación que esté usando ese puerto, y vuelve a ejecutar npm start."],
            ["La segunda consulta no dice hit", "Ejecuta exactamente el mismo GET /api/v1/libros dos veces, sin reiniciar el servidor entre una y otra."],
            ["El alta de libro responde 401", "Vuelve a Authorize y escribe Bearer, un espacio y el token completo."],
            ["El alta de libro responde 403", "Entraste con un estudiante. Usa la cuenta de gerardo o de giovanni."],
            ["Swagger no abre", "Confirma que la terminal sigue en npm start y que la dirección es http://localhost:3000/api/docs."],
            ["Los datos desaparecieron", "Es normal al detener el servidor. Al volver a ejecutar npm start, las cuentas y los tres libros iniciales regresan."],
        ],
    )

    titulo(documento, "10. Qué decir sobre las bases de datos", 1)
    parrafo(
        documento,
        "La demostración usa los cuatro almacenes en memoria para que el proyecto funcione en cualquier PC donde solo esté Node.js. El comportamiento que se ve es el de la entrega: la caché responde hit, el alta confirma PostgreSQL y replica en MongoDB y Neo4j, y el préstamo calcula la política del rol.",
    )
    parrafo(
        documento,
        "El archivo docs/database/scripts_ddl.sql describe las tablas reales de PostgreSQL por si más adelante se conecta un servidor. No es necesario ejecutarlo para la exposición.",
    )
    parrafo(
        documento,
        "La devolución de un libro no está incluida. Si un libro queda Prestado, así se queda hasta que reinicies el servidor. No la presentes como una función terminada.",
    )

    titulo(documento, "11. Lista corta el día de la exposición", 1)
    numero(documento, "Abrir PowerShell en la carpeta BibliotecaGG-main.")
    numero(documento, "Ejecutar npm test y comprobar 12 pruebas pasadas.")
    numero(documento, "Ejecutar npm start y dejar esa ventana abierta.")
    numero(documento, "Abrir http://localhost:3000/api/docs.")
    numero(documento, "Login correcto en 200 y login incorrecto en 401.")
    numero(documento, "Autorizar el token con la palabra Bearer.")
    numero(documento, "Listar libros dos veces y mostrar miss y después hit.")
    numero(documento, "Crear un libro en 201 y repetir el ISBN para mostrar 409.")
    numero(documento, "Crear un préstamo en 201, mostrar la fecha 2026-10-29 y el libro en Prestado.")
    numero(documento, "Abrir el prototipo docs/ui/prototipo/index.html y el informe docs/Informe_Proyecto_Final_GrupoGG.pdf.")

    documento.save(DESTINO)
    print(DESTINO)


if __name__ == "__main__":
    construir()
