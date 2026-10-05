#!/usr/bin/env python3
"""
generar_carrusel_oyz.py — Carrusel Atemporal y Soberano (Sin AI-Slop)
Marca: La Obrera y el Zángano (obrerayzangano.cl)

Reglas estrictas aplicadas:
1. Cero AI-slop reactivo: Prohibido definir la marca por contraste negativo ("no hacemos X", "a diferencia de la industria"). Toda la redacción es asertiva, fáctica y ontológica.
2. Inmune al envejecimiento: Cero fechas relativas ("22 años"). Se usa anclaje histórico absoluto ("Desde 2004") y constantes físicas/botánicas inmutables (<35°C, 42°S, 48h en frío, Codex CXS 12-1981).
3. Vocabulario sagrado: Recolección (jamás cosecha), maestría de origen, poder silencioso.
"""

import os
import random
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "assets", "carrusel_manifiesto_cientifico")
FONTS_DIR = os.path.join(REPO_DIR, "fonts")

os.makedirs(ASSETS_DIR, exist_ok=True)

WIDTH, HEIGHT = 1080, 1350

# Paleta editorial: Piedra oscura y oro alquímico
BG_DARK = (10, 11, 10)         # #0A0B0A
CARD_DARK = (16, 19, 16)       # #101310
BORDER_LINE = (38, 44, 39)     # #262C27
TEXT_IVORY = (242, 238, 230)    # #F2EEE6
TEXT_MUTED = (142, 150, 144)   # #8E9690
GOLD_ACCENT = (214, 170, 92)   # #D6AA5C
GOLD_MUTED = (160, 126, 68)    # #A07E44
DIVIDER_MUTED = (26, 32, 27)

FONT_SERIF = os.path.join(FONTS_DIR, "CormorantGaramond.ttf")
FONT_ITALIC = os.path.join(FONTS_DIR, "CormorantGaramond-Italic.ttf")
FONT_SANS = os.path.join(FONTS_DIR, "SourceSans3.ttf")
FONT_MONO = os.path.join(FONTS_DIR, "JetBrainsMono.ttf")

def get_font(font_type, size):
    mapping = {
        "serif": FONT_SERIF,
        "italic": FONT_ITALIC,
        "sans": FONT_SANS,
        "mono": FONT_MONO
    }
    p = mapping.get(font_type, FONT_SANS)
    if os.path.exists(p):
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            pass
    return ImageFont.load_default()

def create_slate_background():
    img = Image.new("RGB", (WIDTH, HEIGHT), color=BG_DARK)
    draw = ImageDraw.Draw(img)
    random.seed(2004)
    for _ in range(8500):
        x = random.randint(0, WIDTH - 1)
        y = random.randint(0, HEIGHT - 1)
        val = random.randint(6, 16)
        draw.point((x, y), fill=(val, val + 1, val))
    return img

def draw_header_footer(draw, num_slide, kicker_left, kicker_right="CHILOÉ · 42°S"):
    draw.rectangle([55, 55, WIDTH - 55, HEIGHT - 55], outline=BORDER_LINE, width=1)
    font_kicker = get_font("mono", 21)
    
    # Header
    draw.text((95, 95), f"LA OBRERA Y EL ZÁNGANO // {kicker_left}", fill=GOLD_ACCENT, font=font_kicker)
    bbox_kr = font_kicker.getbbox(kicker_right)
    draw.text((WIDTH - 95 - (bbox_kr[2] - bbox_kr[0]), 95), kicker_right, fill=TEXT_MUTED, font=font_kicker)
    
    draw.line([(95, 140), (WIDTH - 95, 140)], fill=DIVIDER_MUTED, width=1)
    
    # Footer
    draw.line([(95, HEIGHT - 140), (WIDTH - 95, HEIGHT - 140)], fill=DIVIDER_MUTED, width=1)
    draw.text((95, HEIGHT - 105), "obrerayzangano.cl", fill=TEXT_MUTED, font=font_kicker)
    
    slide_tag = f"{num_slide}/06"
    bbox_st = font_kicker.getbbox(slide_tag)
    draw.text((WIDTH - 95 - (bbox_st[2] - bbox_st[0]), HEIGHT - 105), slide_tag, fill=GOLD_ACCENT, font=font_kicker)

# ==========================================
# SLIDE 01: DECLARACIÓN BOTÁNICA
# ==========================================
def render_slide_01():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "01", "REGISTRO BOTÁNICO", "PARALELO 42°S")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 230), "DOCUMENTO DE ORIGEN // SELVA VALDIVIANA", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 74)
    lineas = [
        "La miel cruda es la",
        "memoria química del",
        "bosque nativo."
    ]
    y = 310
    for l in lineas:
        draw.text((95, y), l, fill=TEXT_IVORY, font=font_title)
        y += 92
        
    font_sub = get_font("italic", 38)
    draw.text((95, y + 25), "Un archivo biológico de floración estacional y enzimas intactas.", fill=TEXT_MUTED, font=font_sub)
    
    card_y = 690
    draw.rectangle([95, card_y, WIDTH - 95, card_y + 370], fill=CARD_DARK, outline=BORDER_LINE, width=1)
    
    font_card_head = get_font("mono", 22)
    draw.text((140, card_y + 45), "ESTÁNDAR DE EXTRACCIÓN SOBERANA", fill=GOLD_ACCENT, font=font_card_head)
    
    font_card_body = get_font("sans", 31)
    cuerpo = [
        "El néctar de bosque maduro opera como un concentrado botánico:",
        "contiene polen nativo específico, glucosa y fructosa crudas,",
        "y la firma enzimática de floraciones templadas lluviosas.",
        "",
        "Cada lote conserva la acidez, conductividad y perfil aromático",
        "de la cuenca donde las abejas establecieron su vuelo.",
        "",
        "Registro y constantes biológicas. ->"
    ]
    cy = card_y + 90
    for c in cuerpo:
        if c == "":
            cy += 12
            continue
        color = GOLD_ACCENT if "->" in c else TEXT_IVORY
        draw.text((140, cy), c, fill=color, font=font_card_body)
        cy += 40
        
    out = os.path.join(ASSETS_DIR, "slide_01_manifiesto.png")
    img.save(out, "PNG")
    print(f"✓ Slide 01 guardada: {out}")
    return out

# ==========================================
# SLIDE 02: ORIGEN Y PERMANENCIA (DESDE 2004)
# ==========================================
def render_slide_02():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "02", "HISTORIA & GEOGRAFÍA", "DESDE 2004")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 200), "FUNDACIÓN Y ASENTAMIENTO · CHILOÉ", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 62)
    draw.text((95, 260), "Colmenares en el paralelo 42° Sur.", fill=TEXT_IVORY, font=font_title)
    
    font_sub = get_font("sans", 32)
    draw.text((95, 345), "Técnica apícola adaptada a la geografía oceánica insular:", fill=TEXT_MUTED, font=font_sub)
    
    card_y = 430
    draw.rectangle([95, card_y, WIDTH - 95, card_y + 620], fill=CARD_DARK, outline=BORDER_LINE, width=1)
    
    pilares = [
        ("DESDE EL AÑO 2004", "Presencia documentada en colmenares del archipiélago de Chiloé."),
        ("CLIMA DE SELVA FRÍA", "Régimen de 2.400 mm de lluvia anual y vientos del Pacífico Sur."),
        ("RECOLECCIÓN DEL EXCEDENTE", "Respeto estricto a la reserva invernal. Se extrae solo el remanente estival."),
        ("DIVERSIDAD MELÍFERA", "Dosel maduro con floraciones sucesivas de Ulmo, Tiaca, Melí y Tepú.")
    ]
    
    font_pil_title = get_font("mono", 24)
    font_pil_desc = get_font("sans", 26)
    
    py = card_y + 40
    for titulo, desc in pilares:
        draw.text((135, py), titulo, fill=GOLD_ACCENT, font=font_pil_title)
        draw.text((135, py + 38), desc, fill=TEXT_IVORY, font=font_pil_desc)
        draw.line([(135, py + 105), (WIDTH - 135, py + 105)], fill=DIVIDER_MUTED, width=1)
        py += 140
        
    out = os.path.join(ASSETS_DIR, "slide_02_territorio.png")
    img.save(out, "PNG")
    print(f"✓ Slide 02 guardada: {out}")
    return out

# ==========================================
# SLIDE 03: CONSTANTES BIOQUÍMICAS Y CODEX
# ==========================================
def render_slide_03():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "03", "LABORATORIO", "NORMA CXS 12-1981")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 200), "PARÁMETROS QUÍMICOS AUDITABLES", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 60)
    draw.text((95, 260), "Constantes de la miel viva.", fill=TEXT_IVORY, font=font_title)
    
    font_sub = get_font("sans", 30)
    draw.text((95, 340), "Criterios analíticos aplicados a cada recolección de origen:", fill=TEXT_MUTED, font=font_sub)
    
    card_y = 420
    draw.rectangle([95, card_y, WIDTH - 95, card_y + 630], fill=CARD_DARK, outline=BORDER_LINE, width=1)
    
    metricas = [
        ("TEMPERATURA NATURAL", "< 35 °C en todo el ciclo (umbral biológico de la colmena)."),
        ("ENZIMAS DIASTASA & INVERTASA", "Actividad enzimática activa certificada según Codex Alimentarius."),
        ("PERÓXIDO DE HIDRÓGENO", "Factor antimicrobiano natural generado por la enzima glucosa oxidasa."),
        ("CONTEO MELISOPALINOLÓGICO", "Microscopía de granos de polen para certificar la especie dominante."),
        ("FILTRADO MECÁNICO GRUESO", "Retención deliberada de partículas de cera virgen y polen nativo.")
    ]
    
    font_m_title = get_font("mono", 23)
    font_m_desc = get_font("sans", 25)
    
    my = card_y + 35
    for m_tit, m_desc in metricas:
        draw.text((135, my), m_tit, fill=GOLD_ACCENT, font=font_m_title)
        draw.text((135, my + 34), m_desc, fill=TEXT_IVORY, font=font_m_desc)
        draw.line([(135, my + 90), (WIDTH - 135, my + 90)], fill=DIVIDER_MUTED, width=1)
        my += 115
        
    out = os.path.join(ASSETS_DIR, "slide_03_laboratorio.png")
    img.save(out, "PNG")
    print(f"✓ Slide 03 guardada: {out}")
    return out

# ==========================================
# SLIDE 04: BIOMASA Y CUENCAS (CO2)
# ==========================================
def render_slide_04():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "04", "BIOMASA & CUENCAS", "REGULACIÓN HÍDRICA")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 200), "ESTRUCTURA FORESTAL Y BALANCE DE CARBONO", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 58)
    draw.text((95, 260), "El dosel maduro y el agua.", fill=TEXT_IVORY, font=font_title)
    
    font_sub = get_font("sans", 30)
    draw.text((95, 345), "La floración nativa depende de la conservación de la selva fría:", fill=TEXT_MUTED, font=font_sub)
    
    card_y = 425
    bloques = [
        ("ÁRBOLES NODRIZA (Ulmo y Tiaca)", "Especies que alcanzan hasta 40 metros de altura, con alta densidad de fijación de carbono en biomasa forestal perenne."),
        ("PROTECCIÓN DE CUENCAS RIPARIAS", "Colmenares ubicados en cabeceras de cuencas de Chiloé que resguardan la red hídrica superficial y las turberas."),
        ("POLINIZACIÓN DE ESPECIES ENDÉMICAS", "La abeja propicia la dispersión genética y germinación de semillas de especies amenazadas del estrato medio.")
    ]
    
    font_b_tit = get_font("mono", 22)
    font_b_desc = get_font("sans", 25)
    
    by = card_y
    for b_tit, b_desc in bloques:
        draw.rectangle([95, by, WIDTH - 95, by + 180], fill=CARD_DARK, outline=BORDER_LINE, width=1)
        draw.text((135, by + 28), b_tit, fill=GOLD_ACCENT, font=font_b_tit)
        
        palabras = b_desc.split(" ")
        lineas_desc = []
        cur_l = []
        for p in palabras:
            cur_l.append(p)
            test_line = " ".join(cur_l)
            bbox = font_b_desc.getbbox(test_line)
            if bbox[2] - bbox[0] > 780:
                cur_l.pop()
                lineas_desc.append(" ".join(cur_l))
                cur_l = [p]
        if cur_l:
            lineas_desc.append(" ".join(cur_l))
            
        dy = by + 70
        for ld in lineas_desc:
            draw.text((135, dy), ld, fill=TEXT_IVORY, font=font_b_desc)
            dy += 34
            
        by += 205
        
    font_co2_note = get_font("mono", 22)
    draw.text((95, 1075), "VÍNCULO FORESTAL: CONSERVACIÓN CONTINUA DE CUENCAS EN CHILOÉ", fill=GOLD_MUTED, font=font_co2_note)
    
    out = os.path.join(ASSETS_DIR, "slide_04_bosque_co2.png")
    img.save(out, "PNG")
    print(f"✓ Slide 04 guardada: {out}")
    return out

# ==========================================
# SLIDE 05: LA FÍSICA EN DOS ESTADOS
# ==========================================
def render_slide_05():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "05", "ESTADOS FÍSICOS", "CRUDA & CREMADA")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 200), "COMPORTAMIENTO DE CRISTALIZACIÓN", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 60)
    draw.text((95, 260), "La materia en dos expresiones.", fill=TEXT_IVORY, font=font_title)
    
    font_sub = get_font("sans", 30)
    draw.text((95, 345), "Una misma recolección botánica; dos estructuras mecánicas en frío:", fill=TEXT_MUTED, font=font_sub)
    
    y_card = 420
    h_card = 600
    
    # Tarjeta 1: Miel Cruda Líquida
    draw.rectangle([95, y_card, 515, y_card + h_card], fill=CARD_DARK, outline=BORDER_LINE, width=1)
    draw.text((130, y_card + 40), "[ESTADO 01]", fill=GOLD_ACCENT, font=get_font("mono", 20))
    draw.text((130, y_card + 80), "MIEL CRUDA", fill=TEXT_IVORY, font=get_font("serif", 40))
    draw.text((130, y_card + 130), "Floración Estacional", fill=GOLD_MUTED, font=get_font("italic", 24))
    
    desc_1 = [
        "Extracción por centrifugado",
        "mecánico directo del panal.",
        "",
        "Ámbar dorado translúcido",
        "que cristaliza de forma",
        "espontánea y natural con",
        "el paso de los meses.",
        "",
        "Densidad original sin",
        "alteración de fase."
    ]
    dy1 = y_card + 185
    for l in desc_1:
        draw.text((130, dy1), l, fill=TEXT_IVORY, font=get_font("sans", 23))
        dy1 += 34
        
    # Tarjeta 2: Crema de Miel (Batido 48h)
    draw.rectangle([565, y_card, 985, y_card + h_card], fill=CARD_DARK, outline=BORDER_LINE, width=1)
    draw.text((600, y_card + 40), "[ESTADO 02]", fill=GOLD_ACCENT, font=get_font("mono", 20))
    draw.text((600, y_card + 80), "CREMA DE MIEL", fill=TEXT_IVORY, font=get_font("serif", 40))
    draw.text((600, y_card + 130), "Batido en Frío 48 Horas", fill=GOLD_MUTED, font=get_font("italic", 24))
    
    desc_2 = [
        "Micro-cristalización",
        "dirigida mecánicamente.",
        "",
        "Cuarenta y ocho horas de",
        "movimiento lento a",
        "temperatura ambiente.",
        "",
        "Estructura aterciopelada",
        "y untuosa permanente que",
        "mantiene su textura estable."
    ]
    dy2 = y_card + 185
    for l in desc_2:
        draw.text((600, dy2), l, fill=TEXT_IVORY, font=get_font("sans", 23))
        dy2 += 34
        
    font_foot = get_font("mono", 22)
    draw.text((95, 1070), "AMBAS PRESENTACIONES MANTIENEN SU FIRMA ENZIMÁTICA INTACTA", fill=GOLD_ACCENT, font=font_foot)
    
    out = os.path.join(ASSETS_DIR, "slide_05_dos_estados.png")
    img.save(out, "PNG")
    print(f"✓ Slide 05 guardada: {out}")
    return out

# ==========================================
# SLIDE 06: PLATAFORMA Y ACCESO DIRECTO
# ==========================================
def render_slide_06():
    img = create_slate_background()
    draw = ImageDraw.Draw(img)
    draw_header_footer(draw, "06", "BIBLIOTECA & ORIGEN", "ACCESO DIRECTO")
    
    font_badge = get_font("mono", 22)
    draw.text((95, 210), "ENTORNO ACTIVO · INFORMACIÓN PÚBLICA", fill=GOLD_ACCENT, font=font_badge)
    
    font_title = get_font("serif", 66)
    draw.text((95, 275), "Acceso directo al origen.", fill=TEXT_IVORY, font=font_title)
    
    font_body = get_font("sans", 34)
    lineas = [
        "En obrerayzangano.cl se encuentra documentado:",
        "",
        "• Monografías botánicas de cada floración nativa.",
        "• Catálogo de parámetros analíticos y científicos.",
        "• Trazabilidad por código de lote.",
        "• Asignación de Miel Cruda y Crema de Miel batida en frío.",
        "",
        "Despacho directo desde el archipiélago de Chiloé."
    ]
    y = 390
    for l in lineas:
        if l == "":
            y += 20
            continue
        color = GOLD_ACCENT if l.startswith("•") else TEXT_IVORY
        draw.text((95, y), l, fill=color, font=font_body)
        y += 48
        
    card_y = 860
    draw.rectangle([95, card_y, WIDTH - 95, card_y + 240], fill=CARD_DARK, outline=GOLD_ACCENT, width=1)
    
    font_site = get_font("mono", 40)
    draw.text((140, card_y + 55), "obrerayzangano.cl", fill=GOLD_ACCENT, font=font_site)
    
    font_call = get_font("sans", 30)
    draw.text((140, card_y + 115), "Tienda oficial y biblioteca botánica abierta.", fill=TEXT_IVORY, font=font_call)
    
    font_sub_call = get_font("mono", 22)
    draw.text((140, card_y + 165), "ENLACE DIRECTO EN LA BIOGRAFÍA ->", fill=TEXT_MUTED, font=font_sub_call)
    
    out = os.path.join(ASSETS_DIR, "slide_06_acceso.png")
    img.save(out, "PNG")
    print(f"✓ Slide 06 guardada: {out}")
    return out

if __name__ == "__main__":
    print("=" * 65)
    print("LA OBRERA Y EL ZÁNGANO — CARRUSEL ATEMPORAL & SOBERANO")
    print(f"Destino: {ASSETS_DIR}")
    print("=" * 65)
    
    render_slide_01()
    render_slide_02()
    render_slide_03()
    render_slide_04()
    render_slide_05()
    render_slide_06()
    
    print("=" * 65)
    print("¡Carrusel completado con éxito! 6 láminas listas para publicar.")
    print("=" * 65)
