/* Mission 30 — Body Lab / procedural morphing 3D human-body diagnostics (offline, no libraries) */
(() => {
  'use strict';
  const template = () => `
  <section class="bl-shell" aria-label="Animated human body transformation explorer">
    <header class="bl-header"><div><div class="bl-overline">◈ SYS.04 / HUMAN TRANSFORMATION DIAGNOSTICS</div><h3 class="bl-title">HOLOGRAPHIC BODY REACTOR <span style="color:#50D9D0">// 0.3</span></h3></div><span class="bl-demo">SIMULATED SAMPLE · NOT YOUR BODY</span></header>
    <div class="bl-grid">
      <aside class="bl-side" aria-label="Body measurements and checkpoints">
        <div class="bl-sidehead">◈ TRANSFORMATION CHECKPOINTS</div>
        <div class="bl-stage-buttons" role="group" aria-label="Choose body stage">
          <button type="button" class="bl-stage" data-bl-stage="0"><b>01 / START</b><span>Baseline</span></button>
          <button type="button" class="bl-stage active" data-bl-stage="50"><b>02 / CURRENT</b><span>Checkpoint</span></button>
          <button type="button" class="bl-stage" data-bl-stage="100"><b>03 / GOAL</b><span>Preview</span></button>
        </div>
        <div class="bl-measure"><label for="bl-start-weight">START WEIGHT <span class="bl-unit">kg</span></label><input id="bl-start-weight" type="number" min="45" max="190" step="0.5" value="98" inputmode="decimal" /></div>
        <div class="bl-measure"><label for="bl-current-weight">CURRENT WEIGHT <span class="bl-unit">kg</span></label><input id="bl-current-weight" type="number" min="45" max="190" step="0.5" value="90" inputmode="decimal" /></div>
        <div class="bl-measure"><label for="bl-goal-weight">GOAL WEIGHT <span class="bl-unit">kg</span></label><input id="bl-goal-weight" type="number" min="45" max="190" step="0.5" value="76" inputmode="decimal" /></div>
        <div class="bl-sidehead">◈ WAIST MEASUREMENTS</div>
        <div class="bl-measure"><label for="bl-start-waist">START WAIST <span class="bl-unit">cm</span></label><input id="bl-start-waist" type="number" min="55" max="170" step="0.5" value="110" inputmode="decimal" /></div>
        <div class="bl-measure"><label for="bl-current-waist">CURRENT WAIST <span class="bl-unit">cm</span></label><input id="bl-current-waist" type="number" min="55" max="170" step="0.5" value="100" inputmode="decimal" /></div>
        <div class="bl-measure"><label for="bl-goal-waist">GOAL WAIST <span class="bl-unit">cm</span></label><input id="bl-goal-waist" type="number" min="55" max="170" step="0.5" value="84" inputmode="decimal" /></div>
        <p class="bl-editlegend">Sample measurements are saved locally in this browser when storage is permitted. They are not uploaded or synced.</p>
      </aside>
      <div class="bl-canvas-panel">
        <div class="bl-model-tag">SPECIMEN / PARAMETRIC 3D<br />SCAN ENGINE // ACTIVE</div>
        <div class="bl-view-controls" role="group" aria-label="Avatar angle"><button type="button" class="bl-view selected" data-bl-view="front">FRONT</button><button type="button" class="bl-view" data-bl-view="side">SIDE</button><button type="button" class="bl-view" data-bl-view="back">BACK</button></div>
        <canvas id="bl-canvas" role="img" aria-label="Interactive 3D-style human figure that morphs according to sample weight and waist measurements. Drag left or right to rotate." tabindex="0"></canvas>
        <div class="bl-scanline" aria-hidden="true"></div><div class="bl-gesture">⤧ DRAG TO ROTATE · CHANGE WEIGHT TO MORPH</div>
      </div>
      <aside class="bl-side" aria-label="Transformation output and energy">
        <div class="bl-sidehead">◈ VISUALIZATION READOUT</div>
        <div class="bl-readout"><span>SELECTED STAGE</span><strong id="bl-stage-readout">CURRENT</strong><small id="bl-stage-detail">Checkpoint preview</small></div>
        <div class="bl-readout"><span>MODEL WEIGHT</span><strong id="bl-weight-output">90.0 kg</strong><small>Entered or interpolated demo value</small></div>
        <div class="bl-readout"><span>MODEL WAIST</span><strong id="bl-waist-output">100.0 cm</strong><small>Waist influences the 3D torso geometry</small></div>
        <div class="bl-sidehead">◈ ENERGY AURA</div>
        <div class="bl-energy-line"><span>SELF-REPORTED ENERGY / DEMO</span><strong id="bl-energy-output">7 / 10</strong></div>
        <input class="bl-energy" type="range" id="bl-energy" min="1" max="10" step="1" value="7" aria-label="Demo energy level 1 to 10" />
        <div class="bl-energy-meter" id="bl-energy-meter" aria-hidden="true">${Array.from({length:10},()=>'<i></i>').join('')}</div>
        <label class="bl-toggle"><input type="checkbox" id="bl-compare" checked /> Show starting body comparison outline</label>
        <div class="bl-note" id="bl-insight">Change the timeline to watch the human model morph from the starting measurements to the goal preview.</div>
        <span class="bl-sample-tag">NOT APPLE HEALTH · NOT A MEDICAL SCAN</span>
      </aside>
    </div>
    <div class="bl-bottom"><div class="bl-bottom-head"><span>◈ TRANSFORMATION TIME MACHINE</span><span id="bl-timeline-value">CURRENT / 50%</span></div>
      <input class="bl-timeline" id="bl-timeline" type="range" min="0" max="100" step="1" value="50" aria-label="Morph between starting body, current body and goal preview" />
      <div class="bl-labels"><span>00 / START</span><span>50 / CURRENT</span><span>100 / GOAL</span></div>
      <small class="bl-legal">The figure is a stylized parametric 3D illustration, not a photographic prediction or body-fat assessment. Weight alone cannot determine body shape; this concept uses waist measurements for a more meaningful visual change. All values shown here are fictional example data until you choose to enter your own.</small>
    </div>
  </section>
  <div class="bl-secondary-charts" aria-label="Demo body measurement comparison charts">
    <div class="bl-mini-chart"><div class="bl-mini-head"><span>◈ WEIGHT CHANGE BY STAGE</span><small>DEMO VALUES</small></div><div id="bl-weight-graph"></div><div class="bl-mini-foot">START → CURRENT → GOAL / not historical measurements</div></div>
    <div class="bl-mini-chart"><div class="bl-mini-head"><span>◈ WAIST CHANGE BY STAGE</span><small>DEMO VALUES</small></div><div id="bl-waist-graph"></div><div class="bl-mini-foot">START → CURRENT → GOAL / not historical measurements</div></div>
  </div>`;
  const state = {sw:98,cw:90,gw:76,sa:110,ca:100,ga:84,energy:7,progress:50,yaw:0,targetYaw:0,ghost:true,shownWeight:90,shownWaist:100};
  const STORAGE_KEY='mission30-bodylab-demo-v031';
  function persist(){try{const stored={};for(const k of ['sw','cw','gw','sa','ca','ga','energy','progress','ghost'])stored[k]=state[k];localStorage.setItem(STORAGE_KEY,JSON.stringify(stored));}catch(_){/* local preview may deny storage */}}
  function restore(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!saved||typeof saved!=='object')return;const bounds={sw:[45,190],cw:[45,190],gw:[45,190],sa:[55,170],ca:[55,170],ga:[55,170],energy:[1,10],progress:[0,100]};for(const [k,[lo,hi]] of Object.entries(bounds)){const v=saved[k];if(typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi)state[k]=v;}if(typeof saved.ghost==='boolean')state.ghost=saved.ghost;state.shownWeight=state.cw;state.shownWaist=state.ca;}catch(_){}}
  restore();
  let canvas=null,ctx=null,raf=0,resizeObserver=null,frame=0,dragging=false,lastX=0;
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function measure(){
    const t=state.progress/100;
    if(t<=.5)return {w:mix(state.sw,state.cw,t*2),a:mix(state.sa,state.ca,t*2)};
    return {w:mix(state.cw,state.gw,(t-.5)*2),a:mix(state.ca,state.ga,(t-.5)*2)};
  }
  function label(){return state.progress===0?'START':state.progress===50?'CURRENT':state.progress===100?'GOAL':state.progress<50?'START → CURRENT':'CURRENT → GOAL';}
  function chartSVG(nums,unit){
    const min=Math.min(...nums)-6,max=Math.max(...nums)+6;
    const y=v=>96-70*(v-min)/Math.max(1,max-min);
    const pts=nums.map((v,i)=>[34+i*126,y(v)]);
    const pointStr=pts.map(([x,y])=>`${x},${y}`).join(' ');
    return `<svg viewBox="0 0 320 125" role="img" aria-label="Demo ${unit} values: start ${nums[0]}, current ${nums[1]}, goal ${nums[2]}"><defs><linearGradient id="blshade-${unit}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#50D9D0" stop-opacity=".29"/><stop offset="1" stop-color="#50D9D0" stop-opacity="0"/></linearGradient></defs>${[35,65,95].map(v=>`<path d="M14 ${v}H302" stroke="#344350" stroke-dasharray="3 5" fill="none"/>`).join('')}<polygon points="${pointStr} 286,99 34,99" fill="url(#blshade-${unit})"/><polyline points="${pointStr}" stroke="#71E5D8" stroke-width="2.5" fill="none"/>${pts.map(([x,pY],i)=>`<circle cx="${x}" cy="${pY}" r="4.5" fill="#121D2A" stroke="#7CEADD" stroke-width="2"/><text x="${x}" y="${pY-12}" text-anchor="middle" fill="#F0F2F4" font-size="12" font-weight="700">${nums[i].toFixed(1)}</text><text x="${x}" y="120" text-anchor="middle" fill="#9EAEBB" font-size="10">${['START','CURRENT','GOAL'][i]}</text>`).join('')}</svg>`;
  }
  function updateUI(){
    persist();
    const m=measure();
    $('#bl-weight-output').textContent=m.w.toFixed(1)+' kg'; $('#bl-waist-output').textContent=m.a.toFixed(1)+' cm';
    $('#bl-stage-readout').textContent=label();
    $('#bl-stage-detail').textContent=state.progress===100?'Illustrative goal, not a forecast':state.progress===0?'Starting sample measurements':state.progress===50?'Current sample measurements':'Interpolated sample measurements';
    $('#bl-timeline-value').textContent=label()+' / '+state.progress+'%';
    $('#bl-energy-output').textContent=state.energy+' / 10';
    $$('#bl-energy-meter i').forEach((el,i)=>el.classList.toggle('active',i<state.energy));
    $$('.bl-stage').forEach(el=>el.classList.toggle('active',Number(el.dataset.blStage)===state.progress));
    $('#bl-weight-graph').innerHTML=chartSVG([state.sw,state.cw,state.gw],'kg');
    $('#bl-waist-graph').innerHTML=chartSVG([state.sa,state.ca,state.ga],'cm');
    const energyLabel=state.energy<=3?'Low energy demo: a softer aura; rest and recovery matter.':state.energy<=7?'Moderate energy demo: a steady teal energy field.':'High energy demo: a brighter, more active teal aura.';
    $('#bl-insight').textContent=`${label()} view. ${m.w.toFixed(1)} kg / ${m.a.toFixed(1)} cm. ${energyLabel} The model is illustrative, not a clinical assessment.`;
  }
  function limb(points,segments,kind,faces){
    for(let j=0;j<points.length-1;j++)for(let k=0;k<segments;k++){
      const theta=k*Math.PI*2/segments,theta2=(k+1)*Math.PI*2/segments;
      const a=points[j],b=points[j+1];
      const vert=(p,t)=>({x:p.x+Math.cos(t)*p.rx,y:p.y,z:(p.z||0)+Math.sin(t)*p.rz});
      const v1=vert(a,theta),v2=vert(b,theta),v3=vert(b,theta2),v4=vert(a,theta2);
      faces.push({vs:[v1,v2,v3,v4],kind,theta:(theta+theta2)/2});
    }
  }
  function bodyMesh(w,waist,quality=16){
    const faces=[];
    const wFactor=clamp((w-72)/56,0,1); const aFactor=clamp((waist-72)/70,0,1);
    const ab=.34+.27*aFactor, chest=.45+.07*wFactor, hip=.38+.15*aFactor;
    const torso=[
      [1.49,.18,.16],[1.39,.33,.19],[1.32,chest,.215],[1.15,chest+.015,.245],[.96,.43+.05*wFactor,.24],[.78,ab+.025,.215+.08*aFactor],[.63,ab,.21+.095*aFactor],[.48,hip,.225+.07*aFactor],[.43,.32+.06*wFactor,.20+.06*aFactor]
    ].map(([y,rx,rz])=>({x:0,y,rx,rz,z:0}));
    limb(torso,quality,'torso',faces);
    const n=.07;
    limb([{x:0,y:1.50,rx:.145,rz:.13},{x:0,y:1.60,rx:.13,rz:.14}],quality,'neck',faces);
    const head=[]; const headCount=10;
    for(let i=0;i<=headCount;i++){
      const theta=Math.PI*i/headCount;
      head.push({x:0,y:1.82+Math.cos(theta)*.26,rx:Math.max(.006,Math.sin(theta)*(.205+.017*wFactor)),rz:Math.max(.006,Math.sin(theta)*(.21+.012*wFactor)),z:0});
    }
    limb(head,quality,'head',faces);
    [-1,1].forEach(side=>{
      const rr=.125+.048*wFactor;
      limb([
        {x:side*(chest+.003),y:1.30,z:0,rx:rr+.035,rz:rr+.012},
        {x:side*(chest+.095),y:1.13,z:0,rx:rr+.04,rz:rr+.02},
        {x:side*(chest+.18),y:.81,z:0,rx:rr,rz:rr},
        {x:side*(chest+.205),y:.68,z:0,rx:rr*.88,rz:rr*.88},
        {x:side*(chest+.23),y:.42,z:.014,rx:rr*.72,rz:rr*.74},
        {x:side*(chest+.245),y:.25,z:.023,rx:rr*.66,rz:rr*.7},
        {x:side*(chest+.25),y:.12,z:.029,rx:rr*.76,rz:rr*.8}
      ],quality,'arm',faces);
      const t=.205+.085*wFactor+.055*aFactor;
      limb([
        {x:side*.21,y:.48,z:0,rx:t+.05,rz:t+.025},
        {x:side*.23,y:.27,z:0,rx:t+.04,rz:t+.04},
        {x:side*.235,y:-.04,z:0,rx:t*.9,rz:t*.92},
        {x:side*.245,y:-.34,z:.02,rx:t*.73,rz:t*.78},
        {x:side*.252,y:-.52,z:.035,rx:t*.72,rz:t*.8},
        {x:side*.255,y:-.95,z:.04,rx:t*.52,rz:t*.56},
        {x:side*.255,y:-1.20,z:.045,rx:t*.46,rz:t*.46},
        {x:side*.255,y:-1.30,z:.11,rx:.13,rz:.24},
        {x:side*.255,y:-1.35,z:.145,rx:.12,rz:.16}
      ],quality,'leg',faces);
    });
    return faces;
  }
  const norm=(x,y,z)=>{const n=Math.hypot(x,y,z)||1;return{x:x/n,y:y/n,z:z/n}};
  function project(point,yaw,sc,cx,cy,breath){
    const cs=Math.cos(yaw),sn=Math.sin(yaw);
    const x=point.x*cs+point.z*sn;
    const z=point.z*cs-point.x*sn;
    const scale=5.5/(5.5-z);
    return {x:cx+x*sc*scale,y:cy-(point.y+breath)*sc*scale,z,scale};
  }
  function render(){
    if(!canvas||!canvas.isConnected)return;
    const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1){raf=requestAnimationFrame(render);return;}
    const dpr=Math.min(devicePixelRatio||1,2);const pw=Math.round(rect.width*dpr),ph=Math.round(rect.height*dpr);
    if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,rect.width,rect.height);
    const reduced=window.M30?.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!dragging){let delta=state.targetYaw-state.yaw;delta=(delta+Math.PI*2)%(Math.PI*2);if(delta>Math.PI)delta-=Math.PI*2;state.yaw+=delta*.10;}
    const dims=measure();
    state.shownWeight=mix(state.shownWeight,dims.w,reduced?1:.085);
    state.shownWaist=mix(state.shownWaist,dims.a,reduced?1:.085);
    const w=rect.width,h=rect.height,scale=Math.min(h*.255,w*.44),cx=w/2,cy=h*.51;
    const time=performance.now()/1000,breath=reduced?0:Math.sin(time*1.35)*.012;
    const glow=.18+state.energy*.06;
    ctx.save();
    // Ground rings and holographic horizon, drawn in perspective.
    const footY=cy+scale*1.37;
    for(let i=4;i>=1;i--){ctx.beginPath();ctx.ellipse(cx,footY,i*scale*.19,i*scale*.065,0,0,Math.PI*2);ctx.strokeStyle=`rgba(80,217,208,${.025+i*.012})`;ctx.lineWidth=.8;ctx.stroke();}
    ctx.fillStyle=`rgba(65,203,190,${.035+state.energy*.008})`;ctx.beginPath();ctx.ellipse(cx,footY,scale*.58,scale*.11,0,0,7);ctx.fill();
    // Vertical measurement marks.
    const xScale=cx+scale*.88;
    ctx.strokeStyle='#54747A55';ctx.lineWidth=1;ctx.setLineDash([2,6]);ctx.beginPath();ctx.moveTo(xScale,cy-scale*2.1);ctx.lineTo(xScale,footY);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<9;i++){let yy=cy-scale*1.95+i*scale*.42;ctx.strokeStyle='#54787D70';ctx.beginPath();ctx.moveTo(xScale-6,yy);ctx.lineTo(xScale+2,yy);ctx.stroke();}
    const geom=bodyMesh(state.shownWeight,state.shownWaist,window.M30?.lowPower?10:20);
    function drawMesh(mesh,yaw,ghost){
      const faces=mesh.map(f=>{
        const pts=f.vs.map(v=>project(v,yaw,scale,cx,cy,breath));
        const a=f.vs[0],b=f.vs[1],c=f.vs[2];
        const v1={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},v2={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};
        const n=norm(v1.y*v2.z-v1.z*v2.y,v1.z*v2.x-v1.x*v2.z,v1.x*v2.y-v1.y*v2.x);
        const nz=n.z*Math.cos(yaw)-n.x*Math.sin(yaw); const nx=n.x*Math.cos(yaw)+n.z*Math.sin(yaw);
        const lighting=clamp(.48+.35*nz+.16*nx,0,1);
        return {...f,pts,z:pts.reduce((n,p)=>n+p.z,0)/pts.length,light:lighting,nz};
      }).sort((a,b)=>a.z-b.z);
      ctx.save();
      for(const f of faces){
        if(ghost && f.nz<-.2)continue;
        ctx.beginPath();ctx.moveTo(f.pts[0].x,f.pts[0].y);for(let i=1;i<4;i++)ctx.lineTo(f.pts[i].x,f.pts[i].y);ctx.closePath();
        if(ghost){ctx.fillStyle='rgba(245,167,95,.008)';ctx.strokeStyle='rgba(247,174,112,.20)';ctx.lineWidth=.55;}
        else {
          const br=f.light;ctx.fillStyle=`rgba(${Math.round(21+br*55)},${Math.round(96+br*119)},${Math.round(102+br*104)},${(.55+.20*br).toFixed(3)})`;
          ctx.strokeStyle=`rgba(128,237,213,${(.06+.13*br).toFixed(3)})`;ctx.lineWidth=.35;
        }
        ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }
    if(state.ghost && state.progress>3){drawMesh(bodyMesh(state.sw,state.sa,14),state.yaw,true);}
    // Dynamic energy aura, explicitly driven by sample energy input.
    if(!reduced){const pulse=Math.sin(time*(1.05+state.energy*.19))*0.5+0.5;ctx.strokeStyle=`rgba(80,217,208,${glow*.10+pulse*.06})`;ctx.lineWidth=3+state.energy*.37;ctx.shadowColor='#50D9D0';ctx.shadowBlur=8+state.energy*2;ctx.beginPath();ctx.ellipse(cx,cy-scale*.30,scale*(.58+state.energy*.018),scale*1.7,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
    drawMesh(geom,state.yaw,false);
    // Dynamic scan core on chest.
    const p=project({x:0,y:1.08,z:.25},state.yaw,scale,cx,cy,breath);
    ctx.beginPath();ctx.arc(p.x,p.y,3.8,0,7);ctx.fillStyle='#C9F7EC';ctx.shadowBlur=12+state.energy;ctx.shadowColor='#50D9D0';ctx.fill();ctx.shadowBlur=0;
    const labelX=cx+Math.min(132,w*.31),labelY=cy-scale*.9;
    if(w>380){ctx.strokeStyle='#50D9D077';ctx.beginPath();ctx.moveTo(p.x+10,p.y-9);ctx.lineTo(labelX-12,labelY);ctx.lineTo(labelX+3,labelY);ctx.stroke();ctx.fillStyle='#9CC9C2';ctx.font='10px ui-monospace,monospace';ctx.fillText('BIOMETRIC',labelX-5,labelY-8);ctx.fillStyle='#E5F9F1';ctx.fillText(state.shownWeight.toFixed(1)+' KG',labelX-5,labelY+14);}
    ctx.restore();frame++;raf=requestAnimationFrame(render);
  }
  function onPointerDown(e){dragging=true;lastX=e.clientX;canvas.setPointerCapture?.(e.pointerId);}
  function onPointerMove(e){if(!dragging)return;const d=e.clientX-lastX;lastX=e.clientX;state.yaw+=d*.012;state.targetYaw=state.yaw;}
  function onPointerUp(){dragging=false;}
  const KEYS={'bl-start-weight':['sw',45,190],'bl-current-weight':['cw',45,190],'bl-goal-weight':['gw',45,190],'bl-start-waist':['sa',55,170],'bl-current-waist':['ca',55,170],'bl-goal-waist':['ga',55,170]};
  function mount(){
    canvas=$('#bl-canvas');if(!canvas)return;ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
    for(const [id,[key]] of Object.entries(KEYS)){$('#'+id).value=String(state[key]);}
    $('#bl-energy').value=String(state.energy);$('#bl-timeline').value=String(state.progress);$('#bl-compare').checked=state.ghost;
    $$('.bl-stage').forEach(b=>b.onclick=()=>{state.progress=Number(b.dataset.blStage);$('#bl-timeline').value=state.progress;updateUI();});
    for(const [id,[key,min,max]] of Object.entries(KEYS)){$('#'+id).addEventListener('input',e=>{const val=Number(e.target.value);if(Number.isFinite(val)&&val>=min&&val<=max){state[key]=val;updateUI();}});}
    $('#bl-energy').oninput=e=>{state.energy=Number(e.target.value);updateUI();};
    $('#bl-timeline').oninput=e=>{state.progress=Number(e.target.value);updateUI();};
    $('#bl-compare').onchange=e=>{state.ghost=e.target.checked;persist();};
    $$('.bl-view').forEach(el=>el.onclick=()=>{const mode=el.dataset.blView;state.targetYaw=mode==='side'?Math.PI/2:mode==='back'?Math.PI*2:0;$$('.bl-view').forEach(b=>b.classList.toggle('selected',b===el));});
    canvas.addEventListener('pointerdown',onPointerDown);canvas.addEventListener('pointermove',onPointerMove);canvas.addEventListener('pointerup',onPointerUp);canvas.addEventListener('pointercancel',onPointerUp);
    canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();state.targetYaw+=e.key==='ArrowLeft'?-Math.PI/12:Math.PI/12;}});
    updateUI();cancelAnimationFrame(raf);raf=requestAnimationFrame(render);
  }
  function unmount(){cancelAnimationFrame(raf);canvas=null;ctx=null;dragging=false;}
  window.M30BodyLab={markup:template,mount,unmount};
})();
