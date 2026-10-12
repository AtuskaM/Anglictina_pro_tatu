"""Run from any directory: python tests/learning_audit.py [canonical.zip]."""
from pathlib import Path
import json,re,sys,zipfile,hashlib
root=Path(__file__).resolve().parents[1];d={p.stem:json.loads(p.read_text()) for p in (root/'data').glob('*.json')};lessons=d['lessons'];cards=d['study_cards'];byid={c['id']:c for c in cards}
assert len(lessons)==95 and len(cards)==664
assert len(set(l['id'] for l in lessons))==95
assert len(set(l['heading'] for l in lessons))==95
assert len(set(tuple(e[0] for e in l['examples']) for l in lessons))==95
seen=set();counts=[]
# Mask immediate bilingual expressions and flag remaining known English tokens.
english_words=set(re.findall(r"[A-Za-z]+(?:[’']\w+)?",' '.join(c['en'] for c in cards)))
# These are also ordinary Slovak words or letters, and need contextual editorial review.
ambiguous={'a','I','A','to','me','on','so','do','my','by','no','an','at','is','am','it','be','we','s','d','t','ed','ing','tv'}
terms={'I','you','he','she','it','we','they','work','works','do','does','did','will','going','have','has','had','am','is','are','was','were','in','on','at','into','across','through','mine','yours','ours','who','where','when','why','how','what','can','could','should','not','need','buy','go','went','ready','hungry','drink','eat','clean','cooking'}
for i,l in enumerate(lessons):
 assert all(l.get(f) for f in ['heading','body','comparison','mistake','recap','module','objective']),i
 assert set(l['prerequisites'])<=seen,(i,l['prerequisites']);seen.add(l['id'])
 assert len(l['examples'])>=5 and len(l['practice'])>=5
 if l['module'].startswith('G ·'):assert len(l['examples'])>=8
 assert len(l['examples'])==len(l['exampleImages'])
 for en,sk in l['examples']:
  assert en.strip() and sk.strip() and re.search(r'[.!?]$',en) and len(en.split())>=2,(i,en)
 for f in ['body','comparison','mistake','recap']:
  t=l[f]
  # Every parenthetic span must contain a meaning, not an empty translation.
  assert not re.search(r'\(\s*\)',t)
  masked=re.sub(r"[A-Za-z][A-Za-z0-9’'\s,.!?…/\-]*\([^()]+\)", ' ', t)
  leftovers={w for w in re.findall(r"\b\w+(?:[’']\w+)?",masked) if w in terms and w not in ambiguous}
  assert not leftovers,(i,f,leftovers)
 for q in l['practice']:
  assert q['card'] in byid and byid[q['card']]['lesson']==i
  assert q['type'] in ['build','translate','listen','meaning','gap','correct','picture']
  assert q['prompt'] and q['hint']
  if q['type']=='picture':assert byid[q['card']]['imageExact']
  if q['type']=='gap':
   answer=byid[q['card']]['en'].split()[q['gap']];assert answer in q['options'] and len(set(q['options']))>=2
  if q['type']=='correct':assert q['wrong']!=byid[q['card']]['en']
 counts.append([i+1,len(l['examples']),len(l['practice'])])
paths=set()
def visit(v):
 if isinstance(v,dict):
  for k,x in v.items():
   if k in ['image','scene'] and x:paths.add(x)
   elif k=='exampleImages':paths.update(y for y in x if y)
   else:visit(x)
 elif isinstance(v,list):
  for x in v:visit(x)
for x in d.values():visit(x)
for p in paths:assert (root/p).is_file(),p
assert len(d['quizzes'])==len(cards)
for q in d['quizzes']:assert 0<=q['correct']<len(q['a']) and q['audio'] in [c['en'] for c in cards]
if len(sys.argv)>1:
 z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None
 for n in z.namelist():
  if n.startswith('trainer_source/images/') or n in ['trainer_source/data/'+f+'.json' for f in ['stories','story_lessons','notifications','messages','life_cards','word_cards','verbs','pronouns','pilot','quiz_translations']]:
   assert z.read(n)==(root.parent/n).read_bytes(),'Regression: '+n
result=dict(lessons=len(lessons),examples=len(cards),guided=sum(len(l['practice']) for l in lessons),min_examples=min(x[1] for x in counts),min_practice=min(x[2] for x in counts),referenced_images=len(paths),new_diagrams=len(list((root/'images/learning').glob('*.svg'))),status='PASS')
print(json.dumps(result,ensure_ascii=False,indent=2))
(root/'tests/learning_audit_result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
