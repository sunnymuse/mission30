/* Mission 30 — Data Vault V0.6. Owner-scoped Supabase sync OR labeled local sandbox. */
(() => {
  'use strict';
  const root = document.getElementById('vault-workspace');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const LOCAL_KEY = 'mission30.v06.sandbox.records';
  const metrics = {
    weight_kg: {title:'Body weight', unit:'kg', group:'fitness', min:25, max:350, precision:1, accent:'#50D9D0'},
    waist_cm: {title:'Waist', unit:'cm', group:'fitness', min:30, max:250, precision:1, accent:'#50D9D0'},
    sleep_hours: {title:'Sleep duration', unit:'hours', group:'fitness', min:0, max:24, precision:1, accent:'#50D9D0'},
    gym_sessions: {title:'Gym sessions', unit:'sessions/day', group:'fitness', min:0, max:5, precision:0, accent:'#50D9D0'},
    debt_balance_usd: {title:'Total debt balance', unit:'USD', group:'finance', min:0, max:10000000, precision:2, accent:'#F3B96B'},
    emergency_fund_usd: {title:'Emergency savings', unit:'USD', group:'finance', min:0, max:10000000, precision:2, accent:'#F3B96B'},
    monthly_spending_usd: {title:'Monthly spending', unit:'USD', group:'finance', min:0, max:10000000, precision:2, accent:'#F3B96B'},
    credit_score: {title:'Credit score (dated report)', unit:'points', group:'credit', min:300, max:850, precision:0, accent:'#F3B96B'},
    learning_hours: {title:'Personal learning', unit:'hours', group:'career', min:0, max:24, precision:1, accent:'#A594EE'},
    energy_score: {title:'Self-rated energy', unit:'1–10', group:'discipline', min:1, max:10, precision:0, accent:'#A594EE'}
  };
  const state = { mode:'sandbox', cloud:null, user:null, entries:[], selected:'weight_kg', chart:'weight_kg', busy:false, cloudError:'', localOK:true };
  const escape = t => String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d=new Date(); const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`; };
  const msg = t=>window.M30?.toast?.(t);
  const currency = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const format = (metric, v) => {
    if (metric.endsWith('_usd')) return currency(v);
    return `${Number(v).toFixed(metrics[metric].precision)}${metric==='credit_score'?'':metric==='energy_score'?'/10':` ${metrics[metric].unit}`}`;
  };
  const prettyDate = s => new Date(`${s}T12:00:00`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const optionHTML = (selected)=>Object.entries(metrics).map(([key,m])=>`<option value="${key}" ${key===selected?'selected':''}>${m.title}</option>`).join('');
  const status = ()=>state.mode==='cloud'?(state.user?`CLOUD SYNC · ${state.user.email}`:'CLOUD ACCOUNT · SIGN IN REQUIRED'):'LOCAL SANDBOX · NOT PRIVATE CLOUD STORAGE';
  function setStatus(){
    const chip=document.getElementById('data-mode-chip'),strip=document.getElementById('data-mode-strip');
    if(chip){chip.textContent=state.mode==='cloud'&&state.user?'● CLOUD CONNECTED':'● '+(state.mode==='cloud'?'SIGN IN REQUIRED':'LOCAL SANDBOX');}
    if(strip)strip.innerHTML=`<span class="mini-status"></span> ${state.mode==='cloud'&&state.user?'SYNC ACTIVE':state.mode==='cloud'?'NOT SIGNED IN':'LOCAL SANDBOX'}`;
    document.querySelector('.rail-footer span:last-child').textContent=state.mode==='cloud'&&state.user?'PRIVATE CLOUD':'LOCAL PROTOTYPE';
  }
  function localLoad(){
    try { const raw=localStorage.getItem(LOCAL_KEY);const parsed=raw?JSON.parse(raw):[];state.entries=Array.isArray(parsed)?parsed.filter(isValid).slice(0,1000):[]; }
    catch(e){state.entries=[];state.localOK=false;}
  }
  function localSave(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(state.entries));state.localOK=true;}catch(e){state.localOK=false;msg('Browser storage is blocked. Entries will not persist after reload.');}}
  function isValid(e){return !!e && typeof e.id==='string' && !!metrics[e.metric] && typeof e.value==='number' && Number.isFinite(e.value) && typeof e.recorded_on==='string' && /^\d{4}-\d{2}-\d{2}$/.test(e.recorded_on);}
  async function initCloud(){
    const c=window.M30_CONFIG||{};
    // Preview deployment cannot enable external account access.
    state.mode='sandbox';state.entries=[];setStatus();return;
    /* Cloud integration intentionally excluded from this preview. */
  }

  async function pull(){
    if(!state.cloud||!state.user)return;
    const requestUserId=state.user.id;
    const {data,error}=await state.cloud.from('mission_entries').select('id,metric,value,recorded_on,created_at').order('recorded_on',{ascending:false}).order('created_at',{ascending:false}).limit(500);
    if(state.user?.id!==requestUserId)return;
    if(error){state.cloudError=error.message;msg('Cloud sync failed. Review RLS setup and SQL migration.');return;}
    state.cloudError='';state.entries=(data||[]).filter(isValid);render();if(window.M30?.active!=='vault' && window.M30?.active!=='overview')attachToAnalytics(window.M30.active);
  }
  function latest(metric){return [...state.entries].filter(x=>x.metric===metric).sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)||String(b.created_at||'').localeCompare(String(a.created_at||'')))[0]||null;}
  function cards(){
    const important=['weight_kg','debt_balance_usd','emergency_fund_usd','learning_hours'];
    return important.map(metric=>{const x=latest(metric),m=metrics[metric];return `<div class="vault-stat" style="--stat-accent:${m.accent}"><span>${escape(m.title.toUpperCase())}</span><strong>${x?escape(format(metric,x.value)):'—'}</strong><small>${x?`Manual entry · ${prettyDate(x.recorded_on)}`:'Not recorded yet'}</small></div>`}).join('');
  }
  function chartSVG(){
    const metric=state.chart,m=metrics[metric];const arr=state.entries.filter(x=>x.metric===metric).sort((a,b)=>a.recorded_on.localeCompare(b.recorded_on)||String(a.created_at||'').localeCompare(String(b.created_at||''))).slice(-18);
    if(!arr.length)return `<div class="vault-no-data"><span>◇</span><p>No recorded ${escape(m.title.toLowerCase())} measurements yet.</p><small>Save a dated entry to start a real progress trend. No fake data will appear here.</small></div>`;
    const W=700,H=250,L=55,R=677,T=22,B=209,min=Math.min(...arr.map(x=>x.value)),max=Math.max(...arr.map(x=>x.value));
    const spread=Math.max(max-min,Math.abs(max)*.12,1),lo=Math.max(0,min-spread*.3),hi=max+spread*.3;
    const x=i=>L+(R-L)*(arr.length===1?.5:i/(arr.length-1));
    const y=v=>B-(v-lo)/(hi-lo)*(B-T);
    const grid=Array.from({length:4},(_,i)=>{let v=hi-(hi-lo)*i/3, yy=y(v);return `<path d="M${L},${yy}H${R}" stroke="#394858" stroke-dasharray="4 6" opacity=".75"/><text x="${L-9}" y="${yy+4}" fill="#A0ADBA" font-size="11" text-anchor="end">${Number(v.toFixed(1))}</text>`}).join('');
    const path=arr.map((a,i)=>`${i?'L':'M'}${x(i)},${y(a.value)}`).join(' ');
    const points=arr.map((a,i)=>`<circle cx="${x(i)}" cy="${y(a.value)}" r="5" fill="#0B1019" stroke="${m.accent}" stroke-width="2"><title>${prettyDate(a.recorded_on)} · ${format(metric,a.value)}</title></circle>`).join('');
    const axis=arr.filter((a,i)=>i===0||i===arr.length-1||((arr.length<7)&&i%2===0)).map((a)=>{const i=arr.indexOf(a);return `<text x="${x(i)}" y="233" fill="#91A2B1" font-size="11" text-anchor="middle">${a.recorded_on.slice(5)}</text>`}).join('');
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Recorded ${escape(m.title)} trend with ${arr.length} measurements"><defs><linearGradient id="vault-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${m.accent}" stop-opacity=".26"/><stop offset="1" stop-color="${m.accent}" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${path} L${x(arr.length-1)},${B} L${x(0)},${B}Z" fill="url(#vault-grad)"/><path d="${path}" fill="none" stroke="${m.accent}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${points}${axis}</svg>`;
  }
  function logHTML(){
    const arr=[...state.entries].sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)||String(b.created_at||'').localeCompare(String(a.created_at||''))).slice(0,10);
    if(!arr.length)return '<p class="vault-empty">No measurements yet. Your personal data starts empty.</p>';
    return arr.map(e=>`<div class="vault-log-row"><span><b>${escape(metrics[e.metric].title)}</b><small>${prettyDate(e.recorded_on)} · MANUAL</small></span><strong>${escape(format(e.metric,e.value))}</strong><button class="vault-delete" data-id="${escape(e.id)}" type="button" aria-label="Delete ${escape(metrics[e.metric].title)} recorded ${prettyDate(e.recorded_on)}" title="Delete record">×</button></div>`).join('');
  }
  const loggedIn = ()=>false;
  function render(){
    setStatus();
    root.hidden=window.M30?.active!=='vault';
    if(root.hidden)return;
    const cloudConnected=state.mode==='cloud';
    root.innerHTML=`<div class="vault-page">
      <div class="vault-hero"><div><div class="vault-kicker">SYS.08 / SECURE DATA CORE</div><h2>DATA <em>VAULT</em></h2><p>Preview your Mission 30 dashboard. Private records and account imports are disabled in this deployment.</p></div><div class="vault-hero-orb" aria-hidden="true">▥</div></div>
      <div class="vault-banner ${cloudConnected?(state.user?'cloud':'locked'):'sandbox'}"><div><strong>${escape(status())}</strong><p>${cloudConnected?(state.user?'Data is stored in your authenticated, user-scoped Supabase database.':'Sign in with your email to unlock private cloud records. No personal records are displayed while signed out.'):'DEMO ONLY: measurement entry, cloud sign-in and automatic imports are disabled. Body Lab and calendar demo controls use browser-local storage; use fictional values only.'}</p>${state.cloudError?`<p class="vault-error">${escape(state.cloudError)}</p>`:''}</div>${cloudConnected?`<div class="vault-auth">${state.user?`<button type="button" id="vault-signout">SIGN OUT</button><button type="button" id="vault-sync">↻ SYNC</button>`:`<form id="vault-login"><label for="vault-email">YOUR EMAIL</label><div><input id="vault-email" required type="email" autocomplete="email" placeholder="you@example.com"/><button type="submit">EMAIL SIGN-IN LINK</button></div></form>`}</div>`:'<span class="vault-mode-icon">◇</span>'}</div>
      ${loggedIn()?`<div class="vault-stat-grid">${cards()}</div><div class="vault-grid"><section class="vault-panel"><div class="vault-panel-heading"><span>01 / RECORD MEASUREMENT</span><strong>MANUAL SOURCE</strong></div><form id="vault-form" class="vault-form"><label>Metric<select name="metric" id="vault-metric">${optionHTML(state.selected)}</select></label><label>Value <span id="vault-unit">${escape(metrics[state.selected].unit)}</span><input type="number" inputmode="decimal" name="value" id="vault-value" required step="any" placeholder="Enter measured value"/></label><label>Recorded date<input type="date" name="recorded_on" id="vault-date" required max="${today()}" value="${today()}"/></label><button type="submit" class="vault-save">＋ SAVE ENTRY <span>↗</span></button></form><p class="vault-footnote">Use confirmed values, not estimates. Updates create a new dated record; they do not erase history. ${state.mode==='sandbox'?'This is a local-only demonstration.':''}</p></section>
      <section class="vault-panel vault-trend"><div class="vault-panel-heading"><span>02 / REAL MEASUREMENT HISTORY</span><select id="vault-chart-select" aria-label="Choose trend metric">${optionHTML(state.chart)}</select></div><div class="vault-chart">${chartSVG()}</div><p class="vault-footnote">Recorded entries only. No projections, invented progress, or account sync are used.</p></section></div>
      <section class="vault-panel vault-log"><div class="vault-panel-heading"><span>03 / RECENT RECORDS</span><div><button type="button" id="vault-export">↓ EXPORT CSV</button><small>LATEST 10 DISPLAYED ${state.mode==='cloud'?' / UP TO 500 LOADED':''}</small></div></div><div id="vault-records">${logHTML()}</div></section>`:
      `<div class="vault-locked-screen"><span>⌑</span><h3>PERSONAL DATA LOCKED</h3><p>Private data entry is disabled in this preview. Secure login and authorized integrations will be added separately.</p></div>`}
      <div class="vault-bottom"><button type="button" id="vault-home">← RETURN TO MISSION COMMAND</button><span>MISSION 30 / V0.6 · ${state.mode==='cloud'?'SUPABASE CLOUD MODE':'LOCAL SANDBOX MODE'}</span></div>
    </div>`;
    $('#vault-home').onclick=()=>window.M30.navigate('overview');
    if(cloudConnected){
      if(state.user){$('#vault-signout').onclick=signOut;$('#vault-sync').onclick=()=>pull();}
      else $('#vault-login').addEventListener('submit',signIn);
    }
    if(!loggedIn())return;
    $('#vault-metric').addEventListener('change',e=>{state.selected=e.target.value;$('#vault-unit').textContent=metrics[state.selected].unit;});
    $('#vault-chart-select').addEventListener('change',e=>{state.chart=e.target.value;render();});
    $('#vault-form').addEventListener('submit',submit);
    $('#vault-export').onclick=exportCSV;
    root.querySelectorAll('.vault-delete').forEach(b=>b.addEventListener('click',()=>remove(b.dataset.id)));
  }
  async function signIn(ev){ev.preventDefault();if(!state.cloud)return;const email=$('#vault-email').value.trim();if(!email)return;
    const btn=$('#vault-login button');btn.disabled=true;btn.textContent='SENDING…';
    const {error}=await state.cloud.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname+'#/vault'}});
    if(error){msg('Sign-in could not be sent: '+error.message);btn.disabled=false;btn.textContent='EMAIL SIGN-IN LINK';return;}
    msg('Check your email for your sign-in link.');btn.disabled=false;btn.textContent='EMAIL SIGN-IN LINK';
  }
  async function signOut(){if(!state.cloud)return;const {error}=await state.cloud.auth.signOut({scope:'local'});if(error){msg('Sign out failed');return;}state.entries=[];state.user=null;document.querySelectorAll('.vault-linked-panel').forEach(e=>e.remove());render();msg('Signed out of this browser.');}
  async function submit(ev){ev.preventDefault();return; /* Disabled in preview. */
    if(state.busy)return;
    const metric=$('#vault-metric').value, m=metrics[metric],raw=$('#vault-value').value,recorded_on=$('#vault-date').value;
    const value=Number(raw);
    if(!m||!raw.trim()||!Number.isFinite(value)||value<m.min||value>m.max||!/^\d{4}-\d{2}-\d{2}$/.test(recorded_on)||recorded_on>today()||(m.precision===0&&!Number.isInteger(value))){msg(`Enter a valid ${m?.title||'metric'} value and date.`);return;}
    state.busy=true;const b=$('.vault-save');b.disabled=true;b.textContent='SAVING…';
    const entry={metric,value,recorded_on};
    if(state.mode==='cloud'){
      const {data,error}=await state.cloud.from('mission_entries').insert({...entry,user_id:state.user.id}).select('id,metric,value,recorded_on,created_at').single();
      if(error){msg('Cloud save failed: '+error.message);state.busy=false;b.disabled=false;b.textContent='＋ SAVE ENTRY ↗';return;}
      state.entries.unshift(data);
    }else{state.entries.unshift({...entry,id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),created_at:new Date().toISOString()});localSave();}
    state.chart=metric;state.busy=false;render();msg(state.mode==='sandbox'?(state.localOK?'Entry saved in this browser sandbox.':'Entry recorded temporarily, but browser storage is blocked.'):'Entry saved to your private cloud account.');
  }
  async function remove(id){return; /* Disabled in preview. */
    if(!window.confirm('Delete this recorded measurement? This cannot be undone.'))return;
    if(state.mode==='cloud'){
      const {error}=await state.cloud.from('mission_entries').delete().eq('id',id).eq('user_id',state.user.id);
      if(error){msg('Delete failed: '+error.message);return;}
    }
    state.entries=state.entries.filter(x=>x.id!==id);
    if(state.mode==='sandbox')localSave();render();msg('Entry deleted.');
  }
  function exportCSV(){return; /* Disabled in preview. */
    const lines=[['recorded_on','metric','value','unit','source']];
    const rows=[...state.entries].sort((a,b)=>a.recorded_on.localeCompare(b.recorded_on));
    rows.forEach(x=>lines.push([x.recorded_on,x.metric,String(x.value),metrics[x.metric].unit,'manual']));
    const csv=lines.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='mission30-measurements.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    msg('Measurements exported to CSV. Store securely.');
  }
  function attachToAnalytics(id){
    const workspace=document.getElementById('analytics-workspace');
    if(!workspace || workspace.hidden) return;
    workspace.querySelector('.vault-linked-panel')?.remove();
    const group=id;
    const list=Object.keys(metrics).filter(key=>metrics[key].group===group).map(metric=>({metric,entry:latest(metric)})).filter(x=>x.entry);
    const section=document.createElement('section');section.className='vault-linked-panel';
    const showReal=state.mode==='sandbox'?'LOCAL SANDBOX ENTRIES':state.user?'PRIVATE CLOUD ENTRIES':'SIGN IN TO SEE YOUR DATA';
    section.innerHTML=`<div><small>◈ ${showReal}</small><h3>${list.length?'DEMO MEASUREMENTS':'NO REAL MEASUREMENTS YET'}</h3><p>${list.length?'Manual records, dated and distinct from the simulated example graphs below.':'The charts below are clearly marked demonstrations. You can begin your real progress history in Data Vault.'}</p></div><div class="vault-linked-values">${list.slice(0,4).map(({metric,entry})=>`<div><small>${escape(metrics[metric].title)}</small><strong>${escape(format(metric,entry.value))}</strong><span>${prettyDate(entry.recorded_on)} · MANUAL</span></div>`).join('')}</div><button type="button" id="vault-go-from-module">${list.length?'VIEW HISTORY + ADD ENTRY':'OPEN DATA VAULT'} ↗</button>`;
    const kpis=workspace.querySelector('.an-kpis');
    kpis?.insertAdjacentElement('afterend',section);
    section.querySelector('#vault-go-from-module')?.addEventListener('click',()=>window.M30.navigate('vault'));
  }
  window.M30Vault={attachToAnalytics,show:render,hide:()=>{root.hidden=true;root.innerHTML='';},refresh:async()=>{if(state.mode==='cloud'&&state.user)await pull();else render();},latest, getEntries:()=>[...state.entries], mode:()=>state.mode};
  initCloud().then(()=>{if(window.M30?.active==='vault')render();});
})();
