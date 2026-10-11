# WCAG 2.2 contrast checker for the "Sky of the islands" palette. Usage: python3 contrast.py
def luminance(hex_color):
    h = hex_color.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = sorted([luminance(a), luminance(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

PALETTE = dict(
    # Sora (空, sky)
    sora50='#F3F9FE', sora100='#DDEEFB', sora200='#BCDDF5', sora300='#8CC4EC', sora500='#3F8ED0',
    sora700='#1D5C9A', sora900='#14335A',
    # Kumo (雲, cloud) and text
    kumo='#FFFFFF', ink='#14335A', inkMuted='#4B6585', controlBorder='#6F8BAC',
    # Hikari (光, light)
    hikari300='#FBE3A2', hikari400='#F3C658', hikari600='#B4842A',
    # Midori (緑, islands) and Beni (紅, the sword)
    midori400='#7FC08E', midori700='#2E6B45', beni400='#F08A97', beni600='#B23447',
    # Tsuki theme (Yoru 夜, starry night)
    yoru900='#0E1F3B', yoru800='#162B4D', yoru700='#203A63', nightText='#EAF3FC', nightMuted='#A8BDD6',
    nightLink='#9CCBF2', nightBorder='#6582AA',
)

PAIRS = [
    # Hikari theme (day, default)
    ('ink', 'sora50', 'body text', 4.5), ('ink', 'kumo', 'text on card', 4.5),
    ('inkMuted', 'sora50', 'muted text', 4.5), ('inkMuted', 'kumo', 'muted text on card', 4.5),
    ('sora700', 'kumo', 'links', 4.5), ('sora700', 'sora50', 'links on background', 4.5),
    ('kumo', 'sora700', 'primary button', 4.5), ('ink', 'hikari400', 'buy button (CTA)', 4.5),
    ('kumo', 'beni600', 'danger button', 4.5), ('beni600', 'kumo', 'error text', 4.5),
    ('midori700', 'kumo', 'success text', 4.5), ('controlBorder', 'kumo', 'input border', 3.0),
    ('sora500', 'kumo', 'focus ring', 3.0), ('ink', 'sora100', 'text on chip', 4.5),
    # Tsuki theme (night)
    ('nightText', 'yoru900', 'body text (night)', 4.5), ('nightMuted', 'yoru800', 'muted text (night)', 4.5),
    ('nightLink', 'yoru800', 'links (night)', 4.5), ('yoru900', 'nightLink', 'primary button (night)', 4.5),
    ('yoru900', 'hikari400', 'buy button (night)', 4.5), ('beni400', 'yoru800', 'error (night)', 4.5),
    ('midori400', 'yoru800', 'success (night)', 4.5), ('nightBorder', 'yoru800', 'input border (night)', 3.0),
]

if __name__ == '__main__':
    failures = 0
    for fg, bg, use, minimum in PAIRS:
        r = ratio(PALETTE[fg], PALETTE[bg]); ok = r >= minimum; failures += not ok
        print(f"{'OK  ' if ok else 'LOW '} {r:5.2f}:1 (min {minimum}) {fg} on {bg} — {use}")
    print('failures:', failures)
