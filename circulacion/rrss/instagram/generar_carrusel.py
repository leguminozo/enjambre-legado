#!/usr/bin/env python3
"""
generar_carrusel.py — Generador de carruseles de alta densidad para Instagram (Enjambre Legado).
Genera secuencias de micro-piezas listas para publicar (1080x1350 px, ratio 4:5 vertical).
"""

import os
from PIL import Image, ImageDraw, ImageFont

from tokens import (
    CARRUSEL_01_ACCENT,
    CARRUSEL_01_ACCENT_MUTED,
    CARRUSEL_01_BG,
    CARRUSEL_01_BORDER,
    CARRUSEL_01_CARD,
    CARRUSEL_01_DIVIDER,
    CARRUSEL_01_FG,
    CARRUSEL_01_MUTED,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "assets", "carrusel_01_manifiesto")
FONTS_DIR = os.path.join(REPO_DIR, "fonts")

os.makedirs(ASSETS_DIR, exist_ok=True)

# Dimensiones Instagram 4:5 (1080x1350 px)
WIDTH, HEIGHT = 1080, 1350

# Paleta tomada de packages/ui/src/tokens.css (carrusel 01, pieza ya publicada)
BG_COLOR = CARRUSEL_01_BG
CARD_BG = CARRUSEL_01_CARD
BORDER_COLOR = CARRUSEL_01_BORDER
DIVIDER_COLOR = CARRUSEL_01_DIVIDER
TEXT_MAIN = CARRUSEL_01_FG
TEXT_MUTED = CARRUSEL_01_MUTED
ACCENT_COLOR = CARRUSEL_01_ACCENT
ACCENT_MUTED = CARRUSEL_01_ACCENT_MUTED

# Rutas de fuentes locales TTF
FONT_DISPLAY_PATH = os.path.join(FONTS_DIR, "CormorantGaramond.ttf")
FONT_ITALIC_PATH = os.path.join(FONTS_DIR, "CormorantGaramond-Italic.ttf")
FONT_BODY_PATH = os.path.join(FONTS_DIR, "SourceSans3.ttf")
FONT_MONO_PATH = os.path.join(FONTS_DIR, "JetBrainsMono.ttf")

def get_font(font_type, size):
    paths = {
        "display": FONT_DISPLAY_PATH,
        "italic": FONT_ITALIC_PATH,
        "body": FONT_BODY_PATH,
        "mono": FONT_MONO_PATH
    }
    path = paths.get(font_type, FONT_BODY_PATH)
    if os.path.exists(path):
        try:
            return ImageFont.truetype(path, size)
        except Exception as e:
            print(f"Error cargando fuente {path}: {e}")
    return ImageFont.load_default()

def draw_base_frame(draw, index_str, tag_str, top_right="CHILOÉ 42°S", footer_left="ENJAMBRE LEGADO", footer_right="01/06"):
    # Marco perimetral fino
    draw.rectangle([50, 50, WIDTH - 50, HEIGHT - 50], outline=BORDER_COLOR, width=1)
    
    font_meta = get_font("mono", 22)
    
    # Cabecera superior izquierda
    header_text = f"[{index_str} // {tag_str}]"
    draw.text((85, 85), header_text, fill=ACCENT_COLOR, font=font_meta)
    
    # Cabecera superior derecha
    bbox_tr = font_meta.getbbox(top_right)
    draw.text((WIDTH - 85 - (bbox_tr[2] - bbox_tr[0]), 85), top_right, fill=TEXT_MUTED, font=font_meta)
    
    # Línea sutil superior
    draw.line([(85, 135), (WIDTH - 85, 135)], fill=DIVIDER_COLOR, width=1)
    
    # Línea sutil inferior
    draw.line([(85, HEIGHT - 135), (WIDTH - 85, HEIGHT - 135)], fill=DIVIDER_COLOR, width=1)
    
    # Pie de página
    draw.text((85, HEIGHT - 100), footer_left, fill=TEXT_MUTED, font=font_meta)
    bbox_fr = font_meta.getbbox(footer_right)
    draw.text((WIDTH - 85 - (bbox_fr[2] - bbox_fr[0]), HEIGHT - 100), footer_right, fill=ACCENT_COLOR, font=font_meta)

def generar_slide_01():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "01/06", "ARCHIVO BOTÁNICO", top_right="CHILOÉ 42°S", footer_left="POSICIÓN SOBERANA", footer_right="01/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 230), "ENJAMBRE LEGADO // INVENTARIO 01", fill=ACCENT_COLOR, font=font_badge)
    
    font_display = get_font("display", 76)
    lineas = [
        "El 80% de lo que",
        "compraste como miel",
        "nunca vio una flor nativa."
    ]
    cur_y = 310
    for linea in lineas:
        draw.text((85, cur_y), linea, fill=TEXT_MAIN, font=font_display)
        cur_y += 94
        
    font_italic = get_font("italic", 44)
    draw.text((85, cur_y + 40), "La pasteurización industrial apagó el bosque.", fill=TEXT_MUTED, font=font_italic)
    
    # Tarjeta inferior informativa
    card_top = 860
    draw.rectangle([85, card_top, WIDTH - 85, card_top + 260], fill=CARD_BG, outline=BORDER_COLOR, width=1)
    
    font_cta = get_font("mono", 24)
    draw.text((125, card_top + 45), "DESLIZA HACIA LA VERDAD BOTÁNICA ➔", fill=ACCENT_COLOR, font=font_cta)
    
    font_cta_body = get_font("body", 28)
    lineas_cta = [
        "Análisis químico de laboratorio, geografía",
        "y floraciones de la selva fría de Chiloé."
    ]
    y_cta = card_top + 105
    for l in lineas_cta:
        draw.text((125, y_cta), l, fill=TEXT_MAIN, font=font_cta_body)
        y_cta += 42
        
    font_cta_foot = get_font("mono", 20)
    draw.text((125, card_top + 205), "INFRAESTRUCTURA DE ORIGEN SIN INTERMEDIARIOS", fill=TEXT_MUTED, font=font_cta_foot)
    
    out_path = os.path.join(ASSETS_DIR, "slide_01_portada.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

def generar_slide_02():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "02/06", "FRICCIÓN INDUSTRIAL", top_right="CALOR vs. VIDA", footer_left="REF: CODEX ALIMENTARIUS CXS 12-1981", footer_right="02/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 210), "ESTABILIZACIÓN TÉRMICA EN GÓNDOLA", fill=ACCENT_COLOR, font=font_badge)
    
    font_title = get_font("display", 62)
    draw.text((85, 270), "El estándar de supermercado", fill=TEXT_MAIN, font=font_title)
    
    font_body = get_font("body", 36)
    bloques = [
        ("Para que un frasco permanezca idéntico y líquido", False),
        ("por años en una estantería de retail masivo,", False),
        ("la industria somete la miel a más de 70 °C.", False),
        ("", False),
        ("Ese choque térmico destruye las enzimas vivas", False),
        ("(diastasa e invertasa) y apaga la floración.", False),
        ("", False),
        ("Lo que compras no es néctar virgen:", False),
        ("es jarabe biológicamente inerte.", True)
    ]
    
    cur_y = 400
    for texto, is_accent in bloques:
        if texto == "":
            cur_y += 30
            continue
        color = ACCENT_COLOR if is_accent else TEXT_MAIN
        draw.text((85, cur_y), texto, fill=color, font=font_body)
        cur_y += 56
        
    # Nota técnica al pie del contenido
    draw.rectangle([85, 1000, WIDTH - 85, 1140], fill=CARD_BG, outline=BORDER_COLOR, width=1)
    font_note = get_font("mono", 22)
    draw.text((120, 1035), "TEMPERATURA NATURAL EN COLMENA: < 35 °C", fill=TEXT_MUTED, font=font_note)
    draw.text((120, 1075), "PASTEURIZACIÓN INDUSTRIAL COMERCIAL: > 70 °C (DESNATURALIZADA)", fill=ACCENT_COLOR, font=font_note)
    
    out_path = os.path.join(ASSETS_DIR, "slide_02_friccion.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

def generar_slide_03():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "03/06", "INFRAESTRUCTURA SITUADA", top_right="TRAZABILIDAD", footer_left="ENJAMBRE LEGADO // LABORATORIO", footer_right="03/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 200), "REGISTRO TÉCNICO DE ORIGEN · LOTE 01", fill=ACCENT_COLOR, font=font_badge)
    
    font_title = get_font("display", 58)
    draw.text((85, 260), "La anatomía del lote activo", fill=TEXT_MAIN, font=font_title)
    
    # Tarjeta de datos de laboratorio
    card_top = 370
    card_bottom = 980
    draw.rectangle([85, card_top, WIDTH - 85, card_bottom], fill=CARD_BG, outline=BORDER_COLOR, width=1)
    
    filas = [
        ("ORIGEN GEOGRÁFICO", "Archipiélago de Chiloé (42°S)"),
        ("ESPECIE DOMINANTE", "Ulmo (Eucryphia cordifolia)"),
        ("FLORACIÓN ASOCIADA", "Tiaca + Tineo de selva fría"),
        ("TEMPERATURA PANAL", "< 35 °C (Sin calentar)"),
        ("PASTEURIZACIÓN", "0% (Firma enzimática viva)"),
        ("FILTRADO FÍSICO", "Mecánico grueso (Conserva polen)"),
        ("ACIDEZ LIBRE", "Certificada bajo norma Codex")
    ]
    
    font_lbl = get_font("mono", 22)
    font_val = get_font("mono", 24)
    
    y = card_top + 45
    for lbl, val in filas:
        draw.text((125, y), lbl, fill=TEXT_MUTED, font=font_lbl)
        
        color_val = ACCENT_COLOR if ("0%" in val or "< 35" in val) else TEXT_MAIN
        bbox_v = font_val.getbbox(val)
        val_w = bbox_v[2] - bbox_v[0]
        draw.text((WIDTH - 125 - val_w, y), val, fill=color_val, font=font_val)
        
        draw.line([(125, y + 46), (WIDTH - 125, y + 46)], fill=DIVIDER_COLOR, width=1)
        y += 74
        
    font_pie = get_font("body", 28)
    draw.text((85, 1030), "Cada recolección conserva la huella química de su ventana climática.", fill=TEXT_MUTED, font=font_pie)
    draw.text((85, 1075), "Sin homogeneizar lotes ni alterar concentraciones.", fill=TEXT_MAIN, font=font_pie)
    
    out_path = os.path.join(ASSETS_DIR, "slide_03_infraestructura.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

def generar_slide_04():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "04/06", "CIENCIA SENSORIAL", top_right="PANEL ST-CATA", footer_left="CALIBRACIÓN BOTÁNICA", footer_right="04/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 200), "PERCEPCIÓN CALIBRADA (ST-CATA)", fill=ACCENT_COLOR, font=font_badge)
    
    font_title = get_font("display", 62)
    draw.text((85, 260), "La miel real no sabe solo a dulce.", fill=TEXT_MAIN, font=font_title)
    
    font_sub = get_font("body", 30)
    draw.text((85, 350), "El bosque templado lluvioso imprime una firma aromática precisa:", fill=TEXT_MUTED, font=font_sub)
    
    # 4 bloques de descriptores sensoriales
    items = [
        ("01", "RESINA DE ULMO", "Floral denso · Balsámico", "Aroma cálido de floración estacional."),
        ("02", "HUMO DE BOSQUE", "Mineral · Madera húmeda", "Firma mineral del suelo de Chiloé."),
        ("03", "DAMASCO SECO", "Frutal · Acidez nativa", "Acidez equilibrada en retrogusto."),
        ("04", "CERA VIRGEN", "Textura microcristalina", "Untuosidad densa sin disolventes.")
    ]
    
    font_num = get_font("mono", 20)
    font_name = get_font("display", 38)
    font_cat = get_font("mono", 20)
    font_desc = get_font("body", 26)
    
    grid = [
        (85, 430, 520, 720),
        (560, 430, 995, 720),
        (85, 760, 520, 1050),
        (560, 760, 995, 1050)
    ]
    
    for idx, (num, name, cat, desc) in enumerate(items):
        x1, y1, x2, y2 = grid[idx]
        draw.rectangle([x1, y1, x2, y2], fill=CARD_BG, outline=BORDER_COLOR, width=1)
        draw.text((x1 + 35, y1 + 35), f"[{num}] // {cat}", fill=ACCENT_COLOR, font=font_cat)
        draw.text((x1 + 35, y1 + 80), name, fill=TEXT_MAIN, font=font_name)
        draw.text((x1 + 35, y1 + 180), desc, fill=TEXT_MUTED, font=font_desc)
        
    out_path = os.path.join(ASSETS_DIR, "slide_04_sensorial.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

def generar_slide_05():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "05/06", "EL OBJETO DE ORIGEN", top_right="CHILOÉ 2026", footer_left="DISPONIBILIDAD ESTACIONAL FINITA", footer_right="05/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 210), "LUJO TERRITORIAL SOBERANO", fill=ACCENT_COLOR, font=font_badge)
    
    font_title = get_font("display", 64)
    draw.text((85, 275), "Lote 01 · Recolección Estacional", fill=TEXT_MAIN, font=font_title)
    
    # Cuadro de enfoque
    card_top = 390
    draw.rectangle([85, card_top, WIDTH - 85, card_top + 600], fill=CARD_BG, outline=BORDER_COLOR, width=1)
    
    font_body = get_font("body", 35)
    parrafos = [
        ("Un extracto botánico sin diluir, envasado", False),
        ("en vidrio oscuro para proteger los peróxidos", False),
        ("y enzimas de la degradación lumínica.", False),
        ("", False),
        ("• Sin mezclas con mieles foráneas.", True),
        ("• Sin microfiltrado de alta presión.", True),
        ("• Sin químicos sintéticos de síntesis.", True),
        ("", False),
        ("Numerado y resguardado para quienes", False),
        ("exigen verdad material en su alimentación.", False)
    ]
    cur_y = card_top + 50
    for p, is_accent in parrafos:
        if p == "":
            cur_y += 24
            continue
        color = ACCENT_COLOR if is_accent else TEXT_MAIN
        draw.text((125, cur_y), p, fill=color, font=font_body)
        cur_y += 48
        
    font_sub = get_font("mono", 22)
    draw.text((85, 1050), "CÓDIGO DE LOTE Y CERTIFICADO DE ORIGEN EN CADA FRASCO", fill=TEXT_MUTED, font=font_sub)
    
    out_path = os.path.join(ASSETS_DIR, "slide_05_objeto.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

def generar_slide_06():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_COLOR)
    draw = ImageDraw.Draw(img)
    draw_base_frame(draw, "06/06", "ENTORNO OPERATIVO", top_right="ASIGNACIÓN DIRECTA", footer_left="ENJAMBRE LEGADO // INFRAESTRUCTURA", footer_right="06/06")
    
    font_badge = get_font("mono", 22)
    draw.text((85, 210), "PLATAFORMA CANÓNICA EN LÍNEA", fill=ACCENT_COLOR, font=font_badge)
    
    font_title = get_font("display", 64)
    draw.text((85, 275), "La tienda soberana está activa.", fill=TEXT_MAIN, font=font_title)
    
    font_body = get_font("body", 36)
    lineas = [
        "Enjambre Legado no depende de intermediarios",
        "ni de las cadenas de retail masivo.",
        "",
        "Hemos desplegado nuestra propia infraestructura",
        "para asignar los primeros frascos del Lote 01",
        "directamente desde el archipiélago de Chiloé.",
        "",
        "Territorio · Pureza botánica · Trazabilidad"
    ]
    cur_y = 410
    for l in lineas:
        if l == "":
            cur_y += 28
            continue
        color = ACCENT_COLOR if "Territorio · Pureza" in l else TEXT_MAIN
        draw.text((85, cur_y), l, fill=color, font=font_body)
        cur_y += 56
        
    # Caja de salida final (inevitable, soberana)
    box_y = 900
    draw.rectangle([85, box_y, WIDTH - 85, box_y + 190], fill=CARD_BG, outline=ACCENT_COLOR, width=1)
    
    font_url = get_font("mono", 34)
    draw.text((125, box_y + 45), "enjambrelegado.cl", fill=ACCENT_COLOR, font=font_url)
    
    font_sub_url = get_font("body", 28)
    draw.text((125, box_y + 105), "Asignación estacional y acceso directo en enlace de bio.", fill=TEXT_MAIN, font=font_sub_url)
    
    out_path = os.path.join(ASSETS_DIR, "slide_06_acceso.png")
    img.save(out_path, "PNG")
    print(f"✓ Generada: {out_path}")
    return out_path

if __name__ == "__main__":
    print("=" * 60)
    print("ENJAMBRE LEGADO — GENERADOR DE CARRUSEL 01 (INSTAGRAM)")
    print(f"Destino: {ASSETS_DIR}")
    print("=" * 60)
    
    generar_slide_01()
    generar_slide_02()
    generar_slide_03()
    generar_slide_04()
    generar_slide_05()
    generar_slide_06()
    
    print("=" * 60)
    print("¡Carrusel 01 generado con éxito! Las 6 imágenes están listas para subir.")
    print("=" * 60)
