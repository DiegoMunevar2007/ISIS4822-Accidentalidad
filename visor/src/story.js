// Historia guiada en tres actos. Es un slideshow interactivo montado sobre el
// dashboard: cada paso fija un estado, resalta un panel y habilita un solo
// control. El dashboard sigue siendo el dashboard.

import { GRAVEDAD, PERIODOS, cambioPorGravedad, cambioPorCorredor } from './data.js';
import { fmt } from './charts.js';

const ACTS = [
  { name: 'Acto I', label: 'El montaje', steps: [0, 1, 2] },
  { name: 'Acto II', label: 'La evidencia', steps: [3, 4, 5] },
  { name: 'Acto III', label: 'La lectura', steps: [6, 7] },
];

const KEYS = ['tab', 'mapa', 'corredor', 'sitio', 'periodo', 'gravedad', 'radio', 'excluirCruce', 'serieModo', 'velModo', 'ctrlOn', 'rango', 'actor'];

const TAB_LABEL = { mapa: 'Mapa y ficha', serie: 'Serie', panorama: 'Panorama', ab: 'Meses A/B' };

export function initStory({ set, getState, defaults, D, hideLanding }) {
  const el = document.getElementById('story');
  const kicker = document.getElementById('story-kicker');
  const progress = document.getElementById('story-progress');
  const title = document.getElementById('story-title');
  const body = document.getElementById('story-body');
  const hint = document.getElementById('story-hint');
  const warn = document.getElementById('story-warn');
  const stateEl = document.getElementById('story-state');
  const back = document.getElementById('story-back');
  const next = document.getElementById('story-next');
  const close = document.getElementById('story-close');
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  let active = false;
  let i = 0;
  let applying = false;
  let offTrack = false;
  let snap = null;
  let base = null;
  let M = null;

  const reset = () => ({ ...defaults(), clases: new Set(D.meta.clases) });
  const clone = (s) => ({ ...s, clases: new Set(s.clases ?? D.meta.clases) });
  const pick = (s) => Object.fromEntries(KEYS.map((k) => [k, s[k]]));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  function metrics() {
    const st = reset();
    st.gravedad = 'fatal';
    const byGrav = cambioPorGravedad(D, st);
    const corridors = cambioPorCorredor(D, { ...st, gravedad: 'grave' });
    return { byGrav, corridors };
  }
  const g = (k) => M.byGrav.find((x) => x.key === k) ?? M.byGrav[0];
  const fatal = () => g('fatal');
  const grave = () => g('grave');

  const STEPS = [
    {
      act: 0,
      title: '92 cámaras, 40 sitios, una promesa',
      body: () => `Bogotá instaló <b>92 cámaras</b> en <b>40 sitios</b> de 18 corredores entre nov-2019 y mar-2020. Los sitios se eligieron por ser críticos. El visor cruza <b>${fmt.int(D.rows.n)}</b> siniestros georreferenciados con esa geografía.`,
      hint: 'Pasa el cursor por los puntos del mapa: cada uno es un sitio de cámara.',
      patch: { ...reset(), tab: 'mapa', mapa: true, gravedad: 'fatal' },
      focus: ['#panel-map', '#panel-ficha'],
    },
    {
      act: 0,
      title: 'La instalación coincidió con la pandemia',
      body: () => `La banda gris marca la instalación y 2020. Ese año el tráfico cayó por la pandemia y las multas empezaron en mayo de 2020. Un antes/después simple mezclaría las cámaras con todo lo demás.`,
      hint: 'Arrastra sobre la franja inferior para acercar la serie; vuelve a arrastrar para alejar.',
      patch: { ...reset(), tab: 'serie', mapa: false, serieModo: 'linea', gravedad: 'fatal' },
      focus: ['#panel-serie'],
      spot: '#s-context',
      allow: ['rango'],
    },
    {
      act: 0,
      title: 'Comparamos contra vías medidas sin cámara',
      body: () => `El control son tramos que Bitcarrier mide y que están a más de <b>500 m</b> de cualquier cámara. Si las cámaras funcionaran, la línea morada debería caer más que la verde.`,
      hint: 'Enciende y apaga «Ver control» en la leyenda para ver qué añade la comparación.',
      patch: { ...reset(), tab: 'serie', mapa: false, serieModo: 'control', gravedad: 'fatal', ctrlOn: true },
      focus: ['#panel-serie'],
      spot: '#s-main',
      allow: ['ctrlOn'],
    },
    {
      act: 1,
      title: 'En agregado, el control mejoró más',
      body: () => {
        const f = fatal();
        return `Con muertos, la zona con cámara pasó de <b>${fmt.dec(f.zona.ma)}</b> a <b>${fmt.dec(f.zona.md)}</b> casos por mes (${fmt.pct(f.zona.cambio)}); el control bajó de ${fmt.dec(f.control.ma)} a ${fmt.dec(f.control.md)} (${fmt.pct(f.control.cambio)}). Con heridos o muertos y con todos, el control también mejoró más.`;
      },
      hint: 'Cambia la gravedad: la fila se ilumina y el resto del visor se recalcula.',
      patch: { ...reset(), tab: 'panorama', gravedad: 'fatal' },
      focus: ['#panel-panorama'],
      spot: '#pan-gravedad-wrap',
      allow: ['gravedad'],
    },
    {
      act: 1,
      title: 'El promedio esconde 18 corredores',
      body: () => {
        const vals = M.corridors.map((c) => c.cambio).filter((v) => v != null);
        const ctrl = grave().control.cambio;
        const mejor = Math.min(...vals);
        const peor = Math.max(...vals);
        const nMejor = vals.filter((v) => v < ctrl).length;
        return `Cada punto es el cambio de la zona con cámara de un corredor. Van de <b>${fmt.pct(mejor)}</b> a <b>${fmt.pct(peor)}</b>: ${nMejor} de ${vals.length} caen por debajo del control de la ciudad (${fmt.pct(ctrl)}). El promedio no los representa.`;
      },
      hint: 'Haz clic en un corredor para ver su antes/después y su N.',
      patch: { ...reset(), tab: 'panorama', gravedad: 'grave' },
      focus: ['#panel-panorama'],
      spot: '#pan-corredores-wrap',
      allow: ['corredor', 'sitio'],
    },
    {
      act: 1,
      title: 'La velocidad bajó en algunos corredores',
      body: () => `En los tramos con cámara, la velocidad P85 cambió más que en los tramos sin cámara en varios corredores. Es la velocidad del flujo, no la del vehículo del siniestro: un mecanismo posible, no una prueba.`,
      hint: 'Alterna «Con cámara» y «Sin cámara» para comparar las dos series.',
      patch: { ...reset(), tab: 'serie', mapa: false, serieModo: 'control', gravedad: 'grave', velModo: 'ambas' },
      focus: ['#panel-serie'],
      spot: '#v-chart',
      allow: ['velModo'],
    },
    {
      act: 2,
      title: 'Tres razones para no llamarlo efecto',
      body: () => `Los sitios se eligieron por ser críticos: la regresión a la media juega en contra. La pandemia cambió la línea base. Y los casos fatales son pocos: <b>${fmt.int(fatal().n)}</b> en la zona con cámara en cuatro años. El diseño es descriptivo, no causal.`,
      hint: 'Abre cada tarjeta para ver el detalle.',
      patch: { ...reset(), tab: 'mapa', mapa: false, gravedad: 'grave' },
      focus: ['#panel-ficha'],
      cards: [
        { title: 'Regresión a la media', text: 'Los sitios se eligieron porque tenían muchos siniestros. Es esperable que bajen algo aunque la cámara no haga nada; por eso el control es la referencia.' },
        { title: 'Pandemia', text: '2020 cambió la movilidad y la línea base. 2019 y 2021–22 no son mundos comparables; el control ayuda, pero no elimina el problema.' },
        { title: 'Pocos casos', text: 'Los siniestros fatales son raros por corredor. Un cambio de +25 % puede ser ruido; por eso mostramos N y promedios mensuales.' },
      ],
    },
    {
      act: 2,
      title: 'Lo que sí podemos decir',
      body: () => `No encontramos que, en conjunto, las cámaras redujeran los siniestros más que el control. Hay corredores donde la mejora coincide; este diseño no permite atribuirla. El visor queda abierto para que lo compruebes.`,
      hint: 'Cierra la historia y explora: elige un corredor, oculta el mapa y compara dos meses en A/B.',
      patch: { ...reset(), tab: 'mapa', mapa: true, gravedad: 'fatal' },
      focus: ['#panel-map', '#panel-ficha'],
      allowAll: true,
    },
  ];

  function chips() {
    const st = getState();
    const sitio = st.sitio && D.geo.sitios.find((s) => s.id === st.sitio);
    const ambito = sitio ? `${sitio.corredor} · ${sitio.via}` : st.corredor ?? 'Bogotá';
    const items = [
      ambito,
      GRAVEDAD[st.gravedad].short,
      PERIODOS[st.periodo].label,
      `${st.radio} m`,
      TAB_LABEL[st.tab] ?? st.tab,
    ];
    if (st.actor) items.push('con actor');
    if (st.excluirCruce) items.push('sin cruces');
    return items.map((t) => `<span>${t}</span>`).join('');
  }

  function renderRail() {
    const s = STEPS[i];
    const act = ACTS[s.act];
    kicker.textContent = `${act.name} · ${act.label} · Paso ${i + 1} de ${STEPS.length}`;
    title.textContent = s.title;
    body.innerHTML = typeof s.body === 'function' ? s.body() : s.body;
    if (s.cards) {
      const wrap = document.createElement('div');
      wrap.className = 'story-cards';
      wrap.innerHTML = s.cards.map((c) => `<details><summary>${c.title}</summary><p>${c.text}</p></details>`).join('');
      body.appendChild(wrap);
    }
    hint.textContent = s.hint ?? '';
    hint.hidden = !s.hint;
    stateEl.innerHTML = chips();
    back.disabled = i === 0;
    next.textContent = i === STEPS.length - 1 ? 'Explorar el visor' : 'Siguiente';
    progress.innerHTML = ACTS.map((a, ai) => `
      <div class="story-act${ai === s.act ? ' on' : ''}">
        <b>${a.name}</b>
        <div class="story-dots">${a.steps.map((k) => `<button data-step="${k}" class="${k === i ? 'on' : ''}" aria-label="Paso ${k + 1}: ${STEPS[k].title}" ${k === i ? 'aria-current="step"' : ''}></button>`).join('')}</div>
        <em>${a.label}</em>
      </div>`).join('');
    if (offTrack && !s.allowAll) {
      warn.hidden = false;
      warn.innerHTML = `Estás explorando libremente; el texto describe el paso ${i + 1}. <button type="button" id="story-return">Volver al paso</button>`;
    } else {
      warn.hidden = true;
      warn.innerHTML = '';
    }
  }

  function focusStep() {
    document.querySelectorAll('.story-focus,.story-spot').forEach((n) => n.classList.remove('story-focus', 'story-spot'));
    const s = STEPS[i];
    for (const sel of s.focus ?? []) document.querySelector(sel)?.classList.add('story-focus');
    if (s.spot) {
      const spot = document.querySelector(s.spot);
      if (spot) {
        spot.classList.add('story-spot');
        spot.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      }
    }
  }

  function applyStep(k) {
    i = Math.max(0, Math.min(STEPS.length - 1, k));
    applying = true;
    offTrack = false;
    set({ ...STEPS[i].patch });
    applying = false;
    base = pick(getState());
    focusStep();
    renderRail();
    updateURL();
  }

  function start(k = 0) {
    if (active) return applyStep(k);
    snap = clone(getState());
    M = metrics();
    active = true;
    hideLanding?.();
    document.body.classList.add('story-on');
    el.hidden = false;
    applyStep(k);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
  }

  function stop() {
    if (!active) return;
    active = false;
    offTrack = false;
    document.body.classList.remove('story-on');
    el.hidden = true;
    document.querySelectorAll('.story-focus,.story-spot').forEach((n) => n.classList.remove('story-focus', 'story-spot'));
    updateURL();
    if (snap) {
      applying = true;
      set(snap);
      applying = false;
      snap = null;
    }
    setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
  }

  function updateURL() {
    try {
      const u = new URL(location.href);
      if (active) u.searchParams.set('historia', String(i + 1));
      else u.searchParams.delete('historia');
      history.replaceState(null, '', u.toString());
    } catch { /* sin historial */ }
  }

  function onStateChange(st) {
    if (!active || applying || !base) return;
    stateEl.innerHTML = chips();
    if (STEPS[i].allowAll) return;
    const allow = STEPS[i].allow ?? [];
    const changed = KEYS.filter((k) => !same(st[k], base[k]));
    const off = changed.some((k) => !allow.includes(k));
    if (off !== offTrack) {
      offTrack = off;
      renderRail();
    }
  }

  // ------------------------------------------------------------ eventos
  document.getElementById('btn-story')?.addEventListener('click', () => start(0));
  document.getElementById('btn-story-start')?.addEventListener('click', () => start(0));
  close.addEventListener('click', stop);
  back.addEventListener('click', () => applyStep(i - 1));
  next.addEventListener('click', () => {
    if (i >= STEPS.length - 1) stop();
    else applyStep(i + 1);
  });
  progress.addEventListener('click', (e) => {
    const k = e.target.closest('button')?.dataset.step;
    if (k != null) applyStep(+k);
  });
  warn.addEventListener('click', (e) => {
    if (e.target.id === 'story-return') applyStep(i);
  });
  document.addEventListener('keydown', (e) => {
    if (!active) return;
    const t = e.target;
    if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName)) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); if (i < STEPS.length - 1) applyStep(i + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); if (i > 0) applyStep(i - 1); }
    if (e.key === 'Escape') stop();
  });

  // Enlace directo: ?historia=4
  const params = new URLSearchParams(location.search);
  if (params.has('historia')) {
    const k = Math.max(0, Math.min(STEPS.length - 1, (parseInt(params.get('historia'), 10) || 1) - 1));
    setTimeout(() => start(k), 0);
  }

  return { start, stop, onStateChange };
}
