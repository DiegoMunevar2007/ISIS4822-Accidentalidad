// Landing + recorrido guiado (respuesta al feedback: "tutorial para iniciar / landing page").

const KEY = 'camaras-visor-visto';

export function initTour({ set, getState, defaults, onStart }) {
  const landing = document.getElementById('landing');
  const tour = document.getElementById('tour');
  const hole = document.getElementById('tour-hole');
  const card = document.getElementById('tour-card');

  const steps = [
    {
      sel: '#tabs', before: () => set({ tab: 'mapa', mapa: true }),
      title: 'Tres vistas',
      text: '«Mapa y ficha» resume un ámbito; «Serie» muestra la evolución mes a mes; «Meses A/B» compara dos meses en una pantalla aparte.',
    },
    {
      sel: '#panel-map', before: () => set({ tab: 'mapa', mapa: true }),
      title: '1 · Selecciona en el mapa',
      text: 'Cada círculo es un sitio de cámara. Pasa el cursor para ver cuántos siniestros tiene cerca y haz clic para seleccionarlo. Los tramos del corredor también se pueden hacer clic.',
    },
    {
      sel: '.f-corr', before: () => set({ corredor: 'Av. Boyacá', sitio: null }),
      title: '…o desde el menú',
      text: 'Elegimos Av. Boyacá como ejemplo. Puedes bajar a un sitio de cámara específico con el menú de al lado.',
    },
    {
      sel: '#scope-line',
      title: '¿Qué se está contando?',
      text: 'El ámbito siempre está escrito aquí: se cuentan los siniestros a menos del radio elegido de los sitios con cámara, no toda la vía.',
    },
    {
      sel: '.f-periodo',
      title: '2 · Filtra',
      text: 'Periodo (antes 2019, transición 2020, después 2021–22) y gravedad. En «Más filtros» están el tipo de siniestro, el actor (moto, peatón…), el radio y las intersecciones ambiguas.',
    },
    {
      sel: '#panel-ficha', before: () => set({ tab: 'mapa', mapa: true }),
      title: '3 · Compara con el control',
      text: 'La ficha compara el promedio mensual antes y después en la zona con cámara y en vías similares sin cámara. La diferencia en puntos porcentuales es la lectura clave.',
    },
    {
      sel: '#btn-hide-map',
      title: 'El mapa no es fijo',
      text: 'Oculta el mapa para ver la ficha y la serie lado a lado. Vuelve a mostrarlo desde la barra lateral.',
    },
    {
      sel: '#panel-serie', before: () => set({ tab: 'serie', mapa: false, serieModo: 'anios' }),
      title: 'Serie: varias líneas a la vez',
      text: 'Pasa el cursor para ver cada mes. «Años superpuestos» dibuja 2019 contra 2021–22, «Cámara vs. control» compara índices, y abajo está la velocidad del tráfico.',
    },
    {
      sel: '#panel-ab', before: () => set({ tab: 'ab' }),
      title: 'Meses A/B',
      text: 'Haz clic en la serie para fijar A y luego B. Las tarjetas incluyen siniestros, víctimas, cámaras instaladas y velocidad de cada mes.',
    },
  ];

  let k = 0;
  function show() {
    const s = steps[k];
    s.before?.();
    requestAnimationFrame(() => {
      const el = document.querySelector(s.sel);
      if (!el) return next();
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      const r = el.getBoundingClientRect();
      const pad = 6;
      Object.assign(hole.style, {
        left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${Math.min(r.height + pad * 2, window.innerHeight - 20)}px`,
      });
      document.getElementById('tour-step').textContent = `Paso ${k + 1} de ${steps.length}`;
      document.getElementById('tour-title').textContent = s.title;
      document.getElementById('tour-text').textContent = s.text;
      document.getElementById('tour-next').textContent = k === steps.length - 1 ? 'Empezar a explorar' : 'Siguiente';
      const cw = 340;
      const below = r.bottom + 12 + 190 < window.innerHeight;
      const left = Math.min(Math.max(12, r.left), window.innerWidth - cw - 12);
      let top = below ? r.bottom + 12 : Math.max(12, r.top - 200);
      if (r.height > window.innerHeight * 0.6) top = Math.min(r.top + 24, window.innerHeight - 220);
      Object.assign(card.style, { left: `${left}px`, top: `${top}px`, width: `${cw}px` });
    });
  }
  function next() {
    k++;
    if (k >= steps.length) return end();
    show();
  }
  function end() {
    tour.hidden = true;
    set(defaults());
  }
  function start() {
    onStart?.();
    landing.hidden = true;
    tour.hidden = false;
    k = 0;
    set(defaults());
    setTimeout(show, 50);
  }
  function closeLanding() {
    landing.hidden = true;
    try { localStorage.setItem(KEY, '1'); } catch { /* sin almacenamiento */ }
  }

  document.getElementById('tour-next').addEventListener('click', next);
  document.getElementById('tour-skip').addEventListener('click', end);
  document.getElementById('btn-tour').addEventListener('click', () => { closeLanding(); start(); });
  document.getElementById('btn-skip').addEventListener('click', closeLanding);
  document.getElementById('btn-help').addEventListener('click', () => (landing.hidden = false));
  window.addEventListener('resize', () => !tour.hidden && show());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!tour.hidden) end();
      else if (!landing.hidden) closeLanding();
    }
  });

  let visto = false;
  try { visto = localStorage.getItem(KEY) === '1'; } catch { /* nada */ }
  const params = new URLSearchParams(location.search);
  if (params.has('sinlanding')) visto = true;
  if (!visto) landing.hidden = false;
  void getState;

  return { hideLanding: closeLanding, start, end };
}
