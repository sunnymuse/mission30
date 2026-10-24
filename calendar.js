(() => {
  'use strict';
  const ROOT = document.getElementById('calendar-workspace');
  if (!ROOT) return;
  const STORAGE = 'mission30.personal-calendar.v04';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const COLORS = {work:'#50D9D0',health:'#6EDBAC',social:'#A594EE',football:'#F3B96B',learning:'#A5A2EA',rest:'#D9A2C7',errands:'#EEAF91',spirit:'#EBCB98'};
  const LABELS = {work:'Work',health:'Health / gym',social:'Friends / social',football:'Football / fun',learning:'Learning',rest:'Recharge',errands:'Errands',spirit:'Spiritual'};
  const IDEAS = [
    {id:'kickabout',title:'Play football with friends',cat:'football',emoji:'⚽',min:120,cost:'Free / low cost',desc:'Get some movement, competition and laughs. A great weekend alternative to staying indoors.'},
    {id:'match',title:'Watch a match with friends',cat:'football',emoji:'🏟',min:120,cost:'Low-cost option',desc:'Barcelona or NFL watch party; keep the social side of football alive.'},
    {id:'park',title:'Walk the Scioto Mile',cat:'outdoors',emoji:'🌳',min:75,cost:'Usually free',desc:'Explore the Scioto Mile riverfront in downtown Columbus and enjoy a simple outdoor break.'},
    {id:'photowalk',title:'German Village photo walk',cat:'outdoors',emoji:'📸',min:60,cost:'Free',desc:'Explore the streets of German Village, take photos and enjoy discovering Columbus.'},
    {id:'coffee',title:'Coffee and good conversation',cat:'social',emoji:'☕',min:60,cost:'Budget-friendly',desc:'Meet someone, catch up or make a new connection without planning an expensive night.'},
    {id:'meetup',title:'Try a community meetup',cat:'social',emoji:'🤝',min:90,cost:'Varies',desc:'Look for a tech talk, hobby meetup, language exchange or casual social gathering.'},
    {id:'museum',title:'Columbus museum afternoon',cat:'discover',emoji:'🎨',min:120,cost:'Check admission',desc:'Explore COSI or the Columbus Museum of Art. Check current hours and admission before going.'},
    {id:'music',title:'Find a local live show',cat:'discover',emoji:'🎵',min:120,cost:'Check tickets',desc:'Comedy, live music or a community festival can be a good change of pace.'},
    {id:'movie',title:'Movie night',cat:'rest',emoji:'🎬',min:120,cost:'Home = low cost',desc:'Enjoy a film with no productivity target attached.'},
    {id:'cook',title:'Cook something new',cat:'rest',emoji:'🍝',min:75,cost:'Grocery budget',desc:'Try a new recipe, play music and enjoy the process.'},
    {id:'unplanned',title:'Protect unstructured time',cat:'rest',emoji:'🌙',min:60,cost:'Free',desc:'Do nothing on purpose. Rest is a valid plan, not a missed goal.'},
    {id:'call',title:'Call a friend or family',cat:'social',emoji:'📞',min:45,cost:'Free',desc:'Stay connected to people who matter, even in a busy week.'},
  ];
  const state = {view:'month',selected:null,anchor:null,mood:'all',demo:true,events:[],surpriseOffset:0,storageOK:true};
  const pad=n=>String(n).padStart(2,'0');
  const localISO=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const makeDate=iso=>{const [y,m,d]=(iso||'').split('-').map(Number);return new Date(y,m-1,d);};
  const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
  const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1);
  const weekStart=d=>addDays(d,-d.getDay());
  const mins=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
  const clock=m=>`${pad(Math.floor(m/60))}:${pad(m%60)}`;
  const prettyTime=s=>{let [h,m]=s.split(':').map(Number);return `${h%12||12}:${pad(m)} ${h>=12?'PM':'AM'}`;};
  const longDate=iso=>makeDate(iso).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const prettyDuration=n=>n>=60?`${Math.floor(n/60)}h${n%60?` ${n%60}m`:''}`:`${n}m`;
  let toast=(msg)=>{window.M30?.toast?.(msg)};

  function restore(){
    try{const raw=localStorage.getItem(STORAGE);if(raw){const p=JSON.parse(raw);state.events=Array.isArray(p.events)?p.events.filter(e=>e&&typeof e.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.date)&&/^\d\d:\d\d$/.test(e.start)&&/^\d\d:\d\d$/.test(e.end)&&typeof e.title==='string').slice(0,2000):[];state.demo=p.demo!==false;}}
    catch(err){state.storageOK=false;}
    const now=new Date();state.selected=localISO(now);state.anchor=new Date(now.getFullYear(),now.getMonth(),1);
  }
  function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({events:state.events,demo:state.demo}));state.storageOK=true;}catch(e){state.storageOK=false;toast('Changes are visible now, but this browser does not allow local saving.');}}
  function demoForDate(iso){
    if(!state.demo) return [];
    const d=makeDate(iso),day=d.getDay(),events=[];
    const add=(key,title,start,end,cat)=>events.push({id:`demo-${iso}-${key}`,title,date:iso,start,end,cat,demo:true});
    if(day>=1&&day<=5)add('work','Work focus · example','09:00','17:00','work');
    if([1,3,5].includes(day))add('gym','Gym · example','18:00','19:00','health');
    if(day===6)add('football','Football / friends · example','11:00','13:00','football');
    if(day===0)add('rest','Recharge · example','10:30','11:30','rest');
    return events;
  }
  function onDate(iso){return [...demoForDate(iso),...state.events.filter(x=>x.date===iso)].sort((a,b)=>a.start.localeCompare(b.start));}
  function between(start,end){const out=[];for(let d=makeDate(start);localISO(d)<=end;d=addDays(d,1))out.push(...onDate(localISO(d)));return out.sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));}
  function freeWindows(iso){
    const START=8*60,END=22*60;
    const busy=onDate(iso).map(e=>[Math.max(START,mins(e.start)),Math.min(END,mins(e.end))]).filter(x=>x[1]>x[0]).sort((a,b)=>a[0]-b[0]);
    const merged=[];
    for(const cur of busy){let last=merged[merged.length-1];if(last&&cur[0]<=last[1])last[1]=Math.max(last[1],cur[1]);else merged.push([...cur]);}
    const free=[];let pos=START;
    for(const [a,b] of merged){if(a>pos)free.push([pos,a]);pos=Math.max(pos,b);}
    if(END>pos)free.push([pos,END]);
    return free.filter(w=>w[1]-w[0]>=45);
  }
  const freeHours=iso=>freeWindows(iso).reduce((v,[a,b])=>v+b-a,0)/60;
  function eventChip(e){return `<span class="cal-day-event ${e.demo?'demo':''}" style="--ev-color:${COLORS[e.cat]||COLORS.social}" title="${escapeHTML(e.title)}${e.demo?' (sample)':''}">${escapeHTML(e.title)}</span>`;}
  const doc=()=>ROOT;
  function shell(){ROOT.innerHTML=`
    <div class="cal-kicker"><span>MISSION 30 <span style="color:#748F9C">/</span> LIFE SYSTEM 07 <span style="color:#748F9C">/</span> SOCIAL BALANCE & PLANNING</span><button type="button" id="cal-back">↖ RETURN TO MISSION CORE</button></div>
    <div class="cal-hero"><div class="cal-hero-copy"><div class="cal-pretitle">LIFE CALENDAR / HUMAN MODE</div><h2>MAKE ROOM<br>FOR LIVING.</h2><p>Work, train, rebuild — but also explore Columbus, meet people, enjoy football, and protect genuinely free time.</p><div class="cal-hero-chips"><span class="cal-mini-chip">▦ SCHEDULE INTELLIGENCE</span><span class="cal-mini-chip">✦ FREE TIME RADAR</span><span class="cal-mini-chip">☷ REAL-LIFE BALANCE</span></div></div><div class="cal-radar" aria-hidden="true"><div class="cal-radar-sweep"></div><div class="cal-radar-core">✧</div></div></div>
    <div class="cal-preview-alert" id="cal-alert"></div>
    <div class="cal-stats" id="cal-stats"></div>
    <div class="cal-main-grid">
      <section class="cal-panel" aria-label="Calendar grid"><div class="cal-toolbar"><div class="cal-toolbar-left"><button type="button" class="cal-icon-btn" id="cal-prev" aria-label="Previous period">‹</button><button type="button" class="cal-icon-btn" id="cal-next" aria-label="Next period">›</button><button type="button" class="cal-outline-btn" id="cal-today">TODAY</button><h3 id="cal-month-heading"></h3></div><div class="cal-toolbar-right"><div class="cal-view-buttons"><button type="button" data-view="month" class="active">MONTH</button><button type="button" data-view="week">WEEK</button></div><button type="button" class="cal-solid-btn" id="cal-add">+ NEW EVENT</button></div></div><div id="cal-grid"></div><div class="cal-month-footer"><span>SELECT A DAY TO INSPECT YOUR PLAN</span><span>◌ SAMPLE EVENTS ARE DIMMED</span></div></section>
      <aside class="cal-right-stack"><section class="cal-panel"><div class="cal-panel-header"><h3>DAY INTELLIGENCE</h3><span id="cal-day-count">SELECTED</span></div><div class="cal-agenda-date" id="cal-selected-name"></div><div class="cal-agenda-sub" id="cal-selected-sub"></div><div id="cal-agenda-list"></div><div class="cal-quick-summary" id="cal-day-summary"></div></section><section class="cal-panel"><div class="cal-panel-header"><h3>UPCOMING MILESTONES</h3><span>NEXT 14 DAYS</span></div><div class="cal-list" id="cal-upcoming"></div><div style="margin-top:15px"><button class="cal-outline-btn" type="button" id="cal-export">↧ EXPORT MY EVENTS (.ICS)</button></div></section></aside>
    </div>
    <div class="cal-bottom-grid">
      <section class="cal-panel"><div class="cal-radar-heading"><div class="cal-radar-icon">✦</div><div><h3>FREE TIME RADAR</h3><p>Ideas matched to open time on your selected day. Nothing is booked unless you choose it.</p></div></div><div class="cal-slots" id="cal-slots"></div><div class="cal-vibes" id="cal-vibes"></div><div class="cal-idea-grid" id="cal-ideas"></div><div class="cal-discover-links"><a href="https://www.experiencecolumbus.com/things-to-do/" target="_blank" rel="noopener noreferrer">↗ Explore Columbus activities</a><a href="https://www.experiencecolumbus.com/events/?sort=date" target="_blank" rel="noopener noreferrer">↗ Search real local events</a></div><p class="cal-footnote">Suggested activities are general ideas, not verified local bookings. External event pages let you check actual dates, prices and availability. No automatic event-feed connection is active.</p></section>
      <section class="cal-panel"><div class="cal-panel-header"><h3>YOUR WEEKLY RHYTHM</h3><span>NO ROBOT MODE</span></div><p style="font-size:11px;line-height:1.7;color:#9DACB9">The mission works better when it leaves room for people, fun, rest and spontaneous adventures.</p><div id="cal-bars" class="cal-week-bars"></div><div class="cal-life-balance" id="cal-balance-note"></div><div style="border-top:1px solid #394A59;margin-top:18px;padding-top:17px"><div class="cal-panel-header"><h3>DATA CONNECTIONS</h3><span>PREVIEW STATUS</span></div><p class="cal-footnote" style="margin-top:0">▸ Personal events: <strong>saved in this browser only</strong><br>▸ Google Calendar: <strong>not connected</strong><br>▸ Local event discovery: <strong>external links only</strong><br>▸ Agent recommendations: <strong>future integration</strong></p><button type="button" class="cal-outline-btn" id="cal-toggle-demo" style="margin-top:13px">HIDE SAMPLE SCHEDULE</button></div></section>
    </div><div class="an-page-bottom"><span>MISSION 30 / HUMAN MODE — DATE-AWARE LOCAL PLANNER</span><button class="an-bottom-btn" type="button" id="cal-bottom-back">↖ BACK TO COMMAND</button></div>
    <div id="cal-modal" class="cal-modal" hidden><div class="cal-modal-panel" role="dialog" aria-modal="true" aria-labelledby="cal-modal-title"><div class="cal-modal-top"><div><div class="cal-pretitle" style="font-size:9px">PERSONAL LIFE ENTRY</div><h3 id="cal-modal-title">NEW EVENT</h3></div><button class="cal-close" type="button" id="cal-modal-close" aria-label="Close event form">×</button></div><p>These events remain local to this browser until we add secure cloud sync.</p><form id="cal-event-form" class="cal-event-form"><input type="hidden" id="cal-edit-id"><div class="cal-field span2"><label for="cal-title-input">EVENT TITLE</label><input id="cal-title-input" maxlength="100" required placeholder="e.g. Football with friends" autocomplete="off"></div><div class="cal-field"><label for="cal-date-input">DATE</label><input id="cal-date-input" type="date" required></div><div class="cal-field"><label for="cal-category-input">CATEGORY</label><select id="cal-category-input"></select></div><div class="cal-field"><label for="cal-start-input">START TIME</label><input id="cal-start-input" type="time" required></div><div class="cal-field"><label for="cal-end-input">END TIME</label><input id="cal-end-input" type="time" required></div><div class="cal-form-error" id="cal-form-error" role="alert"></div><div class="cal-form-buttons"><button type="button" id="cal-form-cancel">CANCEL</button><button type="submit">SAVE EVENT ↗</button></div></form></div></div>`;
    const cats=Object.entries(LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');ROOT.querySelector('#cal-category-input').innerHTML=cats;
  }
  function alertRender(){ROOT.querySelector('#cal-alert').innerHTML=`<span>◈ <strong>${state.demo?'SAMPLE ROUTINE IS VISIBLE':'YOUR OWN EVENTS ONLY'}</strong> — ${state.demo?'Blue work blocks, gym and football examples are fictional and are not your actual appointments.':'There are no demo appointments mixed into the schedule.'} ${state.storageOK?'Your events are stored locally in this browser.':'Browser storage is unavailable; changes may disappear after reload.'}</span><button id="cal-demo-button" type="button">${state.demo?'HIDE SAMPLE EVENTS':'SHOW SAMPLE ROUTINE'}</button>`;ROOT.querySelector('#cal-demo-button').addEventListener('click',toggleDemo);const b=ROOT.querySelector('#cal-toggle-demo');b.textContent=state.demo?'HIDE SAMPLE SCHEDULE':'SHOW SAMPLE SCHEDULE';}
  function statsRender(){const now=new Date(),today=localISO(now),week=weekStart(makeDate(state.selected)),weekEnd=localISO(addDays(week,6)),weekEvents=between(localISO(week),weekEnd);const personalUpcoming=state.events.filter(e=>(e.date+e.end)>=(today+'00:00')).length;const leisure=weekEvents.filter(e=>['social','football','rest'].includes(e.cat)).length;const free=freeHours(state.selected);const total=onDate(state.selected).length;
    ROOT.querySelector('#cal-stats').innerHTML=`<div class="cal-stat"><small>PLANNED / SELECTED DAY</small><strong>${total}</strong><span>${state.demo?'INCLUDING CLEARLY LABELED DEMO':'PERSONAL ENTRIES ONLY'}</span></div><div class="cal-stat"><small>OPEN TIME / SELECTED DAY</small><strong class="emph">${free.toFixed(1)}<small> h</small></strong><span>8 AM–10 PM WINDOW · NOT AN OBLIGATION</span></div><div class="cal-stat"><small>FUN & REST / THIS WEEK</small><strong>${leisure}</strong><span>INCLUDING SAMPLE WHEN VISIBLE</span></div><div class="cal-stat"><small>YOUR UPCOMING EVENTS</small><strong>${personalUpcoming}</strong><span>EVENTS YOU HAVE SAVED</span></div>`;
  }
  function calendarRender(){const target=ROOT.querySelector('#cal-grid');ROOT.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
    if(state.view==='month'){
      const a=state.anchor;ROOT.querySelector('#cal-month-heading').textContent=`${MONTHS[a.getMonth()]} ${a.getFullYear()}`;
      const first=new Date(a.getFullYear(),a.getMonth(),1),start=weekStart(first),last=new Date(a.getFullYear(),a.getMonth()+1,0);
      const rows=Math.ceil((first.getDay()+last.getDate())/7);let html='<div class="cal-weekdays">'+SHORT.map(x=>`<div>${x.toUpperCase()}</div>`).join('')+'</div><div class="cal-month-grid">';
      for(let i=0;i<rows*7;i++){const date=addDays(start,i),iso=localISO(date),evs=onDate(iso);html+=`<button type="button" class="cal-day${date.getMonth()!==a.getMonth()?' outside':''}${iso===state.selected?' selected':''}${iso===localISO(new Date())?' today':''}" data-date="${iso}" aria-label="${longDate(iso)}, ${evs.length} events" aria-pressed="${iso===state.selected}"><span class="cal-daynum">${date.getDate()}</span><span class="cal-day-events">${evs.slice(0,3).map(eventChip).join('')}${evs.length>3?`<span class="cal-extra">+${evs.length-3}</span>`:''}</span></button>`;}
      target.innerHTML=html+'</div>';
    }else{
      const d=makeDate(state.selected),start=weekStart(d),end=addDays(start,6);ROOT.querySelector('#cal-month-heading').textContent=`${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
      let html='<div class="cal-week-grid">';for(let i=0;i<7;i++){const day=addDays(start,i),iso=localISO(day);html+=`<button class="cal-weekcol${state.selected===iso?' selected':''}" type="button" data-date="${iso}" aria-pressed="${state.selected===iso}"><div class="cal-weekhead">${SHORT[day.getDay()].toUpperCase()}<strong>${day.getDate()}</strong></div>${onDate(iso).map(e=>`<div class="cal-weekevent${e.demo?' demo':''}" style="--ev-color:${COLORS[e.cat]||COLORS.social}">${escapeHTML(e.start)}<br>${escapeHTML(e.title)}</div>`).join('')}</button>`;}
      target.innerHTML=html+'</div>';
    }
    target.querySelectorAll('[data-date]').forEach(b=>b.addEventListener('click',()=>{state.selected=b.dataset.date;state.anchor=new Date(makeDate(state.selected).getFullYear(),makeDate(state.selected).getMonth(),1);render();}));
  }
  function agendaRender(){let evs=onDate(state.selected);ROOT.querySelector('#cal-selected-name').textContent=makeDate(state.selected).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});ROOT.querySelector('#cal-selected-sub').textContent=`${evs.length} event${evs.length===1?'':'s'} · Schedule and open time from selected day`;
    ROOT.querySelector('#cal-day-count').textContent=`${evs.length} PLANNED`;
    ROOT.querySelector('#cal-agenda-list').innerHTML=evs.length?evs.map(e=>`<div class="cal-agenda-event${e.demo?' demo':''}" style="--ev-color:${COLORS[e.cat]||COLORS.social}"><div class="cal-agenda-text"><div class="cal-agenda-time">${prettyTime(e.start)}–${prettyTime(e.end)}</div><div class="cal-agenda-title">${escapeHTML(e.title)}</div><div class="cal-agenda-cat">${LABELS[e.cat]||'Personal'} · ${e.demo?'SAMPLE / NOT YOUR EVENT':'PERSONAL / THIS BROWSER'}</div></div>${e.demo?'':`<div class="cal-event-actions"><button type="button" data-edit="${escapeHTML(e.id)}" aria-label="Edit ${escapeHTML(e.title)}">✎</button><button type="button" data-delete="${escapeHTML(e.id)}" aria-label="Delete ${escapeHTML(e.title)}">×</button></div>`}</div>`).join(''):'<div class="cal-empty">◌ No events here yet.<br>Leave the space free — or plan something worth looking forward to.</div>';
    ROOT.querySelector('#cal-day-summary').innerHTML=`<div><strong>${freeHours(state.selected).toFixed(1)}h</strong>Open (8AM–10PM)</div><div><strong>${evs.filter(e=>['social','football','rest'].includes(e.cat)).length}</strong>Fun / recovery plans</div>`;
    ROOT.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openForm(state.events.find(e=>e.id===b.dataset.edit))));ROOT.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{state.events=state.events.filter(e=>e.id!==b.dataset.delete);persist();render();toast('Event deleted from this browser.');}));
  }
  function upcomingRender(){const today=localISO(new Date()),through=localISO(addDays(new Date(),13)),evs=between(today,through).filter(e=>e.date>today||mins(e.end)>=new Date().getHours()*60+new Date().getMinutes()).slice(0,6);
    ROOT.querySelector('#cal-upcoming').innerHTML=evs.length?evs.map(e=>`<div class="cal-upcoming"><div class="cal-upcoming-date">${makeDate(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric'}).toUpperCase()}</div><div><div class="cal-upcoming-title">${escapeHTML(e.title)}${e.demo?' <span style="color:#BEA37C;font-size:8px">· SAMPLE</span>':''}</div><div class="cal-upcoming-detail">${prettyTime(e.start)} · ${LABELS[e.cat]||'Event'}</div></div></div>`).join(''):'<div class="cal-empty">No upcoming saved events. Add one when you have a plan.</div>';
  }
  function vibesRender(){ROOT.querySelector('#cal-vibes').innerHTML=[['all','✦ All ideas'],['football','⚽ Football'],['social','☕ Social'],['outdoors','🌳 Outdoors'],['discover','🎨 Discover'],['rest','🌙 Recharge']].map(([val,label])=>`<button type="button" class="cal-vibe${state.mood===val?' active':''}" data-mood="${val}">${label}</button>`).join('')+`<button type="button" class="cal-vibe" id="cal-surprise" style="border-color:#50D9D0;color:#EAF5F2">↻ SURPRISE ME</button>`;ROOT.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>{state.mood=b.dataset.mood;state.surpriseOffset=0;radarRender();}));ROOT.querySelector('#cal-surprise').addEventListener('click',()=>{state.surpriseOffset++;radarRender();});}
  function findPlace(minutes){const wins=freeWindows(state.selected),day=makeDate(state.selected).getDay();const minStart=(day>=1&&day<=5)?17*60:10*60;const eligible=wins.map(([a,b])=>[Math.max(a,minStart),b]).filter(([a,b])=>b-a>=minutes);return eligible.length?eligible[0][0]:null;}
  function radarRender(){const wins=freeWindows(state.selected);ROOT.querySelector('#cal-slots').innerHTML=wins.length?wins.slice(0,5).map(([a,b])=>`<span class="cal-slot">${prettyTime(clock(a))}–${prettyTime(clock(b))} <strong>${prettyDuration(b-a)} free</strong></span>`).join(''):'<span class="cal-slot">No open blocks of 45+ min during 8AM–10PM.</span>';
    vibesRender();let ideas=IDEAS.filter(e=>state.mood==='all'||state.mood===e.cat);if(state.surpriseOffset){ideas=ideas.slice(state.surpriseOffset%ideas.length).concat(ideas.slice(0,state.surpriseOffset%ideas.length));}
    ROOT.querySelector('#cal-ideas').innerHTML=ideas.slice(0,4).map(e=>{const place=findPlace(e.min);return `<article class="cal-idea"><div class="cal-idea-top"><span class="cal-idea-icon">${e.emoji}</span><small>${prettyDuration(e.min)} · ${escapeHTML(e.cost)}</small></div><h4>${escapeHTML(e.title)}</h4><p>${escapeHTML(e.desc)}</p><div class="cal-idea-bottom"><span>${place===null?'No suitable free slot':'Fits '+prettyTime(clock(place))}</span><button type="button" data-idea="${e.id}" ${place===null?'disabled':''}>+ PLAN IT</button></div></article>`}).join('');
    ROOT.querySelectorAll('[data-idea]').forEach(b=>b.addEventListener('click',()=>{const idea=IDEAS.find(x=>x.id===b.dataset.idea),place=findPlace(idea.min);if(place===null)return;const categories={outdoors:'social',discover:'social',rest:'rest',football:'football',social:'social'};state.events.push({id:`ev-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:idea.title,date:state.selected,start:clock(place),end:clock(place+idea.min),cat:categories[idea.cat]||'social'});persist();render();toast('Fun added to your calendar. Keep room for living.');}));
  }
  function weekBalance(){const week=weekStart(makeDate(state.selected));let dates=Array.from({length:7},(_,i)=>localISO(addDays(week,i)));let hrs=dates.map(d=>{const evs=onDate(d);return evs.reduce((s,e)=>s+Math.max(0,Math.min(22*60,mins(e.end))-Math.max(8*60,mins(e.start))),0)/60;});let free=dates.map(d=>freeHours(d));ROOT.querySelector('#cal-bars').innerHTML=dates.map((d,i)=>`<div class="cal-bar-col" title="${SHORT[i]} · ${hrs[i].toFixed(1)}h scheduled"><div class="cal-bar-well"><div class="cal-bar-fill" style="height:${Math.min(100,100*hrs[i]/14).toFixed(1)}%"></div></div><small>${SHORT[i]}</small></div>`).join('');
    const personalFun=between(dates[0],dates[6]).filter(e=>!e.demo&&['social','football','rest'].includes(e.cat)).length;
    const average=free.reduce((a,b)=>a+b,0)/7;
    ROOT.querySelector('#cal-balance-note').innerHTML=`<div class="cal-balance-note"><strong style="color:#76E4BA">✦ Bunny's human-mode reminder</strong><br>${personalFun?'You already saved '+personalFun+' personal fun/rest plans this week.':'There are no personal fun or rest plans saved for this week.'} Open time is not a productivity failure. Make room for friends, football, spontaneous plans, and actual recovery.</div><div class="cal-footnote">Average visible open time: ${average.toFixed(1)}h/day between 8 AM and 10 PM. This is schedule space, not a claim of full availability. Travel, meals and untracked commitments may reduce it.</div>`;
  }
  function render(){alertRender();statsRender();calendarRender();agendaRender();upcomingRender();radarRender();weekBalance();}
  function openForm(event){
    const dlg=ROOT.querySelector('#cal-modal'),edit=!!event;
    ROOT.querySelector('#cal-modal-title').textContent=edit?'EDIT EVENT':'NEW EVENT';ROOT.querySelector('#cal-edit-id').value=edit?event.id:'';
    ROOT.querySelector('#cal-title-input').value=edit?event.title:'';ROOT.querySelector('#cal-date-input').value=edit?event.date:state.selected;
    ROOT.querySelector('#cal-start-input').value=edit?event.start:'18:00';ROOT.querySelector('#cal-end-input').value=edit?event.end:'19:00';ROOT.querySelector('#cal-category-input').value=edit?event.cat:'social';ROOT.querySelector('#cal-form-error').textContent='';
    dlg.hidden=false;document.body.style.overflow='hidden';ROOT.querySelector('#cal-title-input').focus();
  }
  function closeForm(){ROOT.querySelector('#cal-modal').hidden=true;document.body.style.overflow='';}
  function toggleDemo(){state.demo=!state.demo;persist();render();toast(state.demo?'Sample routine on · not your real events':'Sample routine hidden');}
  function exportICS(){if(!state.events.length){toast('Add a personal event before exporting.');return;}
    const clean=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
    const stamp=(iso,time)=>`${iso.replace(/-/g,'')}T${time.replace(':','')}00`;
    const text=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mission30//Personal Planner//EN','CALSCALE:GREGORIAN',...state.events.flatMap(e=>['BEGIN:VEVENT',`UID:${e.id}@mission30.local`,`DTSTART:${stamp(e.date,e.start)}`,`DTEND:${stamp(e.date,e.end)}`,`SUMMARY:${clean(e.title)}`,`DESCRIPTION:${clean((LABELS[e.cat]||'Personal')+' • Exported from a local Mission 30 prototype')}`,'END:VEVENT']),'END:VCALENDAR'].join('\r\n');
    const obj=URL.createObjectURL(new Blob([text],{type:'text/calendar;charset=utf-8'}));const a=document.createElement('a');a.href=obj;a.download='Mission30-My-Events.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(obj),1500);toast('Personal events exported as an .ics calendar file.');
  }
  function install(){ROOT.querySelector('#cal-back').addEventListener('click',()=>window.M30.navigate('overview'));
    ROOT.querySelector('#cal-bottom-back').addEventListener('click',()=>window.M30.navigate('overview'));
    ROOT.querySelector('#cal-prev').addEventListener('click',()=>{if(state.view==='month'){state.anchor=addMonths(state.anchor,-1);state.selected=localISO(state.anchor)}else state.selected=localISO(addDays(makeDate(state.selected),-7));render();});
    ROOT.querySelector('#cal-next').addEventListener('click',()=>{if(state.view==='month'){state.anchor=addMonths(state.anchor,1);state.selected=localISO(state.anchor)}else state.selected=localISO(addDays(makeDate(state.selected),7));render();});
    ROOT.querySelector('#cal-today').addEventListener('click',()=>{state.selected=localISO(new Date());const d=makeDate(state.selected);state.anchor=new Date(d.getFullYear(),d.getMonth(),1);render();});
    ROOT.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{state.view=b.dataset.view;render();}));
    ROOT.querySelector('#cal-add').addEventListener('click',()=>openForm());ROOT.querySelector('#cal-toggle-demo').addEventListener('click',toggleDemo);
    ROOT.querySelector('#cal-export').addEventListener('click',exportICS);
    ROOT.querySelector('#cal-modal-close').addEventListener('click',closeForm);ROOT.querySelector('#cal-form-cancel').addEventListener('click',closeForm);
    ROOT.querySelector('#cal-modal').addEventListener('click',e=>{if(e.target.id==='cal-modal')closeForm();});
    ROOT.querySelector('#cal-event-form').addEventListener('submit',e=>{e.preventDefault();const id=ROOT.querySelector('#cal-edit-id').value,title=ROOT.querySelector('#cal-title-input').value.trim(),date=ROOT.querySelector('#cal-date-input').value,start=ROOT.querySelector('#cal-start-input').value,end=ROOT.querySelector('#cal-end-input').value,cat=ROOT.querySelector('#cal-category-input').value;
      if(!title||!date||!start||!end||mins(end)<=mins(start)){ROOT.querySelector('#cal-form-error').textContent='Please enter an event title, date, and an end time after the start time.';return;}
      const record={id:id||`ev-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title,date,start,end,cat};if(id){state.events=state.events.map(e=>e.id===id?record:e)}else state.events.push(record);
      state.selected=date;const d=makeDate(date);state.anchor=new Date(d.getFullYear(),d.getMonth(),1);persist();closeForm();render();toast(id?'Event updated in this browser.':'Your new event is on the calendar.');
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!ROOT.querySelector('#cal-modal').hidden)closeForm();});
  }
  restore();shell();install();render();
  window.M30Calendar={show(){ROOT.hidden=false;render();},hide(){ROOT.hidden=true;closeForm();},refresh(){render();}};
})();
