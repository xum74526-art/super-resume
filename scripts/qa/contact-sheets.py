"""Create review sheets; original page PNGs remain available for closer inspection."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('--version',required=True);p.add_argument('--kind',choices=['pdf','word'],required=True);a=p.parse_args()
root=Path('.cache/qa')/a.version
rows=json.loads((root/a.kind/'manifest.json').read_text(encoding='utf-8'))
files=[]
for row in sorted(rows,key=lambda r:r['id']):
    for i in range(1,row['pages']+1):
        file=root/'word'/row['id']/f'page-{i}.png' if a.kind=='word' else root/'pdf'/f'{row["id"]}-{i}.png'
        files.append((row['id']+f' p{i}',file))
dest=root/f'contact-{a.kind}';dest.mkdir(exist_ok=True)
for start in range(0,len(files),6):
    canvas=Image.new('RGB',(2100,2040),'#d9dee0');draw=ImageDraw.Draw(canvas)
    for k,(label,file) in enumerate(files[start:start+6]):
        im=Image.open(file).convert('RGB');im.thumbnail((680,970));x=10+(k%3)*700;y=10+(k//3)*1020
        draw.text((x+4,y+5),label,fill='black');canvas.paste(im,(x+(680-im.width)//2,y+30))
    canvas.save(dest/f'group-{start//6+1:02}.jpg',quality=95)
(dest/'index.json').write_text(json.dumps([label for label,_ in files],indent=2),encoding='utf-8')
print(a.kind,len(files),'pages in',((len(files)+5)//6),'sheets')
