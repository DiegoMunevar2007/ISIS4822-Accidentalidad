import * as d3 from 'd3';

export const C = {
  ink: '#17191c',
  ink2: '#3d4349',
  muted: '#5c636a',
  grid: '#e4e4e0',
  track: '#ececE8',
  surface: '#ffffff', // halo/gap sobre paneles
  neutral: '#cfcfca', // barra 2020 / neutro
  antes: '#6b7178', // antes / A: gris
  despues: '#B5283A', // después / B / foco: rojo de la bandera de Bogotá
  y2020: '#b3b3ac',
  y2021: '#D9959F',
  y2022: '#B5283A',
  cam: '#B5283A',
  ctrl: '#7a8087',
  fatal: '#B5283A',
  grave: '#E8A100',
  dano: '#a9aeb3',
};

export const fmt = {
  int: d3.format(',.0f'),
  dec: d3.format(',.1f'),
  pct: (v) => (v == null || !isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${d3.format('.1%')(v)}`),
};
// Separadores en español: 1.234,5
const es = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['$', ''] });
fmt.int = es.format(',.0f');
fmt.dec = es.format(',.1f');
fmt.pct = (v) => (v == null || !isFinite(v) ? '—' : `${v > 0 ? '+' : ''}${es.format('.1%')(v)}`);

// ---------------------------------------------------------------- tooltip
const tip = () => document.getElementById('tooltip');
export function showTip(html, ev) {
  const t = tip();
  t.innerHTML = html;
  t.hidden = false;
  const pad = 14;
  const r = t.getBoundingClientRect();
  let x = ev.clientX + pad;
  let y = ev.clientY + pad;
  if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - pad;
  if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - pad;
  t.style.left = `${Math.max(8, x)}px`;
  t.style.top = `${Math.max(8, y)}px`;
}
export const hideTip = () => (tip().hidden = true);

// ---------------------------------------------------------------- barras anuales
/** Título vertical del eje Y, centrado en el área de trazado. */
/** @param {any} svg @param {string} text @param {any} m @param {number} H */
function yAxisLabel(svg, text, m, H) {
  svg.append('text').attr('class', 'ylabel').attr('transform', `translate(14,${(m.t + H - m.b) / 2}) rotate(-90)`)
    .attr('text-anchor', 'middle').text(text);
}

/** @param {any} el @param {any} data @param {any} [opts] */
export function annualBars(el, data, { yMax, onHover, yLabel = 'Siniestros', xLabel = 'Año' } = {}) {
  el.innerHTML = '';
  const W = el.clientWidth || 360;
  const H = 240;
  const m = { t: 34, r: 12, b: 48, l: 78 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
  const x = d3.scaleBand(data.map((d) => d.year), [m.l, W - m.r]).padding(0.38);
  const max = yMax ?? d3.max(data, (d) => d.n) ?? 1;
  const y = d3.scaleLinear([0, max || 1], [H - m.b, m.t]).nice(3);
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(3)).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
    .call(d3.axisLeft(y).ticks(3).tickSize(0).tickFormat(fmt.int)).call((g) => g.select('.domain').remove());
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b + 4})`)
    .call(d3.axisBottom(x).tickSize(0)).call((g) => g.select('.domain').remove());
  const bw = Math.min(x.bandwidth(), 64);
  const g = svg.append('g').selectAll('g').data(data).join('g')
    .attr('transform', (d) => `translate(${x(d.year) + (x.bandwidth() - bw) / 2},0)`);
  g.append('path')
    .attr('d', (d) => roundedTop(0, y(d.n), bw, y(0) - y(d.n), 0))
    .attr('fill', (d) => (d.year === 2020 ? C.neutral : d.year === 2019 ? C.antes : d.year >= 2021 ? C.despues : C.ink));
  g.append('text').attr('class', 'val').attr('x', bw / 2).attr('y', (d) => y(d.n) - 6).attr('text-anchor', 'middle')
    .text((d) => fmt.int(d.n));
  g.append('rect').attr('x', -6).attr('width', bw + 12).attr('y', m.t - 10).attr('height', H - m.t - m.b + 10)
    .attr('fill', 'transparent')
    .on('mousemove', (ev, d) => showTip(onHover(d), ev))
    .on('mouseleave', hideTip);
  if (yLabel) yAxisLabel(svg, yLabel, m, H);
  if (xLabel) svg.append('text').attr('class', 'xlabel').attr('x', (m.l + W - m.r) / 2).attr('y', H - 4)
    .attr('text-anchor', 'middle').text(xLabel);
}

function roundedTop(x, y, w, h, r) {
  if (h <= 0) return `M${x},${y}h${w}`;
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

// ---------------------------------------------------------------- cinta de periodos
/**
 * Cinta de contexto pegada al eje X: una fila por periodo, con el rótulo dentro del tramo (o a su lado si no cabe).
 * Comparte la posición horizontal con los datos, así que se lee sin desviar la mirada y no tapa nada.
 */
function cinta(svg, bands, tramos, y0) {
  bands.forEach((b, k) => {
    const [x0, x1] = tramos[k];
    if (x1 <= x0) return;
    const y = y0 + 20 * k;
    svg.append('rect').attr('class', `cinta-seg ${b.cls ?? ''}`).attr('x', x0).attr('width', x1 - x0).attr('y', y).attr('height', 17).attr('rx', 3);
    if (!b.label) return;
    const cabe = x1 - x0 >= b.label.length * 7 + 12;
    svg.append('text').attr('class', `cinta-txt${cabe ? '' : ' fuera'}`).attr('x', cabe ? x0 + 6 : x1 + 6).attr('y', y + 13).text(b.label);
  });
}

// ---------------------------------------------------------------- gráfica de líneas genérica
/**
 * opts: xs[], series[{key,label,color,dash,ys[]}], xDomain, xTicks, xTickFormat, yMax, yLabel,
 * bands[{x0,x1,label}], vlines[{x,label,color,dash}], tooltip(i) -> html, onClick(x, ev), height
 */
export function lineChart(el, o) {
  el.innerHTML = '';
  const W = el.clientWidth || 600;
  const H = o.height ?? 280;
  // carriles: cada periodo va en su propia fila sobre el gráfico, sin sombrear ni tapar la serie.
  const nb = o.carriles ? (o.bands ?? []).length : 0;
  const rib = nb ? 20 * nb + 6 : 0;
  const m = { t: o.top ?? 30, r: o.right ?? (o.directLabels ? 104 : 16), b: (o.xLabel ? 52 : 30) + rib, l: o.left ?? (o.yLabel ? 78 : 46) };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'linechart');
  const x = d3.scaleLinear(o.xDomain ?? d3.extent(o.xs), [m.l, W - m.r]);
  const allY = o.series.flatMap((s) => s.ys.filter((v) => v != null));
  const y = d3.scaleLinear([o.yMin ?? 0, o.yMax ?? (d3.max(allY) || 1)], [H - m.b, m.t]).nice(4);

  if (o.carriles) {
    cinta(svg, o.bands ?? [], (o.bands ?? []).map((b) => [Math.max(x(b.x0), m.l), Math.min(x(b.x1), W - m.r)]), H - m.b + 6);
    svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', H - m.b).attr('y2', H - m.b).attr('stroke', C.grid);
  }
  // bandas de contexto
  for (const b of o.carriles && !o.sombra ? [] : o.bands ?? []) {
    const x0 = Math.max(x(b.x0), m.l);
    const x1 = Math.min(x(b.x1), W - m.r);
    if (x1 <= x0) continue;
    svg.append('rect').attr('class', `band ${b.cls ?? ''}${o.sombra ? ' fuerte' : ''}`).attr('x', x0).attr('width', x1 - x0).attr('y', m.t).attr('height', H - m.t - m.b);
  }
  // Las etiquetas van después de todas las bandas para que ninguna las tape.
  for (const b of o.carriles ? [] : o.bands ?? []) {
    const x0 = Math.max(x(b.x0), m.l);
    const x1 = Math.min(x(b.x1), W - m.r);
    if (b.label && x1 - x0 > 60) {
      const end = b.align === 'end';
      svg.append('text').attr('class', 'band-label').attr('x', end ? x1 - 4 : x0 + 4).attr('y', H - m.b - 8 - 16 * (b.row ?? 0))
        .attr('text-anchor', end ? 'end' : 'start').text(b.label);
    }
  }
  // con conteos pequeños solo se muestran marcas enteras
  const yt = o.yFormat ? y.ticks(4) : y.ticks(4).filter(Number.isInteger);
  svg.append('g').attr('class', 'grid').selectAll('line').data(yt).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  if (!o.hideYAxis)
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
      .call(d3.axisLeft(y).tickValues(yt).tickSize(0).tickFormat(o.yFormat ?? fmt.int)).call((g) => g.select('.domain').remove());
  const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`;
  svg.append('clipPath').attr('id', clipId).append('rect')
    .attr('x', m.l - 4).attr('y', 0).attr('width', W - m.l - m.r + 8).attr('height', H - m.b + 4);
  const xa = d3.axisBottom(x).tickSize(4).tickFormat(o.xTickFormat ?? String);
  if (o.xTicks) xa.tickValues(o.xTicks.filter((t) => t >= x.domain()[0] && t <= x.domain()[1]));
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b + rib})`).call(xa)
    .call((g) => g.select('.domain').attr('stroke', rib ? 'none' : C.grid));
  if (o.yLabel) yAxisLabel(svg, o.yLabel, m, H);
  if (o.xLabel) svg.append('text').attr('class', 'xlabel').attr('x', (m.l + W - m.r) / 2).attr('y', H - 4)
    .attr('text-anchor', 'middle').text(o.xLabel);

  for (const r of o.refLines ?? []) {
    svg.append('line').attr('class', r.solid ? 'refline solid' : 'refline').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(r.y)).attr('y2', y(r.y));
    svg.append('text').attr('class', 'band-label').attr('x', W - m.r - 4).attr('y', y(r.y) - 4).attr('text-anchor', 'end').text(r.label);
  }
  for (const v of o.vlines ?? []) {
    if (v.x < x.domain()[0] || v.x > x.domain()[1]) continue;
    svg.append('line').attr('x1', x(v.x)).attr('x2', x(v.x)).attr('y1', m.t - 6).attr('y2', H - m.b)
      .attr('stroke', v.color ?? C.ink2).attr('stroke-width', v.width ?? 1.25).attr('stroke-dasharray', v.dash ? '4 3' : null);
    if (v.label)
      svg.append('text').attr('class', 'vlabel').attr('x', x(v.x)).attr('y', m.t - 10).attr('text-anchor', 'middle')
        .attr('fill', v.color ?? C.ink2).text(v.label);
  }

  const line = (ys) => d3.line().defined((d, i) => ys[i] != null).x((d, i) => x(o.xs[i])).y((d, i) => y(ys[i] ?? 0)).curve(o.curve ?? d3.curveLinear)(ys);
  const gl = svg.append('g').attr('clip-path', `url(#${clipId})`);
  const glabels = svg.append('g');
  for (const s of o.series) {
    gl.append('path').attr('d', line(s.ys)).attr('fill', 'none').attr('stroke', s.color)
      .attr('stroke-width', s.width ?? 2).attr('stroke-dasharray', s.dash ? '5 4' : null).attr('stroke-linejoin', 'round');
    if (o.points ?? o.xs.length <= 64) {
      gl.append('g').selectAll('circle').data(s.ys.map((v, i) => [o.xs[i], v]).filter((d) => d[1] != null)).join('circle')
        .attr('cx', (d) => x(d[0])).attr('cy', (d) => y(d[1])).attr('r', o.xs.length > 30 ? 2.2 : 3.2)
        .attr('fill', s.color).attr('stroke', C.surface).attr('stroke-width', 1);
    }
  }
  // etiquetas directas al final de cada línea, separadas para que no se monten
  if (o.directLabels) {
    const labs = [];
    for (const s of o.series) {
      let k = s.ys.length - 1;
      while (k > 0 && s.ys[k] == null) k--;
      if (s.ys[k] != null) labs.push({ s, k, y: y(s.ys[k]) + 4 });
    }
    labs.sort((a, b) => a.y - b.y);
    for (let i = 1; i < labs.length; i++) labs[i].y = Math.max(labs[i].y, labs[i - 1].y + 16);
    for (const l of labs)
      glabels.append('text').attr('class', 'dlabel').attr('x', x(o.xs[l.k]) + 6).attr('y', l.y).text(l.s.label);
  }
  // capas de hover
  const cross = svg.append('line').attr('class', 'cross').attr('y1', m.t).attr('y2', H - m.b).style('opacity', 0);
  const dots = svg.append('g').style('opacity', 0);
  const dotSel = dots.selectAll('circle').data(o.series).join('circle').attr('r', 4.5)
    .attr('fill', (s) => s.color).attr('stroke', C.surface).attr('stroke-width', 2);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b)
    .attr('fill', 'transparent').style('cursor', o.onClick ? 'crosshair' : 'default')
    .on('mousemove', (ev) => {
      const [px] = d3.pointer(ev);
      const xv = x.invert(px);
      const i = d3.minIndex(o.xs, (v) => Math.abs(v - xv));
      if (i < 0) return;
      const cx = x(o.xs[i]);
      cross.attr('x1', cx).attr('x2', cx).style('opacity', 1);
      dots.style('opacity', 1);
      dotSel.attr('cx', cx).attr('cy', (s) => (s.ys[i] == null ? -99 : y(s.ys[i])));
      if (o.tooltip) showTip(o.tooltip(i), ev);
    })
    .on('mouseleave', () => {
      cross.style('opacity', 0);
      dots.style('opacity', 0);
      hideTip();
    })
    .on('click', (ev) => {
      if (!o.onClick) return;
      const [px] = d3.pointer(ev);
      const xv = x.invert(px);
      const i = d3.minIndex(o.xs, (v) => Math.abs(v - xv));
      o.onClick(o.xs[i], ev);
    });
  return { x, y };
}

// ---------------------------------------------------------------- barras mensuales con dos bandas (A y B)
/**
 * Una barra por mes y dos bandas arrastrables: A (gris) y B (verde azulado). Se mueven por dentro y
 * se redimensionan por los bordes; siempre quedan alineadas a meses completos y sin solaparse.
 * opts: values[], grupoA[], grupoB[], modo ('bandas' | 'meses'), activo ('A'|'B', solo en 'meses'), bands[], yLabel,
 *       xTickFormat(m), tooltip(i), resumen(letra, ancho), onRange(letra, desde, hasta) en 'bandas',
 *       onPick(indices, {shift, arrastre}) en 'meses', height
 */
export function monthBars(el, o) {
  el.innerHTML = '';
  const W = el.clientWidth || 700;
  const H = o.height ?? 270;
  const nb = (o.bands ?? []).length;
  const rib = 20 * nb + 6;
  const m = { t: 40, r: 16, b: 38 + rib, l: 78 };
  const n = o.values.length;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'linechart');
  const x = d3.scaleBand(d3.range(n), [m.l, W - m.r]).padding(0.22);
  const y = d3.scaleLinear([0, d3.max(o.values) || 1], [H - m.b, m.t]).nice(4);
  const step = (W - m.l - m.r) / n;
  const enA = new Set(o.grupoA), enB = new Set(o.grupoB);
  const colorA = C.antes, colorB = C.despues;
  const top = m.t - 6;
  const alto = H - m.b - top;

  const yt = y.ticks(4).filter(Number.isInteger);
  svg.append('g').attr('class', 'grid').selectAll('line').data(yt).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
    .call(d3.axisLeft(y).tickValues(yt).tickSize(0).tickFormat(fmt.int)).call((g) => g.select('.domain').remove());
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', H - m.b).attr('y2', H - m.b).attr('stroke', C.grid);
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b + rib})`)
    .call(d3.axisBottom(x).tickValues(d3.range(n).filter((i) => i % 3 === 0)).tickSize(4).tickFormat(o.xTickFormat ?? String))
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  if (o.yLabel) yAxisLabel(svg, o.yLabel, m, H);

  svg.append('g').selectAll('rect').data(o.values).join('rect')
    .attr('x', (d, i) => x(i)).attr('width', x.bandwidth())
    .attr('y', (d) => y(d)).attr('height', (d) => Math.max(0, y(0) - y(d)))
    .attr('fill', (d, i) => (enA.has(i) ? colorA : enB.has(i) ? colorB : '#d3d6d9'));

  cinta(svg, o.bands ?? [], (o.bands ?? []).map((b) => [m.l + b.x0 * step, m.l + (b.x1 + 1) * step]), H - m.b + 6);

  // Pasar el cursor por cualquier mes muestra su valor
  const cross = svg.append('rect').attr('fill', 'rgba(200,16,46,0.08)').attr('y', top).attr('height', alto).style('opacity', 0).attr('pointer-events', 'none');
  const indice = (ev) => Math.max(0, Math.min(n - 1, Math.floor((d3.pointer(ev, svg.node())[0] - m.l) / step)));
  const hover = (ev) => {
    const i = indice(ev);
    cross.attr('x', m.l + i * step).attr('width', step).style('opacity', 1);
    if (o.tooltip) showTip(o.tooltip(i), ev);
  };
  const salir = () => { cross.style('opacity', 0); hideTip(); };
  const etiqueta = (letra, col, i0, i1) => {
    const ancho = (i1 - i0 + 1) * step;
    svg.append('text').attr('class', 'val').attr('fill', col).attr('x', m.l + (i0 + (i1 - i0 + 1) / 2) * step).attr('y', top - 6)
      .attr('text-anchor', 'middle').attr('pointer-events', 'none').text(o.resumen ? o.resumen(letra, ancho) : letra);
  };

  if (o.modo === 'meses') {
    // Meses sueltos: clic alterna un mes, arrastrar pinta un tramo, Shift + clic extiende. Funciona con teclado.
    const teniaFoco = el.contains(document.activeElement);
    const previa = svg.append('rect').attr('y', top).attr('height', alto).attr('fill', o.activo === 'A' ? colorA : colorB).attr('opacity', 0.22).style('opacity', 0).attr('pointer-events', 'none');
    const foco = svg.append('rect').attr('y', top).attr('height', alto).attr('fill', 'none').attr('stroke', C.ink).attr('stroke-width', 2).style('opacity', 0).attr('pointer-events', 'none');
    const pintar = (i, j) => previa.attr('x', m.l + Math.min(i, j) * step).attr('width', (Math.abs(i - j) + 1) * step).style('opacity', 1);
    // Un trazo fino sobre cada tramo continuo de un grupo, fuera de las barras
    for (const [grupo, col] of [[o.grupoA, colorA], [o.grupoB, colorB]]) {
      let ini = 0;
      for (let k = 1; k <= grupo.length; k++) {
        if (k === grupo.length || grupo[k] !== grupo[k - 1] + 1) {
          if (grupo.length) svg.append('rect').attr('x', m.l + grupo[ini] * step + 1).attr('width', (grupo[k - 1] - grupo[ini] + 1) * step - 2).attr('y', top - 2).attr('height', 3).attr('fill', col);
          ini = k;
        }
      }
    }
    for (const [letra, grupo, col] of [['A', o.grupoA, colorA], ['B', o.grupoB, colorB]]) {
      if (grupo.length) etiqueta(letra, col, grupo[0], grupo[grupo.length - 1]);
    }
    let inicio = null;
    let moviendo = false;
    const zona = svg.append('rect').attr('x', m.l).attr('y', top).attr('width', W - m.l - m.r).attr('height', alto).attr('fill', 'transparent')
      .style('cursor', 'pointer').style('touch-action', 'none').style('outline', 'none').attr('tabindex', 0)
      .attr('role', 'application').attr('aria-label', 'Meses. Flechas para moverse, espacio para elegir el mes en el grupo activo.');
    zona
      .on('pointerdown', (ev) => { inicio = indice(ev); moviendo = false; zona.node().setPointerCapture?.(ev.pointerId); })
      .on('pointermove', (ev) => {
        const i = indice(ev);
        cross.attr('x', m.l + i * step).attr('width', step).style('opacity', 1);
        if (inicio != null && i !== inicio) { moviendo = true; pintar(inicio, i); hideTip(); }
        else if (inicio == null && o.tooltip) showTip(o.tooltip(i), ev);
      })
      .on('pointerup', (ev) => {
        if (inicio == null) return;
        const i = indice(ev);
        const desde = inicio;
        inicio = null;
        previa.style('opacity', 0);
        if (moviendo || i !== desde) o.onPick?.(d3.range(Math.min(desde, i), Math.max(desde, i) + 1), { shift: false, arrastre: true });
        else o.onPick?.([i], { shift: ev.shiftKey, arrastre: false });
      })
      .on('pointerleave', () => { cross.style('opacity', 0); if (inicio == null) hideTip(); })
      .on('keydown', (ev) => {
        let f = el._foco ?? 0;
        if (ev.key === 'ArrowRight') f = Math.min(n - 1, f + 1);
        else if (ev.key === 'ArrowLeft') f = Math.max(0, f - 1);
        else if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); o.onPick?.([f], { shift: ev.shiftKey, arrastre: false }); return; }
        else return;
        ev.preventDefault();
        el._foco = f;
        foco.attr('x', m.l + f * step).attr('width', step).style('opacity', 1);
      })
      .on('focus', () => { const f = el._foco ?? 0; foco.attr('x', m.l + f * step).attr('width', step).style('opacity', 1); })
      .on('blur', () => foco.style('opacity', 0));
    if (teniaFoco) zona.node().focus();
    return;
  }

  svg.append('rect').attr('x', m.l).attr('y', top).attr('width', W - m.l - m.r).attr('height', alto).attr('fill', 'transparent')
    .on('mousemove', hover).on('mouseleave', salir);

  // Dos bandas arrastrables
  const rangos = { A: [o.grupoA[0], o.grupoA[o.grupoA.length - 1]], B: [o.grupoB[0], o.grupoB[o.grupoB.length - 1]] };
  for (const [letra, col] of [['A', colorA], ['B', colorB]]) {
    const [i0, i1] = rangos[letra];
    if (i0 == null) continue;
    const otra = rangos[letra === 'A' ? 'B' : 'A'];
    const g = svg.append('g').attr('class', `banda-ab banda-${letra}`);
    const brush = d3.brushX().extent([[m.l, top], [W - m.r, H - m.b]]).handleSize(3)
      .on('end', (ev) => {
        if (!ev.sourceEvent || !ev.selection) return;
        const [px0, px1] = ev.selection;
        let d = Math.max(0, Math.round((px0 - m.l) / step));
        let h = Math.min(n - 1, Math.max(d, Math.round((px1 - m.l) / step) - 1));
        const solapa = otra[0] != null && d <= otra[1] && h >= otra[0];
        if (solapa) d = h = null;
        if (d == null || (d === i0 && h === i1)) g.call(brush.move, [m.l + i0 * step, m.l + (i1 + 1) * step]);
        else o.onRange?.(letra, d, h);
      });
    g.call(brush);
    g.select('.overlay').style('pointer-events', 'none');
    g.select('.selection').attr('fill', col).attr('fill-opacity', 0.14).attr('stroke', col).attr('stroke-width', 1).attr('stroke-opacity', 0.9)
      .on('mousemove', hover).on('mouseleave', salir);
    // Manijas finas; el trazo transparente ensancha la zona donde se puede agarrar.
    g.selectAll('.handle').attr('fill', col).attr('rx', 1.5).attr('opacity', 0.95).attr('stroke', 'transparent').attr('stroke-width', 12);
    g.call(brush.move, [m.l + i0 * step, m.l + (i1 + 1) * step]);
    etiqueta(letra, col, i0, i1);
  }
}

// ---------------------------------------------------------------- diferencia entre dos series
/**
 * Área divergente alrededor de cero: lo que está por encima del cero es teal, lo de abajo es gris.
 * opts: xs[], ds[] (diferencias), xDomain, xTicks, xTickFormat, yLabel, labels[arriba, abajo],
 * bands[], tooltip(i), height, left, right
 */
export function diffChart(el, o) {
  el.innerHTML = '';
  const W = el.clientWidth || 600;
  const H = o.height ?? 170;
  const m = { t: 14, r: o.right ?? 16, b: 36, l: o.left ?? 78 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'linechart');
  const x = d3.scaleLinear(o.xDomain ?? d3.extent(o.xs), [m.l, W - m.r]);
  const lim = Math.max(o.minLim ?? 10, d3.max(o.ds, (d) => (d == null ? 0 : Math.abs(d))) || 0);
  const y = d3.scaleLinear([-lim, lim], [H - m.b, m.t]).nice(2);
  for (const b of o.bands ?? []) {
    const x0 = Math.max(x(b.x0), m.l), x1 = Math.min(x(b.x1), W - m.r);
    if (x1 > x0) svg.append('rect').attr('class', `band ${b.cls ?? ''}`).attr('x', x0).attr('width', x1 - x0).attr('y', m.t).attr('height', H - m.t - m.b);
  }
  const yt = y.ticks(4);
  svg.append('g').attr('class', 'grid').selectAll('line').data(yt).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
    .call(d3.axisLeft(y).tickValues(yt).tickSize(0).tickFormat((v) => (v > 0 ? `+${v}` : String(v)))).call((g) => g.select('.domain').remove());
  const xa = d3.axisBottom(x).tickSize(0).tickPadding(12).tickFormat(o.xTickFormat ?? String);
  if (o.xTicks) xa.tickValues(o.xTicks.filter((t) => t >= x.domain()[0] && t <= x.domain()[1]));
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`).call(xa).call((g) => g.select('.domain').remove());
  const area = (f) => d3.area().defined((d) => d != null).x((d, i) => x(o.xs[i])).y0(y(0)).y1((d) => y(f(d))).curve(d3.curveLinear)(o.ds);
  svg.append('path').attr('d', area((d) => Math.max(d, 0))).attr('fill', C.cam).attr('opacity', 0.85);
  svg.append('path').attr('d', area((d) => Math.min(d, 0))).attr('fill', C.ctrl).attr('opacity', 0.7);
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', C.ink).attr('stroke-width', 1.25);
  if (o.yLabel) yAxisLabel(svg, o.yLabel, m, H);
  if (o.labels) {
    svg.append('text').attr('class', 'band-label').attr('x', W - m.r - 4).attr('y', m.t + 12).attr('text-anchor', 'end').text(o.labels[0]);
    svg.append('text').attr('class', 'band-label').attr('x', W - m.r - 4).attr('y', H - m.b - 6).attr('text-anchor', 'end').text(o.labels[1]);
  }
  const cross = svg.append('line').attr('class', 'cross').attr('y1', m.t).attr('y2', H - m.b).style('opacity', 0);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('mousemove', (ev) => {
      const i = d3.minIndex(o.xs, (v) => Math.abs(v - x.invert(d3.pointer(ev)[0])));
      cross.attr('x1', x(o.xs[i])).attr('x2', x(o.xs[i])).style('opacity', 1);
      if (o.tooltip) showTip(o.tooltip(i), ev);
    })
    .on('mouseleave', () => { cross.style('opacity', 0); hideTip(); });
}

// ---------------------------------------------------------------- contexto con brush
/** Barras mensuales pequeñas con un selector de rango (en días). */
export function contextBrush(el, { monthly, monthStartDay, range, onBrush }) {
  el.innerHTML = '';
  const W = el.clientWidth || 600;
  const H = 62;
  const m = { t: 4, r: 14, b: 22, l: 50 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'context');
  const x = d3.scaleLinear([0, 1461], [m.l, W - m.r]);
  const y = d3.scaleLinear([0, d3.max(monthly) || 1], [H - m.b, m.t]);
  svg.append('g').selectAll('rect').data(monthly).join('rect')
    .attr('x', (d, i) => x(monthStartDay[i]) + 0.5)
    .attr('width', (d, i) => Math.max(1, x(monthStartDay[i + 1] ?? 1461) - x(monthStartDay[i]) - 1))
    .attr('y', (d) => y(d)).attr('height', (d) => y(0) - y(d))
    .attr('fill', (d, i) => (i < 12 ? '#9aa0a6' : i < 24 ? '#d9d9d4' : '#D9959F'));
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).tickValues([0, 365, 731, 1096]).tickSize(3).tickFormat((d, i) => 2019 + i))
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  const brush = d3.brushX().extent([[m.l, m.t], [W - m.r, H - m.b]])
    .on('end', (ev) => {
      if (!ev.sourceEvent) return;
      if (!ev.selection) return onBrush(null);
      const [a, b] = ev.selection.map(x.invert).map(Math.round);
      onBrush(b - a < 7 ? null : [Math.max(0, a), Math.min(1460, b)]);
    });
  const gb = svg.append('g').attr('class', 'brush').call(brush);
  if (range) gb.call(brush.move, range.map(x));
}

// ---------------------------------------------------------------- dispersión: velocidad vs. gravedad
/**
 * rows: [{ corredor, speed, share, total, fatal, tip }]
 * speed = P85 media del corredor (km/h); share = fracción de siniestros con muertos.
 */
export function speedSeverityScatter(el, rows, { selected, onSelect } = {}) {
  el.innerHTML = '';
  if (!rows.length) {
    el.innerHTML = '<p class="muted">No existe información de velocidad para estos corredores.</p>';
    return;
  }
  const W = el.clientWidth || 700;
  const H = 330;
  const m = { t: 20, r: 24, b: 54, l: 78 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'scatter');
  const x = d3.scaleLinear(d3.extent(rows, (d) => d.speed), [m.l, W - m.r]).nice(4);
  const y = d3.scaleLinear([0, (d3.max(rows, (d) => d.share) || 0.01) * 100], [H - m.b, m.t]).nice(4);
  const rr = d3.scaleSqrt(d3.extent(rows, (d) => d.total), [4, 10]);
  const yt = y.ticks(4);
  const yfmt = (v) => `${Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')} %`;

  svg.append('g').attr('class', 'grid').selectAll('line').data(yt).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
    .call(d3.axisLeft(y).tickValues(yt).tickSize(0).tickFormat(yfmt))
    .call((g) => g.select('.domain').remove());
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(3).tickFormat((v) => fmt.int(v)))
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  yAxisLabel(svg, '% siniestros con muertos', m, H);
  svg.append('text').attr('class', 'xlabel').attr('x', (m.l + W - m.r) / 2).attr('y', H - 4)
    .attr('text-anchor', 'middle').text('Velocidad P85 (km/h)');

  const g = svg.append('g').selectAll('g').data(rows).join('g')
    .attr('transform', (d) => `translate(${x(d.speed)},${y(d.share * 100)})`)
    .attr('class', (d) => `sc-row${d.corredor === selected ? ' sel' : ''}`);
  g.append('circle').attr('r', (d) => rr(d.total))
    .attr('fill', (d) => (d.corredor === selected ? C.despues : C.cam))
    .attr('fill-opacity', 0.72).attr('stroke', C.surface).attr('stroke-width', 1.5)
    .on('mousemove', (ev, d) => showTip(d.tip, ev))
    .on('mouseleave', hideTip)
    .on('click', (_, d) => onSelect?.(d.corredor));

  // etiquetas mínimas: el más rápido, el de mayor proporción y el seleccionado
  const mark = new Set([rows.reduce((a, b) => (b.speed > a.speed ? b : a)).corredor,
    rows.reduce((a, b) => (b.share > a.share ? b : a)).corredor]);
  if (selected) mark.add(selected);
  for (const d of rows.filter((d) => mark.has(d.corredor))) {
    const right = x(d.speed) > W * 0.72;
    svg.append('text').attr('class', 'sc-label')
      .attr('x', x(d.speed) + (right ? -rr(d.total) - 6 : rr(d.total) + 6))
      .attr('y', y(d.share * 100) + 4)
      .attr('text-anchor', right ? 'end' : 'start').text(d.corredor);
  }
  if (onSelect) svg.style('cursor', 'pointer');
}
