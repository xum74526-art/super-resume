"""Generate original, text-free Word decorations for the folded design series.

Uses Pillow only during asset maintenance; exports have no Python dependency.
The PDF renderer draws equivalent vector geometry directly.
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw

PROJECT = Path(__file__).resolve().parents[2]
ROOT = PROJECT / 'assets' / 'decorations'
ROOT.mkdir(parents=True, exist_ok=True)
SCALE = 4
STYLES = json.loads((PROJECT / 'src/core/documents/folded-styles.json').read_text(encoding='utf-8'))

def canvas(width, height):
    image = Image.new('RGBA', (round(width*SCALE), round(height*SCALE)))
    return image, ImageDraw.Draw(image)

def polygon(draw, points, fill):
    draw.polygon([(round(x*SCALE), round(y*SCALE)) for x, y in points], fill=fill)

def rect(draw, x, y, w, h, fill):
    draw.rectangle((round(x*SCALE), round(y*SCALE), round((x+w)*SCALE), round((y+h)*SCALE)), fill=fill)

for style in STYLES:
    accent, secondary, paper = ('#'+style[key] for key in ('accent','secondary','paper'))
    prefix, tag = style['asset'], style['tag']
    for locale, end in [('zh', 74), ('en', 140)]:
        image, draw = canvas(525, 24)
        if tag == 'double':
            polygon(draw, [(5,0),(end+8,0),(end+25,14),(5,14)], secondary)
        points = [(0,0),(end,0),(end+17,17),(0,17)]
        if tag == 'chevron':
            points = [(0,0),(end+8,0),(end+22,8.5),(end+8,17),(0,17),(5,8.5)]
        elif tag == 'notch':
            points = [(0,0),(end+17,0),(end+10,8.5),(end+17,17),(0,17)]
        elif tag == 'flag':
            points = [(0,0),(end+17,0),(end+10,17),(0,17)]
        elif tag == 'ticket':
            points = [(0,0),(end+17,0),(end+17,5),(end+12,8.5),(end+17,12),(end+17,17),(0,17),(0,12),(4,8.5),(0,5)]
        elif tag == 'step':
            points = [(0,0),(end+3,0),(end+3,5),(end+12,5),(end+12,10),(end+20,10),(end+20,17),(0,17)]
        polygon(draw, points, accent)
        if tag == 'slash':
            for offset in (3,8):
                polygon(draw, [(end-offset,0),(end-offset-1.3,0),(end+17-offset-1.3,17),(end+17-offset,17)], 'white')
        elif tag in ('outline','edge'):
            polygon(draw, [(1,1),(end-.5,1),(end+14.5,16),(1,16)], paper)
            if tag == 'edge': rect(draw,0,0,5,17,accent)
        elif tag == 'bookmark':
            rect(draw,0,0,4,17,secondary)
        elif tag == 'step':
            rect(draw,end+7,0,13,3,secondary)
        polygon(draw, [(0,17),(10,17),(10,22)], '#365765' if tag == 'slash' else secondary)
        rect(draw, 10, 17, 515, .6, accent)
        rect(draw, 10, 0, .6, 24, accent)
        image.save(ROOT / f'{prefix}-section-{locale}.png')

    image, draw = canvas(595.28, 15)
    header = style['header']
    if header == 'folded':
        polygon(draw, [(0,0),(340,0),(351,15),(0,15)], accent)
        polygon(draw, [(344,0),(595.28,0),(595.28,15),(354,15)], secondary)
    elif header == 'ribbon':
        rect(draw,0,0,595.28,6,accent)
        polygon(draw,[(0,6),(370,6),(383,15),(0,15)],secondary)
    elif header == 'frame':
        rect(draw,30,3,535.28,1,accent)
        rect(draw,30,3,60,4,secondary)
        polygon(draw,[(543,3),(565,3),(565,15)],secondary)
    elif header == 'ledger':
        rect(draw,41,2,513.28,1.6,accent)
        rect(draw,41,7,513.28,.6,secondary)
    elif header == 'masthead':
        rect(draw,41,1,513.28,1,accent)
        rect(draw,41,1,78,4,secondary)
    elif header == 'center':
        rect(draw,41,7,246,0.7,secondary)
        rect(draw,307,7,247,0.7,secondary)
        polygon(draw,[(297,2),(302,7),(297,12),(292,7)],accent)
    elif header == 'executive':
        rect(draw,31,0,533.28,4,accent)
        rect(draw,31,4,355,3,secondary)
    elif header == 'swiss':
        rect(draw,31,0,5,15,accent)
        rect(draw,41,6,513.28,.7,secondary)
        rect(draw,555,0,9,12,secondary)
    elif header == 'academic':
        rect(draw,31,3,533.28,.7,accent)
        rect(draw,31,3,48,3,accent); rect(draw,516,3,48,3,accent)
        polygon(draw,[(294,0),(299,4),(294,8),(289,4)],secondary)
    elif header == 'varsity':
        polygon(draw,[(0,0),(356,0),(368,8),(0,8)],accent)
        rect(draw,0,9,595.28,5,secondary)
    elif header == 'terminal':
        rect(draw,30,0,535.28,5,accent)
        rect(draw,43,7,64,3,secondary); rect(draw,113,7,30,3,secondary)
    elif header == 'portfolio':
        rect(draw,31,0,521.28,5,secondary)
        rect(draw,41,5,524.28,2,accent)
    elif header == 'newsprint':
        rect(draw,41,1,513.28,1.6,accent)
        rect(draw,41,6,513.28,.5,accent)
        rect(draw,294,1,5,7,accent)
    elif header == 'collage':
        polygon(draw,[(35,0),(559,0),(549,9),(44,6)],secondary)
        rect(draw,487,0,53,12,accent)
    elif header == 'han':
        rect(draw,36,0,3,15,accent)
        rect(draw,39,4,526.28,.7,secondary)
        rect(draw,55,2,32,4,accent)
    elif header == 'journey':
        rect(draw,41,6,512,.8,secondary)
        for x in (45,297,553):
            draw.ellipse(((x-2.5)*SCALE,3.5*SCALE,(x+2.5)*SCALE,8.5*SCALE),fill=accent)
        rect(draw,41,6,.7,9,accent)
    else:
        polygon(draw,[(0,0),(395,0),(380,12),(0,12)],accent)
        polygon(draw,[(399,0),(595.28,0),(595.28,5),(394,5)],secondary)
    image.save(ROOT / f'{prefix}-banner.png')

    image, draw = canvas(100, 25)
    for index in range(3):
        x, y = 12+index*35, 12
        draw.ellipse(((x-11)*SCALE,(y-11)*SCALE,(x+11)*SCALE,(y+11)*SCALE), fill=secondary)
        if index == 0:
            polygon(draw, [(x-8,y-2),(x,y-6),(x+8,y-2),(x,y+2)], 'white')
            rect(draw,x-5,y+3,10,2,'white'); rect(draw,x-8,y-1,1,7,'white')
        elif index == 1:
            rect(draw,x-7,y-3,14,10,'white'); rect(draw,x-3,y-6,6,3,'white')
            rect(draw,x-2,y-5,4,2,secondary); rect(draw,x-7,y,14,1,secondary)
        else:
            rect(draw,x-5,y-7,10,13,'white'); rect(draw,x-4,y-6,8,11,secondary)
            rect(draw,x-1,y-6,1,11,'white'); polygon(draw,[(x-4,y+7),(x+4,y+7),(x,y+10)],'white')
    image.save(ROOT / f'{prefix}-icons.png')
print(f'Generated {len(STYLES)} decoration sets in {ROOT}')
