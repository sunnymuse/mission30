/* MISSION 30 holographic reactor — genuine GPU-rendered 3D using the WebGL API.
   Dependency-free, offline-capable, no external code, data collection, or network calls. */
(() => {
  'use strict';
  const canvas=document.getElementById('reactor'), container=document.getElementById('core-space');
  const fallback=document.getElementById('reactor-fallback');
  if(!canvas||!container)return;
  let gl;
  try {gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:'low-power'});}
  catch(e){}
  if(!gl){canvas.hidden=true;fallback.hidden=false;document.getElementById('interaction-hint').textContent='3D UNAVAILABLE · ANIMATED FALLBACK';return;}
  const vs=`attribute vec3 p; attribute vec3 n;
    uniform mat4 mvp;uniform mat4 model;
    varying float face;varying float glowFactor;
    void main(){vec3 N=normalize((model*vec4(n,0.0)).xyz);face=abs(N.z);glowFactor=0.68+0.32*clamp(N.y*0.5+0.5,0.0,1.0);gl_Position=mvp*vec4(p,1.0);}`;
  const fs=`precision mediump float;
    uniform vec3 tint;uniform float alpha;uniform float time;
    varying float face;varying float glowFactor;
    void main(){float fres=pow(1.0-clamp(face,0.0,1.0),1.35);
      float energy=0.84+0.16*sin(time*2.1+gl_FragCoord.y*0.025);
      vec3 col=tint*(0.65+0.78*fres)*glowFactor*energy;
      gl_FragColor=vec4(col,alpha*(0.42+0.6*fres));}`;
  const pvs=`attribute vec3 p;uniform mat4 mvp;uniform float pointSize;varying float vFade;
    void main(){vec4 q=mvp*vec4(p,1.0);gl_Position=q;gl_PointSize=pointSize*(1.5+clamp(2.0-q.z/q.w,0.0,1.8));vFade=0.5+0.5*abs(p.z)/4.0;}`;
  const pfs=`precision mediump float;uniform vec3 tint;varying float vFade;
    void main(){float r=length(gl_PointCoord-vec2(0.5));if(r>0.5)discard;
    float a=pow(1.0-r*2.0,2.2);gl_FragColor=vec4(tint,a*0.55*vFade);}`;
  function compileShader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  function program(v,f){const p=gl.createProgram();gl.attachShader(p,compileShader(gl.VERTEX_SHADER,v));gl.attachShader(p,compileShader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p}
  let prog,particlesProg;
  try{prog=program(vs,fs);particlesProg=program(pvs,pfs)}catch(e){console.warn('WebGL shader failed',e);canvas.hidden=true;fallback.hidden=false;return}
  const loc={p:gl.getAttribLocation(prog,'p'),n:gl.getAttribLocation(prog,'n'),mvp:gl.getUniformLocation(prog,'mvp'),model:gl.getUniformLocation(prog,'model'),tint:gl.getUniformLocation(prog,'tint'),alpha:gl.getUniformLocation(prog,'alpha'),time:gl.getUniformLocation(prog,'time')};
  const ploc={p:gl.getAttribLocation(particlesProg,'p'),mvp:gl.getUniformLocation(particlesProg,'mvp'),tint:gl.getUniformLocation(particlesProg,'tint'),size:gl.getUniformLocation(particlesProg,'pointSize')};
  const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  const mul=(a,b)=>{const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o};
  const rx=t=>new Float32Array([1,0,0,0,0,Math.cos(t),Math.sin(t),0,0,-Math.sin(t),Math.cos(t),0,0,0,0,1]);
  const ry=t=>new Float32Array([Math.cos(t),0,-Math.sin(t),0,0,1,0,0,Math.sin(t),0,Math.cos(t),0,0,0,0,1]);
  const rz=t=>new Float32Array([Math.cos(t),Math.sin(t),0,0,-Math.sin(t),Math.cos(t),0,0,0,0,1,0,0,0,0,1]);
  const translate=(x,y,z)=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,x,y,z,1]);
  function projection(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0])}
  function torus(R,r,start,arc=2*Math.PI,tubeSeg=8,ringSeg=128){const points=[],normals=[],indices=[];
    for(let a=0;a<=ringSeg;a++){const u=start+arc*a/ringSeg,cu=Math.cos(u),su=Math.sin(u);
      for(let b=0;b<=tubeSeg;b++){const v=2*Math.PI*b/tubeSeg,cv=Math.cos(v),sv=Math.sin(v);
        points.push((R+r*cv)*cu,(R+r*cv)*su,r*sv);normals.push(cv*cu,cv*su,sv)}}
    for(let a=0;a<ringSeg;a++)for(let b=0;b<tubeSeg;b++){const i=a*(tubeSeg+1)+b,j=i+tubeSeg+1;indices.push(i,j,i+1,j,j+1,i+1)}
    return{points,normals,indices};}
  function sphere(radius=0.72,stacks=20,slices=36){const points=[],normals=[],indices=[];for(let j=0;j<=stacks;j++){let v=j/stacks*Math.PI;for(let i=0;i<=slices;i++){let u=i/slices*2*Math.PI;let x=Math.sin(v)*Math.cos(u),y=Math.cos(v),z=Math.sin(v)*Math.sin(u);points.push(x*radius,y*radius,z*radius);normals.push(x,y,z)}}for(let j=0;j<stacks;j++)for(let i=0;i<slices;i++){let a=j*(slices+1)+i,b=a+slices+1;indices.push(a,b,a+1,b,b+1,a+1)}return{points,normals,indices}}
  function upload(geom){const obj={};obj.p=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,obj.p);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geom.points),gl.STATIC_DRAW);obj.n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,obj.n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geom.normals),gl.STATIC_DRAW);obj.ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,obj.ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(geom.indices),gl.STATIC_DRAW);obj.count=geom.indices.length;return obj}
  const ringDefs=[
    {R:1.86,r:.010,start:0,len:6.28,x:1.07,y:.20,s:.20,speed:.045,a:.29,off:.3},
    {R:1.63,r:.015,start:0.26,len:5.67,x:.35,y:.50,s:-.11,speed:.093,a:.85,off:.15},
    {R:1.46,r:.030,start:.12,len:5.55,x:1.02,y:-.35,s:.31,speed:-.14,a:.87,off:1.1},
    {R:1.29,r:.016,start:0.2,len:4.93,x:-.61,y:.92,s:-.21,speed:.135,a:.65,off:2.2},
    {R:1.10,r:.027,start:.65,len:4.77,x:1.18,y:.22,s:-.34,speed:-.16,a:.78,off:2.8},
    {R:.94,r:.012,start:0.02,len:5.87,x:-.2,y:.88,s:0.1,speed:.2,a:.75,off:.5},
    {R:2.02,r:.007,start:0.7,len:4.18,x:.65,y:1.32,s:.16,speed:-.082,a:.25,off:2.1}
  ];
  const rings=ringDefs.map(d=>({...d,buffer:upload(torus(d.R,d.r,d.start,d.len,8,128))}));
  const orb=upload(sphere());
  const rand=(()=>{let a=825433;return()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296}})();
  const stars=[];for(let i=0;i<230;i++){const r=2.1+2.2*rand(),theta=rand()*2*Math.PI,z=(rand()*2-1);const v=Math.sqrt(1-z*z);stars.push(r*v*Math.cos(theta),r*v*Math.sin(theta),r*z)}
  const starBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(stars),gl.STATIC_DRAW);
  const defaultColor=[243/255,185/255,107/255];let color=[...defaultColor],targetColor=[...defaultColor];
  let dragX=0,dragY=0,px=0,py=0,dragging=false,hoverX=0,hoverY=0,systemFocused=false;
  let canvasW=0,canvasH=0,dpr=1,frame=0,lastDraw=0,started=performance.now();
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
  function resize(){
    const rect=container.getBoundingClientRect();
    canvasW=Math.max(1,Math.floor(rect.width));canvasH=Math.max(1,Math.floor(rect.height));
    dpr=Math.min(window.devicePixelRatio||1,window.M30?.lowPower?1:1.75);
    canvas.width=Math.max(1,Math.floor(canvasW*dpr));canvas.height=Math.max(1,Math.floor(canvasH*dpr));
    canvas.style.width=canvasW+'px';canvas.style.height=canvasH+'px';gl.viewport(0,0,canvas.width,canvas.height);
  }
  resize();new ResizeObserver(resize).observe(container);window.addEventListener('resize',resize);
  function drawMesh(buffer,model,viewProj,tint,alpha,time){
    gl.useProgram(prog);gl.bindBuffer(gl.ARRAY_BUFFER,buffer.p);gl.enableVertexAttribArray(loc.p);gl.vertexAttribPointer(loc.p,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer.n);gl.enableVertexAttribArray(loc.n);gl.vertexAttribPointer(loc.n,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffer.ibo);gl.uniformMatrix4fv(loc.model,false,model);gl.uniformMatrix4fv(loc.mvp,false,mul(viewProj,model));gl.uniform3fv(loc.tint,tint);gl.uniform1f(loc.alpha,alpha);gl.uniform1f(loc.time,time);gl.drawElements(gl.TRIANGLES,buffer.count,gl.UNSIGNED_SHORT,0);
  }
  function animate(t){
    requestAnimationFrame(animate);
    if(document.hidden || container.offsetWidth===0)return;
    const paused=window.M30?.reducedMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minGap=paused?1000:window.M30?.lowPower?33:16;
    if(t-lastDraw<minGap)return;lastDraw=t;
    frame++;
    for(let k=0;k<3;k++)color[k]+=(targetColor[k]-color[k])*.075;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const time=paused?0:(t-started)*.001;
    const aspect=Math.max(.01,canvasW/canvasH),proj=projection(Math.PI/4.1,aspect,.1,100);
    const distance=aspect<.85?8.75:7.75;
    const view=translate(0,0,-distance),viewProj=mul(proj,view);
    const rot=mul(ry(dragY+hoverX*.15+time*.027),rx(dragX+hoverY*.14+Math.sin(time*.23)*.055));
    // The halo consists of actual 3D torus meshes under perspective projection.
    const innerTint=color.map(v=>Math.min(1,v*1.22));
    drawMesh(orb,mul(rot,ry(time*.04)),viewProj,color,.105,time);
    for(let i=0;i<rings.length;i++){
      const d=rings[i];let m=mul(rot,rx(d.x));m=mul(m,ry(d.y+time*d.speed));m=mul(m,rz(d.s+time*d.speed*.60+d.off));
      drawMesh(d.buffer,m,viewProj,i%3===0?innerTint:color,d.a,time);
    }
    gl.useProgram(particlesProg);
    gl.bindBuffer(gl.ARRAY_BUFFER,starBuffer);gl.enableVertexAttribArray(ploc.p);gl.vertexAttribPointer(ploc.p,3,gl.FLOAT,false,0,0);
    const m=mul(viewProj,mul(rot,ry(time*.004)));
    gl.uniformMatrix4fv(ploc.mvp,false,m);gl.uniform3fv(ploc.tint,color);gl.uniform1f(ploc.size,window.M30?.lowPower?1.4:1.85);
    gl.drawArrays(gl.POINTS,0,window.M30?.lowPower?90:stars.length/3);
  }
  requestAnimationFrame(animate);
  container.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    dragging=true;px=e.clientX;py=e.clientY;container.setPointerCapture?.(e.pointerId);
  });
  container.addEventListener('pointermove',e=>{
    const r=container.getBoundingClientRect();hoverX=((e.clientX-r.left)/r.width-.5)*2;hoverY=((e.clientY-r.top)/r.height-.5)*2;
    if(dragging){dragY+=(e.clientX-px)*.008;dragX+=(e.clientY-py)*.008;dragX=Math.max(-2.2,Math.min(2.2,dragX));px=e.clientX;py=e.clientY}
  });
  const release=()=>{dragging=false};container.addEventListener('pointerup',release);container.addEventListener('pointercancel',release);container.addEventListener('lostpointercapture',release);
  container.addEventListener('pointerleave',()=>{if(!dragging){hoverX=0;hoverY=0}});
  if(window.M30)window.M30.onSystemChange=(id,newColor)=>{targetColor=[...newColor];systemFocused=id!=='overview';};
})();
