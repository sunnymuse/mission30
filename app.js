(() => {
  'use strict';
  const SYSTEMS = {
    overview: {title:'MISSION COMMAND', short:'MISSION 30', tag:'MISSION REACTOR / 001', subtitle:'CHAPTER ONE · THE HIGH LIFE', color:'#F3B96B', rgb:'243,185,107'},
    career: {title:'CAREER ENGINE', short:'CAREER', symbol:'⌘', tag:'SYSTEM 01 / CAREER', subtitle:'BUILD YOUR TECHNICAL EDGE', color:'#F3B96B',rgb:'243,185,107', desc:'Become dependable in production AI engineering: own complex systems, solve incidents independently, and grow toward stronger future career opportunities.', metrics:[['Current chapter','EXAMPLE CAREER PLAN','Customize in a future private deployment'],['Target field','NOT SET','No personal salary target included'],['Skill roadmap','6 tracks','Proposed learning categories'],['Project sync','NOT LINKED','GitHub integration planned']], subs:['Production Python & FastAPI','Agentic AI / RAG evaluation','Observability & incident response','Cloud architecture & security']},
    finance: {title:'FINANCIAL CORE', short:'FINANCE', symbol:'◇', tag:'SYSTEM 02 / FINANCE', subtitle:'RECOVER. PROTECT. BUILD.', color:'#50D9D0',rgb:'80,217,208',desc:'Restore stable cash flow, protect essential expenses, prevent new missed payments and reduce debts through affordable plans.', metrics:[['Current balances','NOT RECORDED','Enter verified balances in Data Vault'],['Emergency fund','NOT LINKED','Current verified balance unavailable'],['Monthly take-home','UNCONFIRMED','Waiting on actual job/pay documents'],['Account sync','OFFLINE','No banking connection']], subs:['Debt payoff visualization','Budget versus real expenses','Budget and cash buffer','Emergency savings timeline']},
    credit: {title:'CREDIT REBUILD', short:'CREDIT', symbol:'▣', tag:'SYSTEM 03 / CREDIT', subtitle:'LONG-TERM PAYMENT STABILITY', color:'#F3B96B',rgb:'243,185,107',desc:'Track dated credit reports, on-time payments, revolving utilization and resolved accounts without assuming a quick score recovery.', metrics:[['Score baseline','NOT RECORDED','Enter a dated report in Data Vault'],['Current score','NOT CONNECTED','Do not confuse baseline with live data'],['Payment streak','NOT TRACKED','Needs verified repayment history'],['Report source','NOT CONNECTED','No credit data linked to this website']],subs:['Credit score history','Payment history checkpoints','Revolving utilization','Collections status and verification']},
    fitness: {title:'BODY LAB', short:'BODY LAB', symbol:'⌁', tag:'SYSTEM 04 / FITNESS', subtitle:'STRENGTH. SLEEP. CONSISTENCY.', color:'#50D9D0',rgb:'80,217,208',desc:'Build a sustainable training and recovery routine around full-time work. Make your progress visible without turning health into a punishment.',metrics:[['Apple Health','NOT CONNECTED','Custom website sync not configured'],['Workout tracking','NO ENTRIES','No workout logs in this prototype'],['Sleep trend','NO SYNC','Requires opted-in Health data'],['Measurements','TO ESTABLISH','Weight and waist baseline pending']],subs:['Activity and workouts','Sleep duration and consistency','Body measurements','Strength progression and recovery']},
    discipline: {title:'MIND & DISCIPLINE', short:'MIND', symbol:'◉', tag:'SYSTEM 05 / DISCIPLINE', subtitle:'BUILD A PEACEFUL ROUTINE', color:'#A594EE',rgb:'165,148,238',desc:'Build repeatable routines around work, gym, home care, sleep and manageable priorities. Measure consistency, not perfection.',metrics:[['Daily check-ins','NOT ENABLED','Manual logging planned'],['Calendar link','NOT CONNECTED','Optional integration'],['Routine target','WORK · GYM · HOME','Intended structure, not confirmed adherence'],['Focus reviews','PLANNED','Weekly retrospectives']],subs:['Morning and evening routines','Weekly habit consistency','Focus and rest blocks','Home and social balance']},
    vault: {title:'DATA VAULT', short:'DATA', symbol:'▥', tag:'SYSTEM 08 / VAULT', subtitle:'YOUR RECORDED DATA', color:'#F3B96B',rgb:'243,185,107'},
    calendar: {title:'LIFE CALENDAR', short:'CALENDAR', symbol:'▦', tag:'SYSTEM 07 / CALENDAR', subtitle:'ROOM FOR LIVING', color:'#F3B96B', rgb:'243,185,107'},
    spirit: {title:'SPIRIT CORE', short:'SPIRIT', symbol:'✧', tag:'SYSTEM 06 / SPIRIT', subtitle:'REFLECTION. GRATITUDE. INTEGRITY.', color:'#EBCB98',rgb:'235,203,152',desc:'Explore a generic reflection and journaling module using fictional examples.',metrics:[['Personal chapter','THE HIGH LIFE','Example milestone'],['Reflection log','NOT ENABLED','Only if you choose to record it'],['Gratitude journal','PRIVATE BY DESIGN','Future encrypted storage'],['Daily reflections','NOT TRACKED','No assumed reflection score']],subs:['Journal and reflection prompts','Reflection prompts','Meaningful moments','Personal commitments']}
  };
  window.M30 = {systems:SYSTEMS, active:'overview', lowPower:false, reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false, onSystemChange:null};
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const hexToRgb = hex => {const a=hex.replace('#',''); return [parseInt(a.slice(0,2),16)/255,parseInt(a.slice(2,4),16)/255,parseInt(a.slice(4,6),16)/255];};
  const getNow = () => new Date();
  function updateClock(){
    const now=getNow(), target=new Date(2028,0,1,0,0,0), start=new Date(2027,0,1,0,0,0), delta=Math.max(0,target-now);
    const days=Math.floor(delta/864e5),hrs=Math.floor(delta%864e5/36e5),mins=Math.floor(delta%36e5/6e4);
    $('#countdown').innerHTML=`${days}<span class="unit">D</span> ${String(hrs).padStart(2,'0')}<span class="unit">H</span> ${String(mins).padStart(2,'0')}<span class="unit">M</span>`;
    const pct=Math.max(0,Math.min(100,100*(now-start)/(target-start)));
    $('#elapsed-pct').textContent=pct.toFixed(1)+'%';$('#timeline-fill').style.width=pct+'%';
    $('#time-note').textContent=delta>0?`${days} DAYS REMAIN`:'MISSION DATE REACHED';
  }
  updateClock();setInterval(updateClock,60e3);
  const overlayIds={module:'#module-overlay',console:'#console-overlay',settings:'#settings-overlay'};
  let previousFocus=null;
  function openOverlay(name){const el=$(overlayIds[name]);if(!el)return;previousFocus=document.activeElement;el.hidden=false;document.body.style.overflow='hidden';const b=el.querySelector('button');b?.focus();}
  function closeOverlay(name){const el=$(overlayIds[name]);if(!el)return;el.hidden=true; if(!Object.values(overlayIds).some(s=>!$(s).hidden))document.body.style.overflow='';previousFocus?.focus?.();}
  $$('[data-close]').forEach(el=>el.addEventListener('click',()=>closeOverlay(el.dataset.close)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){for(const [n,s] of Object.entries(overlayIds)){if(!$(s).hidden){closeOverlay(n);break;}}}});
  let toastTimer;
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3400)};
  window.M30.toast=toast;
  function setSystem(id,updateHash=true){
    const system=SYSTEMS[id];if(!system)return;
    window.M30.active=id;
    document.documentElement.style.setProperty('--accent',system.color);
    document.documentElement.style.setProperty('--accent-rgb',system.rgb);
    $('#zone-title').textContent=system.title;
    $('#core-tag').textContent=system.tag;
    $('#core-status').textContent=system.subtitle;
    $('#core-label').innerHTML=id==='overview'?'M<span>∕</span>30':system.symbol;
    $$('.rail-item, .system-card, .mobile-nav [data-system], .mobile-more-panel [data-system]').forEach(el=>el.classList.toggle('active',el.dataset.system===id));
    if(window.M30.onSystemChange)window.M30.onSystemChange(id,hexToRgb(system.color));
    const detail=id!=='overview';
    $$('.overview-only').forEach(el=>el.hidden=detail);
    if(id==='vault'){window.M30Analytics?.hide();window.M30Calendar?.hide();window.M30Vault?.show();}
    else if(id==='calendar'){window.M30Vault?.hide();window.M30Analytics?.hide();window.M30Calendar?.show();}
    else if(detail){window.M30Vault?.hide();window.M30Calendar?.hide();window.M30Analytics?.show(id);}
    else {window.M30Vault?.hide();window.M30Calendar?.hide();window.M30Analytics?.hide();$('#bunny-message').textContent='Explore career, budget and wellness demo modules. Small consistent actions create the progress we can eventually measure.';}
    if(updateHash){const desired='#/'+id;if(location.hash!==desired)history.pushState(null,'',desired);}
    document.querySelector('#mobile-more-panel').hidden=true;
    window.scrollTo({top:0,behavior:'instant'});
  }
  window.M30.navigate=setSystem;
  $$('[data-system]').forEach(el=>el.addEventListener('click',()=>setSystem(el.dataset.system,true)));
  $('#reset-overview').addEventListener('click',()=>setSystem('overview'));
  $('#bunny-open').addEventListener('click',()=>openOverlay('console'));
  $('#open-console').addEventListener('click',()=>openOverlay('console'));
  $('#settings-btn').addEventListener('click',()=>openOverlay('settings'));
  $('#refresh-view').addEventListener('click',()=>{const id=window.M30.active;if(id==='vault'){window.M30Vault?.refresh();}else if(id==='calendar'){window.M30Calendar?.refresh();}else if(id!=='overview'){window.M30Analytics?.show(id);}updateClock();window.dispatchEvent(new Event('resize'));toast('View refreshed · local entries retained where browser storage is available');});
  $('#briefing-btn').addEventListener('click',()=>{openOverlay('console');postDemo('today')});
  $('#mobile-menu').addEventListener('click',()=>{const menu=$('#mobile-more-panel');menu.hidden=!menu.hidden;});
  $('#reduce-motion').checked=window.M30.reducedMotion;
  document.body.classList.toggle('reduce-motion',window.M30.reducedMotion);
  $('#reduce-motion').addEventListener('change',e=>{window.M30.reducedMotion=e.target.checked;document.body.classList.toggle('reduce-motion',window.M30.reducedMotion)});
  $('#power-saver').addEventListener('change',e=>{window.M30.lowPower=e.target.checked;window.dispatchEvent(new Event('resize'));toast(e.target.checked?'Power saver enabled':'High quality rendering enabled')});
  const replies={
    today:['What should I focus on today?','Explore the sample modules and customize a routine later. There is no live schedule or bank data connected.'],
    finance:["What's my financial priority?",'This is an illustrative budget module. No personal financial baseline is included and no accounts are connected.'],
    career:['How can I grow as an AI engineer?','Learn the architecture, deployment process, incident playbooks and security controls. Build trust through reproducible fixes and clear communication. Do not paste confidential client code or documents here.'],
    health:['What should Body Lab track?','Start with sleep duration, workout consistency, steps, strength milestones and self-reported recovery. Apple Health is not connected to this website yet.']
  };
  const transcript=$('#transcript');
  function bubble(txt,type){const el=document.createElement('div');el.className='transcript-msg '+type;el.textContent=txt;transcript.appendChild(el);transcript.scrollTop=transcript.scrollHeight}
  function postDemo(id){const pair=replies[id];if(!pair)return;bubble(pair[0],'user');setTimeout(()=>bubble(pair[1],'agent'),220)}
  $$('[data-prompt]').forEach(el=>el.addEventListener('click',()=>postDemo(el.dataset.prompt)));
  function syncLocation(){const route=location.hash.replace(/^#\/?/,'');setSystem(SYSTEMS[route]?route:'overview',false);}
  window.addEventListener('popstate',syncLocation);window.addEventListener('hashchange',syncLocation);
  syncLocation();
})();
