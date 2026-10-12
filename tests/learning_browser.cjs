const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),cp=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=process.env.QA_SCREENSHOTS||'/tmp/dad-learning-qa';fs.mkdirSync(out,{recursive:true});
const data={};for(const f of fs.readdirSync(root+'/data').filter(f=>f.endsWith('.json')))data[f.slice(0,-5)]=JSON.parse(fs.readFileSync(root+'/data/'+f));
const cards=Object.fromEntries(data.study_cards.map(c=>[c.id,c]));
(async()=>{const server=cp.spawn('python',['-m','http.server','8876','--bind','127.0.0.1','--directory',root],{stdio:'ignore'});let browser;try{
await new Promise(r=>setTimeout(r,500));browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())});
await page.addInitScript(()=>{window.spoken=[];window.SpeechSynthesisUtterance=class{constructor(t){this.text=t}};Object.defineProperty(window,'speechSynthesis',{value:{cancel:()=>{},getVoices:()=>[{lang:'en-US'}],speak:u=>window.spoken.push({text:u.text,lang:u.lang})}})});
await page.goto('http://127.0.0.1:8876');await page.waitForSelector('[data-learn-step]');assert.equal(await page.locator('[data-learn-step] option').count(),95);
await page.locator('[data-mode="play"]').click();const ids=await page.locator('.learning-exercise').evaluate(el=>el.dataset.card);assert.equal(cards[ids].lesson,0);await page.locator('[data-mode="study"]').click();
for(let i=0;i<95;i++){
 await page.locator('[data-learn-step]').selectOption(String(i));assert.equal(await page.locator('.example').count(),data.lessons[i].examples.length);
 await page.evaluate(()=>Promise.all([...document.images].map(im=>{im.loading='eager';return im.decode()})));assert.ok(await page.evaluate(()=>[...document.images].every(im=>im.naturalWidth>0)));
 const spoken=await page.locator('.example [data-say]').evaluateAll(bs=>bs.map(b=>decodeURIComponent(b.dataset.say)));assert.deepEqual(spoken,data.lessons[i].examples.map(e=>e[0]));
 if(i<15)await page.screenshot({path:out+`/lesson-${String(i+1).padStart(2,'0')}.png`,fullPage:true});
 await page.locator('[data-learn="practice"]').first().click();assert.equal(await page.locator('.learning-exercise').count(),1);
 const result=await page.evaluate(({cards,i})=>{
  let answered=0,wrongDone=false;
  while(!document.querySelector('.quiz-answer h3')?.textContent.includes('Hotovo')){
   const area=document.querySelector('.learning-exercise');if(!area)break;
   const c=cards[area.dataset.card],t=area.dataset.task;if(c.lesson!==i)throw Error('wrong lesson');
   if(t==='build'){
    for(const w of c.en.split(/\s+/)){let b=[...document.querySelectorAll('[data-learn-word]:not(:disabled)')].find(b=>b.textContent===w);if(!b)throw Error('missing word '+w);b.click()}
    document.querySelector('[data-learn="check"]').click();
   }else{
    let expect=['translate','correct','picture'].includes(t)?c.en:c.sk;
    const choices=[...document.querySelectorAll('[data-learn-answer]')];let b;
    if(t==='gap'){
     const h=area.querySelector('h3').textContent.split(' (')[0].split(' '),gap=h.indexOf('_____');expect=c.en.split(' ')[gap];
    }
    if(i===0&&!wrongDone){b=choices.find(b=>b.textContent!==expect);wrongDone=true}else b=choices.find(b=>b.textContent===expect);
    if(!b)throw Error('No correct option '+c.id+' '+t+' '+expect);b.click();
   }
   if(!document.querySelector('[data-learn="advance"]'))throw Error('No feedback');answered++;document.querySelector('[data-learn="advance"]').click();if(answered>30)throw Error('Loop');
  }
  return answered;
 },{cards,i});assert.ok(result>=8);assert.match(await page.locator('.quiz-answer').innerText(),/Hotovo/);
}
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('dad-learning-v2')).complete.length),95);
let score=await page.locator('#score').innerText();await page.reload();await page.waitForSelector('[data-learn-step]');assert.equal(await page.locator('[data-learn-step]').inputValue(),'94');assert.equal(await page.locator('#score').innerText(),score);
// Retry a completed lesson: do not penalize errors or award the same question twice.
await page.locator('[data-learn-step]').selectOption('0');await page.locator('[data-learn="practice"]').first().click();await page.evaluate(cards=>{while(document.querySelector('.learning-exercise')){let a=document.querySelector('.learning-exercise'),c=cards[a.dataset.card],t=a.dataset.task;if(t==='build'){for(const w of c.en.split(' '))[...document.querySelectorAll('[data-learn-word]:not(:disabled)')].find(b=>b.textContent===w).click();document.querySelector('[data-learn="check"]').click()}else{let expect=['translate','correct','picture'].includes(t)?c.en:c.sk;if(t==='gap'){let h=a.querySelector('h3').textContent.split(' (')[0].split(' ');expect=c.en.split(' ')[h.indexOf('_____')]}[...document.querySelectorAll('[data-learn-answer]')].find(b=>b.textContent===expect).click()}document.querySelector('[data-learn="advance"]').click()}},cards);assert.equal(await page.locator('#score').innerText(),score);
assert.equal(await page.evaluate(()=>window.spoken.length),0);await page.locator('[data-mode="play"]').click();for(const t of ['mixed','translate','meaning','listen','build','gap','correct','picture']){
 await page.locator('[data-learn-type]').selectOption(t);assert.equal(await page.locator('.learning-exercise').count(),1);
 if(t==='listen'){const area=page.locator('.learning-exercise');const en=await area.locator('[data-say]').evaluate(b=>decodeURIComponent(b.dataset.say));assert.ok(!(await area.innerText()).includes(en));await area.locator('[data-say]').click();assert.deepEqual(await page.evaluate(()=>window.spoken.at(-1)),{text:en,lang:'en-US'})}
 if(t==='picture')assert.equal(await page.locator('.learning-exercise img').count(),1);
}
await page.locator('[data-play-scope="full"]').click();for(const bank of ['study','verbs','life','words','scenes']){await page.locator('[data-full-bank]').selectOption(bank);assert.equal(await page.locator('.exercise-panel').count(),1)}
await page.locator('[data-full-bank]').selectOption('scenes');await page.locator('[data-full-type="picture"]').click();assert.equal(await page.locator('.picture-choice img').count(),3);
await page.locator('[data-mode="relax"]').click();assert.equal(await page.locator('[data-full-story] option').count(),23);
for(const s of data.stories){await page.locator('[data-full-story]').selectOption(s.id);assert.equal(await page.locator('.dialogue-line').count(),s.lines.length);await page.locator('.story-art img').evaluate(im=>im.decode());for(const sec of ['words','practice','comprehension','role']){await page.locator(`[data-full-section="${sec}"]`).click();if(sec==='role'){await page.locator('[data-role-answer]').first().click();assert.ok(await page.locator('.quiz-answer b').textContent())}}}
await page.locator('[data-full-section="messages"]').click();for(const m of data.messages){assert.equal(await page.locator('.phone-body').innerText(),m.en);await page.locator('[data-message-answer]').filter({hasText:m.a[m.correct]}).click();await page.locator('[data-full-ui="messagenext"]').click()}
await page.locator('[data-action="noticesopen"]').click();assert.equal(await page.locator('.phone-body').count(),1);await page.locator('[data-action="noticesclose"]').click();
for(const [width,height] of [[390,844],[768,1024],[1024,768],[1440,1000]]){
 await page.setViewportSize({width,height});for(const mode of ['study','play','relax']){await page.locator(`[data-mode="${mode}"]`).click();if(mode==='study')await page.locator('[data-learn-step]').selectOption('43');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${mode} ${width}`);assert.ok(await page.evaluate(()=>[...document.querySelectorAll('button,select,summary')].filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().height>=44)),`small control ${mode} ${width}`);await page.screenshot({path:out+`/${mode}-${width}.png`,fullPage:true})}
}
assert.equal(errors.length,0,errors.join('\n'));const result={status:'PASS',lessons:95,guided_questions:760,first15_screenshots:15,stories:23,viewports:4,english_only_audio:true,no_autoplay:true,progress_and_retry:true};fs.writeFileSync(root+'/tests/learning_browser_result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{if(browser)await browser.close();server.kill()}})().catch(e=>{console.error(e);process.exitCode=1});
