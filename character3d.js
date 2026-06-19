// Three.js WoW-style character model
// Loads Three.js from CDN, builds a humanoid figure with class/race/gear colors.

const HAIR_COLORS = [
  '#f9e4be','#f9d079','#9e6633','#5a3014','#1a0a00',
  '#ffd700','#c8c8c8','#2c4a2c','#ff8c00','#1c1c1c',   // 9 = near-black
  '#ffffff','#8b4513','#ff6347','#6495ed','#c0c0c0',
];

const SKIN_TONES = [
  '#f5d0a9','#f0c090','#e8b080','#c08040','#905020',
  '#fce8d0','#eed8b8','#c0a880','#a07050','#785030',
];

const CLASS_CLOTH_COLOR = {
  1:'#8b6914', 2:'#c47080', 3:'#506828',
  4:'#707020', 5:'#e0e0e0', 6:'#500010',
  7:'#204080', 8:'#306888', 9:'#2d1b4e',
  10:'#006838', 11:'#783800', 12:'#500080',
};

const CLASS_TRIM_COLOR = {
  1:'#c8960c', 2:'#f58cba', 3:'#abd473',
  4:'#fff569', 5:'#c0c0c0', 6:'#c41f3b',
  7:'#0070de', 8:'#69ccf0', 9:'#9482c9',
  10:'#00ff96', 11:'#ff7d0a', 12:'#a330c9',
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function hexToThree(hex) {
  return parseInt(hex.replace('#',''), 16);
}

async function initCharacter3D(containerEl, characterData) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');

  const THREE = window.THREE;
  const W = containerEl.clientWidth  || 200;
  const H = containerEl.clientHeight || 320;

  // ── Canvas ──
  let canvas = containerEl.querySelector('canvas.three-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'three-canvas';
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border-radius:6px;';
    containerEl.appendChild(canvas);
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(W, H, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
  camera.position.set(0, 1.1, 6.5);
  camera.lookAt(0, 1.1, 0);

  // ── Lighting ──
  scene.add(new THREE.AmbientLight(0x404060, 0.6));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(2, 4, 3);
  keyLight.castShadow = true;
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
  fillLight.position.set(-2, 2, 1);
  scene.add(fillLight);

  const cls = characterData.class || 9;
  const classColor = hexToThree(CLASS_TRIM_COLOR[cls] || '#9482c9');
  const rimLight = new THREE.PointLight(classColor, 1.5, 5);
  rimLight.position.set(-1.5, 1.5, -2);
  scene.add(rimLight);

  // ── Materials ──
  const skinColor = hexToThree(SKIN_TONES[(characterData.skindata?.skinstyle || 0) % SKIN_TONES.length]);
  const hairColor = hexToThree(HAIR_COLORS[(characterData.skindata?.haircolor || 9) % HAIR_COLORS.length]);
  const robeColor = hexToThree(CLASS_CLOTH_COLOR[cls] || '#2d1b4e');
  const trimColor  = hexToThree(CLASS_TRIM_COLOR[cls]  || '#9482c9');

  const matSkin  = new THREE.MeshPhongMaterial({ color: skinColor, shininess: 40 });
  const matHair  = new THREE.MeshPhongMaterial({ color: hairColor, shininess: 20 });
  const matRobe  = new THREE.MeshPhongMaterial({ color: robeColor, shininess: 60 });
  const matTrim  = new THREE.MeshPhongMaterial({ color: trimColor, shininess: 80, emissive: trimColor, emissiveIntensity: 0.15 });
  const matBelt  = new THREE.MeshPhongMaterial({ color: 0x3a2800, shininess: 100 });
  const matShoe  = new THREE.MeshPhongMaterial({ color: 0x1a1008, shininess: 50 });
  const matStaff = new THREE.MeshPhongMaterial({ color: 0x3a2000, shininess: 80 });
  const matOrb   = new THREE.MeshPhongMaterial({ color: trimColor, emissive: trimColor, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 });

  // ── Character Group ──
  const charGroup = new THREE.Group();
  scene.add(charGroup);

  function box(w,h,d) { return new THREE.BoxGeometry(w,h,d); }
  function cyl(rt,rb,h,seg=8) { return new THREE.CylinderGeometry(rt,rb,h,seg); }
  function sphere(r,ws=12,hs=12) { return new THREE.SphereGeometry(r,ws,hs); }
  function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow=true; return m; }

  // ── Body ──
  const torso = mesh(cyl(0.38, 0.32, 0.90, 8), matRobe);
  torso.position.y = 1.05;
  charGroup.add(torso);

  // Robe skirt (extends downward from torso)
  const skirt = mesh(cyl(0.42, 0.52, 1.10, 8), matRobe);
  skirt.position.y = 0.25;
  charGroup.add(skirt);

  // Robe bottom hem
  const hem = mesh(cyl(0.53, 0.50, 0.08, 8), matTrim);
  hem.position.y = -0.30;
  charGroup.add(hem);

  // Collar/chest trim
  const collar = mesh(cyl(0.40, 0.38, 0.12, 8), matTrim);
  collar.position.y = 1.52;
  charGroup.add(collar);

  // Belt
  const belt = mesh(cyl(0.34, 0.34, 0.12, 8), matBelt);
  belt.position.y = 0.64;
  charGroup.add(belt);

  // Belt buckle
  const buckle = mesh(box(0.14, 0.10, 0.06), matTrim);
  buckle.position.set(0, 0.64, 0.34);
  charGroup.add(buckle);

  // ── Neck ──
  const neck = mesh(cyl(0.13, 0.13, 0.20, 8), matSkin);
  neck.position.y = 1.68;
  charGroup.add(neck);

  // ── Head ──
  const head = mesh(sphere(0.34, 14, 14), matSkin);
  head.position.y = 2.10;
  charGroup.add(head);

  // Hair — cap style
  const hairCap = mesh(sphere(0.36, 12, 12), matHair);
  hairCap.position.y = 2.16;
  hairCap.scale.y = 0.7;
  charGroup.add(hairCap);

  // Hair back flow
  const hairBack = mesh(box(0.58, 0.50, 0.18), matHair);
  hairBack.position.set(0, 2.04, -0.26);
  charGroup.add(hairBack);

  // ── Eyes (subtle) ──
  [-0.12, 0.12].forEach(x => {
    const eye = mesh(sphere(0.04, 6, 6), new THREE.MeshPhongMaterial({ color: 0x222244 }));
    eye.position.set(x, 2.10, 0.31);
    charGroup.add(eye);
  });

  // ── Shoulders ──
  [-0.54, 0.54].forEach(side => {
    const pad = mesh(sphere(0.20, 8, 8), matTrim);
    pad.position.set(side, 1.52, 0);
    pad.scale.set(1, 0.7, 0.9);
    charGroup.add(pad);

    const padSpike = mesh(sphere(0.10, 6, 6), matTrim);
    padSpike.position.set(side * 1.15, 1.65, 0);
    charGroup.add(padSpike);
  });

  // ── Arms ──
  [-0.58, 0.58].forEach(side => {
    // Upper arm
    const uArm = mesh(cyl(0.11, 0.10, 0.55, 7), matRobe);
    uArm.position.set(side, 1.22, 0);
    uArm.rotation.z = side > 0 ? -0.18 : 0.18;
    charGroup.add(uArm);

    // Forearm
    const fArm = mesh(cyl(0.09, 0.08, 0.48, 7), matRobe);
    fArm.position.set(side, 0.85, 0);
    fArm.rotation.z = side > 0 ? -0.12 : 0.12;
    charGroup.add(fArm);

    // Hand
    const hand = mesh(box(0.14, 0.16, 0.10), matSkin);
    hand.position.set(side * 1.04, 0.58, 0);
    charGroup.add(hand);

    // Sleeve trim
    const sleeve = mesh(cyl(0.095, 0.095, 0.07, 7), matTrim);
    sleeve.position.set(side, 0.62, 0);
    charGroup.add(sleeve);
  });

  // ── Legs (hidden under robe, only feet visible) ──
  [-0.14, 0.14].forEach(side => {
    const foot = mesh(box(0.16, 0.12, 0.28), matShoe);
    foot.position.set(side, -0.36, 0.04);
    charGroup.add(foot);
  });

  // ── Cape (behind character) ──
  const capeGeo = new THREE.PlaneGeometry(0.80, 1.10, 1, 4);
  const cape = new THREE.Mesh(capeGeo, new THREE.MeshPhongMaterial({
    color: hexToThree(CLASS_CLOTH_COLOR[cls] || '#2d1b4e'),
    side: THREE.DoubleSide,
    shininess: 30,
  }));
  cape.position.set(0, 0.95, -0.38);
  cape.rotation.x = 0.15;
  charGroup.add(cape);

  const capeTrim = mesh(box(0.82, 0.06, 0.02), matTrim);
  capeTrim.position.set(0, 0.42, -0.37);
  charGroup.add(capeTrim);

  // ── Staff (right hand) ──
  const hasWeapon = (characterData.characterItems || [])[16]?.entry > 0;
  if (hasWeapon) {
    const staffGroup = new THREE.Group();
    // Shaft
    const shaft = mesh(cyl(0.04, 0.04, 2.4, 6), matStaff);
    shaft.position.y = 1.0;
    staffGroup.add(shaft);

    // Orb top
    const orb = mesh(sphere(0.16, 10, 10), matOrb);
    orb.position.y = 2.25;
    staffGroup.add(orb);

    // Orb inner glow
    const orbGlow = mesh(sphere(0.12, 8, 8), new THREE.MeshPhongMaterial({
      color: trimColor, emissive: trimColor, emissiveIntensity: 1.0, transparent: true, opacity: 0.6,
    }));
    orbGlow.position.y = 2.25;
    staffGroup.add(orbGlow);

    // Staff bottom tip
    const tip = mesh(cyl(0.04, 0.01, 0.20, 6), matTrim);
    tip.position.y = -0.10;
    staffGroup.add(tip);

    staffGroup.position.set(0.80, 0.10, 0.10);
    staffGroup.rotation.z = 0.10;
    charGroup.add(staffGroup);

    // Orbiting particle
    const particle = mesh(sphere(0.05, 6, 6), matOrb);
    staffGroup.add(particle);
    staffGroup.userData.particle = particle;
    staffGroup.userData.staffOrbY = 2.25;
  }

  // ── Ground shadow disc ──
  const shadowGeo = new THREE.CircleGeometry(0.55, 32);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.40;
  scene.add(shadow);

  // ── Class aura glow on ground ──
  const auraGeo = new THREE.CircleGeometry(0.7, 32);
  const auraMat = new THREE.MeshBasicMaterial({ color: trimColor, transparent: true, opacity: 0.12 });
  const aura = new THREE.Mesh(auraGeo, auraMat);
  aura.rotation.x = -Math.PI / 2;
  aura.position.y = -0.39;
  scene.add(aura);

  // ── Rotation control ──
  let rotY = 0;
  let isDragging = false;
  let lastX = 0;
  let autoSpin = true;
  let autoRaf = null;

  const startDrag = x => { isDragging = true; lastX = x; autoSpin = false; cancelAnimationFrame(autoRaf); };
  const moveDrag  = x => {
    if (!isDragging) return;
    rotY += (x - lastX) * 0.012;
    lastX = x;
    charGroup.rotation.y = rotY;
  };
  const endDrag = () => {
    isDragging = false;
    setTimeout(() => { autoSpin = true; spin(); }, 2000);
  };

  canvas.addEventListener('mousedown',  e => startDrag(e.clientX));
  window.addEventListener('mousemove',  e => moveDrag(e.clientX));
  window.addEventListener('mouseup',    endDrag);
  canvas.addEventListener('touchstart', e => startDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove',  e => moveDrag(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend',   endDrag);

  // ── Animate ──
  let t = 0;
  function spin() {
    if (!autoSpin) return;
    autoRaf = requestAnimationFrame(spin);
    t += 0.012;
    rotY += 0.008;
    charGroup.rotation.y = rotY;

    // Idle bob
    charGroup.position.y = Math.sin(t * 1.2) * 0.015;

    // Staff orb particle orbit
    const sg = charGroup.children.find(c => c.userData?.particle);
    if (sg) {
      const p = sg.userData.particle;
      p.position.set(
        Math.cos(t * 2.5) * 0.28,
        sg.userData.staffOrbY + Math.sin(t * 2.0) * 0.12,
        Math.sin(t * 2.5) * 0.28
      );
    }

    // Rim light pulse
    rimLight.intensity = 1.2 + Math.sin(t * 1.8) * 0.4;

    renderer.render(scene, camera);
  }

  spin();

  // ── Resize observer ──
  const ro = new ResizeObserver(() => {
    const nw = containerEl.clientWidth;
    const nh = containerEl.clientHeight;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  });
  ro.observe(containerEl);

  return { scene, renderer, charGroup };
}

window.initCharacter3D = initCharacter3D;
