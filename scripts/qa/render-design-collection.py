"""Run the unmodified Documents renderer on the collection inside the QA container."""
import argparse, concurrent.futures, json, subprocess
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--renderer',required=True);p.add_argument('--samples',required=True);p.add_argument('--qa',required=True);p.add_argument('--out',required=True);p.add_argument('--ids',nargs='*')
a=p.parse_args();out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
long_ids=['mint-card','rose-profile','ocean-badge','amber-profile','navy-ribbon','lime-grid','mono-editor','slate-ledger','executive-signature','swiss-red','academic-ivy','campus-spark','tech-terminal','folio-proposal','press-daily','journal-tape','han-vermilion','story-milestone']
jobs=[]
for src in sorted(Path(a.samples).glob('resume-*.docx')):
    ident=src.stem.removeprefix('resume-')
    if a.ids and ident not in a.ids:continue
    jobs.append((ident+'-single',src))
    if ident in long_ids:jobs.append((ident+'-long',Path(a.qa)/('multipage-'+ident+'.docx')))
def render(job):
    name,src=job;dest=out/name
    result=subprocess.run(['/opt/qa-python/bin/python',a.renderer,str(src),'--output_dir',str(dest),'--emit_pdf'],capture_output=True,text=True)
    if result.returncode:raise RuntimeError(name+': '+result.stderr[-2000:])
    pdf=next(dest.glob('*.pdf'));info=subprocess.check_output(['pdfinfo',str(pdf)],text=True);count=int(next(line for line in info.splitlines() if line.startswith('Pages:')).split(':',1)[1].strip())
    print(f'{name}: {count} pages',flush=True)
    return {'id':name,'pdf':str(pdf),'pages':count,'images':[str(dest/f'page-{i}.png') for i in range(1,count+1)]}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(render,jobs))
(out/'manifest.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
