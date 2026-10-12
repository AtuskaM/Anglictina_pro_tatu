/* Illustrated pilot: data shared by Study, flashcards and every quiz type. */
function createPronounPilot(items, award, sayBtn, esc) {
 const byId=Object.fromEntries(items.map(x=>[x.id,x]));
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 let flash=0, flipped=false, activity='picture', order=[], position=0, answer=null, mistakes=[], round=0, finished=false, words=[];
 const image=(x,cls='pilot-image')=>`<img class="${cls}" src="${esc(x.image)}" alt="${esc(x.sk)}" loading="lazy">`;
 function examples(l){
 const old=l.examples.map((x,i)=>({en:x[0],sk:x[1],image:l.pilotImages?.[i] ? byId[l.pilotImages[i]].image : items.find(y=>y.en===x[0])?.image}));
 const added=(l.pilotItems||[]).map(id=>byId[id]);
 return [...old,...added.filter(x=>!old.some(y=>y.en===x.en&&y.sk===x.sk))].map(x=>`<div class="example">${x.image?`<img class="pilot-image" src="${esc(x.image)}" alt="${esc(x.sk)}">`:''}<b>${esc(x.en)}</b><span>${esc(x.sk)}</span><div class="actions">${sayBtn(x.en)}</div></div>`).join('');
 }
 function reset(){order=shuffle(items.map((_,i)=>i));position=0;answer=null;mistakes=[];round=0;finished=false;prepare()}
 let options=[];
 function prepare(){const x=items[order[position]];if(!x)return;words=shuffle(x.en.replace(/[.]/g,'').split(' ').map((text,id)=>({text,id})));const others=items.filter(y=>activity==='picture'?y.en!==x.en:y.sk!==x.sk);options=shuffle([x,...shuffle(others).slice(0,2)]);}
 function render(){if(!order.length)reset();const x=items[order[position]],f=items[flash%items.length];
 return `${activity!=='listen'?`<section class="panel pilot-panel"><div class="tag">OBRÁZKOVÝ ÚVOD · KTO? A ČIE?</div><h2>Kartičky s obrázkami</h2><button class="card pilot-flash" data-pilot="flip" aria-label="Otočiť kartičku">${image(f)}<div class="big">${esc(flipped?f.sk:f.en)}</div><small>${flipped?'Po slovensky':'Po anglicky · Ťukni a otoč'}</small></button><div class="actions">${sayBtn(f.en)}<button class="secondary" data-pilot="flashnext">Ďalšia kartička →</button></div></section>`:''}
 <section class="panel pilot-panel"><h2>Skús to pomaly</h2><div class="activity-tabs">${[['picture','Vyber obrázok'],['meaning','Čo to znamená?'],['listen','Počúvam'],['build','Skladám vetu']].map(([id,label])=>`<button class="secondary ${activity===id?'selected':''}" data-pilot-activity="${id}" aria-pressed="${activity===id}">${label}</button>`).join('')}</div>
 ${finished?`<div class="panel light"><h3>Hotovo! Výborne si si precvičil obrázky.</h3><p>Môžeš si ich zopakovať. Nikam sa neponáhľame.</p><button class="primary" data-pilot="restart">Skúsiť znova</button></div>`:`<div class="actions"><span class="tag">${round?'OPAKUJEME ŤAŽŠIE OTÁZKY':'OTÁZKA'} ${position+1} Z ${order.length}</span><button class="secondary" data-pilot="shuffle">Zamiešať</button></div><h3>${activity==='picture'?esc(x.en):activity==='meaning'?`Čo znamená „${esc(x.en)}“?`:activity==='listen'?'Vypočuj si angličtinu. Vyber slovenský význam.':`Poskladaj po anglicky: ${esc(x.sk)}`}</h3>
 ${activity==='listen'||activity==='meaning'?sayBtn(x.en):activity==='build'?'<p class="muted">Najprv poskladaj odpoveď. Potom si ju vypočuješ.</p>':''}
 ${activity==='picture'?`<div class="picture-choices">${options.map((o,i)=>`<button class="picture-choice" data-pilot-answer="${i}" ${answer!==null?'disabled':''} aria-label="Obrázok ${i+1}">${image(o)}<span>Obrázok ${i+1}</span></button>`).join('')}</div><p class="muted">Pri „you“ môžeš vybrať ty aj vy. Tu ponúkame jeden z týchto obrázkov.</p>`:activity==='build'?`<div class="sentence-slot" aria-live="polite">${esc(words.filter(w=>w.chosen).sort((a,b)=>a.chosen-b.chosen).map(w=>w.text).join(' '))||'Ťukaj na slová v správnom poradí.'}</div><div class="actions">${words.map(w=>`<button class="secondary" data-pilot-word="${w.id}" ${w.chosen||answer!==null?'disabled':''}>${esc(w.text)}</button>`).join('')}</div><div class="actions"><button class="secondary" data-pilot="clear" ${answer!==null?'disabled':''}>Vymazať</button><button class="primary" data-pilot="check" ${answer!==null?'disabled':''}>Skontrolovať</button></div>`:options.map((o,i)=>`<button class="choice" data-pilot-answer="${i}" ${answer!==null?'disabled':''}>${esc(o.sk)}</button>`).join('')}
 ${answer!==null?`<div class="quiz-answer" role="status"><h3>${answer?'Výborne! +10 bodov':'Pozri si odpoveď. Túto otázku si zopakujeme.'}</h3>${image(x)}<b>${esc(x.en)}</b><span>${esc(x.sk)}</span><p>${esc(x.note)}</p>${sayBtn(x.en)}</div><button class="primary" data-pilot="next">Ďalej →</button>`:''}`}</section>`;
 }
 function respond(ok){if(answer!==null)return;answer=ok;if(ok)award(10);else mistakes.push(order[position])}
 function handle(b){
 if(b.dataset.pilotActivity){activity=b.dataset.pilotActivity;reset();return true}
 if(b.dataset.pilotWord!==undefined){if(answer===null){const w=words.find(w=>w.id===Number(b.dataset.pilotWord));if(!w.chosen)w.chosen=words.filter(w=>w.chosen).length+1}return true}
 if(b.dataset.pilotAnswer!==undefined){respond(options[Number(b.dataset.pilotAnswer)].id===items[order[position]].id);return true}
 if(!b.dataset.pilot)return false;
 const a=b.dataset.pilot;if(a==='flip')flipped=!flipped;if(a==='flashnext'){flash++;flipped=false}
 if(a==='clear')words.forEach(w=>delete w.chosen);
 if(a==='check'){const chosen=words.filter(w=>w.chosen).sort((a,b)=>a.chosen-b.chosen).map(w=>w.text).join(' ');respond(chosen===items[order[position]].en.replace(/[.]/g,''))}
 if(a==='shuffle'){const end=position+(answer!==null?1:0);order=order.slice(0,end).concat(shuffle(order.slice(end)));if(answer===null)prepare()}
 if(a==='restart')reset();
 if(a==='next'&&answer!==null){position++;answer=null;if(position>=order.length){if(mistakes.length){order=shuffle([...new Set(mistakes)]);mistakes=[];position=0;round++;prepare()}else{finished=true;position=order.length-1}}else prepare()}
 return true;
 }
 return {render,handle,examples};
}
