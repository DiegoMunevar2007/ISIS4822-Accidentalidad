// Carga de datos y agregaciones. Todo se calcula en el navegador sobre arreglos columnares.

export const N_MESES = 48; // ene-2019 .. dic-2022
export const N_DIAS = 1461;
export const ANIOS = [2019, 2020, 2021, 2022];
export const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const PERIODOS = {
  todo: { label: 'Todo 2019–2022', m0: 0, m1: 47 },
  antes: { label: 'Antes de la instalación · 2019', m0: 0, m1: 11 },
  transicion: { label: 'Instalación y pandemia · 2020', m0: 12, m1: 23 },
  despues: { label: 'Después de la instalación · 2021–2022', m0: 24, m1: 47 },
};

export const GRAVEDAD = {
  fatal: { label: 'siniestros con muertos', short: 'con muertos', min: 2 },
  grave: { label: 'siniestros con heridos o muertos', short: 'graves', min: 1 },
  todos: { label: 'todos los siniestros', short: 'todos', min: 0 },
};

export const ACTORES = [
  ['CON_MOTO', 'Motocicleta'],
  ['CON_PEATON', 'Peatón'],
  ['CON_BICICLETA', 'Bicicleta'],
  ['CON_VELOCIDAD', 'Exceso de velocidad'],
  ['CON_EMBRIAGUEZ', 'Embriaguez'],
  ['CON_CARGA', 'Vehículo de carga'],
  ['CON_TPI', 'Transporte público (TPI)'],
  ['CON_RUTAS', 'Rutas escolares/empresariales'],
  ['CON_PERSONA_MAYOR', 'Persona mayor'],
  ['CON_MENORES', 'Menores de edad'],
  ['CON_HUECOS', 'Huecos'],
];

export const CLASE_LABEL = {
  Choque: 'Choque',
  Atropello: 'Atropello',
  'Caida de ocupante': 'Caída de ocupante',
  Volcamiento: 'Volcamiento',
  Otro: 'Otro',
  Incendio: 'Incendio',
};

export const mesLabel = (m) => `${MESES_CORTOS[m % 12]} ${2019 + Math.floor(m / 12)}`;

export async function loadData() {
  const base = import.meta.env.BASE_URL;
  const get = (n) => fetch(`${base}data/${n}.json`).then((r) => r.json());
  const [S, V, geo, vel] = await Promise.all([get('siniestros'), get('victimas'), get('geo'), get('velocidad')]);

  const c = S.cols;
  const n = S.meta.n;
  // Día -> mes (0..47) con el calendario real.
  const dayMonth = new Uint8Array(N_DIAS);
  for (let d = 0; d < N_DIAS; d++) {
    const dt = new Date(2019, 0, 1 + d);
    dayMonth[d] = (dt.getFullYear() - 2019) * 12 + dt.getMonth();
  }
  const sitios = geo.sitios;
  const sitioIdx = new Map(S.meta.sitios.map((s, i) => [s, i]));
  const sitioCorr = new Int16Array(S.meta.sitios.length);
  const corrIdx = new Map(geo.corredores.map((c, i) => [c, i]));
  for (const s of sitios) sitioCorr[sitioIdx.get(s.id)] = corrIdx.get(s.corredor);

  const rows = {
    n,
    d: Int16Array.from(c.d),
    m: new Uint8Array(n),
    h: Uint8Array.from(c.h),
    g: Uint8Array.from(c.g),
    c: Uint8Array.from(c.c),
    f: Uint16Array.from(c.f),
    dc: Int32Array.from(c.dc),
    s: Uint8Array.from(c.s),
    corr: new Int16Array(n),
    p: Uint8Array.from(c.p),
    x: Uint8Array.from(c.x),
    lat: Float32Array.from(c.lat, (v) => v / 1e5),
    lon: Float32Array.from(c.lon, (v) => v / 1e5),
  };
  for (let i = 0; i < n; i++) {
    rows.m[i] = dayMonth[rows.d[i]];
    rows.corr[i] = sitioCorr[rows.s[i]];
  }

  const vr = V.rows;
  const victimas = {
    condiciones: V.condiciones,
    row: Int32Array.from(vr, (r) => r[0]),
    cond: Uint8Array.from(vr, (r) => r[1]),
    grav: Uint8Array.from(vr, (r) => r[2]),
    cnt: Uint8Array.from(vr, (r) => r[3]),
  };

  return { meta: S.meta, rows, victimas, geo, vel, sitioIdx, corrIdx, dayMonth };
}

// ---------------------------------------------------------------- filtros

/** Máscara de filas que pasan los filtros de atributo (no espaciales ni temporales). */
export function baseMask(D, st) {
  const { rows, meta } = D;
  const out = new Uint8Array(rows.n);
  const gmin = GRAVEDAD[st.gravedad].min;
  const clases = new Uint8Array(meta.clases.length);
  meta.clases.forEach((k, i) => (clases[i] = st.clases.has(k) ? 1 : 0));
  const actorBit = st.actor ? 1 << meta.flags.indexOf(st.actor) : 0;
  for (let i = 0; i < rows.n; i++) {
    if (rows.g[i] < gmin) continue;
    if (!clases[rows.c[i]]) continue;
    if (actorBit && !(rows.f[i] & actorBit)) continue;
    if (st.excluirCruce && rows.x[i]) continue;
    out[i] = 1;
  }
  return out;
}

/** Devuelve el predicado espacial del ámbito seleccionado. */
export function scopeTest(D, st) {
  const { rows } = D;
  const R = st.radio;
  if (st.sitio) {
    const si = D.sitioIdx.get(st.sitio);
    return (i) => rows.s[i] === si && rows.dc[i] <= R;
  }
  if (st.corredor) {
    const ci = D.corrIdx.get(st.corredor);
    return (i) => rows.corr[i] === ci && rows.dc[i] <= R;
  }
  return () => true;
}

/** Zona de cámaras: si hay selección es el ámbito; si no, todo lo que está a <= radio de un sitio. */
export function zonaTest(D, st) {
  if (st.sitio || st.corredor) return scopeTest(D, st);
  const { rows } = D;
  return (i) => rows.dc[i] <= st.radio;
}

/** Control: vías medidas por Bitcarrier, lejos (> radio) de cualquier cámara. */
export function controlTest(D, st) {
  const { rows } = D;
  return (i) => rows.p[i] === 1 && rows.dc[i] > st.radio;
}

export function porMes(D, mask, test) {
  const out = new Float64Array(N_MESES);
  const { rows } = D;
  for (let i = 0; i < rows.n; i++) if (mask[i] && test(i)) out[rows.m[i]]++;
  return out;
}

export function porDia(D, mask, test) {
  const out = new Float64Array(N_DIAS);
  const { rows } = D;
  for (let i = 0; i < rows.n; i++) if (mask[i] && test(i)) out[rows.d[i]]++;
  return out;
}

export const sumRange = (arr, a, b) => {
  let s = 0;
  for (let k = a; k <= b; k++) s += arr[k];
  return s;
};

/** Promedio mensual antes (2019) y después (2021–2022) y el cambio %. */
export function antesDespues(meses) {
  const antes = sumRange(meses, 0, 11);
  const despues = sumRange(meses, 24, 47);
  const ma = antes / 12;
  const md = despues / 24;
  return { antes, despues, ma, md, cambio: ma > 0 ? (md - ma) / ma : null };
}

/** Víctimas (heridas/muertas) por condición en antes/después dentro del ámbito. */
export function victimasPorCondicion(D, mask, test, gravedad) {
  const V = D.victimas;
  const { rows } = D;
  const k = V.condiciones.length;
  const antes = new Float64Array(k);
  const despues = new Float64Array(k);
  const gmin = gravedad === 'fatal' ? 2 : 1;
  for (let j = 0; j < V.row.length; j++) {
    if (V.grav[j] < gmin) continue;
    const i = V.row[j];
    if (!mask[i] || !test(i)) continue;
    const m = rows.m[i];
    if (m <= 11) antes[V.cond[j]] += V.cnt[j];
    else if (m >= 24) despues[V.cond[j]] += V.cnt[j];
  }
  return V.condiciones.map((c, idx) => ({ condicion: c, antes: antes[idx], despues: despues[idx], ma: antes[idx] / 12, md: despues[idx] / 24 }));
}

/** Sitios del ámbito actual. */
export function sitiosDelAmbito(D, st) {
  if (st.sitio) return D.geo.sitios.filter((s) => s.id === st.sitio);
  if (st.corredor) return D.geo.sitios.filter((s) => s.corredor === st.corredor);
  return D.geo.sitios;
}

/** Cámaras con resolución vigente al final del mes m. */
export function camarasActivas(D, sitios, m) {
  const ids = new Set(sitios.map((s) => s.id));
  const y = 2019 + Math.floor(m / 12);
  const mm = (m % 12) + 1;
  const fin = `${y}-${String(mm).padStart(2, '0')}-31`;
  return D.geo.camaras.filter((c) => ids.has(c.sitio) && c.fecha <= fin).length;
}

export function velocidadDelAmbito(D, st) {
  const v = D.vel;
  if (st.sitio && v.sitio[st.sitio]) return { ...v.sitio[st.sitio], fuente: 'sitio' };
  if (st.sitio) {
    const s = D.geo.sitios.find((x) => x.id === st.sitio);
    if (s && v.corredor[s.corredor]) return { ...v.corredor[s.corredor], fuente: 'corredor' };
    return null;
  }
  if (st.corredor) return v.corredor[st.corredor] ? { ...v.corredor[st.corredor], fuente: 'corredor' } : null;
  return { ...v.bogota, limite: null, fuente: 'bogota' };
}

// ---------------------------------------------------------------- panorama (historia / pestaña)
/** Cambio antes/después por nivel de gravedad, siempre para Bogotá (sin corredor ni sitio). */
export function cambioPorGravedad(D, st) {
  const base = { ...st, corredor: null, sitio: null };
  return ['fatal', 'grave', 'todos'].map((key) => {
    const mask = baseMask(D, { ...base, gravedad: key });
    const zm = porMes(D, mask, zonaTest(D, base));
    const cm = porMes(D, mask, controlTest(D, base));
    const zona = antesDespues(zm);
    const control = antesDespues(cm);
    const n = sumRange(zm, 0, 47);
    return {
      key,
      label: GRAVEDAD[key].short,
      zona,
      control,
      n,
      tip: `<b>${GRAVEDAD[key].label}</b><br>Zona con cámara: ${fmtDec(zona.ma)} → ${fmtDec(zona.md)} por mes (${pct(zona.cambio)})<br>Control: ${fmtDec(control.ma)} → ${fmtDec(control.md)} por mes (${pct(control.cambio)})<br><span class="muted">N en la zona: ${n.toLocaleString('es-CO')}</span>`,
    };
  });
}

/** Cambio antes/después de la zona con cámara para cada corredor. */
export function cambioPorCorredor(D, st) {
  const mask = baseMask(D, st);
  const { rows, geo } = D;
  return geo.corredores.map((corredor) => {
    const ci = D.corrIdx.get(corredor);
    const meses = new Float64Array(N_MESES);
    for (let i = 0; i < rows.n; i++) {
      if (!mask[i] || rows.corr[i] !== ci || rows.dc[i] > st.radio) continue;
      meses[rows.m[i]]++;
    }
    const ad = antesDespues(meses);
    const n = sumRange(meses, 0, 47);
    const sitios = geo.sitios.filter((s) => s.corredor === corredor).length;
    return {
      corredor, ...ad, n, sitios,
      tip: `<b>${corredor}</b> · ${sitios} sitio${sitios > 1 ? 's' : ''} de cámara<br>2019: ${fmtDec(ad.ma)} por mes · 2021–22: ${fmtDec(ad.md)} por mes<br>Cambio: <b>${pct(ad.cambio)}</b> · N = ${n.toLocaleString('es-CO')}<br><span class="muted">Siniestros a ≤ ${st.radio} m de las cámaras del corredor</span>`,
    };
  });
}

const pct = (v) => (v == null || !isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${(v * 100).toFixed(1).replace('.', ',')} %`);
const fmtDec = (v) => (v == null || !isFinite(v) ? '—' : v.toFixed(1).replace('.', ','));
