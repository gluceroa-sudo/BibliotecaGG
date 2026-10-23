from pathlib import Path
from fpdf import FPDF

RAIZ = Path(__file__).resolve().parents[1]
FUENTE = r"C:\Windows\Fonts\arial.ttf"
FUENTE_B = r"C:\Windows\Fonts\arialbd.ttf"


class Documento(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.add_font("Arial", "", FUENTE)
        self.add_font("Arial", "B", FUENTE_B)
        self.set_auto_page_break(auto=True, margin=18)
        self.set_margins(16, 20, 16)

    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Arial", "", 9)
        self.set_text_color(70, 80, 70)
        self.cell(0, 8, "Biblioteca GG  |  Análisis de Sistemas II  |  Universidad Mariano Gálvez", align="L")
        self.ln(4)
        self.set_draw_color(31, 77, 58)
        self.set_line_width(0.4)
        self.line(16, 16, 194, 16)
        self.ln(6)

    def footer(self):
        self.set_y(-12)
        self.set_font("Arial", "", 9)
        self.set_text_color(70, 80, 70)
        self.cell(0, 8, str(self.page_no()), align="C")


def texto(pdf, contenido, tamano=11, negrita=False, alto=6):
    pdf.set_text_color(20, 20, 20)
    pdf.set_font("Arial", "B" if negrita else "", tamano)
    pdf.multi_cell(0, alto, contenido)
    pdf.ln(1)


def tabla(pdf, filas):
    if not filas:
        return
    columnas = max(len(fila) for fila in filas)
    ancho = pdf.epw / columnas
    alto_linea = 4.4
    for indice, fila in enumerate(filas):
        while len(fila) < columnas:
            fila.append("")
        pdf.set_font("Arial", "B" if indice == 0 else "", 8)
        alturas = []
        for celda in fila:
            lineas = pdf.multi_cell(ancho - 2, alto_linea, celda, dry_run=True, output="LINES")
            alturas.append(alto_linea * max(1, len(lineas)) + 3)
        alto = max(alturas) if alturas else 8
        if pdf.get_y() + alto > 275:
            pdf.add_page()
        x = pdf.l_margin
        y = pdf.get_y()
        for celda in fila:
            if indice == 0:
                pdf.set_fill_color(31, 77, 58)
                pdf.set_text_color(255, 255, 255)
                pdf.set_font("Arial", "B", 8)
            else:
                if indice % 2 == 0:
                    pdf.set_fill_color(232, 240, 234)
                else:
                    pdf.set_fill_color(255, 253, 248)
                pdf.set_text_color(20, 20, 20)
                pdf.set_font("Arial", "", 8)
            pdf.rect(x, y, ancho, alto, style="FD")
            pdf.set_xy(x + 1, y + 1)
            pdf.multi_cell(ancho - 2, alto_linea, celda)
            x += ancho
        pdf.set_xy(pdf.l_margin, y + alto)
    pdf.ln(3)


def imagen(pdf, ruta):
    if not ruta.exists():
        texto(pdf, f"[Imagen no encontrada: {ruta.name}]")
        return
    ancho = pdf.epw
    if pdf.get_y() > 180:
        pdf.add_page()
    pdf.image(str(ruta), w=ancho)
    pdf.ln(3)


def render(markdown, destino, base):
    pdf = Documento()
    pdf.add_page()
    for bloque in markdown.splitlines():
        linea = bloque.rstrip()
        if not linea.strip():
            pdf.ln(2)
            continue
        if linea.startswith("!["):
            inicio = linea.find("](")
            fin = linea.rfind(")")
            relativa = linea[inicio + 2:fin]
            imagen(pdf, (base / relativa).resolve())
            continue
        if linea.startswith("|"):
            continue
        if linea.startswith("# "):
            texto(pdf, linea[2:], 16, True, 8)
        elif linea.startswith("## "):
            texto(pdf, linea[3:], 13, True, 7)
        elif linea.startswith("### "):
            texto(pdf, linea[4:], 12, True, 6)
        elif linea.startswith("- "):
            texto(pdf, "•  " + linea[2:], 11, False, 6)
        else:
            texto(pdf, linea, 11, False, 6)
    # second pass would be needed for tables if we skip them above.
    pdf.output(str(destino))


def render_completo(markdown, destino, base):
    pdf = Documento()
    pdf.add_page()
    lineas = markdown.splitlines()
    indice = 0
    while indice < len(lineas):
        linea = lineas[indice].rstrip()
        if not linea.strip():
            pdf.ln(2)
            indice += 1
            continue
        if linea.startswith("|"):
            filas = []
            while indice < len(lineas) and lineas[indice].strip().startswith("|"):
                cruda = lineas[indice].strip()
                celdas = [celda.strip() for celda in cruda.strip("|").split("|")]
                if not all(set(celda) <= set("-: ") for celda in celdas):
                    filas.append(celdas)
                indice += 1
            tabla(pdf, filas)
            continue
        if linea.startswith("!["):
            inicio = linea.find("](")
            fin = linea.rfind(")")
            imagen(pdf, (base / linea[inicio + 2:fin]).resolve())
            indice += 1
            continue
        if linea.startswith("# "):
            texto(pdf, linea[2:], 16, True, 8)
        elif linea.startswith("## "):
            texto(pdf, linea[3:], 13, True, 7)
        elif linea.startswith("### "):
            texto(pdf, linea[4:], 12, True, 6)
        elif linea.startswith("- "):
            texto(pdf, "•  " + linea[2:], 11, False, 6)
        else:
            texto(pdf, linea, 11, False, 6)
        indice += 1
    destino.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(destino))
    print(destino.relative_to(RAIZ))


def main():
    trabajos = [
        ("docs/requirements/srs.md", "docs/requirements/srs_ieee_29148.pdf"),
        ("docs/requirements/fichas.md", "docs/requirements/fichas_diseno_ieee1016.pdf"),
        ("docs/architecture/escenarios.md", "docs/architecture/escenarios_iso25010.pdf"),
        ("docs/ui/reporte.md", "docs/ui/reporte_ux_ui.pdf"),
        ("docs/qa/plan.md", "docs/qa/plan_sqa_ieee730.pdf"),
        ("docs/qa/casos.md", "docs/qa/casos_prueba_ieee29119.pdf"),
        ("docs/qa/defectos.md", "docs/qa/reporte_defectos_ieee1044.pdf"),
        ("docs/qa/trazabilidad.md", "docs/qa/trazabilidad.pdf"),
        ("docs/informe.md", "docs/Informe_Proyecto_Final_GrupoGG.pdf"),
        ("docs/informe.md", "informe/informe_proyecto_final.pdf"),
    ]
    for origen, destino in trabajos:
        ruta = RAIZ / origen
        render_completo(ruta.read_text(encoding="utf-8"), RAIZ / destino, ruta.parent)


if __name__ == "__main__":
    main()
