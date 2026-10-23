import json
import sys
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]

SALIDAS = {
    RAIZ / "docs" / "uml" / "clases.puml": RAIZ / "docs" / "uml" / "clases.png",
    RAIZ / "docs" / "uml" / "secuencia.puml": RAIZ / "docs" / "uml" / "secuencia.png",
    RAIZ / "docs" / "uml" / "actividades.puml": RAIZ / "docs" / "uml" / "actividades.png",
    RAIZ / "docs" / "uml" / "paquetes.puml": RAIZ / "docs" / "uml" / "paquetes.png",
    RAIZ / "docs" / "c4" / "src" / "c4_nivel1_contexto.puml": RAIZ / "docs" / "c4" / "c4_nivel1_contexto.png",
    RAIZ / "docs" / "c4" / "src" / "c4_nivel2_contenedores.puml": RAIZ / "docs" / "c4" / "c4_nivel2_contenedores.png",
    RAIZ / "docs" / "c4" / "src" / "c4_nivel3_componentes.puml": RAIZ / "docs" / "c4" / "c4_nivel3_componentes.png",
    RAIZ / "docs" / "c4" / "src" / "c4_nivel4_codigo.puml": RAIZ / "docs" / "c4" / "c4_nivel4_codigo.png",
    RAIZ / "docs" / "database" / "modelo_poliglota.puml": RAIZ / "docs" / "database" / "modelo_poliglota.png",
}


def render(origen: Path, destino: Path) -> None:
    cuerpo = origen.read_text(encoding="utf-8").encode("utf-8")
    solicitud = urllib.request.Request(
        "https://kroki.io/plantuml/png",
        data=cuerpo,
        headers={"Content-Type": "text/plain", "Accept": "image/png"},
        method="POST",
    )
    with urllib.request.urlopen(solicitud, timeout=60) as respuesta:
        datos = respuesta.read()
    if not datos.startswith(b"\x89PNG"):
        raise RuntimeError(f"Respuesta no PNG para {origen.name}")
    destino.write_bytes(datos)
    print(f"OK {destino.relative_to(RAIZ)} ({len(datos)} bytes)")


def main() -> int:
    errores = 0
    for origen, destino in SALIDAS.items():
        try:
            render(origen, destino)
        except Exception as error:
            errores += 1
            print(f"FALLO {origen.name}: {error}", file=sys.stderr)
    return 1 if errores else 0


if __name__ == "__main__":
    raise SystemExit(main())
