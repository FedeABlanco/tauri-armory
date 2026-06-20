// ─── Personaje 3D real (Wowhead ZamModelViewer) ──────────────────────────────
// Renderiza el modelo verdadero del personaje (raza + género + customización)
// y le "viste" los items equipados usando sus DisplayId_ModelViewer.
//
// Depende de los globals cargados en index.html:
//   - jQuery
//   - ZamModelViewer  (viewer.min.js)
//   - window.CONTENT_PATH
//   - window.generateModels  (esm.sh/wow-model-viewer)

let __activeViewer = null;

// Espera a que la librería del visor esté lista (o falle).
function waitForModelViewer(timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    if (window.generateModels && window.ZamModelViewer) return resolve();
    if (window.__wmvFailed) return reject(new Error('wow-model-viewer no disponible'));

    const start = Date.now();
    const tick = () => {
      if (window.generateModels && window.ZamModelViewer) return resolve();
      if (window.__wmvFailed) return reject(new Error('wow-model-viewer no disponible'));
      if (Date.now() - start > timeoutMs) return reject(new Error('timeout cargando el visor 3D'));
      setTimeout(tick, 150);
    };
    window.addEventListener('wmv-ready', () => setTimeout(tick, 0), { once: true });
    tick();
  });
}

// Construye el objeto-personaje que espera wow-model-viewer.
function buildCharacterModel(p) {
  const sd = p.skindata || {};

  // items: [InventoryType, displayId]. Preferimos el transmog si existe.
  const items = (p.characterItems || [])
    .filter(it => it && it.entry)
    .map(it => {
      const tmog = it.transmogdisplayid_ModelViewer;
      const dispId = (tmog && tmog > 0) ? tmog : it.DisplayId_ModelViewer;
      return [it.InventoryType, dispId];
    })
    .filter(pair => pair[0] && pair[1]);

  return {
    race:        p.race,
    gender:      p.gender,          // 0 = hombre, 1 = mujer (convención WoW estándar)
    skin:        sd.skinstyle  ?? 0,
    face:        sd.facecolor  ?? 0,
    hairStyle:   sd.hairstyle  ?? 0,
    hairColor:   sd.haircolor  ?? 0,
    facialStyle: sd.facialhair ?? 0,
    items,
  };
}

// power.js (tooltips) instala un WH mínimo que NO trae WH.debug, que el visor sí
// usa. Lo completamos con stubs apuntando a las funciones que sí existen.
function shimWH() {
  const wh = window.WH;
  if (!wh) return;
  if (typeof wh.debug !== 'function') wh.debug = wh.log || function () {};
  if (typeof wh.error !== 'function') wh.error = wh.log || function () {};
}

async function initCharacter3D(containerEl, p) {
  await waitForModelViewer();
  shimWH();

  const frame = containerEl || document.getElementById('modelFrame');
  let mount = document.getElementById('model3d');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'model3d';
    mount.className = 'model-3d';
    frame.appendChild(mount);
  }

  // Limpia un visor previo (al buscar otro personaje).
  mount.innerHTML = '';
  if (__activeViewer && typeof __activeViewer.destroy === 'function') {
    try { __activeViewer.destroy(); } catch (_) {}
  }
  __activeViewer = null;

  // El visor trae sus propios controles de rotación/zoom: ocultamos decoraciones.
  const overlay = frame.querySelector('.model-overlay');
  const hint    = frame.querySelector('.drag-hint');
  if (overlay) overlay.style.display = 'none';
  if (hint)    hint.style.display = 'none';

  const character = buildCharacterModel(p);

  const rect = frame.getBoundingClientRect();
  const aspect = rect.width && rect.height ? rect.width / rect.height : 0.62;

  __activeViewer = await window.generateModels(aspect, '#model3d', character);
  return __activeViewer;
}

window.initCharacter3D = initCharacter3D;

// ─── Modelo 3D de un NPC (por id de criatura) ─────────────────────────────────
let __npcViewer = null;

async function initNpc3D(containerEl, npcId, type = 8) {  // 8 = NPC (criatura)
  await waitForModelViewer();
  shimWH();

  const frame = containerEl || document.getElementById('npcModelFrame');
  let mount = frame.querySelector('.model-3d');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'npcModel3d';
    mount.className = 'model-3d';
    frame.appendChild(mount);
  }
  mount.innerHTML = '';
  if (__npcViewer && typeof __npcViewer.destroy === 'function') {
    try { __npcViewer.destroy(); } catch (_) {}
  }
  __npcViewer = null;

  const rect = frame.getBoundingClientRect();
  const aspect = rect.width && rect.height ? rect.width / rect.height : 0.62;

  __npcViewer = await window.generateModels(aspect, '#' + mount.id, { id: Number(npcId), type });
  return __npcViewer;
}

window.initNpc3D = initNpc3D;
