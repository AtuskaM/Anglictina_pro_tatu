function startTrainer(data) {
const bank=data.verbs, lesson=data.lessons, quiz=data.quizzes;
const storyLessons=data.story_lessons, stories=data.stories, notifications=data.notifications;
let playScope='learning';
let mode='study',step=0,card=0,flipped=false,qIndex=0,answered=false,points=Number(localStorage.getItem('dad-points')||0);
let legacyFeedback='';
const storyPools=stories.map((story,idx)=>{
 const lesson=storyLessons[idx];const raw=[...lesson.words.map(x=>[x[0],x[1]]),...lesson.phrases.map(x=>[x[0],x[1]]),...story.lines.map(x=>[x[1],x[2]]),story.end];
 const seen=new Set();const entries=raw.filter(([en,sk])=>{let k=en.toLowerCase().trim();if(seen.has(k))return false;seen.add(k);return true});
 const make=(en,sk,kind,n)=>{
  let others=entries.filter(x=>x[0]!==en && x[1]!==sk);
  let choices=others.map(x=>kind==='sk_to_en'||kind==='listen'?x[0]:x[1]);
  choices=[...new Set(choices)].filter(x=>x!==(kind==='sk_to_en'||kind==='listen'?en:sk));
  const start=(n*7+idx*3)%Math.max(1,choices.length);const distractors=[...choices.slice(start),...choices.slice(0,start)].slice(0,2);
  const correct=kind==='sk_to_en'||kind==='listen'?en:sk;
  let opts=[...distractors,correct];let rot=(n+idx)%3;opts=[...opts.slice(rot),...opts.slice(0,rot)];
  return {type:kind,en,sk,a:opts,correct:opts.indexOf(correct),q:kind==='sk_to_en'?`Ako povieš po anglicky: „${sk}“?`:kind==='listen'?'Počúvaj. Ktoré anglické slová si počul?':`Čo znamená „${en}“?`};
 };
 return entries.flatMap(([en,sk],i)=>[make(en,sk,'en_to_sk',i),make(en,sk,'sk_to_en',i),make(en,sk,'listen',i)]);
});
let noticeMode=false,noticeIndex=0,noticeQuestion=0,noticeAnswered=null,noticeOrder=[],noticeMistakes=[],noticeRound=0;
function noticeStart(){noticeOrder=shuffleIndices(notifications.map((_,i)=>i));noticeQuestion=0;noticeAnswered=null;noticeMistakes=[];noticeRound=0}
function noticeCurrent(){return notifications[noticeOrder[Math.floor(noticeQuestion/2)]]}
let storyIndex=0,storyQuizOpen=false,storyQuestion=0,storyChoice=null;
let storyMistakes=[],storyRound=0;
let storyOrder=[];
function shuffleIndices(indices){const a=[...indices];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function storyShuffle(){
 const remaining=storyOrder.slice(storyQuestion+(storyChoice!==null?1:0));
 const prefix=storyOrder.slice(0,storyQuestion+(storyChoice!==null?1:0));
 storyOrder=prefix.concat(shuffleIndices(remaining));
}
function storyReset(){storyQuizOpen=false;storyQuestion=0;storyChoice=null;storyMistakes=[];storyRound=0;storyOrder=[]}

function currentStoryQuestion(){let pool=storyPools[storyIndex];return pool[storyOrder[storyQuestion%storyOrder.length]]}
function storyQuizStart(){storyQuizOpen=true;storyQuestion=0;storyChoice=null;storyMistakes=[];storyRound=0;storyOrder=shuffleIndices(storyPools[storyIndex].map((_,i)=>i));}
function storyQuizNext(){let pool=storyPools[storyIndex];let limit=storyOrder.length;
 if(storyQuestion+1<limit){storyQuestion++;storyChoice=null;return}
 if(storyRound===0&&storyMistakes.length){storyRound=1;storyQuestion=0;storyChoice=null;storyOrder=shuffleIndices(storyMistakes);storyMistakes=[];return}
 storyReset();
}

let relaxGame=false,relaxIndex=0,relaxAnswered=false,relaxCorrect=false;const relaxQuestions=[{q:'Kam chcel Ján zavolať?',a:['Do lekárne.','Na letisko.','Do školy.'],correct:0},{q:'Čo znamená „Please wait“?',a:['Zavolajte zajtra.','Prosím, počkajte.','Stlačte dvojku.'],correct:1},{q:'Čo Ján potreboval?',a:['Nové auto.','Robotický vysávač.','Hovoriť s človekom.'],correct:2}];const AUDIO_DIR='audio/';const app=document.getElementById('app');const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function speak(t){if(!('speechSynthesis' in window)){alert('Tento prehliadač nevie prečítať angličtinu. Skús Safari alebo Chrome.');return;}if(typeof t!=='string'||!t.trim())return;window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(t);utter.lang='en-US';utter.rate=.78;const voices=window.speechSynthesis.getVoices();utter.voice=voices.find(v=>v.lang.replace('_','-').toLowerCase()==='en-us')||voices.find(v=>v.lang.toLowerCase().startsWith('en'))||null;window.speechSynthesis.speak(utter)}
function wordPicture(word){const entry=bank.find(x=>x.en===word);if(entry?.image)return `<img class="word-photo" src="${esc(entry.image)}" alt="${esc(entry.sk)}" loading="lazy">`;const k=String(word||'').toLowerCase().trim();const names={pharmacy:'pharmacy',prescription:'prescription',medicine:'medicine',pharmacist:'pharmacist',insurance:'insurance','text message':'text_message',appointment:'appointment',refill:'refill',renew:'refill',pickup:'pickup', 'pick up':'pickup'};const name=names[k];return name?`<img class="word-photo" src="images/words/${name}.jpg" alt="" loading="lazy">`:''}
function lessonPicture(l){const src=l.image||l.exampleImages?.[0];return src?`<img class="lesson-photo" src="${esc(src)}" alt="${esc(l.examples?.[0]?.[1]||l.heading)}">`:''}
function sayBtn(t,lang='en-US'){return `<button class="secondary" data-say="${encodeURIComponent(t)}" data-lang="${lang}">Vypočuť angličtinu</button>`}
const full=createFullCourse(data,n=>{points+=n;localStorage.setItem('dad-points',points);updateScore()},sayBtn,esc);
const learning=createLearningCourse(data,n=>{points+=n;localStorage.setItem('dad-points',points);updateScore()},sayBtn,esc);
const pilot=createPronounPilot(data.pilot,n=>{points+=n;localStorage.setItem('dad-points',points);updateScore()},sayBtn,esc);
function update(){document.getElementById('score').textContent=points+' bodov';document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));render()}
function render(){
if(mode==='study'){app.innerHTML=learning.renderStudy();return}
if(mode==='play'&&playScope==='learning'){app.innerHTML=playTabs()+learning.renderPlay();return}
if(mode==='play'&&playScope==='full'){app.innerHTML=playTabs()+full.renderPlay();return}
if(mode==='play'&&playScope==='pilot'){app.innerHTML=playTabs()+pilot.render();return}
if(mode==='play'){let w=bank[card%bank.length],q=quiz[qIndex%quiz.length];let beforeAudio=q.type!=='sk_to_en';let translation=q.type==='sk_to_en'?q.q.match(/„(.*)“/)?.[1]||q.why:q.type==='en_to_sk'?q.a[q.correct]:full.translation(q.audio)||q.why;let answerText=answered?`<div class="panel light"><div class="result-line"><strong>${esc(q.audio)}</strong><span>${esc(translation)}</span></div><div class="actions">${sayBtn(q.audio,'en-US')}</div></div>`:'';app.innerHTML=playTabs()+`${q.type==='listen'?'':`<section class="panel"><h2>Kartičky</h2><p class="muted">Ťukni na kartičku a pozri sa, čo slovo znamená.</p><div class="card" data-action="flip"><div class="flash-visual" aria-hidden="true">${wordPicture(w.en)||`<span class="fallback-art">${esc(w.visual||'📚')}</span>`}</div><div class="big">${esc(flipped?w.sk:w.en)}</div><small>${flipped?'Po slovensky':'Po anglicky · Ťukni a otoč'}</small></div><div class="actions">${sayBtn(w.en)}<button class="secondary" data-action="cardnext">Ďalšia kartička →</button></div></section>`}<section class="panel"><div class="tag">KVÍZ · OTÁZKA ${qIndex%quiz.length+1} Z ${quiz.length}</div><div class="actions"><button class="secondary" data-action="quizshuffle">🔀 Zamiešať otázky</button></div><h2>${esc(q.q)}</h2>${beforeAudio&&!answered?`<div class="actions">${sayBtn(q.audio)}</div>`:!answered?'<p class="muted">Najprv vyber odpoveď. Potom si ju vypočuješ.</p>':''}${q.a.map((a,i)=>`<button class="choice" data-answer="${i}" ${answered?'disabled':''}>${esc(q.type==='listen'?full.translation(a):a)}</button>`).join('')}<div id="feedback" class="status" role="status">${answered?esc(legacyFeedback):''}</div>${answerText}${answered?'<button class="primary" data-action="qnext">Ďalšia otázka →</button>':''}</section>`}
if(mode==='relax'&&!noticeMode){app.innerHTML=full.renderRelax();return}
if(mode==='relax'){
 if(noticeMode){renderNotices();return}
 const s=stories[storyIndex],q=currentStoryQuestion();
 app.innerHTML=`<section class="panel"><div class="story-head"><div><div class="tag">ODDYCHUJEM · ANGLIČTINA ZO ŽIVOTA</div><h2 style="margin:8px 0">${esc(s.title)}</h2><div class="story-note">${esc(s.subtitle)}</div></div><div class="story-progress">Príbeh ${storyIndex+1} z ${stories.length}</div></div>
 <div class="actions"><button class="primary" data-action="noticesopen">📱 Čítam správy z lekárne · 14 príkladov</button></div>
 <div class="story-select">${stories.map((st,i)=>`<button class="story-tab ${i===storyIndex?'chosen':''}" data-story="${i}">${i+1}. ${esc(st.title)}<br><small>${esc(st.subtitle)}</small></button>`).join('')}</div>
 <div class="panel light"><p>${esc(s.intro)}</p></div>
 <div class="story-shell"><div class="story-art">${s.scene?`<img src="${esc(s.scene)}" alt="Ilustrácia príbehu: ${esc(s.title)}">`:`<div class="story-emoji" aria-hidden="true">${s.emoji}</div>`}<div class="art-caption"><b>${esc(s.title)}</b><div>${esc(s.subtitle)}</div></div></div>
 <div class="story-dialogue">${s.lines.map(([who,en,sk])=>`<div class="dialogue-line"><div><span class="who">${esc(who)}</span><b>${esc(en)}</b><span class="sk">${esc(sk)}</span></div><button class="listen" data-say="${encodeURIComponent(en)}" data-lang="en-US" aria-label="Vypočuť anglickú vetu">🔊</button></div>`).join('')}</div></div>
 <div class="panel light story-learning"><h2 style="margin-top:0">Malá lekcia z príbehu</h2><p>Každé anglické slovo aj spojenie si môžeš vypočuť. Slovenský význam máš hneď pod ním.</p>
 <h3>1. Slová</h3><div class="vocab-grid">${storyLessons[storyIndex].words.map(([en,sk])=>`<div class="vocab-chip"><b>${esc(en)}</b><span>${esc(sk)}</span><button class="secondary" data-say="${encodeURIComponent(en)}" data-lang="en-US">Vypočuť angličtinu</button></div>`).join('')}</div>
 <h3>2. Užitočné spojenia</h3><div class="phrase-grid">${storyLessons[storyIndex].phrases.map(([en,sk,why])=>`<div class="phrase-chip"><div><b>${esc(en)}</b><span>${esc(sk)}</span><small>${esc(why)}</small></div><button class="secondary" data-say="${encodeURIComponent(en)}" data-lang="en-US">🔊</button></div>`).join('')}</div>
 <h3>3. Celé vety z príbehu</h3><p>Vypočuj si celú vetu a sleduj jej význam.</p><div class="phrase-grid">${[...s.lines.map(x=>[x[1],x[2]]),s.end].map(([en,sk])=>`<div class="phrase-chip"><div><b>${esc(en)}</b><span>${esc(sk)}</span></div><button class="secondary" data-say="${encodeURIComponent(en)}" data-lang="en-US">🔊</button></div>`).join('')}</div></div>
 <div class="end-story"><strong>${esc(s.end[0])}</strong><span>${esc(s.end[1])}</span><div class="actions">${sayBtn(s.end[0])}</div></div>
 <div class="actions"><button class="secondary" data-action="storyreplay">↺ Prejsť príbeh znova</button><button class="primary" data-action="storyquiz">${storyQuizOpen?'Zavrieť kvíz':'🎲 Precvičiť všetky slová a vety'}</button><button class="secondary" data-action="storynext">Ďalší príbeh →</button></div>
 ${storyQuizOpen?`<div class="story-quiz" id="story-quiz-area"><div class="tag" style="color:#496083">${storyRound?'OPAKUJEME SI ŤAŽŠIE OTÁZKY':'VEĽKÝ KVÍZ Z PRÍBEHU'} · ${storyQuestion+1} Z ${storyOrder.length}</div><div class="actions"><button class="secondary" data-action="storyshuffle">🔀 Zamiešať otázky</button></div><h3>${esc(q.q)}</h3>${q.type!=='sk_to_en'&&storyChoice===null?`<div class="actions"><button class="secondary" data-say="${encodeURIComponent(q.en)}">🔊 ${q.type==='listen'?'Počúvaj':'Vypočuť'}</button></div>`:'<p class="muted">Vyber odpoveď. Správnu výslovnosť si vypočuješ potom.</p>'}${q.a.map((opt,i)=>`<button class="choice" data-story-answer="${i}" ${storyChoice!==null?'disabled':''}>${esc(opt)}</button>`).join('')}${storyChoice!==null?`<div class="quiz-answer"><h3>${storyChoice===q.correct?'😊 Výborne! +10 bodov':'Nič sa nedeje. Pozri si odpoveď.'}</h3><b>${esc(q.en)}</b><span>${esc(q.sk)}</span><div class="actions">${sayBtn(q.en)}</div></div><button class="primary" data-action="storyqnext">Ďalšia otázka →</button>`:''}</div>`:''}</section>`;
}

}
function renderNotices(){
 const n=noticeCurrent();
 const q=n.questions[noticeQuestion%2];
 const pool=notifications.map(x=>noticeQuestion%2===0?x.meaning:x.action);
 const options=[q.correct,...pool.filter(x=>x!==q.correct)].filter((x,i,a)=>a.indexOf(x)===i);
 const shuffled=shuffleIndices(options.slice(1).map((_,i)=>i)).slice(0,3).map(i=>options[i+1]);
 // Keep stable choices during a question; recompute only when advancing.
 if(!window._noticeChoices || window._noticeChoicesKey!==n.id+':'+(noticeQuestion%2)){
   window._noticeChoices=shuffleIndices([q.correct,...shuffled]);window._noticeChoicesKey=n.id+':'+(noticeQuestion%2);
 }
 const opts=window._noticeChoices;
 app.innerHTML=`<section class="panel"><div class="tag">ODDYCHUJEM · SPRÁVY Z BEŽNÉHO ŽIVOTA</div><h2>📱 Čítam správy z lekárne</h2><p>Správy sú realistické učebné príklady, nie skutočné SMS. Pri podozrivom odkaze nikdy neposielaj osobné údaje; over si ho priamo v lekárni.</p><div class="actions"><button class="secondary" data-action="noticesclose">← Späť k príbehom</button><button class="secondary" data-action="noticeshuffle">🔀 Zamiešať správy</button></div><div class="tag">SPRÁVA ${noticeQuestion+1} Z ${noticeOrder.length*2} · ${esc(n.title)}</div><div class="phone-card"><div class="phone-top">Lekáreň · učebná správa</div><div class="phone-title">${esc(n.title)}</div><div class="phone-body">${esc(n.en)}</div><div class="actions">${sayBtn(n.en)}</div></div><details class="notice-translation"><summary>Ukáž slovenský preklad</summary><p>${esc(n.sk)}</p><p><b>Vysvetlenie:</b> ${esc(n.meaning)}</p></details><h3>${esc(q.q)}</h3>${opts.map((x,i)=>`<button class="choice" data-notice-answer="${i}" ${noticeAnswered!==null?'disabled':''}>${esc(x)}</button>`).join('')}${noticeAnswered!==null?`<div class="quiz-answer"><h3>${opts[noticeAnswered]===q.correct?'😊 Výborne! +10 bodov':'Nič sa nedeje. Túto správu si zopakujeme.'}</h3><b>${esc(q.correct)}</b><span>${esc(n.sk)}</span><div class="actions">${sayBtn(n.en)}</div></div><button class="primary" data-action="noticenext">Ďalšia otázka →</button>`:''}<h3>Slová a spojenia zo správy</h3><div class="phrase-grid">${n.vocab.map(({en,sk,note})=>`<div class="phrase-chip"><div><b>${esc(en)}</b><span>${esc(sk)}</span></div>${note?`<small>${esc(note)}</small>`:''}${sayBtn(en)}</div>`).join('')}</div><p class="muted">REFILL = ďalšie vydanie na platný recept. RENEW = požiadať o nový recept alebo jeho obnovenie. Žiadosť ešte neznamená schválenie.</p></section>`;
}
document.addEventListener('click',e=>{let b=e.target.closest('button,[data-action]');if(!b||b.disabled)return;if(!b.dataset.say && 'speechSynthesis' in window)window.speechSynthesis.cancel();if(b.dataset.action==='topmenu'){window.scrollTo({top:0,behavior:'smooth'});return}if(b.dataset.playScope){playScope=b.dataset.playScope;learning.enter('play');render();return}if(learning.handle(b,mode)){render();return}if(full.handle(b,mode)){render();return}if(pilot.handle(b)){render();return}if(b.dataset.mode){mode=b.dataset.mode;learning.enter(mode);update();return}if(b.dataset.say){speak(decodeURIComponent(b.dataset.say),b.dataset.lang);return}if(b.dataset.action==='noticesopen'){noticeMode=true;noticeStart();render();return}if(b.dataset.action==='noticesclose'){noticeMode=false;render();return}if(b.dataset.action==='noticeshuffle'){const prefix=noticeOrder.slice(0,Math.floor(noticeQuestion/2)+1);const rest=noticeOrder.slice(prefix.length);noticeOrder=prefix.concat(shuffleIndices(rest));render();return}if(b.dataset.noticeAnswer!==undefined){if(noticeAnswered!==null)return;noticeAnswered=Number(b.dataset.noticeAnswer);const n=noticeCurrent();const q=n.questions[noticeQuestion%2];if(window._noticeChoices[noticeAnswered]===q.correct){points+=10;localStorage.setItem('dad-points',points)}else if(noticeRound===0)noticeMistakes.push(noticeOrder[Math.floor(noticeQuestion/2)]);render();updateScore();return}if(b.dataset.action==='noticenext'){noticeQuestion++;noticeAnswered=null;window._noticeChoices=null;if(noticeQuestion>=noticeOrder.length*2){if(noticeRound===0&&noticeMistakes.length){noticeRound=1;noticeOrder=shuffleIndices([...new Set(noticeMistakes)]);noticeQuestion=0;noticeMistakes=[]}else noticeStart()}render();return}if(b.dataset.story!==undefined){storyIndex=Number(b.dataset.story);storyReset();render();return}if(b.dataset.storyAnswer!==undefined){if(storyChoice!==null)return;storyChoice=Number(b.dataset.storyAnswer);if(storyChoice===currentStoryQuestion().correct){points+=10;localStorage.setItem('dad-points',points)}else if(storyRound===0){storyMistakes.push(storyOrder[storyQuestion])}render();updateScore();return}if(b.dataset.action==='storyquiz'){if(storyQuizOpen){storyQuizOpen=false}else{storyQuizStart()}render();return}if(b.dataset.action==='storyshuffle'){storyShuffle();render();return}if(b.dataset.action==='storyqnext'){storyQuizNext();render();return}if(b.dataset.action==='storynext'){storyIndex=(storyIndex+1)%stories.length;storyQuizOpen=false;storyQuestion=0;storyChoice=null;storyMistakes=[];storyRound=0;render();window.scrollTo({top:0,behavior:'smooth'});return}if(b.dataset.action==='storyreplay'){window.scrollTo({top:0,behavior:'smooth'});return}let a=b.dataset.action;if(a==='next')step=(step+1)%lesson.length;if(a==='prev')step=Math.max(0,step-1);if(a==='flip')flipped=!flipped;if(a==='cardnext'){card++;flipped=false}if(a==='quizshuffle'){const remaining=quiz.slice(qIndex+(answered?1:0));for(let i=remaining.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]]}quiz.splice(qIndex+(answered?1:0),remaining.length,...remaining);render();return}if(a==='qnext'){qIndex++;answered=false;legacyFeedback='';let q=quiz[qIndex%quiz.length];/* Audio only when learner presses the listening button. */}if(a==='replay'){relaxGame=false;relaxIndex=0;relaxAnswered=false;window.scrollTo({top:0,behavior:'smooth'})}if(a==='relaxstart'){relaxGame=true;relaxIndex=0;relaxAnswered=false}if(a==='relaxnext'){if(relaxIndex===2){relaxGame=false;relaxIndex=0}else{relaxIndex++;relaxAnswered=false}}if(b.dataset.relaxAnswer!==undefined){if(relaxAnswered)return;relaxAnswered=true;relaxCorrect=Number(b.dataset.relaxAnswer)===relaxQuestions[relaxIndex].correct;render();return}if(b.dataset.answer!==undefined){if(answered)return;answered=true;let q=quiz[qIndex%quiz.length],correct=Number(b.dataset.answer)===q.correct;if(correct){points+=10;localStorage.setItem('dad-points',points)}render();legacyFeedback=correct?'Výborne! +10 bodov.':'Nič sa nedeje. Pozri si odpoveď. '+q.why;if(!correct)quiz.push(q);document.getElementById('feedback').textContent=legacyFeedback;updateScore();return}render()});
function playTabs(){return `<div class="actions scope-tabs"><button class="${playScope==='learning'?'primary':'secondary'}" data-play-scope="learning">Moje prečítané lekcie</button><button class="${playScope==='full'?'primary':'secondary'}" data-play-scope="full">Hry k rozhovorom a kartičky</button></div>`}
document.addEventListener('change',e=>{if('speechSynthesis' in window)window.speechSynthesis.cancel();if(e.target.matches('[data-lesson-select]')){step=Number(e.target.value);render();return}if(learning.change(e.target)){render();return}if(full.change(e.target))render()});
function updateScore(){document.getElementById('score').textContent=points+' bodov'}update();

}

window.addEventListener('scroll',()=>document.querySelector('.return-menu')?.classList.toggle('hidden',window.scrollY<400),{passive:true});
window.addEventListener('pagehide',()=>window.speechSynthesis?.cancel());
const files=['verbs','lessons','quizzes','story_lessons','stories','pronouns','notifications','pilot','study_cards','life_cards','word_cards','messages','quiz_translations'];
Promise.all(files.map(async name=>{
  const response=await fetch(`data/${name}.json`);
  if(!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return [name,await response.json()];
})).then(entries=>startTrainer(Object.fromEntries(entries))).catch(error=>{
  document.getElementById('app').innerHTML='<section class="panel"><h2>Nepodarilo sa načítať lekcie</h2><p>Otvorte túto stránku cez webovú adresu (napríklad cez START_LOCAL_SERVER.py), nie priamo zo súboru index.html.</p><p>Skúste stránku obnoviť.</p></section>';
  console.error('Loading lesson data failed',error);
});
