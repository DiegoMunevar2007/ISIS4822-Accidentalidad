import L from 'leaflet';
import { interpolateRgb } from 'd3';
import 'leaflet/dist/leaflet.css';
import { C, fmt, showTip, hideTip } from './charts.js';

/** Capa de puntos en canvas: dibuja decenas de miles de siniestros sin crear un objeto por punto. */
const PointsLayer = L.Layer.extend({
  initialize() {
    this._pts = { lat: [], lon: [], g: [], n: 0 };
  },
  onAdd(map) {
    this._map = map;
    this._canvas = L.DomUtil.create('canvas', 'points-canvas leaflet-zoom-hide');
    map.getPane('puntos').appendChild(this._canvas);
    map.on('moveend zoomend resize viewreset', this._redraw, this);
    this._redraw();
  },
  onRemove(map) {
    this._canvas.remove();
    map.off('moveend zoomend resize viewreset', this._redraw, this);
  },
  setPoints(pts) {
    this._pts = pts;
    if (this._map) this._redraw();
  },
  _redraw() {
    const map = this._map;
    const size = map.getSize();
    const ratio = window.devicePixelRatio || 1;
    const cv = this._canvas;
    cv.width = size.x * ratio;
    cv.height = size.y * ratio;
    cv.style.width = `${size.x}px`;
    cv.style.height = `${size.y}px`;
    L.DomUtil.setPosition(cv, map.containerPointToLayerPoint([0, 0]));
    const ctx = cv.getContext('2d');
    ctx.scale(ratio, ratio);
    const { lat, lon, g, n } = this._pts;
    const z = map.getZoom();
    const base = n > 20000 ? 0.8 : n > 4000 ? 1.1 : 1.7;
    const r = base * Math.min(3, Math.max(0.8, (z - 11) * 0.5 + 1));
    // Con muchos puntos y poco zoom los puntos se montan unos sobre otros: se agrupan en celdas y se pinta la densidad.
    const densidad = n > 12000 && z < 13;
    if (densidad) {
      const celda = 9;
      const cols = Math.ceil(size.x / celda) + 1;
      const cuenta = new Map();
      let max = 0;
      for (let i = 0; i < n; i++) {
        const p = map.latLngToContainerPoint([lat[i], lon[i]]);
        if (p.x < 0 || p.y < 0 || p.x > size.x || p.y > size.y) continue;
        const k = Math.floor(p.y / celda) * cols + Math.floor(p.x / celda);
        const v = (cuenta.get(k) ?? 0) + 1;
        cuenta.set(k, v);
        if (v > max) max = v;
      }
      const rampa = interpolateRgb('#F7EBC3', '#B5283A');
      for (const [k, v] of cuenta) {
        ctx.fillStyle = rampa(Math.sqrt(v / max));
        ctx.globalAlpha = 0.35 + 0.6 * Math.sqrt(v / max);
        ctx.fillRect((k % cols) * celda, Math.floor(k / cols) * celda, celda - 1, celda - 1);
      }
      ctx.globalAlpha = 1;
    }
    // Dibujar en orden de gravedad para que los fatales queden encima
    const colors = ['rgba(150,156,162,0.45)', 'rgba(232,161,0,0.7)', 'rgba(200,16,46,0.92)'];
    for (let level = densidad ? 2 : 0; level <= 2; level++) {
      ctx.fillStyle = colors[level];
      ctx.beginPath();
      const rr = level === 2 ? r * 1.25 : r;
      for (let i = 0; i < n; i++) {
        if (g[i] !== level) continue;
        const p = map.latLngToContainerPoint([lat[i], lon[i]]);
        if (p.x < -5 || p.y < -5 || p.x > size.x + 5 || p.y > size.y + 5) continue;
        ctx.moveTo(p.x + rr, p.y);
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
      }
      if (level === 2 || n < 4000) {
        ctx.strokeStyle = 'rgba(255,255,255,0.95)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.fill();
    }
  },
});

export function createMap(el, D, { onSelectSitio, onSelectCorredor, onHoverCorredor }) {
  const map = L.map(el, { zoomControl: true, attributionControl: true, preferCanvas: false, zoomSnap: 0.25 })
    .setView([4.65, -74.1], 11);
  const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
  L.tileLayer(`${esri}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
    attribution: 'Base: Esri, HERE, Garmin, &copy; OpenStreetMap',
    maxZoom: 16,
  }).addTo(map);
  const labels = L.tileLayer(`${esri}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
    maxZoom: 16, pane: 'shadowPane', opacity: 0.75,
  }).addTo(map);
  labels.getContainer().style.pointerEvents = 'none';
  // El contenedor cambia de tamaño al ocultar/mostrar paneles: Leaflet debe enterarse.
  new ResizeObserver(() => map.invalidateSize({ pan: false })).observe(el);

  // Orden de capas: tramos < radios < puntos < sitios
  [['tramos', 410], ['radios', 415], ['puntos', 420], ['resalte', 425], ['sitios', 430]].forEach(([n, z]) => {
    map.createPane(n).style.zIndex = z;
  });
  map.getPane('radios').style.pointerEvents = 'none';
  map.getPane('puntos').style.pointerEvents = 'none';
  map.getPane('resalte').style.pointerEvents = 'none';
  const canvasRenderer = L.canvas({ padding: 0.3, tolerance: 6, pane: 'tramos' });
  const sitioRenderer = L.svg({ pane: 'sitios' });
  const tramoLayer = L.layerGroup().addTo(map);
  const bufferLayer = L.layerGroup().addTo(map);
  const points = new PointsLayer().addTo(map);
  const resalteLayer = L.layerGroup().addTo(map);
  const resalteRenderer = L.svg({ pane: 'resalte' });
  const sitioLayer = L.layerGroup().addTo(map);
  // Cámara seleccionada: un ícono propio con su etiqueta, por encima de todo lo demás.
  const focoLayer = L.layerGroup().addTo(map);

  // Tramos Bitcarrier
  const tramoLines = D.geo.tramos.map((t) => {
    const latlngs = t.lines.map((line) => line.map(([x, y]) => [y, x]));
    const pl = L.polyline(latlngs, { renderer: canvasRenderer, weight: 2, color: '#b7bbbf', opacity: 0.85 });
    pl.tramo = t;
    pl.on('mouseover', (ev) => {
      if (!t.corredor) return;
      onHoverCorredor?.(t.corredor);
      showTip(`<b>${t.corredor}</b><br>Tramo ${t.id.replace('|', ', ')}`, ev.originalEvent);
    });
    pl.on('mouseout', () => { hideTip(); onHoverCorredor?.(null); });
    pl.on('click', () => t.corredor && onSelectCorredor(t.corredor));
    pl.addTo(tramoLayer);
    return pl;
  });

  // Sitios de cámara
  const sitioMarkers = D.geo.sitios.map((s) => {
    const mk = L.circleMarker([s.lat, s.lon], {
      radius: 4 + s.n_camaras, weight: 1.5, renderer: sitioRenderer, pane: 'sitios', color: C.ink, fillColor: '#ffffff', fillOpacity: 1,
    });
    mk.sitio = s;
    mk.on('mouseover', (ev) => {
      mk.setStyle({ weight: 3 });
      showTip(mk._tipHtml?.() ?? s.id, ev.originalEvent);
    });
    mk.on('mousemove', (ev) => showTip(mk._tipHtml?.() ?? s.id, ev.originalEvent));
    mk.on('mouseout', () => {
      mk.setStyle({ weight: mk._sel ? 2.5 : 1.5 });
      hideTip();
    });
    mk.on('click', () => onSelectSitio(s.id));
    mk.addTo(sitioLayer);
    return mk;
  });

  let lastBoundsKey = null;

  let selCorr = null;
  let hoverCorr = null;
  function restyleTramos() {
    for (const pl of tramoLines) {
      const t = pl.tramo;
      const on = selCorr && t.corredor === selCorr;
      const hov = hoverCorr && t.corredor === hoverCorr;
      pl.setStyle({
        color: on || hov ? C.despues : t.cam ? '#8a9096' : '#c9ccd0',
        weight: hov ? 6 : on ? 4 : t.cam ? 2.5 : 1.6,
        opacity: hov ? 1 : selCorr && !on ? 0.55 : 0.9,
      });
      if (on || hov) pl.bringToFront();
    }
  }
  /** Resalta un corredor sin recalcular puntos ni sitios (se llama al pasar el cursor por la lista). */
  function setHover(c) {
    if (c === hoverCorr) return;
    hoverCorr = c;
    restyleTramos();
    // Halo blanco más línea del color de acento, por encima de los puntos para que no los tapen.
    resalteLayer.clearLayers();
    if (!c) return;
    for (const pl of tramoLines) {
      if (pl.tramo.corredor !== c) continue;
      const ll = pl.getLatLngs();
      L.polyline(ll, { renderer: resalteRenderer, pane: 'resalte', color: '#ffffff', weight: 12, opacity: 0.95, interactive: false }).addTo(resalteLayer);
      L.polyline(ll, { renderer: resalteRenderer, pane: 'resalte', color: C.ink, weight: 6, opacity: 1, interactive: false }).addTo(resalteLayer);
    }
  }

  function update(st, { pts, sitiosAmbito, conteoSitio, gravLabel }) {
    selCorr = st.sitio ? D.geo.sitios.find((s) => s.id === st.sitio).corredor : st.corredor;
    restyleTramos();
    const ids = new Set(sitiosAmbito.map((s) => s.id));
    bufferLayer.clearLayers();
    focoLayer.clearLayers();
    if (st.corredor || st.sitio) {
      for (const s of sitiosAmbito) {
        L.circle([s.lat, s.lon], {
          radius: st.radio, color: C.despues, weight: 1, dashArray: '4 4', fillColor: C.despues, fillOpacity: 0.05, interactive: false, pane: 'radios',
        }).addTo(bufferLayer);
      }
    }
    if (st.sitio && sitiosAmbito[0]) {
      const s = sitiosAmbito[0];
      const pin = L.marker([s.lat, s.lon], {
        interactive: false, keyboard: false, zIndexOffset: 1000,
        icon: L.divIcon({ className: 'cam-pin', html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 13] }),
      }).addTo(focoLayer);
      pin.bindTooltip(
        `<b>Cámara</b><br>${s.via}<br>${s.n_camaras} cámara${s.n_camaras > 1 ? 's' : ''}, ${s.tipo}, límite ${s.limite} km/h`,
        { permanent: true, direction: 'right', offset: [24, 0], className: 'cam-label' },
      );
      // Etiqueta del radio, sobre el borde norte del círculo.
      L.marker([s.lat + st.radio / 111320, s.lon], {
        interactive: false, keyboard: false,
        icon: L.divIcon({ className: 'radio-label', html: `<span>${st.radio} m</span>`, iconSize: [0, 0] }),
      }).addTo(focoLayer);
    }
    for (const mk of sitioMarkers) {
      const s = mk.sitio;
      const sel = (st.corredor || st.sitio) && ids.has(s.id);
      mk._sel = sel;
      mk.setStyle({
        color: sel ? C.despues : C.ink,
        fillColor: st.sitio === s.id ? C.ink : '#ffffff',
        weight: sel ? 2.5 : 1.5,
        opacity: (st.corredor || st.sitio) && !sel ? 0.45 : 1,
        fillOpacity: (st.corredor || st.sitio) && !sel ? 0.5 : 1,
      });
      if (sel) mk.bringToFront();
      mk._tipHtml = () => {
        const c = conteoSitio.get(s.id) ?? 0;
        return `<b>${s.corredor}, ${s.via}</b><br>${s.id}: ${s.n_camaras} cámara${s.n_camaras > 1 ? 's' : ''} (${s.tipo}), límite ${s.limite} km/h<br>
          Desde ${s.fecha}<br><b>${fmt.int(c)}</b> ${gravLabel} a ≤ ${st.radio} m (filtros actuales)`;
      };
    }
    points.setPoints(pts);

    const key = `${st.corredor}|${st.sitio}`;
    map.invalidateSize({ pan: false });
    const sz = map.getSize();
    if (key !== lastBoundsKey && sz.x > 0 && sz.y > 0) {
      lastBoundsKey = key;
      if (st.sitio) {
        const s = sitiosAmbito[0];
        map.flyTo([s.lat, s.lon], st.radio > 600 ? 14 : 15, { duration: 0.6 });
      } else if (st.corredor) {
        const b = L.latLngBounds(sitiosAmbito.map((s) => [s.lat, s.lon]));
        for (const pl of tramoLines) if (pl.tramo.corredor === selCorr && !st.sitio) b.extend(pl.getBounds());
        map.flyToBounds(b.pad(st.sitio ? 0.01 : 0.15), { maxZoom: st.sitio ? 15 : 13.5, duration: 0.6 });
      } else {
        map.flyTo([4.65, -74.1], 11, { duration: 0.6 });
      }
    }
  }

  return { map, update, setHover, invalidate: () => map.invalidateSize() };
}
