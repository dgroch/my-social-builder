#!/usr/bin/env python3
"""
Phase 2: insert <div class="voice">{{voice}}</div> in the body of each
template (right after the kicker), and lay out the lower panel properly
so elements don't overlap.

Layout target (story-promo and similar tan-1 lower panels):
  kicker at y=1276 (12px)        ends 1288
  voice  at y=1312 (24px, 1.3lh)  ends ~1344
  h      at y=1376 (48px, 1.05lh) ends ~1426
  sub    at y=1456 (16px, 1.5lh)  ends ~1480
  pill   at y=1512 (12px + pad)
  rule   at bottom:160
  logo   at bottom:72
  cta    at bottom:84
"""
import os, re, glob

DS = "/opt/data/workspace/my-social-builder/design-system"

# Per-template, set positions for: kicker, voice, h, sub, pill, cta
# (other elements left alone)
# For lanes without a tan-1 lower panel (e.g. story-editorial, story-overlay,
# story-tagline, story-quote-soft) we leave positions alone — those have their
# own layouts.

LAYOUTS = {
    "story-promo/cover": {
        "kicker": (1276, "left"),
        "voice":  (1312, "left"),
        "h":      (1376, "left"),
        "sub":    (1456, "left"),
        "pill":   (1512, "left"),
    },
    "story-studio/cover": {
        "kicker": (1132, "left"),
        "voice":  (1168, "left"),
        "h":      (1232, "left"),
        "body":   (1320, "left"),
    },
    "story-gift/intro": {
        "kicker": (1132, "left"),
        "voice":  (1168, "left"),
        "h":      (1232, "left"),
        "body":   (1320, "left"),
    },
    "story-gift/closing": {
        "kicker": (1132, "center"),
        "voice":  (1168, "center"),
        "h":      (1216, "center"),
    },
    "carousel-journal/cover": {
        "kicker": (88,   "left"),
        "voice":  (124,  "left"),
        "h":      (200,  "left"),
    },
    "carousel-journal/intro": {
        "kicker": (88,   "left"),
        "voice":  (124,  "left"),
        "lede":   (200,  "left"),
    },
    "carousel-journal/interior": {
        "kicker": (88,   "left"),
        "voice":  (124,  "left"),
    },
    "carousel-journal/closing": {
        # closing has no kicker — skip
    },
}

def reposition(css, layout):
    """Set the `top` (and alignment) of each class in the layout dict."""
    for cls, (top, align) in layout.items():
        # find .cls{...} decl
        pattern = re.compile(rf"(\.{cls}\s*\{{)([^{{}}]*?)(\}})")
        def repl(m):
            head, inner, tail = m.group(1), m.group(2), m.group(3)
            # set top
            if "top:" in inner:
                inner = re.sub(r"top\s*:\s*\d+px", f"top:{top}px", inner)
            else:
                inner = inner.rstrip(";").rstrip() + f";top:{top}px"
            # alignment
            if align == "center":
                if "text-align:" in inner:
                    inner = re.sub(r"text-align\s*:\s*\w+", "text-align:center", inner)
                else:
                    inner = inner.rstrip(";").rstrip() + ";text-align:center"
            return head + inner + tail
        css = pattern.sub(repl, css)
    return css

def insert_voice_div(html):
    """Insert <div class="voice">{{voice}}</div> right after the kicker div,
    if not already present."""
    if "{{voice}}" in html:
        return html
    # find the kicker div and insert the voice div after it
    pattern = re.compile(r'(<div class="kicker">\{\{kicker\}\}</div>)')
    new_html, n = pattern.subn(
        r'\1\n  <div class="voice">{{voice}}</div>',
        html, count=1
    )
    return new_html

def add_voice_to_token_header(header):
    """Add `voice` token line to the TOKENS block if missing."""
    if re.search(r"^\s*voice\s*:", header, re.MULTILINE):
        return header
    if "LEVERS:" in header:
        return header.replace(
            "LEVERS:",
            "       voice     : text, optional   | Cervanttis voice line — its own block, never inline\n     LEVERS:",
            1
        )
    # find TOKENS and append
    return re.sub(
        r"(\s+\w+\s*:[^\n]*\n)(\s+LEVERS:|\Z)",
        lambda m: m.group(1) + "       voice     : text, optional   | Cervanttis voice line — its own block, never inline\n" + (m.group(2) if m.group(2).strip() else ""),
        header, count=1
    )

def process_file(path):
    with open(path) as f:
        c = f.read()
    m = re.match(r"^(<!--[\s\S]*?-->)([\s\S]*)$", c)
    if not m: return f"  SKIP {path}"
    header = m.group(1)
    body = m.group(2)
    template_key = os.path.relpath(path, DS).replace("designs/", "").replace(".html", "")
    layout = LAYOUTS.get(template_key, {})

    new_body = body
    if layout:
        new_body = reposition(new_body, layout)
    new_body = insert_voice_div(new_body)
    new_header = add_voice_to_token_header(header)

    new = new_header + new_body
    if new != c:
        with open(path, "w") as f:
            f.write(new)
    return f"  {os.path.relpath(path, DS)}: layout applied"

def main():
    files = sorted(glob.glob(f"{DS}/designs/*/*.html"))
    for f in files:
        print(process_file(f))

if __name__ == "__main__":
    main()
