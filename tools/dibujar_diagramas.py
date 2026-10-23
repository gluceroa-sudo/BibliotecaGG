from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parents[1]
FUENTE = Path(r"C:\Windows\Fonts\arial.ttf")
FUENTE_NEGRITA = Path(r"C:\Windows\Fonts\arialbd.ttf")
TINTA = "#1c1915"
VERDE = "#d8e8d8"
AZUL = "#d8e4f4"
NARANJA = "#f4e4d8"
ROJO = "#f8d8d8"
MORADO = "#e4d8f4"
PAPEL = "#fffdf8"
GRIS = "#eeeeee"


def fuente(tamano, negrita=False):
    return ImageFont.truetype(str(FUENTE_NEGRITA if negrita else FUENTE), tamano)


def nuevo(ancho, alto, titulo):
    imagen = Image.new("RGB", (ancho, alto), "#f7f4ee")
    lapiz = ImageDraw.Draw(imagen)
    lapiz.rectangle((0, 0, ancho, 64), fill="#1f4d3a")
    lapiz.text((24, 16), titulo, font=fuente(26, True), fill="white")
    return imagen, lapiz


def caja(lapiz, x, y, w, h, texto, relleno=PAPEL, tamano=18):
    lapiz.rounded_rectangle((x, y, x + w, y + h), radius=14, fill=relleno, outline=TINTA, width=2)
    lineas = texto.split("\n")
    alto = tamano + 6
    total = len(lineas) * alto
    inicio = y + (h - total) / 2
    for indice, linea in enumerate(lineas):
        cuadro = lapiz.textbbox((0, 0), linea, font=fuente(tamano, indice == 0))
        ancho = cuadro[2] - cuadro[0]
        lapiz.text((x + (w - ancho) / 2, inicio + indice * alto), linea, font=fuente(tamano, indice == 0), fill=TINTA)


def flecha(lapiz, x1, y1, x2, y2, etiqueta="", tamano=15):
    lapiz.line((x1, y1, x2, y2), fill=TINTA, width=3)
    import math
    angulo = math.atan2(y2 - y1, x2 - x1)
    largo = 14
    punta1 = (x2 - largo * math.cos(angulo - 0.45), y2 - largo * math.sin(angulo - 0.45))
    punta2 = (x2 - largo * math.cos(angulo + 0.45), y2 - largo * math.sin(angulo + 0.45))
    lapiz.polygon([(x2, y2), punta1, punta2], fill=TINTA)
    if etiqueta:
        lapiz.text(((x1 + x2) / 2 + 6, (y1 + y2) / 2 - 18), etiqueta, font=fuente(tamano), fill="#333333")


def guardar(imagen, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    imagen.save(ruta, "PNG")
    print(ruta.relative_to(RAIZ))


def clases():
    imagen, lapiz = nuevo(1600, 1100, "UML 2.5.1  ·  Diagrama de clases de análisis y diseño")
    caja(lapiz, 80, 110, 280, 170, "Usuario\nid, nombre, correo\npassword, rol\nautenticar()", VERDE)
    caja(lapiz, 620, 110, 300, 190, "Libro\nid, isbn, titulo\nautor, editorial\nanio, estado", AZUL)
    caja(lapiz, 1140, 110, 360, 170, "Prestamo\nfechaPrestamo\nfechaDevolucion, estado\nregistrar()", NARANJA)
    caja(lapiz, 1140, 430, 360, 160, "PoliticaPrestamo\n«strategy»\ndias, maxActivos\ncalcularDevolucion()", MORADO)
    caja(lapiz, 80, 470, 280, 140, "Catalogo\nconsultar(filtro)\nregistrar(libro)", VERDE)
    caja(lapiz, 620, 470, 300, 150, "DocumentoCatalogo\nlibroId, resumen\netiquetas", NARANJA)
    caja(lapiz, 620, 760, 300, 150, "RelacionGrafo\ntipo, desde, hacia\nESCRITO_POR / PRESTO", MORADO)
    flecha(lapiz, 360, 190, 620, 190, "1 solicita 0..*")
    flecha(lapiz, 920, 200, 1140, 190, "1 se incluye en 0..*")
    flecha(lapiz, 1320, 280, 1320, 430, "composición 1")
    flecha(lapiz, 220, 470, 220, 280, "agregación 0..*")
    flecha(lapiz, 620, 540, 360, 540, "1 se describe en 0..1")
    flecha(lapiz, 770, 660, 770, 760, "1 participa en 0..*")
    lapiz.text((80, 980), "Composición: el préstamo se calcula con una política.  Agregación: el catálogo agrupa libros que también existen fuera de una consulta.", font=fuente(18), fill=TINTA)
    guardar(imagen, RAIZ / "docs" / "uml" / "clases.png")


def secuencia():
    imagen, lapiz = nuevo(1700, 1200, "UML 2.5.1  ·  Diagrama de secuencia del préstamo")
    actores = [
        (80, "Bibliotecario"),
        (300, "API"),
        (500, "Auth JWT"),
        (720, "PrestamoService"),
        (980, "Strategy"),
        (1180, "PostgreSQL"),
        (1400, "Neo4j /\nRedis"),
    ]
    for x, nombre in actores:
        caja(lapiz, x, 90, 170, 80, nombre, VERDE if x < 600 else AZUL, 16)
        lapiz.line((x + 85, 170, x + 85, 1120), fill="#b7b0a4", width=2)
    mensajes = [
        (80, 300, "POST préstamo + Bearer"),
        (300, 500, "verificar token y rol"),
        (500, 720, "usuario autenticado"),
        (300, 720, "crear(usuario, libro, fecha)"),
        (720, 1180, "buscar usuario y libro"),
        (720, 980, "calcularDevolucion(rol)"),
        (720, 1180, "insertar préstamo confirmado"),
        (1180, 1400, "actualizar a Prestado y PRESTO"),
        (720, 1400, "invalidar caché / circuito"),
        (300, 80, "201 y consistencia eventual"),
    ]
    y = 210
    for origen, destino, texto in mensajes:
        y += 80
        x1 = origen + 85
        x2 = destino + 85
        flecha(lapiz, x1, y, x2, y, "")
        lapiz.text((min(x1, x2) + 8, y - 24), texto, font=fuente(15), fill=TINTA)
    guardar(imagen, RAIZ / "docs" / "uml" / "secuencia.png")


def actividades():
    imagen, lapiz = nuevo(1600, 980, "UML 2.5.1  ·  Actividad con calles: consultar catálogo")
    calles = [("Lector", VERDE), ("API", PAPEL), ("Redis", ROJO), ("PostgreSQL + MongoDB", AZUL)]
    for indice, (nombre, color) in enumerate(calles):
        x = 40 + indice * 390
        lapiz.rectangle((x, 90, x + 370, 930), outline=TINTA, width=2)
        lapiz.rectangle((x, 90, x + 370, 150), fill="#1f4d3a")
        cuadro = lapiz.textbbox((0, 0), nombre, font=fuente(18, True))
        lapiz.text((x + (370 - (cuadro[2] - cuadro[0])) / 2, 108), nombre, font=fuente(18, True), fill="white")
    caja(lapiz, 70, 190, 310, 80, "Solicitar el catálogo", VERDE, 16)
    flecha(lapiz, 225, 270, 560, 330, "")
    caja(lapiz, 450, 330, 310, 80, "Validar filtro y armar clave", PAPEL, 16)
    flecha(lapiz, 605, 410, 980, 470, "")
    caja(lapiz, 840, 470, 310, 90, "¿Clave vigente?", ROJO, 16)
    caja(lapiz, 840, 680, 310, 80, "Devolver catálogo cacheado", ROJO, 16)
    caja(lapiz, 1230, 560, 310, 100, "Leer libros y enriquecer\nresumen y etiquetas", AZUL, 16)
    caja(lapiz, 840, 820, 310, 80, "Guardar con TTL de 60 s", ROJO, 16)
    flecha(lapiz, 995, 560, 995, 680, "sí, hit")
    flecha(lapiz, 1150, 515, 1230, 590, "no, miss")
    flecha(lapiz, 1385, 660, 1150, 820, "luego guarda")
    guardar(imagen, RAIZ / "docs" / "uml" / "actividades.png")


def paquetes():
    imagen, lapiz = nuevo(1500, 900, "UML 2.5.1  ·  Diagrama de paquetes")
    caja(lapiz, 80, 140, 560, 250, "interfaz\nroutes  ·  controllers  ·  middlewares\nContrato HTTP y Problem Details", VERDE, 20)
    caja(lapiz, 820, 140, 580, 250, "aplicacion\nauthService  ·  libroService\nprestamoService  ·  observadores", AZUL, 20)
    caja(lapiz, 80, 520, 560, 250, "dominio\nPoliticaPrestamo  ·  BusEventos\nCircuitBreaker  ·  problemas RFC 9457", MORADO, 20)
    caja(lapiz, 820, 520, 580, 250, "infraestructura\nrepositorios y gateways\nPostgreSQL, MongoDB, Redis, Neo4j", NARANJA, 20)
    flecha(lapiz, 640, 260, 820, 260, "usa")
    flecha(lapiz, 360, 390, 360, 520, "reglas")
    flecha(lapiz, 1100, 390, 1100, 520, "adapta")
    guardar(imagen, RAIZ / "docs" / "uml" / "paquetes.png")


def contexto():
    imagen, lapiz = nuevo(1500, 860, "C4 Nivel 1  ·  Contexto del sistema")
    caja(lapiz, 80, 180, 240, 100, "Lector", GRIS, 20)
    caja(lapiz, 80, 360, 240, 100, "Bibliotecario", GRIS, 20)
    caja(lapiz, 80, 540, 240, 100, "Administrador", GRIS, 20)
    caja(lapiz, 520, 320, 420, 180, "Biblioteca GG\nSistema de gestión\nbibliográfica", VERDE, 22)
    caja(lapiz, 1120, 160, 300, 120, "Identidad JWT", GRIS, 18)
    caja(lapiz, 1120, 360, 300, 120, "Fichas y bitácora", NARANJA, 18)
    caja(lapiz, 1120, 560, 300, 120, "Grafo de autoría\ny préstamos", MORADO, 18)
    flecha(lapiz, 320, 230, 520, 360, "consulta")
    flecha(lapiz, 320, 410, 520, 410, "registra")
    flecha(lapiz, 320, 590, 520, 470, "administra")
    flecha(lapiz, 940, 360, 1120, 220, "")
    flecha(lapiz, 940, 410, 1120, 420, "")
    flecha(lapiz, 940, 470, 1120, 610, "")
    guardar(imagen, RAIZ / "docs" / "c4" / "c4_nivel1_contexto.png")


def contenedores():
    imagen, lapiz = nuevo(1600, 980, "C4 Nivel 2  ·  Contenedores")
    caja(lapiz, 40, 180, 260, 100, "Personal de\nbiblioteca", GRIS, 18)
    caja(lapiz, 420, 150, 420, 140, "Aplicación API\nNode.js y Express\n/api/v1", VERDE, 20)
    caja(lapiz, 420, 340, 420, 110, "Swagger UI\n/api/docs", PAPEL, 20)
    caja(lapiz, 1040, 120, 500, 120, "PostgreSQL\nfuente de verdad", AZUL, 20)
    caja(lapiz, 1040, 280, 500, 120, "MongoDB\ncatálogo y actividades", NARANJA, 20)
    caja(lapiz, 1040, 440, 500, 120, "Redis\nCache-Aside con TTL", ROJO, 20)
    caja(lapiz, 1040, 600, 500, 120, "Neo4j\nESCRITO_POR y PRESTO", MORADO, 20)
    flecha(lapiz, 300, 230, 420, 220, "JSON")
    flecha(lapiz, 840, 210, 1040, 180, "")
    flecha(lapiz, 840, 230, 1040, 340, "")
    flecha(lapiz, 840, 250, 1040, 500, "")
    flecha(lapiz, 840, 270, 1040, 660, "")
    guardar(imagen, RAIZ / "docs" / "c4" / "c4_nivel2_contenedores.png")


def componentes():
    imagen, lapiz = nuevo(1600, 1000, "C4 Nivel 3  ·  Componentes del contenedor API")
    cajas = [
        (40, 110, "authController", VERDE),
        (320, 110, "libroController", VERDE),
        (600, 110, "prestamoController", VERDE),
        (900, 110, "middleware JWT", PAPEL),
        (1180, 110, "errorHandler\nRFC 9457", ROJO),
        (40, 340, "authService", AZUL),
        (320, 340, "libroService", AZUL),
        (600, 340, "prestamoService", AZUL),
        (900, 340, "Strategy\nPoliticaPrestamo", MORADO),
        (1180, 340, "Observer\nBusEventos", MORADO),
        (40, 600, "Cache-Aside", NARANJA),
        (320, 600, "Circuit Breaker", NARANJA),
        (600, 600, "Repositorios", AZUL),
        (980, 600, "Gateways\nPostgreSQL, MongoDB\nRedis y Neo4j", NARANJA),
    ]
    for x, y, texto, color in cajas:
        caja(lapiz, x, y, 250, 140, texto, color, 18)
    flecha(lapiz, 165, 250, 165, 340, "")
    flecha(lapiz, 445, 250, 445, 340, "")
    flecha(lapiz, 725, 250, 725, 340, "")
    flecha(lapiz, 725, 480, 1020, 410, "")
    flecha(lapiz, 850, 410, 1180, 410, "")
    flecha(lapiz, 445, 480, 165, 600, "")
    flecha(lapiz, 725, 480, 725, 600, "")
    flecha(lapiz, 850, 670, 980, 670, "")
    guardar(imagen, RAIZ / "docs" / "c4" / "c4_nivel3_componentes.png")


def codigo():
    imagen, lapiz = nuevo(1600, 980, "C4 Nivel 4  ·  Código de los componentes críticos")
    caja(lapiz, 40, 120, 360, 180, "«interface»\nLibroRepository\nbuscar, crear\nactualizar", PAPEL, 18)
    caja(lapiz, 460, 120, 360, 180, "PostgresGateway\nmemoria o Sequelize\nimplementa el repositorio", AZUL, 18)
    caja(lapiz, 900, 120, 320, 180, "LibroService\nlistar, obtenerPorId\ncrear", VERDE, 18)
    caja(lapiz, 1260, 120, 300, 180, "CacheAside\nclave, TTL, cargar", ROJO, 18)
    caja(lapiz, 40, 460, 360, 180, "PrestamoService\ncrear, listar", VERDE, 18)
    caja(lapiz, 460, 460, 360, 180, "PoliticaPrestamo\nStrategy\ncalcularDevolucion", MORADO, 18)
    caja(lapiz, 900, 460, 320, 180, "CircuitBreaker\nejecutar con alternativa", NARANJA, 18)
    caja(lapiz, 1260, 460, 300, 180, "Neo4jGateway\nrelacionarAutor\nvincularPrestamo", MORADO, 18)
    flecha(lapiz, 400, 200, 460, 200, "implementa")
    flecha(lapiz, 900, 200, 820, 200, "usa")
    flecha(lapiz, 1220, 200, 1260, 200, "usa")
    flecha(lapiz, 220, 300, 220, 460, "")
    flecha(lapiz, 400, 540, 460, 540, "")
    flecha(lapiz, 820, 540, 900, 540, "")
    flecha(lapiz, 1220, 540, 1260, 540, "")
    lapiz.text((40, 760), "La interfaz aísla el caso de uso del motor. El circuito permite que un fallo del grafo no revierta el préstamo ya confirmado.", font=fuente(18), fill=TINTA)
    guardar(imagen, RAIZ / "docs" / "c4" / "c4_nivel4_codigo.png")


def poliglota():
    imagen, lapiz = nuevo(1600, 900, "Persistencia políglota y patrón Cache-Aside")
    caja(lapiz, 500, 110, 560, 120, "LibroService y PrestamoService", VERDE, 22)
    caja(lapiz, 60, 420, 340, 160, "PostgreSQL\nconsistencia fuerte\nusuarios, libros, préstamos", AZUL, 18)
    caja(lapiz, 440, 420, 340, 160, "Redis\nTTL 60 s y 120 s\nCache-Aside", ROJO, 18)
    caja(lapiz, 820, 420, 340, 160, "MongoDB\nficha y bitácora\nconsistencia eventual", NARANJA, 18)
    caja(lapiz, 1200, 420, 340, 160, "Neo4j\nautoría y préstamos\ncircuit breaker", MORADO, 18)
    flecha(lapiz, 620, 230, 230, 420, "1. confirmar")
    flecha(lapiz, 700, 230, 610, 420, "2. leer o invalidar")
    flecha(lapiz, 860, 230, 990, 420, "3. replicar")
    flecha(lapiz, 980, 230, 1370, 420, "4. relacionar")
    lapiz.text((60, 700), "Si Redis o Neo4j fallan, la lectura sigue en PostgreSQL y la relación queda marcada como pendiente.", font=fuente(20), fill=TINTA)
    guardar(imagen, RAIZ / "docs" / "database" / "modelo_poliglota.png")


if __name__ == "__main__":
    clases()
    secuencia()
    actividades()
    paquetes()
    contexto()
    contenedores()
    componentes()
    codigo()
    poliglota()
