import L from 'leaflet';
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
    // Dibujar en orden de gravedad para que los fatales queden encima
    const colors = ['rgba(120,113,103,0.35)', 'rgba(235,104,52,0.55)', 'rgba(176,36,28,0.95)'];
    for (let level = 0; level <= 2; level++) {
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
        ctx.strokeStyle = 'rgba(255,253,249,0.95)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.fill();
    }
  },
});

export function createMap(el, D, { onSelectSitio, onSelectCorredor }) {
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
  [['tramos', 410], ['radios', 415], ['puntos', 420], ['sitios', 430]].forEach(([n, z]) => {
    map.createPane(n).style.zIndex = z;
  });
  map.getPane('radios').style.pointerEvents = 'none';
  map.getPane('puntos').style.pointerEvents = 'none';
  const canvasRenderer = L.canvas({ padding: 0.3, tolerance: 6, pane: 'tramos' });
  const sitioRenderer = L.svg({ pane: 'sitios' });
  const tramoLayer = L.layerGroup().addTo(map);
  const bufferLayer = L.layerGroup().addTo(map);
  const points = new PointsLayer().addTo(map);
  const sitioLayer = L.layerGroup().addTo(map);

  // Tramos Bitcarrier
  const tramoLines = D.geo.tramos.map((t) => {
    const latlngs = t.lines.map((line) => line.map(([x, y]) => [y, x]));
    const pl = L.polyline(latlngs, { renderer: canvasRenderer, weight: 2, color: '#b9b0a3', opacity: 0.8 });
    pl.tramo = t;
    pl.on('mouseover', (ev) => {
      if (!t.corredor) return;
      showTip(`<b>${t.corredor}</b><br>Tramo ${t.id.replace('|', ' · ')}<br><span class="muted">Clic para seleccionar el corredor</span>`, ev.originalEvent);
    });
    pl.on('mouseout', hideTip);
    pl.on('click', () => t.corredor && onSelectCorredor(t.corredor));
    pl.addTo(tramoLayer);
    return pl;
  });

  // Sitios de cámara
  const sitioMarkers = D.geo.sitios.map((s) => {
    const mk = L.circleMarker([s.lat, s.lon], {
      radius: 4 + s.n_camaras, weight: 1.5, renderer: sitioRenderer, pane: 'sitios', color: C.ink, fillColor: '#fffdf9', fillOpacity: 1,
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

  function update(st, { pts, sitiosAmbito, conteoSitio, gravLabel }) {
    const selCorr = st.sitio ? D.geo.sitios.find((s) => s.id === st.sitio).corredor : st.corredor;
    for (const pl of tramoLines) {
      const t = pl.tramo;
      const on = selCorr && t.corredor === selCorr;
      pl.setStyle({
        color: on ? C.despues : t.cam ? '#857d71' : '#c9c1b4',
        weight: on ? 4 : t.cam ? 2.5 : 1.6,
        opacity: selCorr && !on ? 0.55 : 0.9,
      });
      if (on) pl.bringToFront();
    }
    const ids = new Set(sitiosAmbito.map((s) => s.id));
    bufferLayer.clearLayers();
    if (st.corredor || st.sitio) {
      for (const s of sitiosAmbito) {
        L.circle([s.lat, s.lon], {
          radius: st.radio, color: C.despues, weight: 1, dashArray: '4 4', fillColor: C.despues, fillOpacity: 0.05, interactive: false, pane: 'radios',
        }).addTo(bufferLayer);
      }
    }
    for (const mk of sitioMarkers) {
      const s = mk.sitio;
      const sel = (st.corredor || st.sitio) && ids.has(s.id);
      mk._sel = sel;
      mk.setStyle({
        color: sel ? C.despues : C.ink,
        fillColor: st.sitio === s.id ? C.ink : '#fffdf9',
        weight: sel ? 2.5 : 1.5,
        opacity: (st.corredor || st.sitio) && !sel ? 0.45 : 1,
        fillOpacity: (st.corredor || st.sitio) && !sel ? 0.5 : 1,
      });
      if (sel) mk.bringToFront();
      mk._tipHtml = () => {
        const c = conteoSitio.get(s.id) ?? 0;
        return `<b>${s.corredor} · ${s.via}</b><br>${s.id} · ${s.n_camaras} cámara${s.n_camaras > 1 ? 's' : ''} · ${s.tipo} · límite ${s.limite} km/h<br>
          Desde ${s.fecha}<br><b>${fmt.int(c)}</b> ${gravLabel} a ≤ ${st.radio} m (filtros actuales)<br>
          <span class="muted">${st.sitio === s.id ? 'Clic otra vez para quitar' : 'Clic para seleccionar este sitio'}</span>`;
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

  return { map, update, invalidate: () => map.invalidateSize() };
}
