// Ambiente: fondale, rocce, gorgonie, cima d'ormeggio, superficie, raggi, particelle, bolle, pesci
import * as THREE from '../vendor/three/three.module.min.js';
import { mergeGeometries } from '../vendor/three/BufferGeometryUtils.js';
import { fbm2, fbm3, noise2, rng } from './noise.js?v=54d20f2c';
import { CFG } from './config.js?v=54d20f2c';
import { causticTexture } from './look.js?v=54d20f2c';

export function heightAt(x, z) {
  let h = CFG.seabed + (fbm2(x * 0.022 + 10, z * 0.022 + 4) - 0.5) * 5 + (fbm2(x * 0.11, z * 0.11) - 0.5) * 1.1;
  const c = Math.abs(noise2(x * 0.045 + 3, z * 0.045 + 8) - 0.5);
  if (c < 0.05) h -= (1 - c / 0.05) * 1.4;                                   // crepacci
  const u = x * 0.913 - z * 0.408, v = x * 0.408 + z * 0.913;                // assi del relitto
  const w = Math.exp(-((u * u) / 1100 + (v * v) / 230));                       // piano sotto il relitto
  h = h * (1 - w) + (CFG.seabed - 0.3) * w;
  for (const k in CFG.places) {                                                 // fondo più regolare nei luoghi dei reperti
    const P = CFG.places[k], d2 = (x - P.x) ** 2 + (z - P.z) ** 2, f = Math.exp(-d2 / 60);
    h = h * (1 - f * 0.7) + (CFG.seabed - 0.6) * f * 0.7;
  }
  const r = Math.hypot(x, z);
  if (r > CFG.cliff) h -= (r - CFG.cliff) * 1.2 + Math.pow(r - CFG.cliff, 2) * 0.03;   // fino a circa 50 m sul bordo dell'area   // la scarpata verso il blu
  return h;
}

const rand = rng(7);
const R = (a, b) => a + (b - a) * rand();

export function buildWorld(scene, tex, q, avoid) {
  const W = { colliders: [], updaters: [] };

  // ---------------- fondale ----------------
  {
    const seg = q.mobile ? 170 : 260;
    const size = (CFG.limit + 30) * 2;
    const g = new THREE.PlaneGeometry(size, size, seg, seg);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));
    g.computeVertexNormals();
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * size / 5, uv.getY(i) * size / 5);
    const m = new THREE.MeshStandardMaterial({ map: tex.sand.map, normalMap: tex.sand.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 1, metalness: 0 });
    const mesh = new THREE.Mesh(g, m);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // ---------------- rocce (forme tutte diverse) ----------------
  {
    const bases = [];
    for (let b = 0; b < 7; b++) {
      const g = new THREE.IcosahedronGeometry(1, q.mobile ? 3 : 4);
      const p = g.attributes.position, v = new THREE.Vector3();
      const o = b * 13.7;
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = fbm3(v.x * 1.3 + o, v.y * 1.3, v.z * 1.3, 5);
        const ridge = Math.abs(fbm3(v.x * 3 + o, v.y * 3, v.z * 3, 3) - 0.5);
        v.multiplyScalar(0.72 + n * 0.62 - ridge * 0.25);
        if (v.y < -0.25) v.y = -0.25 + (v.y + 0.25) * 0.3;                         // base appiattita
        p.setXYZ(i, v.x, v.y, v.z);
      }
      g.computeVertexNormals();
      bases.push({ g, list: [] });
    }
    const add = (x, z, s, sy) => {
      if (avoid(x, z, s * 1.2)) return;
      const k = Math.floor(rand() * bases.length);
      const sc = new THREE.Vector3(s * R(0.8, 1.3), s * sy, s * R(0.8, 1.3));
      const y = heightAt(x, z) - sc.y * R(0.05, 0.35);   // in parte sepolte nel sedimento
      const rot = R(0, Math.PI * 2);
      bases[k].list.push({ x, y, z, sc, rot });
      W.colliders.push({ c: new THREE.Vector3(x, y, z), s: sc.clone().multiplyScalar(0.92), rot });
    };
    // gruppi di rocce intorno al relitto e scogli più lontani
    const clusters = [[26, -16, 9], [-26, 22, 8], [18, 20, 6], [-30, -18, 10], [40, 6, 8], [-6, 32, 7], [4, -30, 9], [-40, 0, 10], [42, -30, 10], [-34, 38, 9], [20, 56, 8], [-66, -20, 9], [60, -50, 9], [-14, -64, 8], [64, 30, 9], [-70, 40, 8]];
    for (const [cx, cz, n] of clusters) {
      add(cx, cz, R(2.4, 4), R(0.5, 0.8));                                    // scoglio principale
      for (let i = 0; i < n; i++) { const a = R(0, 7), d = R(1.5, 6); add(cx + Math.cos(a) * d, cz + Math.sin(a) * d, R(0.3, 1.8) * (1 - d / 9), R(0.4, 0.85)); }
    }
    for (let i = 0; i < 40; i++) { const a = R(0, 7), d = R(40, 90); add(Math.cos(a) * d, Math.sin(a) * d, R(2, 6), R(0.4, 0.9)); }   // scogli lontani
    for (let i = 0; i < 50; i++) { const a = R(0, 7), d = R(15, 75); add(Math.cos(a) * d, Math.sin(a) * d, R(0.4, 1.4), R(0.4, 0.9)); }
    for (let i = 0; i < 160; i++) { const a = R(0, 7), d = R(8, 75); add(Math.cos(a) * d, Math.sin(a) * d, R(0.15, 0.45), R(0.5, 0.9)); } // ciottoli
    const m = new THREE.MeshStandardMaterial({ map: tex.rock.map, normalMap: tex.rock.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.95 });
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
    for (const b of bases) {
      if (!b.list.length) continue;
      const im = new THREE.InstancedMesh(b.g, m, b.list.length);
      b.list.forEach((r, i) => { Q.setFromEuler(E.set(R(-0.15, 0.15), r.rot, R(-0.15, 0.15))); M.compose(new THREE.Vector3(r.x, r.y, r.z), Q, r.sc); im.setMatrixAt(i, M); });
      im.castShadow = im.receiveShadow = true;
      scene.add(im);
    }
    W.rocks = bases.flatMap((b) => b.list);
    W.rockBases = bases.map((b) => b.g); W.rockMat = m;
  }

  // ---------------- gorgonie (modello vero, messo da extras.js) e spugne ----------------
  // qui scelgo solo dove vanno: in cima alle rocce più grandi, una per roccia
  {
    const spots = W.rocks.filter((r) => r.sc.x > 0.9).slice(0, q.mobile ? 32 : 64);
    W.gorgSpots = spots.map((r) => {
      const a = R(0, 7);
      return { x: r.x + Math.cos(a) * r.sc.x * 0.35, y: r.y + r.sc.y * 0.8, z: r.z + Math.sin(a) * r.sc.z * 0.35, rot: R(0, 7), tx: R(-0.15, 0.15), tz: R(-0.15, 0.15), s: R(1.0, 1.8) };
    });
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion();
    const sg = new THREE.SphereGeometry(1, 10, 8);
    const sm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });
    const sp = new THREE.InstancedMesh(sg, sm, 160);
    const cols = [0xd8792c, 0xc9a33a, 0x9a3b52, 0xb85a2a];
    for (let i = 0; i < 160; i++) {
      const r = W.rocks[Math.floor(rand() * W.rocks.length)];
      const a = R(0, 7), s = R(0.05, 0.16);
      M.compose(new THREE.Vector3(r.x + Math.cos(a) * r.sc.x * 0.6, r.y + r.sc.y * R(0.2, 0.7), r.z + Math.sin(a) * r.sc.z * 0.6), Q.identity(), new THREE.Vector3(s, s * R(0.6, 1.4), s));
      sp.setMatrixAt(i, M); sp.setColorAt(i, new THREE.Color(cols[i % 4]));
    }
    scene.add(sp);
  }

  // ---------------- cima d'ormeggio con boa e corpo morto ----------------
  {
    const top = new THREE.Vector3(CFG.line.x, 0.1, CFG.line.z);
    const bx = CFG.line.bx, bz = CFG.line.bz, by = heightAt(bx, bz);
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push(new THREE.Vector3(top.x + (bx - top.x) * t + Math.sin(t * 9) * 0.25 * (1 - t), top.y + (by + 0.6 - top.y) * t, top.z + (bz - top.z) * t + Math.cos(t * 7) * 0.2 * (1 - t)));
    }
    W.lineCurve = new THREE.CatmullRomCurve3(pts);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(W.lineCurve, 200, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0xb8a888, roughness: 1 }));
    scene.add(rope);
    const buoy = new THREE.Mesh(new THREE.SphereGeometry(0.45, 20, 14), new THREE.MeshStandardMaterial({ color: 0xd2541f, roughness: 0.6 }));
    buoy.position.copy(top); scene.add(buoy); W.buoy = buoy;
    const block = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), new THREE.MeshStandardMaterial({ map: tex.rock.map, roughness: 1, color: 0x9a9a90 }));
    block.position.set(bx, by + 0.2, bz); block.rotation.y = 0.4; scene.add(block);
    W.colliders.push({ c: block.position.clone(), s: new THREE.Vector3(0.7, 0.45, 0.7), rot: 0 });
  }

  // ---------------- superficie vista da sotto (finestra di Snell) ----------------
  // come il video della superficie del sito: onde chiare e luminose dentro il cerchio di luce sopra il sub,
  // riflesso blu scuro fuori; il reticolo delle onde è lo stesso delle caustiche sul fondo
  {
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, transparent: false,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uDeep: { value: new THREE.Color(0x0a3550) }, uSky: { value: new THREE.Color(0xc8f4ff) }, uMid: { value: new THREE.Color(0x1689cf) },
        uFog: { value: new THREE.Color() }, uDensity: { value: 0.03 }, uTex: { value: causticTexture() } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `uniform float uTime; uniform vec3 uCam, uDeep, uSky, uMid, uFog; uniform float uDensity; uniform sampler2D uTex; varying vec3 vW;
        void main(){
          vec3 d = normalize(vW-uCam);
          vec2 p = vW.xz*.16;
          vec2 wob = vec2(sin(p.y*3.1+uTime*.9)+sin(p.x*5.3-uTime*.7), cos(p.x*2.7+uTime*.8)+cos(p.y*4.9+uTime*.6))*.03;
          float c1 = texture2D(uTex, p + vec2(uTime*.021, uTime*.014) + wob).r;
          float c2 = texture2D(uTex, p*1.43 + vec2(-uTime*.017, uTime*.023) - wob).r;
          float c3 = texture2D(uTex, p*.31 + vec2(uTime*.006, -uTime*.008)).r;
          float c4 = texture2D(uTex, p*2.9 + vec2(uTime*.04, uTime*.03) + wob*2.).r;
          float net = min(c1, c2)*1.1 + c1*c2*.6 + c4*.35;                       // creste delle onde, luminose
          float tilt = (c1 - c2)*.05 + (c3 - .3)*.04;                  // le onde spostano il bordo della finestra
          float c = d.y + tilt;
          float win = smoothstep(.6, .8, c);
          vec3 sunD = normalize(vec3(.22, 1., .12));
          float sun = pow(max(0., dot(d, sunD)), 28.)*1.6 + pow(max(0., dot(d, sunD)), 4.)*.35;
          vec3 inside = mix(uMid, uSky, clamp(net*.5 + sun*.7, 0., 1.)) * (.8 + c3*.35) + uSky*sun*.45;
          vec3 outside = uDeep*(.75 + net*.35);                         // riflesso totale: blu scuro con onde appena visibili
          vec3 col = mix(outside, inside, win);
          col = mix(col, uMid*1.1, smoothstep(.45, .62, c)*(1.-win)*.6); // alone azzurro sul bordo della finestra
          float f = 1.-exp(-pow(uDensity*length(vW-uCam),2.));
          gl_FragColor = vec4(mix(col, uFog, f*(1.-win*.7)),1.);
          #include <colorspace_fragment>
        }`,
    });
    const surf = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1).rotateX(Math.PI / 2), mat);
    surf.position.y = 0; scene.add(surf);
    W.surface = mat;
  }

  // ---------------- fasci di luce dalla superficie ----------------
  {
    const geo = mergeGeometries([new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0), new THREE.PlaneGeometry(1, 1).translate(0, -0.5, 0).rotateY(Math.PI / 2)]);
    const mat = new THREE.MeshBasicMaterial({ map: tex.ray, color: 0x9fe4ff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const n = q.mobile ? 10 : 18;
    const rays = new THREE.InstancedMesh(geo, mat, n);
    const data = [];
    for (let i = 0; i < n; i++) data.push({ x: R(-22, 22), z: R(-22, 22), w: R(1.2, 4), h: R(18, 34), ph: R(0, 7), tilt: R(0.08, 0.2) });
    rays.frustumCulled = false;
    scene.add(rays);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3();
    W.updaters.push((dt, t, cam) => {
      data.forEach((r, i) => {
        // i fasci seguono il sub (ricollocati a griglia) così ce ne sono sempre intorno
        const gx = cam.position.x + ((r.x - cam.position.x + 22) % 44 + 44) % 44 - 22;
        const gz = cam.position.z + ((r.z - cam.position.z + 22) % 44 + 44) % 44 - 22;
        P.set(gx, 0, gz); Q.setFromEuler(E.set(r.tilt, r.ph, r.tilt * 0.5));
        const pulse = 0.65 + 0.35 * Math.sin(t * 0.4 + r.ph);
        S.set(r.w * pulse, r.h, r.w * pulse);
        M.compose(P, Q, S); rays.setMatrixAt(i, M);
      });
      rays.instanceMatrix.needsUpdate = true;
      const depth = -cam.position.y;
      mat.opacity = 0.11 * Math.max(0.15, 1 - depth / 34);
    });
  }

  // ---------------- particelle sospese (illuminate dalla torcia) ----------------
  {
    const N = q.particles, B = 34;
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = R(0, B); pos[i * 3 + 1] = R(0, B); pos[i * 3 + 2] = R(0, B); seed[i] = rand(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector3() }, uTorch: { value: 1 }, uAmb: { value: 0.2 }, uPR: { value: 1 }, uB: { value: B }, uCone: { value: CFG.torch.angle } },
      vertexShader: `attribute float aSeed; uniform float uTime, uTorch, uAmb, uPR, uB, uCone; uniform vec3 uCam, uDir; varying float vA;
        void main(){
          vec3 p = position + vec3(sin(uTime*.2+aSeed*40.)*.4, -uTime*(.03+aSeed*.05), cos(uTime*.17+aSeed*30.)*.4);
          p = mod(p - uCam + uB*.5, uB) - uB*.5 + uCam;
          vec3 d = p - uCam; float dist = length(d);
          float cone = smoothstep(cos(uCone*1.15), cos(uCone*.35), dot(d/dist, uDir));
          float lit = uTorch * cone / (1. + dist*dist*.035);
          vA = (uAmb*.35 + lit*1.6) * smoothstep(uB*.5, uB*.3, dist) * (.4+aSeed*.6);
          vec4 mv = modelViewMatrix*vec4(p,1.);
          gl_PointSize = (1.2+aSeed*2.6) * uPR * 9. / max(.5,-mv.z);
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: `varying float vA; void main(){ vec2 c = gl_PointCoord-.5; float a = smoothstep(.5,.0,length(c)); gl_FragColor = vec4(vec3(.85,.93,1.)*vA*a, 1.); }`,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
    W.particles = mat;
  }

  // ---------------- bolle dell'erogatore ----------------
  {
    const N = 90;
    const pos = new Float32Array(N * 3), size = new Float32Array(N);
    const life = new Float32Array(N).fill(-1), vel = new Float32Array(N);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { uPR: { value: 1 }, uAmb: { value: 0.5 } },
      vertexShader: `attribute float aSize; uniform float uPR; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = aSize*uPR*300./max(.3,-mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform float uAmb; void main(){ vec2 c = gl_PointCoord-.5; float r = length(c); if(r>.5) discard; float rim = smoothstep(.32,.48,r)*(1.-smoothstep(.48,.5,r)); float hl = smoothstep(.12,.0,length(c-vec2(-.15,.15))); gl_FragColor = vec4(vec3(.8,.95,1.), (rim*.55+hl*.8+.05)*uAmb); }`,
    });
    const pts = new THREE.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
    let next = 0;
    W.bubbles = {
      mat,
      emit(origin, n) {
        for (let k = 0; k < n; k++) {
          const i = next; next = (next + 1) % N;
          pos[i * 3] = origin.x + R(-0.08, 0.08); pos[i * 3 + 1] = origin.y + R(-0.05, 0.05); pos[i * 3 + 2] = origin.z + R(-0.08, 0.08);
          size[i] = R(0.004, 0.02); life[i] = 0; vel[i] = R(0.4, 0.9);
        }
      },
      burst(origin, n, spread) {
        for (let k = 0; k < n; k++) {
          const i = next; next = (next + 1) % N;
          pos[i * 3] = origin.x + R(-spread, spread); pos[i * 3 + 1] = origin.y + R(0, 0.3); pos[i * 3 + 2] = origin.z + R(-spread, spread);
          size[i] = R(0.006, 0.03); life[i] = R(-0.6, 0); vel[i] = R(0.4, 1.2);
        }
      },
      clear() { life.fill(-1); size.fill(0); },
    };
    W.updaters.push((dt, t) => {
      for (let i = 0; i < N; i++) {
        if (life[i] < 0) { if (life[i] > -1) life[i] += dt; else size[i] = 0; continue; }
        life[i] += dt; vel[i] = Math.min(vel[i] + dt * 0.5, 2);
        pos[i * 3 + 1] += vel[i] * dt;
        pos[i * 3] += Math.sin(t * 6 + i) * dt * 0.15; pos[i * 3 + 2] += Math.cos(t * 5 + i) * dt * 0.15;
        size[i] *= 1 + dt * 0.03;
        if (life[i] > 9 || pos[i * 3 + 1] > -0.1) { life[i] = -1; size[i] = 0; }
      }
      g.attributes.position.needsUpdate = true; g.attributes.aSize.needsUpdate = true;
    });
  }

  return W;
}

// collisioni con rocce (ellissoidi) e fondale
const _l = new THREE.Vector3();
export function collideWorld(W, p, r) {
  for (const c of W.colliders) {
    _l.subVectors(p, c.c);
    if (Math.abs(_l.x) > c.s.x + r + 0.5 || Math.abs(_l.z) > c.s.z + r + 0.5 || Math.abs(_l.y) > c.s.y + r + 0.5) continue;
    // nel sistema locale dell'ellissoide (rotazione attorno a y = c.rot, come mesh.rotation.y)
    const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
    const lx = _l.x * cs - _l.z * sn, lz = _l.x * sn + _l.z * cs;
    const ex = lx / (c.s.x + r), ey = _l.y / (c.s.y + r), ez = lz / (c.s.z + r);
    const d = Math.hypot(ex, ey, ez);
    if (d < 1 && d > 1e-4) {
      const k = 1 / d;
      const nx = ex * k * (c.s.x + r), ny = ey * k * (c.s.y + r), nz = ez * k * (c.s.z + r);
      p.set(c.c.x + nx * cs + nz * sn, c.c.y + ny, c.c.z - nx * sn + nz * cs);
    }
  }
  const fl = heightAt(p.x, p.z) + r + 0.15;
  if (p.y < fl) p.y = fl;
  if (p.y > -0.35) p.y = -0.35;
  const rr = Math.hypot(p.x, p.z);
  if (rr > CFG.limit) { p.x *= CFG.limit / rr; p.z *= CFG.limit / rr; }
}
