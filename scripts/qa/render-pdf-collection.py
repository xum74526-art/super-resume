"""Render the collection and representative long resumes using Poppler."""
import argparse, concurrent.futures, json, subprocess
from pathlib import Path
p=argparse.ArgumentParser()
p.add_argument('--version',required=True);p.add_argument('--poppler',required=True)
a=p.parse_args();root=Path('.cache/qa')/a.version;out=root/'pdf';out.mkdir(parents=True,exist_ok=True)
rows=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
long_ids=['mint-card','rose-profile','ocean-badge','amber-profile','navy-ribbon','lime-grid','mono-editor','slate-ledger','executive-signature','swiss-red','academic-ivy','campus-spark','tech-terminal','folio-proposal','press-daily','journal-tape','han-vermilion','story-milestone']
jobs=[]
for row in rows:
    ident=row['id'];jobs.append((Path('artifacts/samples')/a.version/f'resume-{ident}.pdf',f'resume-{ident}',row['samplePdfPages']))
    if ident in long_ids:jobs.append((root/f'multipage-{ident}.pdf',f'multipage-{ident}',row['longPdfPages']))
def render(job):
    src,name,pages=job
    subprocess.run([a.poppler,'-scale-to','1600','-png',str(src),str(out/name)],check=True,capture_output=True)
    return {'id':name,'pages':pages,'images':[str(out/f'{name}-{i}.png') for i in range(1,pages+1)]}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:result=list(pool.map(render,jobs))
(out/'manifest.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(f'{len(result)} documents / {sum(r["pages"] for r in result)} pages')
