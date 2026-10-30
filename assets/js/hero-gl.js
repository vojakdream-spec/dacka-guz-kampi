/* =========================================================
   HERO · WebGL basketbol topu + ışık izleri
   Tamamen kodla üretilir; görsel dosyası kullanmaz.
   ========================================================= */
(function () {
  'use strict';
  var canvas = document.getElementById('heroGL');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'high-performance' });
  if (!gl) { canvas.remove(); var hb = document.getElementById('heroBall'); if (hb) hb.classList.add('is-static', 'is-on'); return; }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform vec3 uBall;uniform float uScroll;uniform vec2 uRot;uniform float uShow;uniform float uLight;',
    'float h11(float n){return fract(sin(n*127.1)*43758.5453);}',
    'float h31(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float n3(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);',
    ' return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),',
    '            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}',
    'mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}',
    'mat3 rotZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}',
    'vec3 streaks(vec2 uv,vec2 c){',
    ' vec3 col=vec3(0.);',
    ' float band=uv.x-c.x+(uv.y-c.y)*.42+.08;',
    ' float mask=exp(-band*band/.09)*.95+exp(-pow(band+.55,2.)/.05)*.35;',
    ' mask*=smoothstep(.95,.1,abs(uv.y-c.y));',
    ' for(int k=0;k<2;k++){',
    '  float dens=k==0?70.:150.;',
    '  float y=uv.y*dens;float lane=floor(y);float fy=fract(y);',
    '  float r=h11(lane+float(k)*31.);float r2=h11(lane*1.7+3.);',
    '  float spd=.25+r*1.1;',
    '  float x=uv.x*(1.2+r2*2.)+uTime*spd+r*20.;',
    '  float seg=fract(x*.35);',
    '  float len=.25+r2*.55;',
    '  float s=smoothstep(0.,len,seg)*smoothstep(len+.02,len,seg);',
    '  s=pow(s,2.5)*step(.35,r2);',
    '  float prof=smoothstep(.5,.0,abs(fy-.5));prof*=prof;',
    '  vec3 tint=r>.62?vec3(.30,.25,1.):vec3(.17,.95,.45);',
    '  col+=tint*s*prof*(k==0?1.:.55);',
    ' }',
    ' return col*mask*1.6;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' vec2 m=uMouse*.03;',
    ' vec2 c=uBall.xy+vec2(0.,sin(uTime*1.1)*.012)+m*.6;',
    ' float R=uBall.z;',
    ' vec3 col=vec3(0.);',
    ' float dc=length(uv-c);',
    ' col+=vec3(.0,.38,.15)*exp(-dc*dc/(R*R*2.6))*.55;',
    ' col+=vec3(.12,.08,.6)*exp(-pow(length(uv-c-vec2(-.35*R,.5*R)),2.)/(R*R*1.6))*.35;',
    ' col+=streaks(uv+m*.4,c);',
    ' float px=1.6/uRes.y;',
    ' vec2 sh=uv-c-vec2(0.,-R*1.18);',
    ' col*=1.-.65*exp(-(sh.x*sh.x/(R*R*.7)+sh.y*sh.y/(R*R*.02)));',
    ' float ring=exp(-pow((dc-R*1.03)/(R*.035),2.));col+=vec3(.17,.89,.44)*ring*.16;',
    ' float a=0.;',
    ' if(uShow>.5&&dc<R+px){',
    '  vec2 d=(uv-c)/R;float zz=max(0.,1.-dot(d,d));vec3 n=normalize(vec3(d,sqrt(zz)));',
    '  mat3 M=rotZ(.5)*rotX(uRot.y-.35)*rotY(uRot.x);',
    '  vec3 p=M*n;',
    '  float w=.014;float aa=px/R*1.6;',
    '  float g1=abs(p.x);float g2=abs(p.y);',
    '  float cv=abs(abs(p.x)-(.58+.3*(p.z*p.z-p.y*p.y)));',
    '  float sd=min(min(g1,g2),cv);',
    '  float seam=1.-smoothstep(w,w+aa,sd);',
    '  float groove=1.-smoothstep(w,w*4.,sd);',
    '  float peb=n3(p*90.)*.55+n3(p*190.)*.45;',
    '  vec3 base=mix(vec3(.74,.27,.06),vec3(.88,.37,.10),n3(p*3.));',
    '  base*=.9+.16*peb;',
    '  vec3 nb=normalize(n+(vec3(n3(p*110.),n3(p*110.+7.),n3(p*110.+13.))-.5)*.12);',
    '  vec3 L=normalize(vec3(-.55,.65,.75));',
    '  float dif=max(dot(nb,L),0.);',
    '  float rimG=pow(1.-n.z,3.2)*smoothstep(-.1,.8,n.x);',
    '  float rimB=pow(1.-n.z,3.)*smoothstep(-.1,.8,-n.x+.2*n.y);',
    '  vec3 H=normalize(L+vec3(0,0,1));float sp=pow(max(dot(nb,H),0.),18.)*.22;',
    '  vec3 bc=base*(.10+1.05*dif)+sp*vec3(1.,.9,.8);',
    '  bc*=1.-.35*groove;',
    '  bc=mix(bc,vec3(.05,.025,.015)+sp*.2,seam);',
    '  bc+=vec3(.17,.95,.45)*rimG*.9+vec3(.3,.25,1.)*rimB*.8;',
    '  bc*=mix(.35,1.,smoothstep(0.,.6,n.z));',
    '  a=1.-smoothstep(R-px,R+px,dc);',
    '  col=mix(col,bc,a);',
    ' }',
    ' if(uLight>.5){',
    '  vec3 st=streaks(uv+m*.4,c);float am=clamp(max(st.r,max(st.g,st.b)),0.,1.);',
    '  vec3 hue=st/max(am,1e-3);vec3 bg=vec3(.965,.962,.94);',
    '  bg=mix(bg,vec3(.82,.95,.86),exp(-dc*dc/(R*R*3.2))*.7);',
    '  bg=mix(bg,hue*vec3(.25,.55,.35)+vec3(0.,.08,.02),am*.75);',
    '  bg*=1.-.25*exp(-(sh.x*sh.x/(R*R*.7)+sh.y*sh.y/(R*R*.02)));',
    '  col=mix(bg,1.-exp(-col*1.35),a);',
    ' } else {',
    ' col=1.-exp(-col*1.35);',
    ' col=pow(col,vec3(.95));',
    ' float vig=smoothstep(1.25,.25,length(uv*vec2(.8,1.)));',
    ' col*=mix(.55,1.,vig);',
    ' col*=1.-uScroll*.7;',
    ' }',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.remove(); return; }
  var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uMouse', 'uBall', 'uScroll', 'uRot', 'uShow', 'uLight'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });

  var W = 0, H = 0, ball = [0.42, 0.02, 0.3];
  var photo = document.getElementById('heroBall');
  if (photo) { var pim = photo.querySelector('img'); var ok = function () { photo.classList.add('is-on'); }; if (pim.complete && pim.naturalWidth) ok(); else pim.addEventListener('load', ok); }
  var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  var rot = { x: 0.6, y: 0.25, vx: 0.32, vy: 0.0 };
  var scroll = 0, visible = true, running = false, last = 0, t0 = performance.now();

  function layout() {
    var mobile = window.innerWidth < 761;
    var cap = mobile ? 1.25 : 1.5;
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    // piksel bütçesi: büyük ekranlarda gölgelendirici yükü sınırlanır (~1.6 MP)
    var area = canvas.clientWidth * canvas.clientHeight;
    dpr = Math.min(dpr, Math.sqrt(1.6e6 / Math.max(1, area)));
    W = Math.round(canvas.clientWidth * dpr); H = Math.round(canvas.clientHeight * dpr);
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    var aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    if (mobile) {
      ball = [aspect * 0.5 - 0.1, 0.31, Math.min(0.17, aspect * 0.36)];
    } else if (aspect < 1.25) {
      ball = [aspect * 0.5 - 0.17, 0.12, 0.17];
    } else {
      ball = [aspect * 0.5 - Math.max(0.42, aspect * 0.23), 0.04, Math.min(0.33, aspect * 0.18)];
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    mouse.x += (mouse.tx - mouse.x) * 0.06; mouse.y += (mouse.ty - mouse.y) * 0.06;
    rot.x += (rot.vx + mouse.x * 0.35 + scroll * 4) * dt;
    rot.y += ((mouse.y * 0.5 + 0.25) - rot.y) * 0.04;
    var t = (now - t0) / 1000;
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, reduce ? 4.0 : t);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform3f(U.uBall, ball[0], ball[1] + scroll * 0.25, ball[2] * (1 + scroll * 0.15));
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform2f(U.uRot, rot.x, rot.y);
    gl.uniform1f(U.uShow, photo ? 0 : 1);
    gl.uniform1f(U.uLight, document.documentElement.getAttribute('data-theme') === 'light' ? 1 : 0);
    if (photo) {
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      var bx = ball[0] + mouse.x * 0.018, by = ball[1] + scroll * 0.25 + Math.sin((reduce ? 4 : t) * 1.1) * 0.012 + mouse.y * 0.018;
      var br = ball[2] * (1 + scroll * 0.15);
      var px = cw / 2 + bx * ch, py = ch / 2 - by * ch, d = br * ch * 2.06;
      photo.style.width = d + 'px'; photo.style.height = d + 'px';
      photo.style.transform = 'translate3d(' + (px - d / 2).toFixed(1) + 'px,' + (py - d / 2).toFixed(1) + 'px,0) rotate(' + ((reduce ? 0 : Math.sin(t * 0.4) * 8) + mouse.x * 10 + scroll * 120).toFixed(2) + 'deg)';
      photo.style.opacity = 1 - scroll * 0.6;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (reduce) { running = false; return; }
    requestAnimationFrame(frame);
  }
  function start() { if (running || !visible || document.hidden) return; running = true; last = 0; frame(performance.now()); }
  function stop() { running = false; }

  layout();
  window.addEventListener('resize', function () { layout(); if (reduce) start(); });
  window.addEventListener('temadegisti', function () { if (reduce || !running) { running = false; start(); } });
  window.addEventListener('pointermove', function (e) {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });
  window.addEventListener('scroll', function () {
    var h = canvas.clientHeight || 1;
    scroll = Math.min(1, Math.max(0, window.scrollY / h));
    if (reduce) start();
  }, { passive: true });
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  // Ekran dışındayken tuval tamamen gizlenir; duran bir WebGL katmanı
  // bazı Chromium sürümlerinde tüm sayfanın kararmasına yol açıyor.
  new IntersectionObserver(function (en) {
    visible = en[0].isIntersecting;
    canvas.style.visibility = visible ? '' : 'hidden';
    visible ? start() : stop();
  }).observe(canvas.parentNode);
  canvas.classList.add('is-on');
  start();
})();
