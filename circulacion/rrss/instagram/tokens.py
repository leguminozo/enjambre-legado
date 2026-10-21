#!/usr/bin/env python3
"""
tokens.py — Paleta de marca para los generadores de oficina.

La verdad del color vive en `packages/ui/src/tokens.css`. Este módulo la lee y
la entrega en RGB para Pillow, de modo que la pieza que sale de la oficina y
la que sale del estudio en el navegador no puedan separarse.

Si el archivo de tokens no está (uso suelto del script), se usan los mismos
valores como respaldo: el script nunca se queda sin color.
"""

import os
import re

REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
TOKENS_CSS = os.path.join(REPO_DIR, "packages", "ui", "src", "tokens.css")

_TOKEN_PATTERN = re.compile(r"--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;")


def _load_tokens():
    tokens = {}
    try:
        with open(TOKENS_CSS, "r", encoding="utf-8") as handle:
            content = handle.read()
    except OSError:
        return tokens

    for name, value in _TOKEN_PATTERN.findall(content):
        tokens.setdefault(name, value)
    return tokens


def _hex_to_rgb(value):
    value = value.lstrip("#")
    if len(value) == 3:
        value = "".join(char * 2 for char in value)
    if len(value) < 6:
        return (0, 0, 0)
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


_TOKENS = _load_tokens()


def token(name, fallback):
    """Devuelve el token como RGB. Si no existe, el respaldo."""
    value = _TOKENS.get(name)
    if not value:
        return _hex_to_rgb(fallback)
    return _hex_to_rgb(value)


def token_hex(name, fallback):
    value = _TOKENS.get(name)
    return value if value else fallback


# ── Atmósfera Obsidiana (la del estudio por defecto) ──────────────────────
BG_DARK = token("--enj-slide-obsidiana-bg", "#0A0B0A")
CARD_DARK = token("--enj-slide-obsidiana-card", "#101310")
BORDER_LINE = token("--enj-slide-obsidiana-border", "#262C27")
DIVIDER_MUTED = token("--enj-slide-obsidiana-divider", "#1A201B")
TEXT_IVORY = token("--enj-slide-obsidiana-fg", "#F2EEE6")
TEXT_MUTED = token("--enj-slide-obsidiana-muted", "#8E9690")

# ── Acento ────────────────────────────────────────────────────────────────
GOLD_ACCENT = token("--enj-accent-oro", "#D6AA5C")
GOLD_MUTED = token("--enj-accent-oro-muted", "#A07E44")

# ── Carrusel 01 (pieza ya publicada) ───────────────────────────────────────
CARRUSEL_01_BG = token("--enj-carrusel-01-bg", "#070A08")
CARRUSEL_01_CARD = token("--enj-carrusel-01-card", "#0E1410")
CARRUSEL_01_BORDER = token("--enj-carrusel-01-border", "#202A23")
CARRUSEL_01_DIVIDER = token("--enj-carrusel-01-divider", "#18201A")
CARRUSEL_01_FG = token("--enj-carrusel-01-fg", "#EDE8DF")
CARRUSEL_01_MUTED = token("--enj-carrusel-01-muted", "#828C84")
CARRUSEL_01_ACCENT = token("--enj-carrusel-01-accent", "#D4A359")
CARRUSEL_01_ACCENT_MUTED = token("--enj-carrusel-01-accent-muted", "#4B3A20")
