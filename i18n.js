// ─── INTERNACIONALIZACIÓN (ES / EN) ──────────────────────────────────────────
(function () {
  const STORE_KEY = 'lang';

  // Idioma inicial: guardado > navegador > 'es'
  function detectLang() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === 'es' || saved === 'en') return saved;
    } catch (e) {}
    const nav = (navigator.language || 'es').toLowerCase();
    return nav.startsWith('es') ? 'es' : 'en';
  }

  let LANG = detectLang();

  // ── Strings de interfaz ──
  const STR = {
    es: {
      'nav.armory': '⚔ Armería', 'nav.npc': '🐉 Buscar NPC', 'nav.item': '🗡 Buscar Ítem', 'nav.quests': '📜 Misiones',
      'search.char': 'Nombre del personaje...', 'search.btn': 'Buscar',
      'loading.char': 'Consultando la Armería de Tauri...',
      'err.tauri': 'Error de Tauri: ', 'err.net': 'Error de red: ', 'alert.needName': 'Por favor, ingresá el nombre de un personaje.',
      'ilvl.avg': 'iLvl promedio', 'bar.health': 'Vida',
      'stats.attrs': 'Atributos', 'stats.off': 'Ofensivo', 'stats.def': 'Defensivo',
      'stat.str': 'Fuerza', 'stat.agi': 'Agilidad', 'stat.sta': 'Aguante', 'stat.int': 'Intelecto', 'stat.spi': 'Espíritu',
      'stat.sp': 'Bon. daño', 'stat.crit': 'Golpe crít.', 'stat.haste': 'Celeridad', 'stat.mastery': 'Maestría',
      'stat.armor': 'Armadura', 'stat.maxhealth': 'Vida máx.', 'stat.maxOf': '{p} máx.',
      'lvl.line': 'Nivel {lvl} {race} {cls}',
      // NPC
      'npc.ph': 'Nombre del NPC (ej: Thrall) o ID...',
      'npc.empty': 'Escribí el nombre de un NPC para ver su modelo 3D y dónde encontrarlo.<br>¿No aparece? Pegá su <strong>ID</strong> (el número en la URL de Wowhead) y Enter.',
      'npc.loading': 'Cargando NPC...', 'npc.info': 'Información', 'npc.location': 'Ubicación',
      'npc.wowhead': 'Ver en Wowhead →', 'npc.maphint': 'Puntos = ubicaciones donde aparece el NPC. El mapa completo y filtros, en Wowhead.',
      'npc.loadingWH': 'Cargando datos de Wowhead...', 'npc.noData': 'Sin datos adicionales en Wowhead.',
      'npc.loadFail': 'No se pudieron cargar los datos. Usá el botón para verlo en Wowhead.',
      'npc.noModel': 'Sin modelo 3D ni imagen para este NPC.',
      'ac.empty': 'Sin resultados. Si sabés el ID (de la URL de Wowhead), pegalo y Enter.',
      // Item
      'item.ph': 'Nombre del ítem (ej: Lingote de hierro) o ID...',
      'item.empty': 'Buscá cualquier ítem: materiales de crafteo, armas, armaduras, gemas…<br>¿No aparece? Pegá su <strong>ID</strong> (el número en la URL de Wowhead) y Enter.',
      'item.loadingWH': 'Cargando datos de Wowhead...', 'item.noData': 'Sin datos en Wowhead para este ítem.',
      'item.loadFail': 'No se pudieron cargar los datos. Usá el botón para verlo en Wowhead.',
      'item.wowhead': 'Ver en Wowhead →', 'item.ilvl': 'Nivel de objeto {n}', 'item.loading': 'Cargando...',
      // Quests
      'quest.ph': 'ID de la misión, o nombre para buscar en Wowhead...', 'quest.btn': 'Ver',
      'quest.empty': 'Pegá el <strong>ID</strong> de una misión (el número en la URL de Wowhead, ej: <code style="color:#c8960c">quest=<u>40519</u></code>) para ver sus objetivos y recompensas.<br>Si escribís un nombre, te abro la búsqueda en Wowhead.',
      'quest.details': 'Detalles', 'quest.loadingWH': 'Cargando objetivos y recompensas...',
      'quest.title': 'Misión #{id}', 'quest.sub': 'Datos de Wowhead', 'quest.subLoading': 'Cargando datos de Wowhead...',
      'quest.hover': 'Pasá el mouse sobre el enlace para ver objetivos y recompensas',
      'quest.noData': 'Sin datos en Wowhead para esta misión.',
      'quest.loadFail': 'No se pudieron cargar los datos. Usá el botón para verla en Wowhead.',
      'quest.wowhead': 'Ver en Wowhead →',
      // Cookies
      'cookie.text': '🍪 Usamos cookies de <strong>Google Analytics</strong> para entender cómo se usa el sitio. No recopilamos datos personales. Podés rechazarlas sin problema.',
      'cookie.accept': 'Aceptar', 'cookie.reject': 'Rechazar',
      'lang.label': 'Idioma',
    },
    en: {
      'nav.armory': '⚔ Armory', 'nav.npc': '🐉 Find NPC', 'nav.item': '🗡 Find Item', 'nav.quests': '📜 Quests',
      'search.char': 'Character name...', 'search.btn': 'Search',
      'loading.char': 'Querying the Tauri Armory...',
      'err.tauri': 'Tauri error: ', 'err.net': 'Network error: ', 'alert.needName': 'Please enter a character name.',
      'ilvl.avg': 'Avg item level', 'bar.health': 'Health',
      'stats.attrs': 'Attributes', 'stats.off': 'Offensive', 'stats.def': 'Defensive',
      'stat.str': 'Strength', 'stat.agi': 'Agility', 'stat.sta': 'Stamina', 'stat.int': 'Intellect', 'stat.spi': 'Spirit',
      'stat.sp': 'Spell power', 'stat.crit': 'Crit', 'stat.haste': 'Haste', 'stat.mastery': 'Mastery',
      'stat.armor': 'Armor', 'stat.maxhealth': 'Max health', 'stat.maxOf': 'Max {p}',
      'lvl.line': 'Level {lvl} {race} {cls}',
      'npc.ph': 'NPC name (e.g. Thrall) or ID...',
      'npc.empty': 'Type an NPC name to see its 3D model and where to find it.<br>Not showing up? Paste its <strong>ID</strong> (the number in the Wowhead URL) and press Enter.',
      'npc.loading': 'Loading NPC...', 'npc.info': 'Information', 'npc.location': 'Location',
      'npc.wowhead': 'View on Wowhead →', 'npc.maphint': 'Dots = where the NPC spawns. Full map and filters on Wowhead.',
      'npc.loadingWH': 'Loading data from Wowhead...', 'npc.noData': 'No extra data on Wowhead.',
      'npc.loadFail': 'Could not load data. Use the button to view it on Wowhead.',
      'npc.noModel': 'No 3D model or image for this NPC.',
      'ac.empty': 'No results. If you know the ID (from the Wowhead URL), paste it and press Enter.',
      'item.ph': 'Item name (e.g. Iron Bar) or ID...',
      'item.empty': 'Search any item: crafting materials, weapons, armor, gems…<br>Not showing up? Paste its <strong>ID</strong> (the number in the Wowhead URL) and press Enter.',
      'item.loadingWH': 'Loading data from Wowhead...', 'item.noData': 'No data on Wowhead for this item.',
      'item.loadFail': 'Could not load data. Use the button to view it on Wowhead.',
      'item.wowhead': 'View on Wowhead →', 'item.ilvl': 'Item level {n}', 'item.loading': 'Loading...',
      'quest.ph': 'Quest ID, or a name to search on Wowhead...', 'quest.btn': 'View',
      'quest.empty': 'Paste a quest <strong>ID</strong> (the number in the Wowhead URL, e.g. <code style="color:#c8960c">quest=<u>40519</u></code>) to see its objectives and rewards.<br>If you type a name, I\'ll open the Wowhead search.',
      'quest.details': 'Details', 'quest.loadingWH': 'Loading objectives and rewards...',
      'quest.title': 'Quest #{id}', 'quest.sub': 'Data from Wowhead', 'quest.subLoading': 'Loading data from Wowhead...',
      'quest.hover': 'Hover the link to see objectives and rewards',
      'quest.noData': 'No data on Wowhead for this quest.',
      'quest.loadFail': 'Could not load data. Use the button to view it on Wowhead.',
      'quest.wowhead': 'View on Wowhead →',
      'cookie.text': '🍪 We use <strong>Google Analytics</strong> cookies to understand how the site is used. We don\'t collect personal data. You can decline, no problem.',
      'cookie.accept': 'Accept', 'cookie.reject': 'Decline',
      'lang.label': 'Language',
    },
  };

  // ── Datos dependientes del idioma ──
  const CLASS = {
    1:  { es: 'Guerrero', en: 'Warrior', color: '#C79C6E', power: { es: 'Furia', en: 'Rage' }, powerClass: 'rage' },
    2:  { es: 'Paladín', en: 'Paladin', color: '#F58CBA', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    3:  { es: 'Cazador', en: 'Hunter', color: '#ABD473', power: { es: 'Enfoque', en: 'Focus' }, powerClass: 'energy' },
    4:  { es: 'Pícaro', en: 'Rogue', color: '#FFF569', power: { es: 'Energía', en: 'Energy' }, powerClass: 'energy' },
    5:  { es: 'Sacerdote', en: 'Priest', color: '#FFFFFF', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    6:  { es: 'Caballero de la Muerte', en: 'Death Knight', color: '#C41F3B', power: { es: 'Runas', en: 'Runes' }, powerClass: 'energy' },
    7:  { es: 'Chamán', en: 'Shaman', color: '#0070DE', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    8:  { es: 'Mago', en: 'Mage', color: '#69CCF0', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    9:  { es: 'Brujo', en: 'Warlock', color: '#9482C9', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    10: { es: 'Monje', en: 'Monk', color: '#00FF96', power: { es: 'Energía', en: 'Energy' }, powerClass: 'energy' },
    11: { es: 'Druida', en: 'Druid', color: '#FF7D0A', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' },
    12: { es: 'Cazador de Demonios', en: 'Demon Hunter', color: '#A330C9', power: { es: 'Furia', en: 'Fury' }, powerClass: 'rage' },
  };
  const RACE = {
    1: { es: 'Humano', en: 'Human' }, 2: { es: 'Orco', en: 'Orc' }, 3: { es: 'Enano', en: 'Dwarf' },
    4: { es: 'Elfo de la noche', en: 'Night Elf' }, 5: { es: 'No-muerto', en: 'Undead' }, 6: { es: 'Tauren', en: 'Tauren' },
    7: { es: 'Gnomo', en: 'Gnome' }, 8: { es: 'Trol', en: 'Troll' }, 9: { es: 'Goblin', en: 'Goblin' },
    10: { es: 'Elfo de sangre', en: 'Blood Elf' }, 11: { es: 'Draenei', en: 'Draenei' },
    22: { es: 'Huargen', en: 'Worgen' }, 24: { es: 'Pandaren', en: 'Pandaren' }, 25: { es: 'Pandaren', en: 'Pandaren' },
  };
  const SLOT = {
    0: { es: 'Cabeza', en: 'Head' }, 1: { es: 'Cuello', en: 'Neck' }, 2: { es: 'Hombros', en: 'Shoulder' },
    3: { es: 'Espalda', en: 'Back' }, 4: { es: 'Pecho', en: 'Chest' }, 5: { es: 'Camisa', en: 'Shirt' },
    6: { es: 'Tabardo', en: 'Tabard' }, 7: { es: 'Muñecas', en: 'Wrist' }, 8: { es: 'Manos', en: 'Hands' },
    9: { es: 'Cintura', en: 'Waist' }, 10: { es: 'Piernas', en: 'Legs' }, 11: { es: 'Pies', en: 'Feet' },
    12: { es: 'Anillo 1', en: 'Ring 1' }, 13: { es: 'Anillo 2', en: 'Ring 2' }, 14: { es: 'Objeto 1', en: 'Trinket 1' },
    15: { es: 'Objeto 2', en: 'Trinket 2' }, 16: { es: 'Mano Ppal.', en: 'Main Hand' },
    17: { es: 'Mano Sec.', en: 'Off Hand' }, 18: { es: 'A distancia', en: 'Ranged' },
  };
  const CTYPE = {
    1: { es: 'Bestia', en: 'Beast' }, 2: { es: 'Dragón', en: 'Dragonkin' }, 3: { es: 'Demonio', en: 'Demon' },
    4: { es: 'Elemental', en: 'Elemental' }, 5: { es: 'Gigante', en: 'Giant' }, 6: { es: 'No-muerto', en: 'Undead' },
    7: { es: 'Humanoide', en: 'Humanoid' }, 8: { es: 'Alimaña', en: 'Critter' }, 9: { es: 'Mecánico', en: 'Mechanical' },
    10: { es: 'Indefinido', en: 'Not specified' }, 11: { es: 'Tótem', en: 'Totem' }, 12: { es: 'Mascota', en: 'Companion' },
    13: { es: 'Nube de gas', en: 'Gas Cloud' }, 14: { es: 'Mascota salvaje', en: 'Wild Pet' }, 15: { es: 'Aberración', en: 'Aberration' },
  };
  const CCLASS = {
    0: { es: 'Normal', en: 'Normal' }, 1: { es: 'Élite', en: 'Elite' }, 2: { es: 'Raro élite', en: 'Rare Elite' },
    3: { es: 'Jefe de banda', en: 'World Boss' }, 4: { es: 'Raro', en: 'Rare' },
  };
  const QUALITY = {
    0: { es: 'Pobre', en: 'Poor' }, 1: { es: 'Común', en: 'Common' }, 2: { es: 'Poco común', en: 'Uncommon' },
    3: { es: 'Raro', en: 'Rare' }, 4: { es: 'Épico', en: 'Epic' }, 5: { es: 'Legendario', en: 'Legendary' },
    6: { es: 'Artefacto', en: 'Artifact' }, 7: { es: 'Patrimonio', en: 'Heirloom' },
  };

  // ── API ──
  function t(key, vars) {
    let s = (STR[LANG] && STR[LANG][key]) || (STR.es[key]) || key;
    if (vars) for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }
  function tClass(id) {
    const c = CLASS[id] || { es: 'Desconocida', en: 'Unknown', color: '#cccccc', power: { es: 'Maná', en: 'Mana' }, powerClass: 'mana' };
    return { name: c[LANG], color: c.color, power: c.power[LANG], powerClass: c.powerClass };
  }
  function pick(map, id, fallback) { const e = map[id]; return e ? e[LANG] : (fallback || ''); }

  const RERENDER = [];

  window.i18n = {
    get lang() { return LANG; },
    t,
    tClass,
    raceName: (id) => pick(RACE, id, LANG === 'es' ? 'Desconocida' : 'Unknown'),
    slotName: (id) => pick(SLOT, id, ''),
    creatureType: (id) => pick(CTYPE, id, 'NPC'),
    creatureClass: (id) => pick(CCLASS, id, 'Normal'),
    quality: (id) => pick(QUALITY, id, ''),
    whLocale: () => (LANG === 'es' ? 6 : 0),
    whDomain: () => (LANG === 'es' ? 'es.wowhead.com' : 'www.wowhead.com'),
    mapLoc: () => (LANG === 'es' ? 'eses' : 'enus'),
    onLangChange: (fn) => RERENDER.push(fn),
    setLang(lang) {
      if (lang !== 'es' && lang !== 'en') return;
      LANG = lang;
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
      applyStatic();
      RERENDER.forEach(fn => { try { fn(); } catch (e) {} });
    },
  };

  // Aplica los strings estáticos marcados con data-i18n / data-i18n-ph / data-i18n-html
  function applyStatic() {
    document.documentElement.lang = LANG;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    // etiquetas de los slots del equipo (tooltip al pasar el mouse)
    for (let i = 0; i < 19; i++) {
      const slot = document.getElementById('slot-' + i);
      if (slot) slot.setAttribute('data-label', window.i18n.slotName(i));
    }
    const sel = document.getElementById('langSel');
    if (sel) sel.value = LANG;
  }

  document.addEventListener('DOMContentLoaded', applyStatic);
})();
