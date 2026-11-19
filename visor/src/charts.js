import * as d3 from 'd3';

export const C = {
  ink: '#18212e',
  ink2: '#4a5563',
  muted: '#6b7686',
  grid: '#e6eaf0',
  track: '#eef1f5',
  surface: '#ffffff', // halo/gap sobre paneles
  neutral: '#c3cad4', // barra 2020 / neutro
  antes: '#2360bd', // A / antes
  despues: '#c23128', // B / después
  y2020: '#9aa2ae',
  y2021: '#eb6834',
  y2022: '#b0241c',
  cam: '#6250d6',
  ctrl: '#0f9d6b',
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

const sw = (color, dash) =>
  `<svg width="18" height="8" aria-hidden="true"><line x1="0" y1="4" x2="18" y2="4" stroke="${color}" stroke-width="2.5" ${dash ? 'stroke-dasharray="4 3"' : ''}/></svg>`;
export const legendHtml = (items) =>
  `<div class="chart-legend">${items.map((s) => `<span>${sw(s.color, s.dash)}${s.label}</span>`).join('')}</div>`;

// ---------------------------------------------------------------- barras anuales
export function annualBars(el, data, { yMax, onHover } = {}) {
  el.innerHTML = '';
  const W = el.clientWidth || 360;
  const H = 168;
  const m = { t: 22, r: 8, b: 24, l: 34 };
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
    .attr('d', (d) => roundedTop(0, y(d.n), bw, y(0) - y(d.n), 4))
    .attr('fill', (d) => (d.year === 2020 ? C.neutral : d.year === 2019 ? C.antes : d.year >= 2021 ? C.despues : C.ink));
  g.append('text').attr('class', 'val').attr('x', bw / 2).attr('y', (d) => y(d.n) - 6).attr('text-anchor', 'middle')
    .text((d) => fmt.int(d.n));
  g.append('rect').attr('x', -6).attr('width', bw + 12).attr('y', m.t - 10).attr('height', H - m.t - m.b + 10)
    .attr('fill', 'transparent')
    .on('mousemove', (ev, d) => showTip(onHover(d), ev))
    .on('mouseleave', hideTip);
}

function roundedTop(x, y, w, h, r) {
  if (h <= 0) return `M${x},${y}h${w}`;
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

// ---------------------------------------------------------------- barras horizontales pareadas
/** rows: [{label, a, b, aLabel, bLabel, tip}] -> dos barras por fila (antes azul / después rojo). */
export function pairedBars(el, rows, { max, fmtVal = fmt.dec } = {}) {
  el.innerHTML = '';
  const mx = max ?? (d3.max(rows, (r) => Math.max(r.a, r.b)) || 1);
  const html = rows
    .map(
      (r) => `
    <div class="pb-row" data-tip="${encodeURIComponent(r.tip || '')}">
      <div class="pb-label">${r.label}</div>
      <div class="pb-bars">
        <div class="pb-line"><div class="pb-bar" style="width:${(100 * r.a) / mx}%;background:${C.antes}"></div><b>${fmtVal(r.a)}</b></div>
        <div class="pb-line"><div class="pb-bar" style="width:${(100 * r.b) / mx}%;background:${C.despues}"></div><b>${fmtVal(r.b)}</b></div>
      </div>
      ${r.delta != null ? `<div class="pb-delta ${r.delta < 0 ? 'down' : r.delta > 0 ? 'up' : ''}">${fmt.pct(r.delta)}</div>` : ''}
    </div>`,
    )
    .join('');
  el.innerHTML = html;
  el.querySelectorAll('.pb-row').forEach((row) => {
    const t = decodeURIComponent(row.dataset.tip);
    if (!t) return;
    row.addEventListener('mousemove', (ev) => showTip(t, ev));
    row.addEventListener('mouseleave', hideTip);
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
  const H = o.height ?? 260;
  const m = { t: 26, r: o.directLabels ? 78 : 14, b: 26, l: 40 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'linechart');
  const x = d3.scaleLinear(o.xDomain ?? d3.extent(o.xs), [m.l, W - m.r]);
  const allY = o.series.flatMap((s) => s.ys.filter((v) => v != null));
  const y = d3.scaleLinear([o.yMin ?? 0, o.yMax ?? (d3.max(allY) || 1)], [H - m.b, m.t]).nice(4);

  // bandas de contexto
  for (const b of o.bands ?? []) {
    const x0 = Math.max(x(b.x0), m.l);
    const x1 = Math.min(x(b.x1), W - m.r);
    if (x1 <= x0) continue;
    svg.append('rect').attr('class', 'band').attr('x', x0).attr('width', x1 - x0).attr('y', m.t).attr('height', H - m.t - m.b);
    if (b.label && x1 - x0 > 46)
      svg.append('text').attr('class', 'band-label').attr('x', x0 + 4).attr('y', m.t + 11).text(b.label);
  }
  // con conteos pequeños solo se muestran marcas enteras
  const yt = o.yFormat ? y.ticks(4) : y.ticks(4).filter(Number.isInteger);
  svg.append('g').attr('class', 'grid').selectAll('line').data(yt).join('line')
    .attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l - 6},0)`)
    .call(d3.axisLeft(y).tickValues(yt).tickSize(0).tickFormat(o.yFormat ?? fmt.int)).call((g) => g.select('.domain').remove());
  const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`;
  svg.append('clipPath').attr('id', clipId).append('rect')
    .attr('x', m.l - 4).attr('y', 0).attr('width', W - m.l - m.r + 8).attr('height', H - m.b + 4);
  const xa = d3.axisBottom(x).tickSize(4).tickFormat(o.xTickFormat ?? String);
  if (o.xTicks) xa.tickValues(o.xTicks.filter((t) => t >= x.domain()[0] && t <= x.domain()[1]));
  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`).call(xa)
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  if (o.yLabel) svg.append('text').attr('class', 'ylabel').attr('x', m.l - 34).attr('y', 12).text(o.yLabel);

  for (const r of o.refLines ?? []) {
    svg.append('line').attr('class', 'refline').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(r.y)).attr('y2', y(r.y));
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
    for (let i = 1; i < labs.length; i++) labs[i].y = Math.max(labs[i].y, labs[i - 1].y + 13);
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

// ---------------------------------------------------------------- contexto con brush
/** Barras mensuales pequeñas con un selector de rango (en días). */
export function contextBrush(el, { monthly, monthStartDay, range, onBrush }) {
  el.innerHTML = '';
  const W = el.clientWidth || 600;
  const H = 54;
  const m = { t: 4, r: 14, b: 18, l: 40 };
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'context');
  const x = d3.scaleLinear([0, 1461], [m.l, W - m.r]);
  const y = d3.scaleLinear([0, d3.max(monthly) || 1], [H - m.b, m.t]);
  svg.append('g').selectAll('rect').data(monthly).join('rect')
    .attr('x', (d, i) => x(monthStartDay[i]) + 0.5)
    .attr('width', (d, i) => Math.max(1, x(monthStartDay[i + 1] ?? 1461) - x(monthStartDay[i]) - 1))
    .attr('y', (d) => y(d)).attr('height', (d) => y(0) - y(d))
    .attr('fill', (d, i) => (i < 12 ? '#bcd2f0' : i < 24 ? '#dfe4ea' : '#eeb8b2'));
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

// ---------------------------------------------------------------- tarjeta A/B (barra de progreso)
export function meter(value, max, color) {
  const w = max > 0 ? Math.min(100, (100 * value) / max) : 0;
  return `<div class="meter"><div style="width:${w}%;background:${color}"></div></div>`;
}

// ---------------------------------------------------------------- dumbbell: cámara vs. control
/**
 * rows: [{ key, label, a, b, n, tip }]
 * a = cambio de la zona con cámara (fracción), b = cambio del control (fracción).
 * Se usa en el panorama para los tres niveles de gravedad.
 */
export function dumbbell(el, rows, { selected, onSelect } = {}) {
  el.innerHTML = '';
  if (!rows.length) return;
  const W = el.clientWidth || 560;
  const rowH = 44;
  const m = { t: 26, r: 18, b: 32, l: 158 };
  const H = m.t + rows.length * rowH + m.b;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'dumbbell');
  const vals = rows.flatMap((r) => [r.a, r.b]).filter((v) => v != null);
  const [lo, hi] = d3.extent([...vals, 0]);
  const pad = Math.max(0.04, (hi - lo) * 0.18);
  const x = d3.scaleLinear([lo - pad, hi + pad], [m.l, W - m.r]).nice(4);

  svg.append('g').attr('class', 'grid').selectAll('line').data(x.ticks(4)).join('line')
    .attr('x1', x).attr('x2', x).attr('y1', m.t - 8).attr('y2', H - m.b);
  svg.append('line').attr('class', 'zero').attr('x1', x(0)).attr('x2', x(0))
    .attr('y1', m.t - 8).attr('y2', H - m.b);

  const rowsG = svg.append('g').selectAll('g').data(rows).join('g')
    .attr('class', (r) => `db-row${r.key === selected ? ' sel' : ''}${onSelect ? ' clickable' : ''}`)
    .attr('transform', (r, i) => `translate(0,${m.t + i * rowH})`);
  rowsG.append('rect').attr('class', 'db-bg').attr('x', 0).attr('y', 2).attr('width', W).attr('height', rowH - 4)
    .attr('rx', 4).attr('fill', (r) => (r.key === selected ? 'var(--soft)' : 'transparent'));
  rowsG.append('text').attr('class', 'db-label').attr('x', m.l - 12).attr('y', rowH / 2 + 4)
    .attr('text-anchor', 'end').text((r) => r.label);
  rowsG.append('text').attr('class', 'db-n').attr('x', m.l - 12).attr('y', rowH / 2 + 18)
    .attr('text-anchor', 'end').text((r) => (r.n == null ? '' : `N = ${fmt.int(r.n)}`));
  rowsG.append('line').attr('class', 'db-link')
    .attr('x1', (r) => x(r.a)).attr('x2', (r) => x(r.b))
    .attr('y1', rowH / 2).attr('y2', rowH / 2);
  rowsG.append('circle').attr('class', 'db-dot cam')
    .attr('cx', (r) => x(r.a)).attr('cy', rowH / 2).attr('r', 5)
    .attr('fill', C.cam);
  rowsG.append('circle').attr('class', 'db-dot ctrl')
    .attr('cx', (r) => x(r.b)).attr('cy', rowH / 2).attr('r', 5)
    .attr('fill', C.ctrl);
  rowsG.append('rect').attr('class', 'db-hit').attr('x', 0).attr('y', 2).attr('width', W).attr('height', rowH - 4)
    .attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(r.tip, ev))
    .on('mouseleave', hideTip)
    .on('click', (_, r) => onSelect?.(r.key));

  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat((v) => fmt.pct(v)).tickSize(3))
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  if (onSelect) svg.style('cursor', 'pointer');
}

// ---------------------------------------------------------------- dot plot por corredor
/**
 * rows: [{ corredor, value, n, antes, despues, ma, md, tip }]
 * value = cambio de la zona con cámara del corredor (fracción).
 * control = cambio del control de la ciudad (fracción) para la línea de referencia.
 */
export function corridorDots(el, rows, { control, selected, onSelect } = {}) {
  el.innerHTML = '';
  if (!rows.length) return;
  const W = el.clientWidth || 760;
  const rowH = 25;
  const m = { t: 30, r: 54, b: 34, l: 168 };
  const H = m.t + rows.length * rowH + m.b;
  const svg = d3.select(el).append('svg').attr('width', W).attr('height', H).attr('class', 'corridor-dots');
  const vals = rows.map((r) => r.value).filter((v) => v != null);
  if (control != null) vals.push(control);
  vals.push(0);
  const [lo, hi] = d3.extent(vals);
  const pad = Math.max(0.04, (hi - lo) * 0.14);
  const x = d3.scaleLinear([lo - pad, hi + pad], [m.l, W - m.r]).nice(4);

  svg.append('g').attr('class', 'grid').selectAll('line').data(x.ticks(4)).join('line')
    .attr('x1', x).attr('x2', x).attr('y1', m.t - 10).attr('y2', H - m.b);
  svg.append('line').attr('class', 'zero').attr('x1', x(0)).attr('x2', x(0))
    .attr('y1', m.t - 10).attr('y2', H - m.b);
  if (control != null) {
    svg.append('line').attr('class', 'control-line').attr('x1', x(control)).attr('x2', x(control))
      .attr('y1', m.t - 18).attr('y2', H - m.b);
    svg.append('text').attr('class', 'control-label')
      .attr('x', x(control)).attr('y', m.t - 24)
      .attr('text-anchor', x(control) > W * 0.72 ? 'end' : 'start')
      .text(`control ciudad ${fmt.pct(control)}`);
  }

  const g = svg.append('g').selectAll('g').data(rows).join('g')
    .attr('class', (r) => `cd-row${r.corredor === selected ? ' sel' : ''}${onSelect ? ' clickable' : ''}`)
    .attr('transform', (r, i) => `translate(0,${m.t + i * rowH})`);
  g.append('rect').attr('class', 'cd-bg').attr('x', 0).attr('y', 1).attr('width', W).attr('height', rowH - 2)
    .attr('rx', 4).attr('fill', (r) => (r.corredor === selected ? 'var(--soft)' : 'transparent'));
  g.append('text').attr('class', 'cd-label').attr('x', m.l - 12).attr('y', rowH / 2 + 4)
    .attr('text-anchor', 'end').text((r) => r.corredor);
  g.append('circle').attr('class', 'cd-dot')
    .attr('cx', (r) => x(r.value)).attr('cy', rowH / 2)
    .attr('r', (r) => (r.corredor === selected ? 6 : 4.5))
    .attr('fill', (r) => (r.corredor === selected ? C.despues : C.cam));
  g.append('text').attr('class', 'cd-n').attr('x', W - m.r + 10).attr('y', rowH / 2 + 4)
    .text((r) => fmt.int(r.n));
  g.append('rect').attr('class', 'cd-hit').attr('x', 0).attr('y', 1).attr('width', W).attr('height', rowH - 2)
    .attr('fill', 'transparent')
    .on('mousemove', (ev, r) => showTip(r.tip, ev))
    .on('mouseleave', hideTip)
    .on('click', (_, r) => onSelect?.(r.corredor));

  svg.append('g').attr('class', 'axis x').attr('transform', `translate(0,${H - m.b})`)
    .call(d3.axisBottom(x).ticks(4).tickFormat((v) => fmt.pct(v)).tickSize(3))
    .call((g) => g.select('.domain').attr('stroke', C.grid));
  svg.append('text').attr('class', 'cd-hint').attr('x', W - m.r + 10).attr('y', m.t - 24)
    .attr('text-anchor', 'end').text('N');
  if (onSelect) svg.style('cursor', 'pointer');
}
