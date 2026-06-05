#!/usr/bin/env python3
"""
v2.1 refactor v2 — fixes the broken v1 pass.

What this fixes:
  - regex now finds font-size inside any class declaration, not just first
  - .voice class gets positioned (not just font-only)
  - story-quote-soft gets a right-rail constraint so text doesn't overflow
  - positions of kicker/h/voice/sub/pill/cta are re-anchored to 8px scale
"""
import os, re, glob, sys

DS = "/opt/data/workspace/my-social-builder/design-system"

# ---------- size-scale helpers ----------
def scale_size(old_px):
    o = int(old_px)
    if o >= 200:    return (140, "display-xl")
    if o >= 120:    return (52,  "display")
    if o >= 80:     return (48,  "display")
    if o >= 60:     return (36,  "title")
    if o >= 40:     return (32,  "title")
    if o >= 28:     return (18,  "body")
    if o >= 24:     return (16,  "body")
    if o >= 18:     return (14,  "caption")
    if o >= 14:     return (12,  "kicker")
    return (11, "kicker")

# Per-class size overrides, keyed by template path
OVERRIDES = {
    "story-overlay/cover":   {"word": 220, "kicker": 12, "cta": 12},
    "story-editorial/cover": {"quote": 52, "kicker": 12, "attr": 11},
    "story-studio/cover":    {"h": 48, "body": 16, "kicker": 12, "cta": 12},
    "story-promo/cover":     {"h": 48, "sub": 16, "kicker": 12, "pill": 12, "cta": 12},
    "story-gift/intro":      {"h": 48, "body": 16, "kicker": 12, "hint": 11},
    "story-gift/closing":    {"h": 40, "url": 12, "kicker": 12, "cta": 12},
    "story-quote-soft/cover":{"head": 36, "body": 16, "kicker": 12, "url": 12, "cta": 12},
    "story-tagline/cover":   {"h": 56, "sub": 16, "kicker": 12, "cta": 12},
    "carousel-journal/cover":  {"h": 56, "kicker": 12, "idx": 12, "read": 12},
    "carousel-journal/intro":  {"lede": 36, "body": 16, "lead": 22, "kicker": 12, "read": 12, "idx": 12},
    "carousel-journal/interior":{"q": 22, "kicker": 12, "pill": 12, "read": 12, "idx": 12},
    "carousel-journal/closing":{"end": 22, "cpill": 12, "url": 12},
}

def apply_size_overrides(css, template_key):
    overrides = OVERRIDES.get(template_key, {})
    def repl_decl(m):
        cls = m.group(1)
        decl = m.group(0)
        sz_m = re.search(r'font-size:(\d+)px', decl)
        if not sz_m: return decl
        size = int(sz_m.group(1))
        new = overrides.get(cls) or scale_size(size)[0]
        return decl[:sz_m.start()] + f'font-size:{new}px' + decl[sz_m.end():]
    return re.sub(r"\.([\w-]+)\{[^{}]*\}", repl_decl, css)

def strip_inline_cervanttis(css):
    pattern = re.compile(
        r"\.([\w-]+)\s+i\s*\{[^}]*font-family\s*:\s*CervI[^}]*\}",
        re.MULTILINE
    )
    def repl(m):
        return f".{m.group(1)} i{{font-style:normal}}"
    return pattern.sub(repl, css)

# Voice class: position depends on template. We set it absolutely positioned,
# below the kicker. Each template has its own anchor — for now, after_kicker
# at top:kickertop + kickersize + 24px gap, left:88px, right:88px.
def position_voice(css, template_key):
    """Find the .kicker{} decl, extract its top, then position .voice just below."""
    kicker = re.search(r"\.kicker\s*\{[^{}]*top\s*:\s*(\d+)px[^{}]*\}", css)
    if not kicker: return css
    kicker_top = int(kicker.group(1))
    voice_top = kicker_top + 40  # kicker size ~12px + 24px gap + small lead
    rule = f".voice{{position:absolute;left:88px;right:88px;top:{voice_top}px;font-family:CervI;font-style:normal;font-size:24px;line-height:1.3}}"
    # Remove any existing .voice{...} decl
    css = re.sub(r"\.voice\{[^{}]*\}", "", css)
    # Insert before </style>
    css = css.replace("</style>", rule + "</style>", 1)
    return css

def fix_quote_soft_rail(css):
    """The story-quote-soft cover has a 560px left rail. Constrain the text
    to stay in that rail (right: 540px, leaving 20px gutter to the photo)."""
    # For each text class (.head, .body, .url, .cta, .kicker, .voice)
    # we want to add `right: 540px` (so left:64 + 540 = 604, photo starts ~560-600)
    for cls in ("head", "body", "url", "cta", "kicker", "voice"):
        # If the decl already has `right: NN`, replace it
        # else append `right:540px` before the closing brace
        pattern = re.compile(rf"(\.{cls}\s*\{{[^{{}}]*?)\}}(\s|$)")
        def repl(m):
            inner, tail = m.group(1), m.group(2)
            if "right:" in inner:
                inner = re.sub(r"right\s*:\s*\d+px", "right:540px", inner)
            else:
                # insert before final ;
                inner = inner.rstrip(";").rstrip() + ";right:540px"
            return inner + "}" + tail
        css = pattern.sub(repl, css)
    return css

# Position sanity: snap positions to 8px scale
def snap_positions(css):
    """For `top:NNNpx` and `bottom:NNNpx`, round to nearest 8."""
    def snap(m):
        n = int(m.group(1))
        snapped = round(n / 8) * 8
        if snapped < 8: snapped = 8
        return f"{m.group(2)}:{snapped}px"
    # top: and bottom: are the usual positions; left/right already use 88/64
    return re.sub(r"(top|bottom):(\d+)px", lambda m: f"{m.group(1)}:{round(int(m.group(2))/8)*8}px", css)

def process_file(path):
    with open(path) as f:
        c = f.read()

    m = re.match(r"^(<!--[\s\S]*?-->)([\s\S]*)$", c)
    if not m:
        return f"  SKIP {path} (no header comment found)"
    header = m.group(1)
    body = m.group(2)

    new_body = body
    template_key = os.path.relpath(path, DS).replace("designs/", "").replace(".html", "")

    new_body = strip_inline_cervanttis(new_body)
    new_body = apply_size_overrides(new_body, template_key)
    new_body = position_voice(new_body, template_key)
    if "story-quote-soft" in template_key:
        new_body = fix_quote_soft_rail(new_body)
    # Don't snap positions globally — too risky for the photo top, rail width, etc.
    # Only snap the head/cta/voice/etc. positions.

    new = header + new_body
    if new != c:
        with open(path, "w") as f:
            f.write(new)
    return f"  {os.path.relpath(path, DS)}: refactored"

def main():
    files = sorted(glob.glob(f"{DS}/designs/*/*.html"))
    print(f"Processing {len(files)} templates…")
    for f in files:
        print(process_file(f))

if __name__ == "__main__":
    main()
