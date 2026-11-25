// Genera presentacion/Visor_Camaras_Salvavidas.pptx
// Uso: NODE_PATH=<carpeta con pptxgenjs> node presentacion/build_deck.js
const path = require('path');
const fs = require('fs');
const pptxgen = require('pptxgenjs');

const ROOT = path.resolve(__dirname, '..');
const IMG = (f) => path.join(__dirname, 'img', f);
const OUT = path.join(__dirname, 'Visor_Camaras_Salvavidas.pptx');
const APPLY_THEME = process.env.APPLY_THEME; // ruta a apply_theme.js (opcional)

const THEME = {
  name: 'Camaras Salvavidas',
  headFontFace: 'Cambria',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '18212E', lt1: 'FFFFFF', dk2: '4A5563', lt2: 'EDF0F4',
    accent1: 'C23128', accent2: '2360BD', accent3: '6250D6', accent4: '0F9D6B', accent5: 'EB6834', accent6: '6B7686',
    hlink: '2360BD', folHlink: '6250D6',
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
pres.title = '¿Las cámaras salvavidas realmente salvan vidas?';
pres.subject = 'Visor de accidentalidad · ISIS4822';
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

// ---------------------------------------------------------------- layouts
const FOOT = { x: 0.6, y: 7.02, w: 9, h: 0.3, fontSize: 10, color: C.text2 };
pres.defineSlideMaster({
  title: 'PORTADA',
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 2.0, w: 8.2, h: 2.6, fontSize: 44, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: 'top', margin: 0, align: 'left' }, text: '' } },
    { placeholder: { options: { name: 'body', type: 'body', x: 0.8, y: 4.75, w: 8.2, h: 1.2, fontSize: 18, color: C.background2, valign: 'top', margin: 0, align: 'left' }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'CONTENIDO',
  background: { color: HEX.lt1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontSize: 28, bold: true, color: C.text1, fontFace: THEME.headFontFace, valign: 'top', margin: 0, align: 'left' }, text: '' } },
    { text: { text: 'Cámaras salvavidas · Visor de accidentalidad · ISIS4822', options: FOOT } },
  ],
  slideNumber: { x: 12.2, y: 7.02, w: 0.5, h: 0.3, fontSize: 10, color: C.text2, align: 'right' },
});
pres.defineSlideMaster({
  title: 'CIERRE',
  background: { color: HEX.dk1 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.6, y: 0.35, w: 12.1, h: 0.95, fontSize: 28, bold: true, color: C.background1, fontFace: THEME.headFontFace, valign: 'top', margin: 0, align: 'left' }, text: '' } },
  ],
  slideNumber: { x: 12.2, y: 7.02, w: 0.5, h: 0.3, fontSize: 10, color: C.background2, align: 'right' },
});

// ---------------------------------------------------------------- helpers
const T = (slide, text, o) => slide.addText(text, { isTextBox: true, margin: 0, valign: 'top', fontSize: 14, color: C.text1, ...o });
const nf = (v, d = 1) => v.toLocaleString('es-CO', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Motivo visual: el marcador de "sitio de cámara" del visor (anillo + punto rojo). */
function sitio(slide, x, y, d, { dark = false } = {}) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: d, h: d, fill: { color: dark ? C.text1 : C.background1 }, line: { color: dark ? C.background1 : C.text1, width: Math.max(1.5, d * 3) },
    objectName: 'motivo sitio',
  });
  const r = d * 0.36;
  slide.addShape(pres.shapes.OVAL, { x: x + (d - r) / 2, y: y + (d - r) / 2, w: r, h: r, fill: { color: C.accent1 }, line: { type: 'none' }, objectName: 'motivo sitio punto' });
}

function shot(slide, file, x, y, w, h, alt) {
  slide.addShape(pres.shapes.RECTANGLE, { x: x - 0.02, y: y - 0.02, w: w + 0.04, h: h + 0.04, fill: { color: C.background2 }, line: { color: 'DCE2EA', width: 0.75 }, objectName: `marco ${alt}` });
  slide.addImage({ path: IMG(file), x, y, w, h, altText: alt, objectName: alt });
}

function card(slide, x, y, w, h, name) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: C.background2 }, line: { type: 'none' }, objectName: name });
}

// ---------------------------------------------------------------- datos para gráficas
const vel = JSON.parse(fs.readFileSync(path.join(ROOT, 'visor/public/data/velocidad.json'), 'utf8'));
const avg = (a, i, j) => {
  const x = a.slice(i, j).filter((v) => v != null);
  return x.length ? x.reduce((s, v) => s + v, 0) / x.length : null;
};
const velRows = Object.entries(vel.corredor)
  .filter(([, o]) => o.cam.n && o.sin.n)
  .map(([c, o]) => ({
    c, lim: o.limite,
    cam: avg(o.cam.p85, 24, 48) - avg(o.cam.p85, 0, 12),
    sin: avg(o.sin.p85, 24, 48) - avg(o.sin.p85, 0, 12),
  }))
  .filter((r) => r.cam != null && r.sin != null && !Number.isNaN(r.cam) && !Number.isNaN(r.sin))
  .sort((a, b) => a.cam - b.cam);

// Cambio % del promedio mensual de siniestros con heridos o muertos (2019 vs 2021-22), zona <= 500 m.
// Calculado con scripts/build_data.py + siniestros.csv (ver notas del orador).
const CORR_GRAVES = [
  ['Av. Carrera 9', -41.9], ['Av. Caracas', -26.6], ['Autopista Norte', -25.0], ['Av. Gaitán Cortés', -16.7],
  ['Av. Primero de Mayo', -15.7], ['Av. Carrera 10', -13.7], ['Av. Carrera 68', -11.6], ['Av Villavicencio', -10.9],
  ['Av. Bosa', -6.3], ['Av. Boyacá', -6.0], ['Av. Ciudad de Cali', 9.3], ['Av. Calle 80', 14.8], ['Av. Carrera 7', 26.9],
  ['Av. NQS', 30.5], ['Calle 139', 35.0], ['Av. Américas', 35.1], ['Autopista Sur', 38.6], ['Calle 63 Sur', 45.8],
];

// ---------------------------------------------------------------- 1. Portada
/** Lista de viñetas: cada item es 'texto' o ['Negrita: ', 'resto']. */
function bullets(slide, items, o) {
  const runs = [];
  items.forEach((it, i) => {
    const last = i === items.length - 1;
    if (Array.isArray(it)) {
      runs.push({ text: it[0], options: { bold: true, bullet: true } });
      runs.push({ text: it[1], options: { breakLine: !last } });
    } else {
      runs.push({ text: it, options: { bullet: true, breakLine: !last } });
    }
  });
  T(slide, runs, { fontSize: 16, paraSpaceAfter: 10, ...o });
}
const sub = (slide, text, x, y, w) => T(slide, text, { x, y, w, h: 0.4, fontSize: 18, bold: true, fontFace: THEME.headFontFace });

pres.addSection({ title: 'Contexto' });
let s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Contexto' });
s.addText('¿Las cámaras salvavidas realmente salvan vidas?', { placeholder: 'title' });
s.addText('Visor interactivo de siniestralidad cerca de las cámaras de Bogotá, 2019–2022', { placeholder: 'body' });
T(s, 'ISIS4822 - Visual Analytics', { x: 0.8, y: 1.3, w: 6, h: 0.4, fontSize: 14, color: C.background2, bold: true, charSpacing: 2 });
[[10.3, 1.6, 1.1], [11.7, 2.9, 0.55], [10.0, 3.6, 0.7], [11.2, 4.8, 0.9], [12.3, 1.2, 0.4], [9.6, 5.6, 0.45], [12.4, 5.9, 0.35]].forEach(([x, y, d]) => sitio(s, x, y, d, { dark: true }));
s.addNotes('Pregunta del proyecto: ¿cerca de las cámaras salvavidas hubo menos siniestros graves después de instalarlas, comparado con vías similares sin cámara?');

// ---------------------------------------------------------------- 2. Contexto y pregunta
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Contexto' });
s.addText('Contexto y pregunta', { placeholder: 'title' });
const stats = [['92', 'cámaras en 40 sitios'], ['109.137', 'siniestros 2019–2022'], ['1.862', 'con al menos un muerto']];
stats.forEach(([n, l], i) => {
  const y = 1.5 + i * 1.75;
  card(s, 0.6, y, 3.6, 1.5, `dato ${l}`);
  T(s, n, { x: 0.85, y: y + 0.18, w: 3.1, h: 0.75, fontSize: 40, bold: true, fontFace: THEME.headFontFace, color: i === 2 ? C.accent1 : C.text1 });
  T(s, l, { x: 0.85, y: y + 0.95, w: 3.1, h: 0.4, fontSize: 15, color: C.text2 });
});
sub(s, 'Qué pasó', 4.8, 1.5, 7.9);
bullets(s, [
  ['Nov 2019 – mar 2020: ', 'Bogotá instala cámaras en 18 corredores críticos.'],
  ['Mayo 2020: ', 'empiezan las multas, en plena pandemia.'],
  ['Antes = 2019 y después = 2021–2022: ', '2020 queda como transición.'],
], { x: 4.8, y: 2.05, w: 7.9, h: 2.0, fontSize: 18, paraSpaceAfter: 12 });
sub(s, 'Qué queremos responder', 4.8, 4.35, 7.9);
bullets(s, [
  '¿Bajaron los siniestros graves cerca de las cámaras?',
  '¿Bajaron más que en vías parecidas sin cámara (control)?',
  '¿Qué corredores mejoran o empeoran, y qué pasó con la velocidad?',
], { x: 4.8, y: 4.9, w: 7.9, h: 1.9, fontSize: 18, paraSpaceAfter: 12 });
s.addNotes('Cifras del paquete de datos de la SDM, inventario de cámaras y Bitcarrier. La línea base es un solo año y 2020 está distorsionado por la pandemia; por eso comparamos promedios mensuales y siempre contra un control.');

// ---------------------------------------------------------------- 3. Datos y método
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Contexto' });
s.addText('Datos y método', { placeholder: 'title' });
card(s, 0.6, 1.45, 5.85, 5.35, 'columna fuentes');
card(s, 6.85, 1.45, 5.85, 5.35, 'columna comparacion');
sub(s, 'Fuentes', 0.9, 1.75, 5.3);
bullets(s, [
  ['Siniestros: ', '109 mil, georreferenciados (SDM).'],
  ['Víctimas: ', '237 mil personas, por condición.'],
  ['Cámaras: ', '92 cámaras en 40 sitios, con fecha de resolución.'],
  ['Velocidad: ', 'P85 mensual de 397 tramos (Bitcarrier).'],
  ['Preparación: ', 'un script une todo por formulario, sitio y tramo; el visor filtra en el navegador.'],
], { x: 0.9, y: 2.35, w: 5.3, h: 4.3, fontSize: 17, paraSpaceAfter: 14 });
sub(s, 'Cómo comparamos', 7.15, 1.75, 5.3);
bullets(s, [
  ['Zona con cámara: ', 'siniestros a ≤ 500 m de un sitio (radio ajustable de 150 a 1.000 m).'],
  ['Control: ', 'vías medidas por Bitcarrier, lejos de cualquier cámara.'],
  ['Antes vs. después: ', 'promedio mensual de 2019 contra 2021–2022.'],
  ['Lectura: ', 'diferencia en puntos porcentuales entre zona y control. Es descriptiva, no causal.'],
], { x: 7.15, y: 2.35, w: 5.3, h: 4.3, fontSize: 17, paraSpaceAfter: 14 });
s.addNotes('El wireframe asumía datos desde 2018; los datos reales empiezan en 2019, por eso antes = 2019 y comparamos promedios mensuales (12 vs. 24 meses). El control no estaba en el wireframe y es clave por la regresión a la media.');

// ---------------------------------------------------------------- 4. Novedades de esta versión
pres.addSection({ title: 'El visor' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Qué cambió en esta versión del visor', { placeholder: 'title' });
shot(s, 'landing.jpg', 0.6, 1.45, 7.25, 5.35, 'Pantalla de bienvenida con tres entradas');
bullets(s, [
  ['Historia guiada: ', '3 actos y 9 pasos sobre el mismo visor.'],
  ['Panorama: ', 'pestaña nueva con Bogotá y los 18 corredores.'],
  ['Serie: ', 'banda de instalación o pandemia; control y velocidad se prenden y apagan.'],
  ['Rediseño: ', 'tema claro, menús desplegables propios y paleta revisada para daltonismo.'],
  ['Bienvenida: ', 'ver la historia, aprender a usarlo o explorar libre.'],
], { x: 8.25, y: 1.5, w: 4.45, h: 5.3, fontSize: 16, paraSpaceAfter: 14 });
s.addNotes('Cambios desde la versión anterior: commits «Cambios storytelling», «Rediseño del visor: tema claro, selector propio y fix de hover», «Mas cambios» y «Fixes». La bienvenida ahora ofrece tres caminos.');

// ---------------------------------------------------------------- 5. Historia guiada
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('La historia guiada: tres actos sobre el mismo visor', { placeholder: 'title' });
shot(s, 'historia-4.jpg', 0.6, 1.45, 8.6, 5.375, 'Historia guiada, paso 4: la comparación incómoda');
const actos = [
  ['Acto I · El montaje', '92 cámaras en 40 sitios; qué es zona y qué es control.'],
  ['Acto II · La evidencia', 'El quiebre de 2020, las víctimas, Panorama y la velocidad.'],
  ['Acto III · La lectura', 'Tres razones para no llamarlo efecto.'],
];
actos.forEach(([t, txt], i) => {
  const y = 1.5 + i * 1.3;
  T(s, [{ text: t, options: { bold: true, fontFace: THEME.headFontFace, fontSize: 17, breakLine: true } }, { text: txt, options: { fontSize: 15, color: C.text2 } }],
    { x: 9.6, y, w: 3.1, h: 1.2, paraSpaceAfter: 4, objectName: t });
});
bullets(s, [
  'Cada paso fija la vista y deja un control activo.',
  'Enlace directo: ?historia=4',
], { x: 9.6, y: 5.5, w: 3.1, h: 1.3, fontSize: 14, paraSpaceAfter: 6, color: C.text2 });
s.addNotes('La historia es un slideshow interactivo montado sobre el dashboard: no es otra página. Pasos: 1 El montaje · 2 El quiebre de 2020 · 3 No todas las víctimas cambian igual · 4 La comparación incómoda · 5 El mapa antes y después · 6 Rápido no es grave · 7 Los dos extremos · 8 Tres razones para no llamarlo efecto · 9 Lo que sí podemos decir.');

// ---------------------------------------------------------------- 6. Mapa y ficha
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Mapa y ficha', { placeholder: 'title' });
shot(s, 'mapa-boyaca.jpg', 0.6, 1.45, 8.6, 5.375, 'Vista Mapa y ficha, Av. Boyacá');
bullets(s, [
  ['Selecciona ', 'un corredor o sitio en el mapa o en los menús.'],
  ['Filtra ', 'por periodo, gravedad, tipo, actor y radio.'],
  ['El ámbito ', 'queda escrito: qué se cuenta y dónde.'],
  ['La ficha ', 'compara antes/después contra el control.'],
  ['Ejemplo: ', 'Av. Boyacá −9,5 % vs. −3,3 % del control.'],
], { x: 9.6, y: 1.5, w: 3.1, h: 5.3, fontSize: 15 });
s.addNotes('Seleccionamos Av. Boyacá con gravedad «Con muertos». El mapa resalta el corredor y sus 7 sitios; la ficha da barras por año, antes vs. después contra el control y víctimas por condición.');

// ---------------------------------------------------------------- 7. Serie y A/B
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Serie y comparación de meses', { placeholder: 'title' });
shot(s, 'serie-boyaca.jpg', 0.6, 1.45, 5.9, 3.2, 'Serie de Av. Boyacá con velocidad');
shot(s, 'ab-boyaca.jpg', 6.8, 1.45, 5.9, 3.01, 'Comparación de meses A/B en Av. Boyacá');
bullets(s, [
  'Línea de tiempo, años superpuestos o cámara vs. control.',
  'Banda gris: instalación o pandemia 2020.',
  'Zoom de meses a semanas y días.',
  'Velocidad P85 aparte, con o sin cámara.',
], { x: 0.6, y: 4.95, w: 5.9, h: 1.9, fontSize: 15, paraSpaceAfter: 6 });
bullets(s, [
  'Pantalla propia, sin mapa.',
  'Clic en la serie para fijar A y B.',
  'Cada mes: siniestros, víctimas, cámaras y velocidad.',
], { x: 6.8, y: 4.95, w: 5.9, h: 1.9, fontSize: 15, paraSpaceAfter: 6 });
s.addNotes('La serie responde cuándo cambia la tendencia y qué pasó con la velocidad. A/B compara dos meses con la misma escala; un mes suelto es ruidoso y sirve para explorar.');

// ---------------------------------------------------------------- 8. Panorama
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Panorama: Bogotá y sus 18 corredores en una pantalla', { placeholder: 'title' });
shot(s, 'pan-gravedad.jpg', 0.6, 1.45, 7.0, 1.35, 'Panorama: cambio por gravedad, zona vs control');
shot(s, 'pan-corredores.jpg', 0.6, 2.95, 7.0, 2.83, 'Panorama: cambio por corredor');
shot(s, 'pan-detalle.jpg', 0.6, 5.93, 7.0, 0.98, 'Panorama: tarjeta de Av. Boyacá');
shot(s, 'pan-velocidad.jpg', 7.95, 1.45, 4.75, 1.32, 'Panorama: velocidad vs gravedad por corredor');
bullets(s, [
  ['Tres gravedades: ', 'zona con cámara (morado) vs. control (verde).'],
  ['18 corredores ', 'ordenados por cambio, con N y la línea del control.'],
  ['Velocidad vs. gravedad: ', 'cada punto es un corredor.'],
  ['Clic en un corredor: ', 'tarjeta con 2019, 2021–22, cambio y control.'],
], { x: 7.95, y: 3.05, w: 4.75, h: 3.8, fontSize: 15, paraSpaceAfter: 10 });
s.addNotes('Panorama responde la pregunta general sin elegir un sitio. El control es de toda la ciudad, no un control propio de cada corredor; por eso la comparación contra control se hace en el agregado.');

// ---------------------------------------------------------------- 9. Hallazgo general
pres.addSection({ title: 'Hallazgos' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Hallazgos' });
s.addText('Cerca de las cámaras no bajó más que en el control', { placeholder: 'title' });
s.addChart(pres.charts.BAR, [
  { name: 'Zona con cámara (≤ 500 m)', labels: ['Con muertos', 'Heridos o muertos', 'Todos'], values: [25.0, -1.4, -17.9] },
  { name: 'Control (vías medidas > 500 m)', labels: ['Con muertos', 'Heridos o muertos', 'Todos'], values: [-3.3, -7.8, -27.5] },
], {
  x: 0.6, y: 1.4, w: 7.6, h: 5.4, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 60,
  chartColors: [HEX.accent3, HEX.accent4],
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '+0.0"%";-0.0"%"', dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt',
  showLegend: true, legendPos: 'b', legendFontSize: 12, legendFontFace: '+mn-lt', legendColor: HEX.dk2,
  showTitle: true, title: 'Cambio del promedio mensual, 2019 → 2021–22', titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', catAxisLineShow: false, catAxisLabelPos: 'low',
  valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt', valAxisLabelFormatCode: '0"%"',
  valGridLine: { color: 'E6EAF0', size: 0.75 }, catGridLine: { style: 'none' }, valAxisMinVal: -30, valAxisMaxVal: 30, valAxisMajorUnit: 10,
  objectName: 'grafica cambio zona vs control',
});
bullets(s, [
  ['Con muertos: ', '+25 % cerca de cámaras vs. −3 % en el control.'],
  ['En los tres niveles ', 'de gravedad el control mejoró más.'],
  ['Pocos casos fatales: ', '297 en la zona en cuatro años; el +25 % es ruidoso.'],
  ['Regresión a la media: ', 'los sitios se eligieron por ser críticos.'],
], { x: 8.6, y: 1.5, w: 4.1, h: 5.3 });
s.addNotes('Toda la ciudad, radio 500 m, mismas funciones que la pestaña Panorama. Con muertos: 5,8 → 7,3 por mes en la zona; 16,3 → 15,7 en el control. Heridos o muertos: 149,8 → 147,7 (−1,4 %) vs 339,7 → 313,3 (−7,8 %). Todos: −17,9 % vs −27,5 %.');

// ---------------------------------------------------------------- 10. Corredores y velocidad
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Hallazgos' });
s.addText('El resultado depende del corredor', { placeholder: 'title' });
s.addChart(pres.charts.BAR, [
  { name: 'Cambio %', labels: CORR_GRAVES.map((r) => r[0]), values: CORR_GRAVES.map((r) => r[1]) },
], {
  x: 0.6, y: 1.4, w: 7.6, h: 5.45, barDir: 'bar', barGapWidthPct: 35,
  chartColors: CORR_GRAVES.map((r) => (r[1] < -7.8 ? HEX.accent4 : r[1] < 0 ? '9FD3BE' : HEX.accent1)),
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '+0"%";-0"%"', dataLabelFontSize: 10, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt',
  showLegend: false, showTitle: true, title: 'Siniestros con heridos o muertos a ≤ 500 m · cambio del promedio mensual', titleFontSize: 13, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 11, catAxisLabelFontFace: '+mn-lt', catAxisOrientation: 'maxMin', catAxisLineShow: false, catAxisLabelPos: 'low',
  valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 10, valAxisLabelFontFace: '+mn-lt', valAxisLabelFormatCode: '0"%"',
  valGridLine: { color: 'E6EAF0', size: 0.75 }, catGridLine: { style: 'none' }, valAxisMinVal: -50, valAxisMaxVal: 50, valAxisMajorUnit: 25,
  objectName: 'grafica cambio por corredor',
});
const vTop = velRows.slice(0, 3);
sub(s, 'Siniestros graves', 8.6, 1.5, 4.1);
bullets(s, [
  ['Mejoran: ', 'Caracas, Autopista Norte, Carrera 10 y Carrera 68 bajan más que el control (−7,8 %).'],
  ['Empeoran: ', 'NQS, Américas, Autopista Sur y Calle 80.'],
], { x: 8.6, y: 2.0, w: 4.1, h: 2.1, fontSize: 15, paraSpaceAfter: 8 });
sub(s, 'Velocidad P85', 8.6, 4.15, 4.1);
bullets(s, [
  `${vTop[0].c}: ${nf(vTop[0].cam)} km/h con cámara vs. ${nf(vTop[0].sin)} sin cámara.`,
  ['Rápido no es grave: ', 'NQS es el más rápido (61 km/h) y no el más letal.'],
], { x: 8.6, y: 4.65, w: 4.1, h: 2.2, fontSize: 15, paraSpaceAfter: 8 });
s.addNotes('Verde oscuro: mejor que el control; verde claro: bajó pero menos que el control; rojo: aumentó. Corredores con pocos casos (Carrera 9, Calle 139, Calle 63 Sur) se leen con cautela. Velocidad vs. gravedad (Panorama): NQS 60,8 km/h con 1,5 % de siniestros con muertos; Calle 80, 48,2 km/h con 2,3 %; Carrera 10, 32 km/h con 2,2 %.');

// ---------------------------------------------------------------- 11. Feedback
pres.addSection({ title: 'Feedback' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Feedback' });
s.addText('Feedback de usuarios: 11 sugerencias, 11 atendidas', { placeholder: 'title' });
card(s, 0.6, 1.45, 7.0, 5.35, 'columna implementadas');
card(s, 7.95, 1.45, 4.75, 5.35, 'columna ajustadas');
sub(s, 'Implementadas (9)', 0.9, 1.75, 6.4);
bullets(s, [
  ['Filtros por tipo, ', 'no solo fatales: gravedad, 6 tipos y 11 actores (ambos grupos).'],
  ['Mapa no fijo: ', '«Ocultar mapa» deja ficha y serie lado a lado (ambos grupos).'],
  ['Varias líneas en la serie: ', 'años superpuestos y cámara vs. control.'],
  ['Conteos en A/B: ', 'cámaras instaladas, siniestros y víctimas por mes.'],
  ['¿Toda la vía o un tramo? ', 'ámbito explícito, selector de sitio y radio.'],
  ['A/B en otra pantalla, ', 'y tutorial: ahora historia guiada y recorrido.'],
], { x: 0.9, y: 2.35, w: 6.4, h: 4.3, fontSize: 16, paraSpaceAfter: 12 });
sub(s, 'Con ajuste (2)', 8.25, 1.75, 4.2);
bullets(s, [
  ['Hover por días: ', 'hover en todas las gráficas; días solo al acercar a < 100 días. Por día hay 0 o 1 fatales: es ruido.'],
  ['Incluir velocidad: ', 'sí, en gráfica aparte y en Panorama. Un doble eje sugiere correlaciones falsas.'],
], { x: 8.25, y: 2.35, w: 4.2, h: 4.3, fontSize: 16, paraSpaceAfter: 18 });
s.addNotes('Las 11 notas vienen de nuestra sesión y del grupo de Diego; dos se repetían (filtros por tipo y mapa fijo), por eso hay 9 implementadas tal cual y 2 con ajuste. Ninguna se descartó del todo. Esta versión refuerza el tutorial con la historia guiada.');

// ---------------------------------------------------------------- 12. Cierre
pres.addSection({ title: 'Cierre' });
s = pres.addSlide({ masterName: 'CIERRE', sectionTitle: 'Cierre' });
s.addText('Lo que sí podemos decir', { placeholder: 'title' });
T(s, 'En conjunto, las cámaras no redujeron los siniestros más que el control. Hay corredores donde la mejora coincide, pero este diseño no permite atribuirla.', { x: 0.6, y: 1.35, w: 12.1, h: 0.9, fontSize: 20, color: C.background1 });
T(s, 'Tres razones para no llamarlo efecto', { x: 0.6, y: 2.6, w: 5.8, h: 0.5, fontSize: 20, bold: true, color: C.background1, fontFace: THEME.headFontFace });
bullets(s, [
  ['Regresión a la media: ', 'se eligieron sitios críticos.'],
  ['Pandemia: ', '2020 cambió la línea base.'],
  ['Pocos casos: ', '297 fatales en la zona en 4 años.'],
], { x: 0.6, y: 3.25, w: 5.8, h: 2.8, fontSize: 19, color: C.background2, paraSpaceAfter: 16 });
T(s, 'Próximos pasos', { x: 6.9, y: 2.6, w: 5.8, h: 0.5, fontSize: 20, bold: true, color: C.background1, fontFace: THEME.headFontFace });
bullets(s, [
  'Diferencias en diferencias con event study.',
  'Normalizar por exposición (km y tráfico).',
  'Segunda ronda de pruebas, ahora con la historia.',
  'Publicar el visor como sitio estático.',
], { x: 6.9, y: 3.25, w: 5.8, h: 2.8, fontSize: 19, color: C.background2, paraSpaceAfter: 16 });
[[0.6, 6.3, 0.45], [1.25, 6.45, 0.3], [11.9, 6.25, 0.5]].forEach(([x, y, d]) => sitio(s, x, y, d, { dark: true }));
s.addNotes('Es el mismo cierre del Acto III de la historia guiada. La velocidad es la del flujo del tramo, no la del vehículo del siniestro.');

// pptxgenjs inserta un <a:pPr><a:buNone/> a mitad de párrafo cuando una viñeta mezcla
// negrita y texto normal, y eso borra el punto de la viñeta. Se elimina tras escribir.
async function arreglarVinetas(file) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string');
    zip.file(name, xml.replace(/(<\/a:r>)<a:pPr [^>]*>(?:(?!<\/a:pPr>).)*<\/a:pPr>/g, '$1'));
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
}

(async () => {
  await pres.writeFile({ fileName: OUT });
  await arreglarVinetas(OUT);
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log('OK', OUT);
})();
