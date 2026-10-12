"""Full-course integrity, content coverage and speech-source audit. No network needed."""
import json,re,sys,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1];d={p.stem:json.loads(p.read_text()) for p in (root/'data').glob('*.json')}
assert len(d['lessons'])==40 and len(d['quizzes'])==234 and len(d['verbs'])==79
assert len(d['stories'])==23 and len(d['story_lessons'])==23
assert len(d['notifications'])==14 and len(d['messages'])==10
ids=[s['id'] for s in d['stories']];assert len(set(ids))==23
for s in d['stories']:
 assert len(s['lines'])>=15,s['id']
 assert all(len(x)==3 and all(isinstance(v,str) and v.strip() for v in x) for x in s['lines'])
 assert len(s['end'])==2 and all(s['end'])
 assert s['intro_en'] and s['intro_sk'] and s['title_en']
 assert len(s['roleplay'])>=3 and len(s['comprehension'])>=2
 for r in s['roleplay']:
  assert r['en'] and r['sk'] and len(r['a'])==len(r['a_sk'])==3 and all(r['a_sk']),r
  assert r['a_sk'][r['correct']]==r['correct_sk']
for story,bank in zip(d['stories'][3:],d['story_lessons'][3:]):
 dialogue=' '.join(x[1] for x in story['lines']).lower()
 assert all(x[0].lower() in dialogue for x in bank['words']+bank['phrases']),story['id']
for story in d['stories']:
 for role in story['roleplay']:assert len(set(role['a_sk']))==3,role
for l in d['lessons']:assert len(l['examples'])==len(l['exampleImages'])
for n in d['notifications']:
 for x in n['vocab']:assert isinstance(x,dict) and all(isinstance(x[k],str) for k in ['en','sk','note'])
paths=set()
def visit(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k in ['image','scene'] and isinstance(x,str):paths.add(x)
   elif k=='exampleImages':paths.update(x)
   else:visit(x)
 elif isinstance(v,list):
  for x in v:visit(x)
for data in d.values():visit(data)
for path in paths:assert (root/path).is_file() and (root/path).stat().st_size>100,path
images=[p for p in (root/'images').rglob('*') if p.is_file()];assert len(images)==91
for p in images:
 assert p.stat().st_size>100,p
 if p.suffix=='.webp':
  payload=p.read_bytes();assert payload[:4]==b'RIFF' and payload[8:12]==b'WEBP',p
assert len({s['scene'] for s in d['stories']})==23
assert (root/'images/situations/neighbor-package.webp').is_file()
for name in ['app.js','pilot.js','full-course.js']:
 source=(root/'js'/name).read_text()
 assert not re.search(r'sayBtn\([^)]*\.(sk|body|note|why|title)\)',source),name
 assert not re.search(r'encodeURIComponent\((sk|note|why)',source),name
source=(root/'js/app.js').read_text();assert "utter.lang='en-US'" in source
calls=re.findall(r'(?<!function )\bspeak\(([^;]*?)\)',source);assert calls==['utter','decodeURIComponent(b.dataset.say'],calls
# All existing listening-choice English strings have actual Slovak translations.
translations={x['en']:x['sk'] for x in d['verbs']+d['study_cards']+d['life_cards']+d['pilot']+d['quiz_translations']}
for q in d['quizzes']:
 if q['type']=='listen':
  assert all(a in translations for a in q['a']),q
  assert len(set(translations[a] for a in q['a']))==len(q['a']),q
# Optional canonical ZIP comparison: original examples/content/assets are preserved.
if len(sys.argv)>1:
 z=zipfile.ZipFile(sys.argv[1]);original={n.split('/')[-1][:-5]:json.loads(z.read(n)) for n in z.namelist() if n.startswith('trainer_source/data/') and n.endswith('.json')}
 assert d['quizzes']==original['quizzes'] and d['pronouns']==original['pronouns'] and d['pilot']==original['pilot']
 for a,b in zip(original['lessons'],d['lessons']):
  assert a['heading']==b['heading'] and a['body']==b['body']
  assert all(x in b['examples'] for x in a['examples'])
 for a,b in zip(original['verbs'],d['verbs']):assert all(b[k]==v for k,v in a.items())
 for a,b in zip(original['stories'],d['stories']):assert b['lines'][:len(a['lines'])]==a['lines'] and b['end']==a['end']
 for n in z.namelist():
  if n.startswith('trainer_source/images/'):assert (root/n.split('trainer_source/',1)[1]).read_bytes()==z.read(n)
 print('PASS canonical-source preservation')
print('PASS: 40 lessons, 23 complete stories, 234 original quizzes, 79 words, 14 pharmacy + 10 general messages; translations, scenes, referenced images and English-only speech routing.')
