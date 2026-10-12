/* Slow lesson flow and curriculum-aware games. Speech receives only card.en. */
function createLearningCourse(data,award,sayBtn,esc){
 const lessons=data.lessons,cards=data.study_cards,byId=Object.fromEntries(cards.map(c=>[c.id,c]));
 const KEY='dad-learning-v2';let saved;try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{saved={}}
 let step=Math.max(0,Math.min(lessons.length-1,Number(saved.step)||0)),view='teach';
 let read=new Set((saved.read||[]).filter(id=>lessons.some(l=>l.id===id))),complete=new Set((saved.complete||[]).filter(id=>lessons.some(l=>l.id===id))),credited=new Set(saved.credited||[]);
 let session=null,gameType='mixed',gameScope='known';
 const names={mixed:'Trochu zo všetkého',build:'Skladám vetu',translate:'Vyberám anglickú vetu',meaning:'Rozumiem významu',listen:'Iba počúvam',gap:'Doplním slovo',correct:'Opravím vetu',picture:'Obrázok → veta'};
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 function save(){localStorage.setItem(KEY,JSON.stringify({step,read:[...read],complete:[...complete],credited:[...credited]}))}
 function setStep(n){step=Math.max(0,Math.min(lessons.length-1,n));view='teach';session=null;save()}
 function eligible(){return cards.filter(c=>read.has(lessons[c.lesson].id)||complete.has(lessons[c.lesson].id)||(read.size===0&&complete.size===0&&c.lesson===0))}
 function lessonCards(c){return cards.filter(x=>x.lesson===c.lesson)}
 function start(qs,lessonId=null){session={qs:lessonId?[...qs]:shuffle(qs),index:0,result:null,selected:[],missed:[],retry:false,done:false,lessonId};prepare()}
 function prepare(){const s=session;if(!s||s.done)return;const q=s.qs[s.index],c=byId[q.card],pool=lessonCards(c);s.result=null;s.selected=[];
 s.words=c.en.split(/\s+/);s.options=shuffle([c,...shuffle(pool.filter(x=>x.en!==c.en&&x.sk!==c.sk)).slice(0,2)]);
 s.tiles=shuffle(s.words.map((word,id)=>({word,id})));
 if(q.type==='gap'){
  s.gap=q.gap??Math.max(0,Math.floor(s.words.length/2)-1);s.answer=s.words[s.gap];
  s.options=shuffle(q.options||[s.answer,...shuffle([...new Set(pool.flatMap(x=>x.en.split(/\s+/)).filter(w=>w!==s.answer))]).slice(0,2)]);
 }
 }
 function startLesson(){read.add(lessons[step].id);save();view='practice';start(lessons[step].practice,lessons[step].id)}
 function startGames(){let pool=eligible();if(gameScope!=='known')pool=pool.filter(c=>c.lesson===Number(gameScope));if(!pool.length)pool=eligible();const types=Object.keys(names).filter(x=>!['mixed','picture'].includes(x));
 const qs=pool.filter(c=>gameType!=='picture'||c.imageExact).map((c,i)=>{let type=gameType==='mixed'?types[i%types.length]:gameType;
 let wrong=c.en.split(' ');[wrong[0],wrong[1]]=[wrong[1],wrong[0]];return{card:c.id,type,wrong:wrong.join(' '),hint:lessons[c.lesson].comparison,prompt:names[type]}});
 if(!qs.length){session={done:true,empty:true};return}start(qs)}
 function image(c){return c.image?`<figure class="learn-picture"><img src="${esc(c.image)}" alt="${esc(c.sk)}" loading="lazy">${!c.imageExact?'<figcaption>Obrázok k téme vety</figcaption>':''}</figure>`:''}
 function examples(l){return l.examples.map(([en,sk],i)=>{const c=cards.find(x=>x.lesson===step&&x.en===en);return `<div class="example">${image(c)}<b>${esc(en)}</b><span class="translation">(${esc(sk)})</span>${sayBtn(en)}</div>`}).join('')}
 function pairs(l){return l.pairs.length?`<details class="learn-details" open><summary>Čo sa mení? Porovnaj ${l.pairs.length} dvojíc.</summary>${l.pairs.map(pair=>`<div class="learn-pair">${pair.map(([en,sk])=>`<div><b>${esc(en)}</b><span>(${esc(sk)})</span>${sayBtn(en)}</div>`).join('')}</div>`).join('')}</details>`:''}
 function renderStudy(){const l=lessons[step];return `<section class="panel"><label class="select-label">Vyber malý krok<select data-learn-step>${lessons.map((x,i)=>`<option value="${i}" ${i===step?'selected':''}>${complete.has(x.id)?'✓ ':''}${i+1}. ${esc(x.heading)}</option>`).join('')}</select></label><div class="tag">UČÍM SA · KROK ${step+1} Z ${lessons.length}</div><p class="learn-progress">Hotové kroky: ${complete.size} z ${lessons.length}. Môžeš sa kedykoľvek vrátiť.</p><div class="lesson-module">${esc(l.module)}</div><h2>${esc(l.heading)}</h2><div class="activity-tabs"><button class="${view==='teach'?'primary':'secondary'}" data-learn="teach">Pozriem si vysvetlenie</button><button class="${view==='practice'?'primary':'secondary'}" data-learn="practice">Prečítané · Precvičím si</button></div>${view==='teach'?`<div class="panel light"><p>${esc(l.body)}</p></div><p class="muted">Nemusíš sa učiť všetky vety naraz. Dnes si môžeš vybrať aj jedinú.</p>${l.diagrams?.length?`<details class="learn-details"><summary>Pozriem si názorné porovnanie</summary><div class="two">${l.diagrams.map(d=>`<div class="diagram-card"><img class="learning-diagram" src="${esc(d.image)}" alt="${esc(d.sk)}" loading="lazy"><b>${esc(d.en)} (${esc(d.sk)})</b>${sayBtn(d.en)}</div>`).join('')}</div></details>`:''}${pairs(l)}<details class="learn-details" ${l.pairs.length?'':'open'}><summary>Príklady · ${l.examples.length} viet</summary><div class="two">${examples(l)}</div></details><details class="learn-details"><summary>Čo zostáva a čo sa mení</summary><p>${esc(l.comparison)}</p></details><details class="learn-details"><summary>Na čo si dám pozor</summary><p>${esc(l.mistake)}</p></details><details class="learn-details"><summary>Krátke pripomenutie</summary><p>${esc(l.recap)}</p></details><button class="primary" data-learn="practice">Prečítané · Skúsim ${l.practice.length} krátkych úloh</button>`:renderPractice()}<div class="actions"><button class="secondary" data-learn="prev" ${step===0?'disabled':''}>← Predchádzajúci krok</button><button class="secondary" data-learn="repeat">Zopakovať túto lekciu</button><button class="primary" data-learn="next" ${step===lessons.length-1?'disabled':''}>Ďalší krok →</button></div></section>`}
 function renderPlay(){if(!session)startGames();let known=lessons.map((l,i)=>({l,i})).filter(({l,i})=>read.has(l.id)||complete.has(l.id)||(read.size===0&&complete.size===0&&i===0));
 return `<section class="panel"><h2>Hrám sa s tým, čo už poznám</h2><p class="muted">Tu sú vety z prečítaných lekcií. Novú lekciu pridáš v Učím sa tlačidlom Prečítané · Precvičím si.</p><label class="select-label">Čo si zopakujem?<select data-learn-scope><option value="known">Všetky prečítané kroky</option>${known.map(({l,i})=>`<option value="${i}" ${String(i)===gameScope?'selected':''}>${i+1}. ${esc(l.heading)}</option>`).join('')}</select></label><label class="select-label">Ako sa hrám?<select data-learn-type>${Object.entries(names).map(([id,name])=>`<option value="${id}" ${gameType===id?'selected':''}>${name}</option>`).join('')}</select></label>${renderPractice()}</section>`}
 function renderPractice(){const s=session;if(!s)return '';if(s.empty)return '<p>Obrázkové úlohy sa objavia po prečítaní krokov o polohe. Dovtedy si vyber inú hru.</p>';
 if(s.done)return `<div class="quiz-answer" role="status"><h3>Hotovo. Dnes si urobil dobrý krok.</h3><p>${s.lessonId?'Túto lekciu si zapamätáme ako hotovú.':'Precvičil si známe vety.'}</p><button class="primary" data-learn="restart">Zopakovať bez trestu</button></div>`;
 const q=s.qs[s.index],c=byId[q.card],englishChoices=['translate','correct','picture'].includes(q.type);
 let prompt=q.type==='listen'?'Vypočuj si vetu. Vyber slovenský význam.':q.type==='meaning'?`${c.en} (${c.sk})`:q.type==='correct'?`Nesprávne poradie: ${q.wrong} (${c.sk})`:q.type==='gap'?`${s.words.map((w,i)=>i===s.gap?'_____':w).join(' ')} (${c.sk})`:q.type==='picture'?'Ktorá veta opisuje tento obrázok?':c.sk;
 // Meaning tasks show English only: the translation is the answer, revealed after responding.
 if(q.type==='meaning')prompt=c.en;
 return `<div class="exercise-panel learning-exercise" data-card="${esc(c.id)}" data-task="${q.type}"><div class="tag">${s.retry?'POKOJNÉ OPAKOVANIE':'ÚLOHA'} ${s.index+1} Z ${s.qs.length}</div><p>${esc(q.prompt||names[q.type])}</p><h3>${esc(prompt)}</h3>${q.type==='picture'?image(c):''}${q.type==='listen'||q.type==='meaning'?sayBtn(c.en):''}
 ${q.type==='build'?`<div class="sentence-slot" aria-live="polite">${s.selected.map(i=>esc(s.words[i])).join(' ')||'Ťukaj na slová v poradí.'}</div><div class="actions">${s.tiles.map(t=>`<button class="secondary" data-learn-word="${t.id}" ${s.selected.includes(t.id)||s.result!==null?'disabled':''}>${esc(t.word)}</button>`).join('')}</div><div class="actions"><button class="secondary" data-learn="clear" ${s.result!==null?'disabled':''}>Vymazať</button><button class="primary" data-learn="check" ${s.selected.length!==s.words.length||s.result!==null?'disabled':''}>Skontrolovať</button></div>`:s.options.map((o,i)=>`<button class="choice" data-learn-answer="${i}" ${s.result!==null?'disabled':''}>${esc(q.type==='gap'?o:englishChoices?o.en:o.sk)}</button>`).join('')}
 <details class="learn-details"><summary>Malá pomoc</summary><p>${esc(q.hint||lessons[c.lesson].comparison)}</p></details>
 ${s.result!==null?`<div class="quiz-answer" role="status"><h3>${s.result?'Výborne.':'Nič sa nedeje. Túto vetu si zopakujeme.'}</h3><b>${esc(c.en)}</b><span>(${esc(c.sk)})</span>${sayBtn(c.en)}</div><button class="primary" data-learn="advance">Ďalšia úloha →</button>`:''}</div>`}
 function respond(ok){const s=session;if(!s||s.done||s.result!==null)return;const q=s.qs[s.index];s.result=ok;const key=q.card+':'+q.type;
 if(ok&&!credited.has(key)){credited.add(key);award(10);save()}if(!ok)s.missed.push(q);}
 function handle(b,mode){if(b.dataset.learnWord!==undefined){if(session?.result===null&&!session.selected.includes(Number(b.dataset.learnWord)))session.selected.push(Number(b.dataset.learnWord));return true}
 if(b.dataset.learnAnswer!==undefined){if(!session||session.done||session.result!==null)return true;const q=session.qs[session.index],c=byId[q.card],o=session.options[Number(b.dataset.learnAnswer)];respond(q.type==='gap'?o===session.answer:o.id===c.id);return true}
 const a=b.dataset.learn;if(!a)return false;
 if(a==='teach'){view='teach';session=null}if(a==='practice')startLesson();if(a==='repeat'){setStep(step)}if(a==='next')setStep(step+1);if(a==='prev')setStep(step-1);
 if(a==='clear'&&session?.result===null)session.selected=[];
 if(a==='check'&&session?.selected.length===session?.words.length)respond(session.selected.map(i=>session.words[i]).join(' ')===byId[session.qs[session.index].card].en);
 if(a==='restart'){if(mode==='study')startLesson();else startGames()}
 if(a==='advance'&&session?.result!==null&&!session.done){session.index++;if(session.index>=session.qs.length){if(session.missed.length){session.qs=shuffle(session.missed);session.index=0;session.missed=[];session.retry=true;prepare()}else{session.done=true;if(session.lessonId){complete.add(session.lessonId);save()}}}else prepare()}
 return true}
 function change(el){if(el.matches('[data-learn-step]')){setStep(Number(el.value));return true}if(el.matches('[data-learn-scope]')){gameScope=el.value;startGames();return true}if(el.matches('[data-learn-type]')){gameType=el.value;startGames();return true}return false}
 function enter(mode){session=null;if(mode==='study')view='teach';}
 return{renderStudy,renderPlay,handle,change,enter,known:()=>eligible()};
}
