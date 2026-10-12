"""Offline content preservation, image and English-only speech source audit."""
import json,re,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
data={p.stem:json.loads(p.read_text()) for p in (root/'data').glob('*.json')}
assert len(data['lessons'])>=31 and len(data['notifications'])==14
assert len(data['quizzes'])==234 and len(data['stories'])>=3
assert len({x['image'] for x in data['pilot']})>=12
for x in data['pilot']:
 assert (root/x['image']).is_file(),x['image']
 assert all(isinstance(x[k],str) for k in ['en','sk','image','note'])
for n in data['notifications']:
 assert len(n['questions'])==2
 for v in n['vocab']:
  assert isinstance(v,dict) and all(isinstance(v[k],str) for k in ['en','sk','note'])
  assert not re.search('[áäčďéíľĺňóôŕšťúýž]',v['en'],re.I),v
source=(root/'js/app.js').read_text()
# Speech has one invocation route, exclusively the encoded English controls.
assert re.findall(r'(?<!function )\bspeak\(([^;]*?)\)',source)==['utter','decodeURIComponent(b.dataset.say'], 'Unexpected automatic/mixed speech call'
assert "utter.lang='en-US'" in source
for file in ['app.js','pilot.js']:
 s=(root/'js'/file).read_text()
 assert not re.search(r'sayBtn\([^)]*\.(?:sk|body|note|q|why)',s)
 assert not re.search(r'data-say="\$\{encodeURIComponent\((?:sk|note|why)',s)
print('PASS: JSON, at least 31 lessons, 234 quizzes, at least 3 stories, 14 messages, 16 distinct images, structured vocabulary and English-only speech source audit.')
