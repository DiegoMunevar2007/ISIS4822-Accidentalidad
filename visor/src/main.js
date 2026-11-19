import './style.css';
import {
  loadData, baseMask, scopeTest, zonaTest, controlTest, porMes, porDia, antesDespues, victimasPorCondicion,
  sitiosDelAmbito, camarasActivas, velocidadDelAmbito, sumRange, PERIODOS, GRAVEDAD, ACTORES, CLASE_LABEL,
  ANIOS, MESES_CORTOS, mesLabel, N_MESES, cambioPorGravedad, cambioPorCorredor,
} from './data.js';
import { C, fmt, annualBars, pairedBars, lineChart, contextBrush, legendHtml, meter, dumbbell, corridorDots } from './charts.js';
import { createMap } from './map.js';
import { initTour } from './tour.js';
import { initStory } from './story.js';
import { enhanceSelects, syncSelects } from './select.js';

const $ = (s) => document.querySelector(s);
const MES_A_DEF = 10; // nov 2019
const MES_B_DEF = 34; // nov 2021

const defaults = () => ({
  tab: 'mapa',
  corredor: null,
  sitio: null,
  periodo: 'todo',
  gravedad: 'fatal',
  clases: null, // se llena al cargar
  actor: null,
  radio: 500,
  excluirCruce: false,
  mapa: true,
  serieModo: 'linea',
  velModo: 'ambas',
  ctrlOn: true,
  rango: null, // [día0, día1] del brush
  mesA: MES_A_DEF,
  mesB: MES_B_DEF,
  abClick: 'A',
});

let D;
let st = defaults();
let mapCtl;
let storyCtl = null;
let cache = {};

// ---------------------------------------------------------------- utilidades de fechas
const monthStartDay = [];
for (let m = 0; m <= N_MESES; m++) {
  const d = new Date(2019 + Math.floor(m / 12), m % 12, 1);
  monthStartDay.push(Math.round((d - new Date(2019, 0, 1)) / 864e5));
}
const dayDate = (d) => new Date(2019, 0, 1 + d);
const fmtDia = (d) => {
  const dt = dayDate(d);
  return `${dt.getDate()} ${MESES_CORTOS[dt.getMonth()]} ${dt.getFullYear()}`;
};
const INSTALACION = [322, 451]; // 19-nov-2019 .. 27-mar-2020
const OPERACION = monthStartDay[16]; // may-2020

// ---------------------------------------------------------------- textos de ámbito
function nombreAmbito() {
  if (st.sitio) {
    const s = D.geo.sitios.find((x) => x.id === st.sitio);
    return `${s.corredor} · ${s.via}`;
  }
  return st.corredor ?? 'Bogotá';
}
function nombreZona() {
  if (st.sitio || st.corredor) return nombreAmbito();
  return `Zonas con cámara (≤ ${st.radio} m)`;
}
const gravLabel = () => GRAVEDAD[st.gravedad].label;

// ---------------------------------------------------------------- cálculo (memo por estado de filtros)
function compute() {
  const keyBase = JSON.stringify([st.gravedad, [...st.clases], st.actor, st.excluirCruce]);
  const keyScope = JSON.stringify([keyBase, st.corredor, st.sitio, st.radio]);
  if (cache.keyBase !== keyBase) {
    cache = { keyBase, mask: baseMask(D, st) };
  }
  if (cache.keyScope !== keyScope) {
    const mask = cache.mask;
    const scope = scopeTest(D, st);
    const zona = zonaTest(D, st);
    const ctrl = controlTest(D, st);
    const all = () => true;
    cache.keyScope = keyScope;
    cache.scope = scope;
    cache.mScope = porMes(D, mask, scope);
    cache.dScope = porDia(D, mask, scope);
    cache.mZona = st.sitio || st.corredor ? cache.mScope : porMes(D, mask, zona);
    cache.mCtrl = porMes(D, mask, ctrl);
    cache.mBogota = porMes(D, mask, all);
    // todos los siniestros (sin filtro de gravedad) para el conteo A/B
    const maskTodos = baseMask(D, { ...st, gravedad: 'todos' });
    cache.mScopeTodos = porMes(D, maskTodos, zona);
    cache.vict = victimasPorCondicion(D, mask, zona, st.gravedad);
    cache.victMes = victimasMes(mask, zona);
    // conteo por sitio (para hover del mapa) en el periodo completo
    const R = st.radio;
    const cnt = new Map();
    const { rows } = D;
    for (let i = 0; i < rows.n; i++) {
      if (!mask[i] || rows.dc[i] > R) continue;
      const id = D.meta.sitios[rows.s[i]];
      cnt.set(id, (cnt.get(id) ?? 0) + 1);
    }
    cache.conteoSitio = cnt;
  }
  return cache;
}

function victimasMes(mask, test) {
  const V = D.victimas;
  const out = new Float64Array(N_MESES);
  for (let j = 0; j < V.row.length; j++) {
    if (V.grav[j] !== 2) continue;
    const i = V.row[j];
    if (mask[i] && test(i)) out[D.rows.m[i]] += V.cnt[j];
  }
  return out;
}

// ---------------------------------------------------------------- render principal
function render() {
  const K = compute();
  const P = PERIODOS[st.periodo];

  // pestañas y layout
  document.querySelectorAll('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === st.tab));
  const stage = $('#stage');
  stage.className = `stage tab-${st.tab} ${st.mapa ? 'map-on' : 'map-off'}`;
  $('#map-rail').hidden = st.tab === 'ab' || st.tab === 'panorama' || st.mapa;
  $('#ab-controls').hidden = st.tab !== 'ab';
  $('#panel-map').hidden = st.tab === 'ab' || st.tab === 'panorama' || !st.mapa;
  $('#panel-ficha').hidden = st.tab !== 'mapa';
  $('#panel-serie').hidden = !(st.tab === 'serie' || (st.tab === 'mapa' && !st.mapa));
  $('#panel-panorama').hidden = st.tab !== 'panorama';
  $('#panel-ab').hidden = st.tab !== 'ab';

  // controles
  setSeg('#seg-periodo', st.periodo);
  setSeg('#seg-gravedad', st.gravedad);
  $('#sel-corredor').value = st.corredor ?? '';
  fillSitios();
  $('#sel-sitio').value = st.sitio ?? '';
  $('#sel-actor').value = st.actor ?? '';
  $('#rng-radio').value = st.radio;
  $('#radio-val').textContent = `${st.radio} m`;
  $('#chk-cruce').checked = st.excluirCruce;
  document.querySelectorAll('#chips-clase button').forEach((b) => b.setAttribute('aria-pressed', st.clases.has(b.dataset.v)));
  const nMore = (st.clases.size < D.meta.clases.length ? 1 : 0) + (st.actor ? 1 : 0) + (st.radio !== 500 ? 1 : 0) + (st.excluirCruce ? 1 : 0);
  $('#more-count').textContent = nMore ? `· ${nMore} activo${nMore > 1 ? 's' : ''}` : '';
  $('#sel-mes-a').value = st.mesA;
  $('#sel-mes-b').value = st.mesB;

  renderScopeLine(K, P);
  if (!$('#panel-map').hidden) renderMap(K, P);
  if (!$('#panel-ficha').hidden) renderFicha(K, P);
  if (!$('#panel-serie').hidden) renderSerie(K, P);
  if (!$('#panel-panorama').hidden) renderPanorama(K, P);
  if (!$('#panel-ab').hidden) renderAB(K);
  syncSelects();
}

function setSeg(sel, v) {
  document.querySelectorAll(`${sel} button`).forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
}

function renderScopeLine(K, P) {
  const sitios = sitiosDelAmbito(D, st);
  const nCam = sitios.reduce((a, s) => a + s.n_camaras, 0);
  const clases = st.clases.size === D.meta.clases.length ? 'todos los tipos' : [...st.clases].map((c) => CLASE_LABEL[c]).join(', ');
  const actor = st.actor ? ACTORES.find((a) => a[0] === st.actor)[1].toLowerCase() : null;
  let donde;
  if (st.sitio) donde = `<b>${nombreAmbito()}</b> · ≤ ${st.radio} m · ${nCam} cámara${nCam > 1 ? 's' : ''}`;
  else if (st.corredor) donde = `<b>${st.corredor}</b> · ${sitios.length} sitio${sitios.length > 1 ? 's' : ''} · ≤ ${st.radio} m`;
  else donde = `<b>Bogotá</b> · ${sitios.length} sitios · ${nCam} cámaras`;
  const extra = [clases !== 'todos los tipos' ? clases : null, actor ? `con ${actor}` : null, st.excluirCruce ? 'sin cruces ambiguos' : null].filter(Boolean).join(' · ');
  $('#scope-line').innerHTML = `${donde} · ${gravLabel()}${extra ? ` · ${extra}` : ''} · <b>${st.tab === 'ab' ? 'meses A/B' : P.label}</b>`;
}

// ---------------------------------------------------------------- mapa
function renderMap(K, P) {
  const { rows } = D;
  const mask = K.mask;
  const scope = K.scope;
  const d0 = monthStartDay[P.m0];
  const d1 = monthStartDay[P.m1 + 1] - 1;
  const lat = [], lon = [], g = [];
  for (let i = 0; i < rows.n; i++) {
    if (!mask[i] || rows.d[i] < d0 || rows.d[i] > d1 || !scope(i)) continue;
    lat.push(rows.lat[i]);
    lon.push(rows.lon[i]);
    g.push(rows.g[i]);
  }
  const sitiosAmbito = sitiosDelAmbito(D, st);
  mapCtl.update(st, {
    pts: { lat, lon, g, n: lat.length },
    sitiosAmbito,
    conteoSitio: K.conteoSitio,
    gravLabel: GRAVEDAD[st.gravedad].short === 'todos' ? 'siniestros' : `siniestros ${GRAVEDAD[st.gravedad].short}`,
  });
  $('#map-title').textContent = `${nombreAmbito()} · mapa`;
  $('#map-sub').textContent = `${fmt.int(lat.length)} ${gravLabel()} · ${P.label}`;
  const gravs = GRAVEDAD[st.gravedad].min;
  $('#map-legend').innerHTML = `
    <span><i class="lg-sitio"></i>Sitio de cámara (tamaño = n.º de cámaras)</span>
    <span><i class="lg-line" style="background:${C.despues}"></i>Corredor seleccionado</span>
    <span><i class="lg-line" style="background:#8a93a0"></i>Tramo con cámara · <i class="lg-line" style="background:#c2c9d2"></i>sin cámara</span>
    <span><i class="lg-dot" style="background:#c23128"></i>Con muertos${gravs <= 1 ? ` <i class="lg-dot" style="background:#eb6834"></i>Con heridos` : ''}${gravs === 0 ? ` <i class="lg-dot" style="background:#9aa2ae"></i>Solo daños` : ''}</span>
    <span class="muted">${st.corredor || st.sitio ? 'Clic en otro sitio o «Quitar selección».' : 'Clic en un sitio o tramo.'}</span>`;
}

// ---------------------------------------------------------------- ficha
function renderFicha(K, P) {
  const el = $('#panel-ficha');
  const years = ANIOS.filter((y, i) => i * 12 >= P.m0 && i * 12 <= P.m1);
  const N = sumRange(K.mScope, P.m0, P.m1);
  const zonaAD = antesDespues(K.mZona);
  const ctrlAD = antesDespues(K.mCtrl);
  const sitios = sitiosDelAmbito(D, st);
  const nCam = sitios.reduce((a, s) => a + s.n_camaras, 0);
  const diff = zonaAD.cambio != null && ctrlAD.cambio != null ? zonaAD.cambio - ctrlAD.cambio : null;
  const pp = diff == null ? '—' : `${diff > 0 ? '+' : ''}${fmt.dec(diff * 100)} p.p`;
  const lectura =
    diff == null ? 'No hay suficientes datos en este ámbito para comparar.'
      : zonaAD.antes + zonaAD.despues < 30 ? `Pocos casos (${fmt.int(zonaAD.antes + zonaAD.despues)}): interpreta con cautela.`
        : diff < -0.05 ? 'La zona con cámara mejoró más que el control.'
          : diff > 0.05 ? 'La zona con cámara evolucionó peor que el control.'
            : 'La zona con cámara y el control evolucionaron de forma parecida.';

  el.innerHTML = `
    <header class="panel-head">
      <div><h2>${nombreAmbito()} · ficha</h2><p class="sub">${P.label} · ${gravLabel()}</p></div>
    </header>
    <p class="kpi">N = ${fmt.int(N)} <span>· ${years.length} año${years.length > 1 ? 's' : ''} visible${years.length > 1 ? 's' : ''}</span></p>
    <div id="f-anual" class="chart"></div>
    <h3 class="sec">Antes vs. después <span>prom. mensual · 2019 vs. 2021–22</span></h3>
    <div class="legend-inline"><span><i style="background:${C.antes}"></i>Antes 2019</span><span><i style="background:${C.despues}"></i>Después 2021–22</span></div>
    <div id="f-ad"></div>
    <p class="read"><b>Diferencia contra el control: ${pp}.</b> ${lectura}</p>
    <h3 class="sec">Víctimas ${st.gravedad === 'fatal' ? 'fatales' : 'heridas o fatales'} por condición <span>prom. mensual · ${nombreZona()}</span></h3>
    <div id="f-vict"></div>
    <h3 class="sec">Cámaras en el ámbito</h3>
    <p class="cams">${sitios.length} sitio${sitios.length > 1 ? 's' : ''} · ${nCam} cámaras · ${[...new Set(sitios.map((s) => s.tipo))].join(' / ')} · límite ${[...new Set(sitios.map((s) => s.limite))].sort().join('/')} km/h · resoluciones ${d3min(sitios.map((s) => s.fecha))} a ${d3max(sitios.map((s) => s.fecha))}</p>
    <p class="caveat">Cambio descriptivo, no causal. Se compara el promedio mensual (antes: 12 meses; después: 24).</p>`;

  annualBars($('#f-anual'), years.map((y) => {
    const i = y - 2019;
    return { year: y, n: sumRange(K.mScope, i * 12, i * 12 + 11) };
  }), {
    yMax: Math.max(...ANIOS.map((y, i) => sumRange(K.mScope, i * 12, i * 12 + 11))),
    onHover: (d) => `<b>${d.year}</b>${d.year === 2020 ? ' · transición (pandemia e instalación)' : ''}<br>${fmt.int(d.n)} ${gravLabel()}<br>${fmt.dec(d.n / 12)} por mes`,
  });
  pairedBars($('#f-ad'), [
    { label: nombreZona(), a: zonaAD.ma, b: zonaAD.md, delta: zonaAD.cambio,
      tip: `<b>${nombreZona()}</b><br>2019: ${fmt.int(zonaAD.antes)} (${fmt.dec(zonaAD.ma)}/mes)<br>2021–22: ${fmt.int(zonaAD.despues)} (${fmt.dec(zonaAD.md)}/mes)` },
    { label: `Control: vías medidas a > ${st.radio} m de cámaras`, a: ctrlAD.ma, b: ctrlAD.md, delta: ctrlAD.cambio,
      tip: `<b>Control</b> (tramos Bitcarrier sin cámara cerca, toda la ciudad)<br>2019: ${fmt.int(ctrlAD.antes)} (${fmt.dec(ctrlAD.ma)}/mes)<br>2021–22: ${fmt.int(ctrlAD.despues)} (${fmt.dec(ctrlAD.md)}/mes)<br><span class="muted">Escala propia: compara el % de cambio, no la longitud.</span>` },
  ].map((r) => ({ ...r, max: Math.max(r.a, r.b) })), { max: undefined, fmtVal: fmt.dec });
  // cada fila con su propia escala (zona y control tienen magnitudes muy distintas)
  document.querySelectorAll('#f-ad .pb-row').forEach((row, k) => {
    const r = [zonaAD, ctrlAD][k];
    const mx = Math.max(r.ma, r.md) || 1;
    const bars = row.querySelectorAll('.pb-bar');
    bars[0].style.width = `${(100 * r.ma) / mx}%`;
    bars[1].style.width = `${(100 * r.md) / mx}%`;
  });
  pairedBars($('#f-vict'), K.vict.filter((v) => v.antes + v.despues > 0).map((v) => ({
    label: v.condicion, a: v.ma, b: v.md, delta: v.ma > 0 ? (v.md - v.ma) / v.ma : null,
    tip: `<b>${v.condicion}</b><br>2019: ${fmt.int(v.antes)} víctimas (${fmt.dec(v.ma)}/mes)<br>2021–22: ${fmt.int(v.despues)} (${fmt.dec(v.md)}/mes)`,
  })), { fmtVal: fmt.dec });
  if (!K.vict.some((v) => v.antes + v.despues > 0)) $('#f-vict').innerHTML = '<p class="muted">Sin víctimas registradas con estos filtros.</p>';
}
const d3min = (a) => a.reduce((x, y) => (y < x ? y : x));
const d3max = (a) => a.reduce((x, y) => (y > x ? y : x));

// ---------------------------------------------------------------- serie
function renderSerie(K, P) {
  const el = $('#panel-serie');
  const modos = [['linea', 'Línea de tiempo'], ['anios', 'Años superpuestos'], ['control', 'Cámara vs. control']];
  el.innerHTML = `
    <header class="panel-head">
      <div><h2>${nombreAmbito()} · serie</h2><p class="sub" id="s-sub"></p></div>
      <div class="seg small" id="seg-modo">${modos.map(([v, l]) => `<button data-v="${v}" aria-pressed="${st.serieModo === v}">${l}</button>`).join('')}</div>
    </header>
    <div id="s-legend"></div>
    <div id="s-main" class="chart"></div>
    <div id="s-context" class="chart"></div>
    <p class="note" id="s-note"></p>
    <h3 class="sec">Velocidad del tráfico <span id="v-sub"></span></h3>
    <div class="serie-subhead">
      <div id="v-legend"></div>
      <div class="seg small" id="seg-vel" aria-label="Series de velocidad">
        <button data-v="ambas" aria-pressed="${st.velModo === 'ambas'}">Ambas</button>
        <button data-v="cam" aria-pressed="${st.velModo === 'cam'}">Con cámara</button>
        <button data-v="sin" aria-pressed="${st.velModo === 'sin'}">Sin cámara</button>
      </div>
    </div>
    <div id="v-chart" class="chart"></div>
    <p class="caveat" id="v-note"></p>`;
  el.querySelectorAll('#seg-modo button').forEach((b) => b.addEventListener('click', () => set({ serieModo: b.dataset.v })));
  el.querySelectorAll('#seg-vel button').forEach((b) => b.addEventListener('click', () => set({ velModo: b.dataset.v })));

  if (st.serieModo === 'linea') serieLinea(K, P);
  else if (st.serieModo === 'anios') serieAnios(K, P);
  else serieControl(K, P);
  serieVelocidad(P);
}

function granularidad(span) {
  if (span <= 100) return 'dia';
  if (span <= 400) return 'semana';
  return 'mes';
}

function serieLinea(K, P) {
  const r = st.rango ?? [monthStartDay[P.m0], monthStartDay[P.m1 + 1] - 1];
  const gran = granularidad(r[1] - r[0]);
  let xs = [], ys = [], lab = [];
  if (gran === 'mes') {
    for (let m = 0; m < N_MESES; m++) {
      xs.push(monthStartDay[m] + 14);
      ys.push(K.mScope[m]);
      lab.push(mesLabel(m));
    }
  } else if (gran === 'semana') {
    // semanas que empiezan en lunes (1-ene-2019 fue martes)
    for (let w0 = -1; w0 < 1461; w0 += 7) {
      let s = 0;
      for (let d = Math.max(0, w0); d < Math.min(1461, w0 + 7); d++) s += K.dScope[d];
      xs.push(w0 + 3);
      ys.push(s);
      lab.push(`Semana del ${fmtDia(Math.max(0, w0))}`);
    }
  } else {
    for (let d = 0; d < 1461; d++) {
      xs.push(d);
      ys.push(K.dScope[d]);
      lab.push(`${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][dayDate(d).getDay()]} ${fmtDia(d)}`);
    }
  }
  // escala fija: máximo de toda la serie a esta granularidad
  const yMax = Math.max(1, ...ys);
  const inR = xs.map((x) => x >= r[0] - 16 && x <= r[1] + 16);
  const gl = { mes: 'meses', semana: 'semanas', dia: 'días' }[gran];
  $('#s-sub').textContent = `${fmtDia(r[0])} – ${fmtDia(r[1])} · por ${gl} · ${gravLabel()} · escala fija 0–${fmt.int(yMax)}`;
  const nIn = ys.reduce((a, v, i) => a + (inR[i] ? v : 0), 0);
  lineChart($('#s-main'), {
    xs: xs.filter((_, i) => inR[i]),
    series: [{ key: 'z', label: nombreAmbito(), color: C.ink, ys: ys.filter((_, i) => inR[i]) }],
    xDomain: r, yMax,
    xTicks: tickDays(r, gran), xTickFormat: (d) => tickFmt(d, gran),
    bands: [{ x0: INSTALACION[0], x1: INSTALACION[1], label: 'Instalación' }, { x0: monthStartDay[12], x1: monthStartDay[24], label: '' }],
    vlines: [{ x: OPERACION, label: 'Multas desde may-2020', color: C.ink2, dash: true }],
    tooltip: (i) => {
      const k = xs.findIndex((x) => x === xs.filter((_, j) => inR[j])[i]);
      return `<b>${lab[k]}</b><br>${fmt.int(ys[k])} ${gravLabel()}`;
    },
    height: 250,
  });
  $('#s-legend').innerHTML = '';
  contextBrush($('#s-context'), {
    monthly: [...K.mScope], monthStartDay, range: st.rango,
    onBrush: (rg) => set({ rango: rg }),
  });
  $('#s-note').innerHTML = `N = ${fmt.int(nIn)} en el rango. <b>Arrastra la franja de abajo</b> para acercar (meses → semanas → días). La banda gris marca la instalación.`;
}

function tickDays([a, b], gran) {
  const out = [];
  if (gran === 'mes') {
    const span = b - a;
    const step = span > 900 ? 6 : span > 500 ? 3 : 1;
    for (let m = 0; m <= N_MESES; m += step) if (monthStartDay[m] >= a && monthStartDay[m] <= b) out.push(monthStartDay[m]);
  } else if (gran === 'semana') {
    for (let m = 0; m <= N_MESES; m++) if (monthStartDay[m] >= a && monthStartDay[m] <= b) out.push(monthStartDay[m]);
  } else {
    const step = b - a > 50 ? 7 : b - a > 20 ? 3 : 1;
    for (let d = a; d <= b; d += step) out.push(d);
  }
  return out;
}
function tickFmt(d, gran) {
  const dt = dayDate(d);
  if (gran === 'dia') return `${dt.getDate()} ${MESES_CORTOS[dt.getMonth()]}`;
  return dt.getMonth() === 0 ? String(dt.getFullYear()) : MESES_CORTOS[dt.getMonth()];
}

const COL_ANIO = { 2019: C.antes, 2020: C.y2020, 2021: C.y2021, 2022: C.y2022 };
function serieAnios(K, P) {
  const years = ANIOS.filter((y, i) => i * 12 >= P.m0 && i * 12 <= P.m1);
  const series = years.map((y) => ({
    key: y, label: String(y), color: COL_ANIO[y], dash: y === 2020, width: y === 2020 ? 1.5 : 2.25,
    ys: Array.from({ length: 12 }, (_, k) => K.mScope[(y - 2019) * 12 + k]),
  }));
  const yMax = Math.max(1, ...K.mScope);
  $('#s-sub').textContent = `Cada línea es un año (enero a diciembre) · ${gravLabel()} · escala fija 0–${fmt.int(yMax)}`;
  $('#s-legend').innerHTML = legendHtml(series.map((s) => ({ label: s.label + (s.key === 2019 ? ' (antes)' : s.key === 2020 ? ' (transición)' : ' (después)'), color: s.color, dash: s.dash })));
  lineChart($('#s-main'), {
    xs: [...Array(12).keys()], series, xDomain: [0, 11], yMax,
    xTicks: [...Array(12).keys()], xTickFormat: (k) => MESES_CORTOS[k],
    directLabels: true, points: true, height: 270,
    tooltip: (i) => `<b>${MESES_CORTOS[i]}</b><br>${series.map((s) => `${legendDot(s.color)} ${s.label}: <b>${fmt.int(s.ys[i])}</b>`).join('<br>')}`,
  });
  $('#s-context').innerHTML = '';
  const tot = series.map((s) => `${s.label}: ${fmt.int(s.ys.reduce((a, b) => a + b, 0))}`).join(' · ');
  $('#s-note').innerHTML = `Totales — ${tot}. Comparar el mismo mes entre años evita confundir el efecto con la estacionalidad.`;
}
const legendDot = (c) => `<i class="dot" style="background:${c}"></i>`;

function serieControl(K, P) {
  const base = (arr) => sumRange(arr, 0, 11) / 12 || 1;
  const roll = (arr) => Array.from(arr, (_, i) => {
    const a = Math.max(0, i - 1), b = Math.min(N_MESES - 1, i + 1);
    return sumRange(arr, a, b) / (b - a + 1);
  });
  const bz = base(K.mZona), bc = base(K.mCtrl);
  const zi = roll(K.mZona).map((v) => (100 * v) / bz);
  const ci = roll(K.mCtrl).map((v) => (100 * v) / bc);
  const xs = [...Array(N_MESES).keys()];
  const series = [
    { key: 'z', label: 'Cámara', color: C.cam, ys: zi },
  ];
  if (st.ctrlOn) series.push({ key: 'c', label: 'Control', color: C.ctrl, dash: true, ys: ci });
  $('#s-sub').textContent = `Índice: promedio mensual de 2019 = 100 · media móvil de 3 meses · ${gravLabel()}`;
  $('#s-legend').innerHTML = legendHtml([
    { label: `${nombreZona()}`, color: C.cam },
    ...(st.ctrlOn ? [{ label: `Control: vías medidas a > ${st.radio} m de cámaras`, color: C.ctrl, dash: true }] : []),
  ]) + `<label class="legend-toggle"><input type="checkbox" id="chk-ctrl" ${st.ctrlOn ? 'checked' : ''} /> Ver control</label>`;
  $('#chk-ctrl')?.addEventListener('change', (e) => set({ ctrlOn: e.target.checked }));
  lineChart($('#s-main'), {
    xs, series, xDomain: [P.m0, P.m1], yMax: Math.max(140, ...zi.slice(P.m0, P.m1 + 1), ...(st.ctrlOn ? ci.slice(P.m0, P.m1 + 1) : [0])),
    xTicks: xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0), xTickFormat: (m) => (m % 12 === 0 ? String(2019 + m / 12) : MESES_CORTOS[m % 12]),
    refLines: [{ y: 100, label: 'nivel 2019' }],
    bands: [{ x0: 10.6, x1: 14.9, label: 'Instalación' }, { x0: 11.5, x1: 23.5, label: '' }],
    vlines: [{ x: 16, label: 'Multas', color: C.ink2, dash: true }],
    directLabels: true, height: 260,
    tooltip: (i) => `<b>${mesLabel(i)}</b><br>${legendDot(C.cam)} Cámara: índice <b>${fmt.int(zi[i])}</b> (${fmt.int(K.mZona[i])} casos)${st.ctrlOn ? `<br>${legendDot(C.ctrl)} Control: índice <b>${fmt.int(ci[i])}</b> (${fmt.int(K.mCtrl[i])} casos)` : ''}`,
  });
  $('#s-context').innerHTML = '';
  $('#s-note').innerHTML = `Índice para comparar magnitudes distintas en un eje. Cámara por debajo del control tras 2020 = la zona mejoró más.`;
}

function serieVelocidad(P) {
  const v = velocidadDelAmbito(D, st);
  const xs = [...Array(N_MESES).keys()];
  if (!v || (v.cam.n === 0 && v.sin.n === 0)) {
    $('#v-chart').innerHTML = '<p class="muted">Bitcarrier no mide velocidades en este corredor.</p>';
    $('#v-sub').textContent = '';
    $('#v-note').textContent = '';
    $('#v-legend').innerHTML = '';
    return;
  }
  const series = [];
  if (v.cam.n && st.velModo !== 'sin') series.push({ key: 'c', label: 'Con cámara', color: C.cam, ys: v.cam.p85 });
  if (v.sin.n && st.velModo !== 'cam') series.push({ key: 's', label: 'Sin cámara', color: C.ctrl, dash: true, ys: v.sin.p85 });
  if (!series.length) {
    $('#v-chart').innerHTML = '<p class="muted">No hay tramos con ese filtro en este corredor.</p>';
    $('#v-legend').innerHTML = '';
    $('#v-sub').textContent = '';
    $('#v-note').textContent = '';
    return;
  }
  const vals = series.flatMap((s) => s.ys.filter((x) => x != null));
  $('#v-sub').textContent = `P85 mensual (km/h) · Bitcarrier · ${v.fuente === 'bogota' ? 'todos los tramos medidos' : v.fuente === 'sitio' ? 'tramos junto a este sitio vs. resto de la vía' : 'tramos de la vía con y sin cámara'}${st.velModo === 'cam' ? ' · solo con cámara' : st.velModo === 'sin' ? ' · solo sin cámara' : ''}`;
  $('#v-legend').innerHTML = legendHtml([
    ...(v.cam.n ? [{ label: `Tramos con cámara (${v.cam.n})`, color: C.cam }] : []),
    ...(v.sin.n ? [{ label: `Tramos sin cámara (${v.sin.n})`, color: C.ctrl, dash: true }] : []),
  ]);
  lineChart($('#v-chart'), {
    xs, series, xDomain: [P.m0, P.m1],
    yMin: Math.floor((Math.min(...vals, v.limite ?? 99) - 5) / 5) * 5,
    yMax: Math.ceil((Math.max(...vals, v.limite ?? 0) + 3) / 5) * 5,
    xTicks: xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0), xTickFormat: (m) => (m % 12 === 0 ? String(2019 + m / 12) : MESES_CORTOS[m % 12]),
    refLines: v.limite ? [{ y: v.limite, label: `límite ${v.limite} km/h` }] : [],
    vlines: [{ x: 16, color: C.ink2, dash: true }],
    directLabels: true, height: 190, yFormat: (d) => d,
    tooltip: (i) => `<b>${mesLabel(i)}</b><br>${series.map((s) => `${legendDot(s.color)} ${s.label}: <b>${s.ys[i] == null ? 'sin dato' : `${fmt.dec(s.ys[i])} km/h`}</b>`).join('<br>')}`,
  });
  $('#v-note').textContent = 'P85 = velocidad bajo la que va el 85 % del tráfico (flujo del tramo, no el vehículo del siniestro).';
}

// ---------------------------------------------------------------- panorama
function renderPanorama(K, P) {
  const el = $('#panel-panorama');
  const grav = cambioPorGravedad(D, st);
  const gSel = grav.find((g) => g.key === st.gravedad) ?? grav[0];
  const all = cambioPorCorredor(D, st).sort((a, b) => (a.cambio ?? 0) - (b.cambio ?? 0));
  const conDato = all.filter((c) => c.cambio != null);
  const sinDato = all.length - conDato.length;
  const sel = st.corredor ? all.find((c) => c.corredor === st.corredor) : null;
  const diff = sel && sel.cambio != null && gSel.control.cambio != null ? sel.cambio - gSel.control.cambio : null;

  el.innerHTML = `
    <header class="panel-head">
      <div><h2>Panorama · Bogotá</h2>
        <p class="sub">Cambio prom. mensual 2019 → 2021–22 · ${gravLabel()} · ≤ ${st.radio} m</p>
      </div>
    </header>
    <div class="pan-section" id="pan-gravedad-wrap">
      <h3 class="sec">Los tres niveles de gravedad <span>clic en una fila para fijar la gravedad</span></h3>
      <div class="chart" id="pan-gravedad"></div>
      <div class="legend-inline"><span><i style="background:${C.cam}"></i>Zona con cámara</span><span><i style="background:${C.ctrl}"></i>Control de la ciudad</span></div>
    </div>
    <div class="pan-section" id="pan-corredores-wrap">
      <h3 class="sec">Los ${all.length} corredores <span>ordenados por cambio · clic para ver el detalle</span></h3>
      <div class="chart" id="pan-corredores"></div>
      <div class="legend-inline"><span><i style="background:${C.cam}"></i>Cambio de la zona con cámara</span><span><i class="dash-i" style="border-color:${C.ink2}"></i>Control de la ciudad (${fmt.pct(gSel.control.cambio)})</span><span class="muted">N = siniestros del corredor en el periodo</span></div>
      ${sinDato ? `<p class="note">${sinDato} corredor${sinDato > 1 ? 'es' : ''} sin casos en 2019: no se pueden situar en la escala de cambio.</p>` : ''}
    </div>
    <div class="pan-detail" id="pan-detalle"></div>`;

  dumbbell($('#pan-gravedad'), grav.map((g) => ({
    key: g.key, label: g.label, a: g.zona.cambio, b: g.control.cambio, n: g.n, tip: g.tip,
  })), { selected: st.gravedad, onSelect: (k) => set({ gravedad: k }) });

  corridorDots($('#pan-corredores'), conDato.map((c) => ({
    corredor: c.corredor, value: c.cambio, n: c.n, tip: c.tip,
  })), {
    control: gSel.control.cambio,
    selected: st.corredor,
    onSelect: (c) => set({ corredor: c, sitio: null }),
  });

  if (!sel) {
    $('#pan-detalle').innerHTML = `<p class="pan-empty">Haz clic en un corredor para ver su antes/después, su N y la diferencia contra el control de la ciudad.</p>`;
    return;
  }
  $('#pan-detalle').innerHTML = `
    <div class="pan-card">
      <header><h3>${sel.corredor}</h3><span class="muted">${sel.sitios} sitio${sel.sitios > 1 ? 's' : ''} de cámara</span></header>
      ${sel.cambio == null
        ? '<p class="muted">Sin siniestros en 2019 con estos filtros: no hay cambio calculable.</p>'
        : `<div class="pan-nums">
            <div><span>2019</span><b>${fmt.dec(sel.ma)}</b><small>por mes</small></div>
            <div><span>2021–22</span><b>${fmt.dec(sel.md)}</b><small>por mes</small></div>
            <div><span>Cambio</span><b class="${sel.cambio < 0 ? 'down' : 'up'}">${fmt.pct(sel.cambio)}</b><small>N = ${fmt.int(sel.n)}</small></div>
            <div><span>Control ciudad</span><b>${fmt.pct(gSel.control.cambio)}</b><small>${diff == null ? '—' : `${fmt.dec(diff * 100)} p.p. de diferencia`}</small></div>
          </div>
          <p class="caveat">El control es de toda la ciudad, no un control propio de este corredor. La comparación contra control se hace en el agregado.</p>`
      }
      <button class="btn small" id="pan-ver">Ver en el mapa</button>
    </div>`;
  $('#pan-ver')?.addEventListener('click', () => set({ tab: 'mapa', mapa: true }));
}

// ---------------------------------------------------------------- A/B
function renderAB(K) {
  const el = $('#panel-ab');
  const sitios = sitiosDelAmbito(D, st);
  const v = velocidadDelAmbito(D, st);
  const months = [st.mesA, st.mesB];
  const maxB = Math.max(...K.mBogota);
  const maxZ = Math.max(1, ...K.mZona);
  const maxT = Math.max(1, ...K.mScopeTodos);
  const maxV = Math.max(1, ...K.victMes);
  const totalCam = sitios.reduce((a, s) => a + s.n_camaras, 0);
  const card = (m, who) => {
    const col = who === 'A' ? C.antes : C.despues;
    const cams = camarasActivas(D, sitios, m);
    const vel = v?.cam.n ? v.cam.p85[m] : null;
    return `
    <div class="ab-card ${who.toLowerCase()}">
      <div class="ab-card-head"><span class="tag ${who.toLowerCase()}">${who}</span><h3>${mesLabel(m)}</h3><span class="muted">${who === 'A' ? 'referencia' : 'comparación'}</span></div>
      <div class="ab-metric"><span>Bogotá · ${GRAVEDAD[st.gravedad].short}</span><b>${fmt.int(K.mBogota[m])}</b></div>${meter(K.mBogota[m], maxB, col)}<small>escala 0–${fmt.int(maxB)}</small>
      <div class="ab-metric"><span>${nombreZona()} · ${GRAVEDAD[st.gravedad].short}</span><b>${fmt.int(K.mZona[m])}</b></div>${meter(K.mZona[m], maxZ, col)}<small>escala 0–${fmt.int(maxZ)}</small>
      <div class="ab-metric"><span>Siniestros (todas las gravedades) en la zona</span><b>${fmt.int(K.mScopeTodos[m])}</b></div>${meter(K.mScopeTodos[m], maxT, col)}<small>escala 0–${fmt.int(maxT)}</small>
      <div class="ab-metric"><span>Víctimas fatales en la zona</span><b>${fmt.int(K.victMes[m])}</b></div>${meter(K.victMes[m], maxV, col)}<small>escala 0–${fmt.int(maxV)}</small>
      <div class="ab-metric"><span>Cámaras instaladas en el ámbito</span><b>${cams} / ${totalCam}</b></div>${meter(cams, totalCam, col)}<small>${cams === 0 ? 'aún sin cámaras' : cams < totalCam ? 'instalación parcial' : 'todas instaladas'}</small>
      <div class="ab-metric"><span>Velocidad P85, tramos con cámara</span><b>${vel == null ? '—' : `${fmt.dec(vel)} km/h`}</b></div>
    </div>`;
  };
  const delta = (a, b) => {
    const d = b - a;
    const p = a > 0 ? d / a : null;
    return `<b>${d > 0 ? '+' : ''}${fmt.int(d)}</b> <span>(${p == null ? '—' : fmt.pct(p)})</span>`;
  };
  const [a, b] = months;
  el.innerHTML = `
    <header class="panel-head">
      <div><h2>Comparar meses · ${nombreAmbito()}</h2><p class="sub">${gravLabel()} por mes · A y B usan la misma escala</p></div>
      <div class="seg small" id="seg-click"><span class="muted">El clic en la serie fija:</span>
        <button data-v="A" aria-pressed="${st.abClick === 'A'}">A</button><button data-v="B" aria-pressed="${st.abClick === 'B'}">B</button></div>
    </header>
    <div id="ab-serie" class="chart"></div>
    <div class="ab-grid">
      ${card(a, 'A')}
      ${card(b, 'B')}
      <div class="ab-delta">
        <h3>Resultado A → B</h3>
        <p class="muted">${mesLabel(a)} → ${mesLabel(b)}</p>
        <dl>
          <dt>Bogotá</dt><dd>${fmt.int(K.mBogota[a])} → ${fmt.int(K.mBogota[b])} · ${delta(K.mBogota[a], K.mBogota[b])}</dd>
          <dt>${nombreZona()}</dt><dd>${fmt.int(K.mZona[a])} → ${fmt.int(K.mZona[b])} · ${delta(K.mZona[a], K.mZona[b])}</dd>
          <dt>Siniestros totales en la zona</dt><dd>${fmt.int(K.mScopeTodos[a])} → ${fmt.int(K.mScopeTodos[b])} · ${delta(K.mScopeTodos[a], K.mScopeTodos[b])}</dd>
          <dt>Víctimas fatales en la zona</dt><dd>${fmt.int(K.victMes[a])} → ${fmt.int(K.victMes[b])} · ${delta(K.victMes[a], K.victMes[b])}</dd>
          <dt>Cámaras instaladas</dt><dd>${camarasActivas(D, sitios, a)} → ${camarasActivas(D, sitios, b)}</dd>
        </dl>
        <p class="caveat">Un mes suelto tiene mucho ruido (pocos casos fatales por corredor). Úsalo para explorar; para concluir usa la ficha y el control.</p>
      </div>
    </div>`;
  el.querySelectorAll('#seg-click button').forEach((bt) => bt.addEventListener('click', () => set({ abClick: bt.dataset.v })));
  const xs = [...Array(N_MESES).keys()];
  $('#ab-serie').innerHTML = '';
  lineChart($('#ab-serie'), {
    xs, series: [{ key: 'z', label: nombreZona(), color: C.ink, ys: [...K.mZona] }], xDomain: [0, 47],
    xTicks: xs.filter((m) => m % 3 === 0), xTickFormat: (m) => (m % 12 === 0 ? String(2019 + m / 12) : MESES_CORTOS[m % 12]),
    bands: [{ x0: 10.6, x1: 14.9, label: 'Instalación' }],
    vlines: [{ x: a, label: 'A', color: C.antes, width: 2 }, { x: b, label: 'B', color: C.despues, width: 2 }],
    height: 220,
    tooltip: (i) => `<b>${mesLabel(i)}</b><br>${fmt.int(K.mZona[i])} ${gravLabel()}<br><span class="muted">Clic para fijar ${st.abClick} · Shift+clic fija ${st.abClick === 'A' ? 'B' : 'A'}</span>`,
    onClick: (m, ev) => {
      const who = ev.shiftKey ? (st.abClick === 'A' ? 'B' : 'A') : st.abClick;
      set(who === 'A' ? { mesA: m, abClick: 'B' } : { mesB: m, abClick: 'A' });
    },
  });
}

// ---------------------------------------------------------------- estado y eventos
function set(patch) {
  if ('periodo' in patch) patch.rango = null;
  const prevMap = st.mapa;
  const prevTab = st.tab;
  st = { ...st, ...patch };
  render();
  storyCtl?.onStateChange(st);
  if ((prevMap !== st.mapa || prevTab !== st.tab) && st.mapa) setTimeout(() => mapCtl.invalidate(), 30);
}

function fillSitios() {
  const sel = $('#sel-sitio');
  const key = st.corredor ?? '';
  if (sel.dataset.key === key) return;
  sel.dataset.key = key;
  const sitios = st.corredor ? D.geo.sitios.filter((s) => s.corredor === st.corredor) : D.geo.sitios;
  sel.innerHTML = `<option value="">${st.corredor ? 'Todo el corredor' : 'Todos los sitios'}</option>` +
    sitios.map((s) => `<option value="${s.id}">${st.corredor ? '' : `${s.corredor} · `}${s.via} (${s.id})</option>`).join('');
}

function bindUI() {
  const corrSel = $('#sel-corredor');
  corrSel.innerHTML = `<option value="">Bogotá · vista general</option>` +
    D.geo.corredores.map((c) => `<option value="${c}">${c}</option>`).join('');
  corrSel.addEventListener('change', () => set({ corredor: corrSel.value || null, sitio: null }));
  $('#sel-sitio').addEventListener('change', (e) => {
    const id = e.target.value || null;
    const s = id && D.geo.sitios.find((x) => x.id === id);
    set({ sitio: id, corredor: s ? s.corredor : st.corredor });
  });
  $('#sel-actor').innerHTML = `<option value="">Todos</option>` + ACTORES.map(([k, l]) => `<option value="${k}">${l}</option>`).join('');
  $('#sel-actor').addEventListener('change', (e) => set({ actor: e.target.value || null }));
  $('#chips-clase').innerHTML = D.meta.clases.map((c) => `<button data-v="${c}">${CLASE_LABEL[c]}</button>`).join('');
  $('#chips-clase').addEventListener('click', (e) => {
    const v = e.target.closest('button')?.dataset.v;
    if (!v) return;
    const s = new Set(st.clases);
    if (s.has(v)) s.delete(v);
    else s.add(v);
    if (s.size === 0) return; // al menos un tipo
    set({ clases: s });
  });
  const rng = $('#rng-radio');
  rng.addEventListener('input', () => ($('#radio-val').textContent = `${rng.value} m`));
  rng.addEventListener('change', () => set({ radio: +rng.value }));
  $('#chk-cruce').addEventListener('change', (e) => set({ excluirCruce: e.target.checked }));
  $('#seg-periodo').addEventListener('click', (e) => e.target.dataset.v && set({ periodo: e.target.dataset.v }));
  $('#seg-gravedad').addEventListener('click', (e) => e.target.dataset.v && set({ gravedad: e.target.dataset.v }));
  $('#tabs').addEventListener('click', (e) => e.target.dataset.tab && set({ tab: e.target.dataset.tab }));
  $('#btn-hide-map').addEventListener('click', () => set({ mapa: false }));
  $('#map-rail').addEventListener('click', () => set({ mapa: true }));
  $('#btn-reset').addEventListener('click', () => set({ ...defaults(), clases: new Set(D.meta.clases) }));
  $('#btn-clear').addEventListener('click', () => set({ corredor: null, sitio: null }));
  const opts = [...Array(N_MESES).keys()].map((m) => `<option value="${m}">${mesLabel(m)}</option>`).join('');
  $('#sel-mes-a').innerHTML = opts;
  $('#sel-mes-b').innerHTML = opts;
  $('#sel-mes-a').addEventListener('change', (e) => set({ mesA: +e.target.value }));
  $('#sel-mes-b').addEventListener('change', (e) => set({ mesB: +e.target.value }));
  $('#btn-swap').addEventListener('click', () => set({ mesA: st.mesB, mesB: st.mesA }));
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(render, 150);
  });
}

async function init() {
  D = await loadData();
  st.clases = new Set(D.meta.clases);
  bindUI();
  enhanceSelects();
  mapCtl = createMap($('#map'), D, {
    onSelectSitio: (id) => {
      if (st.sitio === id) return set({ sitio: null });
      const s = D.geo.sitios.find((x) => x.id === id);
      set({ sitio: id, corredor: s.corredor });
    },
    onSelectCorredor: (c) => set({ corredor: c, sitio: null }),
  });
  $('#loading').remove();
  render();
  const tourCtl = initTour({
    set,
    getState: () => st,
    defaults: () => ({ ...defaults(), clases: new Set(D.meta.clases) }),
    onStart: () => storyCtl?.stop(),
  });
  storyCtl = initStory({
    set,
    getState: () => st,
    defaults: () => ({ ...defaults(), clases: new Set(D.meta.clases) }),
    D,
    hideLanding: tourCtl.hideLanding,
  });
}

init();
