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
    dk1: '1F1D1A', lt1: 'FFFFFF', dk2: '5B5750', lt2: 'F2EEE6',
    accent1: 'C8372C', accent2: '2A78D6', accent3: '6250D6', accent4: '1BAF7A', accent5: 'EB6834', accent6: '8F8A80',
    hlink: '2A78D6', folHlink: '6250D6',
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

/** Fila de callout: marcador + título en negrita + texto. */
function callout(slide, x, y, w, title, body, { h = 1.0, size = 14 } = {}) {
  sitio(slide, x, y + 0.05, 0.26);
  T(slide, [
    { text: title, options: { bold: true, breakLine: true } },
    { text: body, options: { color: C.text2 } },
  ], { x: x + 0.42, y, w: w - 0.42, h, fontSize: size, paraSpaceAfter: 2, objectName: `callout ${title}` });
}

function shot(slide, file, x, y, w, h, alt) {
  slide.addShape(pres.shapes.RECTANGLE, { x: x - 0.02, y: y - 0.02, w: w + 0.04, h: h + 0.04, fill: { color: C.background2 }, line: { color: 'D8D0C3', width: 0.75 }, objectName: `marco ${alt}` });
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
pres.addSection({ title: 'Contexto' });
let s = pres.addSlide({ masterName: 'PORTADA', sectionTitle: 'Contexto' });
s.addText('¿Las cámaras salvavidas realmente salvan vidas?', { placeholder: 'title' });
s.addText('Un visor interactivo para explorar la siniestralidad cerca de las cámaras de Bogotá, 2019–2022', { placeholder: 'body' });
T(s, 'ISIS4822 · Visualización de datos', { x: 0.8, y: 1.3, w: 6, h: 0.4, fontSize: 14, color: C.background2, bold: true, charSpacing: 2 });
// motivo: mapa abstracto de sitios
[[10.3, 1.6, 1.1], [11.7, 2.9, 0.55], [10.0, 3.6, 0.7], [11.2, 4.8, 0.9], [12.3, 1.2, 0.4], [9.6, 5.6, 0.45], [12.4, 5.9, 0.35]].forEach(([x, y, d]) => sitio(s, x, y, d, { dark: true }));
s.addNotes('Abrimos con la pregunta del proyecto. Bogotá instaló cámaras de fotodetección ("salvavidas") en puntos críticos. Queremos que cualquier persona pueda explorar si cerca de esas cámaras hubo menos siniestros graves después de su instalación, y comparar contra vías similares sin cámara.');

// ---------------------------------------------------------------- 2. Contexto
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Contexto' });
s.addText('Bogotá instaló 92 cámaras en 40 puntos críticos', { placeholder: 'title' });
const stats = [['109.137', 'siniestros georreferenciados 2019–2022'], ['1.862', 'siniestros con al menos un muerto'], ['236.527', 'personas involucradas (víctimas)'], ['397', 'tramos con velocidad Bitcarrier']];
stats.forEach(([n, l], i) => {
  const x = 0.6 + i * 3.08;
  card(s, x, 1.55, 2.85, 1.75, `dato ${l}`);
  T(s, n, { x: x + 0.25, y: 1.75, w: 2.4, h: 0.8, fontSize: 40, bold: true, fontFace: THEME.headFontFace, color: i === 1 ? C.accent1 : C.text1 });
  T(s, l, { x: x + 0.25, y: 2.6, w: 2.4, h: 0.6, fontSize: 14, color: C.text2 });
});
// línea de tiempo
const tl = [
  { x: 0.6, w: 3.1, t: 'Antes · 2019', d: '12 meses de línea base', c: C.accent2 },
  { x: 3.8, w: 2.9, t: 'Nov 2019 – mar 2020', d: 'Instalación de las cámaras', c: C.accent6 },
  { x: 6.8, w: 2.6, t: 'Mayo 2020', d: 'Empiezan las multas (y la pandemia)', c: C.accent6 },
  { x: 9.5, w: 3.2, t: 'Después · 2021–2022', d: '24 meses de comparación', c: C.accent1 },
];
tl.forEach((p) => {
  s.addShape(pres.shapes.RECTANGLE, { x: p.x, y: 4.05, w: p.w, h: 0.14, fill: { color: p.c }, line: { type: 'none' }, objectName: `periodo ${p.t}` });
  T(s, p.t, { x: p.x, y: 4.35, w: p.w, h: 0.4, fontSize: 16, bold: true });
  T(s, p.d, { x: p.x, y: 4.75, w: p.w, h: 0.6, fontSize: 14, color: C.text2 });
});
T(s, [
  { text: 'Reto: ', options: { bold: true } },
  { text: 'la línea base es un solo año y 2020 está distorsionado por la pandemia. Por eso el visor compara promedios mensuales y siempre muestra un grupo de control.' },
], { x: 0.6, y: 5.75, w: 12.1, h: 0.8, fontSize: 16 });
s.addNotes('Cifras del paquete de datos: 109.137 siniestros del histórico georreferenciado de la SDM, 236.527 víctimas, 92 cámaras en 40 sitios y 397 tramos con velocidad. La línea de tiempo explica por qué "antes" es solo 2019 y por qué 2020 es transición: instalación de nov-2019 a mar-2020, multas desde mayo de 2020, y pandemia.');

// ---------------------------------------------------------------- 3. Tareas
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Contexto' });
s.addText('Una pregunta, seis tareas para el visor', { placeholder: 'title' });
const tareas = [
  ['1 · ¿Cuándo cambia la tendencia?', 'Serie mensual con instalación e inicio de multas marcados'],
  ['2 · ¿Cambiaron las víctimas?', 'Víctimas por condición (peatón, moto, ciclista…) antes vs. después'],
  ['3 · ¿Bajó más con cámara?', 'Ficha: zona con cámara vs. control, diferencia en puntos porcentuales'],
  ['4 · ¿Dónde ocurren los fatales?', 'Mapa de puntos filtrado por periodo, gravedad, tipo y actor'],
  ['5 · ¿Más velocidad, más gravedad?', 'Velocidad P85 de tramos con y sin cámara junto a la serie'],
  ['6 · ¿Qué corredor mejora o empeora?', 'Selección por corredor o por sitio y comparación de meses A/B'],
];
tareas.forEach(([t, d], i) => {
  const col = i % 3, row = Math.floor(i / 3);
  const x = 0.6 + col * 4.1, y = 1.6 + row * 2.55;
  card(s, x, y, 3.85, 2.25, `tarea ${i + 1}`);
  sitio(s, x + 0.3, y + 0.32, 0.36);
  T(s, t, { x: x + 0.85, y: y + 0.3, w: 2.8, h: 0.75, fontSize: 17, bold: true });
  T(s, d, { x: x + 0.3, y: y + 1.15, w: 3.3, h: 0.95, fontSize: 14, color: C.text2 });
});
s.addNotes('Las seis tareas vienen del documento de diseño (LEEME). Cada una tiene un lugar concreto en el visor; esto es lo que guía el diseño de las tres vistas.');

// ---------------------------------------------------------------- 4. Datos
pres.addSection({ title: 'El visor' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Cuatro fuentes unidas por tres llaves', { placeholder: 'title' });
const fuentes = [
  ['Siniestros', 'siniestros.csv · 109 mil filas'],
  ['Víctimas', 'victimas.csv · 237 mil filas'],
  ['Cámaras y sitios', '92 cámaras · 40 sitios'],
  ['Tramos y velocidad', 'Bitcarrier · P85 mensual'],
];
fuentes.forEach(([t, d], i) => {
  const y = 1.6 + i * 1.12;
  card(s, 0.6, y, 3.3, 0.92, `fuente ${t}`);
  T(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { color: C.text2, fontSize: 12 } }], { x: 0.8, y: y + 0.13, w: 3.0, h: 0.7, fontSize: 15 });
});
const arrow = (x, y) => s.addShape(pres.shapes.RIGHT_ARROW, { x, y, w: 0.55, h: 0.4, fill: { color: C.text2 }, line: { type: 'none' }, objectName: 'flecha' });
arrow(4.05, 3.25);
card(s, 4.75, 2.45, 3.0, 2.0, 'paso preparar');
T(s, [{ text: 'scripts/build_data.py', options: { bold: true, breakLine: true } }, { text: 'Une por FORMULARIO, SITIO_DEI y PAR_ID; compacta a 4 JSON (5,9 MB) y arma un panel balanceado de velocidad', options: { color: C.text2, fontSize: 13 } }], { x: 4.95, y: 2.65, w: 2.6, h: 1.7, fontSize: 15 });
arrow(7.9, 3.25);
card(s, 8.6, 2.45, 4.1, 2.0, 'paso visor');
T(s, [{ text: 'Visor web (Vite + D3 + Leaflet)', options: { bold: true, breakLine: true } }, { text: 'Filtra y agrega 109 mil filas en milisegundos en cada clic; no necesita servidor de base de datos', options: { color: C.text2, fontSize: 13 } }], { x: 8.8, y: 2.65, w: 3.7, h: 1.7, fontSize: 15 });
T(s, [
  { text: 'Zona con cámara: ', options: { bold: true } }, { text: 'siniestros a ≤ radio (150–1.000 m, por defecto 500 m) del sitio más cercano.', options: { breakLine: true } },
  { text: 'Control: ', options: { bold: true } }, { text: 'siniestros sobre vías medidas por Bitcarrier y a más del radio de cualquier cámara.', options: { breakLine: true } },
  { text: 'Antes vs. después: ', options: { bold: true } }, { text: 'promedio mensual de 2019 contra 2021–2022 (12 vs. 24 meses).' },
], { x: 4.75, y: 4.85, w: 7.95, h: 1.7, fontSize: 14, paraSpaceAfter: 6 });
s.addNotes('Explicamos el pipeline. Un script de Python sin dependencias convierte los CSV y GeoJSON en JSON columnares. Todo el filtrado sucede en el navegador, por eso los filtros responden al instante. Las tres definiciones de la parte inferior son las que aparecen escritas en la línea de "Ámbito" del visor.');

// ---------------------------------------------------------------- 5. Wireframe -> visor
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Del wireframe en papel al visor funcionando', { placeholder: 'title' });
shot(s, 'wireframe-1.png', 0.6, 1.55, 5.22, 3.69, 'Wireframe en papel: mapa y ficha');
shot(s, 'crop-boyaca.png', 6.75, 1.55, 5.95, 3.69, 'Visor: mapa y ficha de Av. Boyacá');
T(s, 'Wireframe (kit de papel)', { x: 0.6, y: 5.35, w: 5.6, h: 0.35, fontSize: 12, color: C.text2 });
T(s, 'Visor implementado', { x: 6.75, y: 5.35, w: 5.95, h: 0.35, fontSize: 12, color: C.text2 });
T(s, [
  { text: 'Se mantuvo: ', options: { bold: true } }, { text: 'tres pestañas, mapa a la izquierda y ficha a la derecha, Todo/Antes/Después, A en azul y B en rojo.', options: { breakLine: true } },
  { text: 'Cambió: ', options: { bold: true } }, { text: 'los datos reales cubren 2019–2022 (no 2018), así que antes = 2019 y se comparan promedios mensuales; se agregó el control.' },
], { x: 0.6, y: 5.85, w: 12.1, h: 0.95, fontSize: 14, paraSpaceAfter: 4 });
s.addNotes('Comparación lado a lado. El wireframe asumía 2018–2022 y periodos de 24 meses; los datos del repositorio empiezan en 2019, por eso ajustamos la comparación a promedio mensual. También añadimos el grupo de control, que no estaba en el wireframe y es clave por la regresión a la media.');

// ---------------------------------------------------------------- 6. Mapa y ficha
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Mapa y ficha: seleccionar un corredor y leer su antes y después', { placeholder: 'title' });
shot(s, 'crop-boyaca.png', 0.6, 1.6, 7.9, 4.9, 'Vista Mapa y ficha, Av. Boyacá');
callout(s, 8.95, 1.6, 3.75, 'Seleccionar', 'Clic en un sitio o tramo del mapa, o menús de corredor y sitio.', { h: 1.05 });
callout(s, 8.95, 2.85, 3.75, 'Ámbito explícito', 'Una línea dice qué se cuenta: radio, sitios, cámaras, gravedad y periodo.', { h: 1.05 });
callout(s, 8.95, 4.1, 3.75, 'Ficha', 'Barras anuales, antes vs. después contra el control y víctimas por condición.', { h: 1.05 });
callout(s, 8.95, 5.35, 3.75, 'Lectura guiada', 'Av. Boyacá: −9,5 % vs. −3,3 % del control → −6,2 p.p.', { h: 1.05 });
s.addNotes('Recorrido en vivo: seleccionamos Av. Boyacá. El mapa resalta el corredor, dibuja el radio alrededor de cada sitio y muestra los siniestros filtrados. La ficha resume: 69 siniestros con muertos 2019–2022; el promedio mensual bajó 9,5 %, mientras el control bajó 3,3 %: la zona con cámara mejoró 6,2 puntos porcentuales más. Es descriptivo, no causal.');

// ---------------------------------------------------------------- 7. Serie
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Serie: varias líneas a la vez para ver antes, después y velocidad', { placeholder: 'title' });
shot(s, 'crop-anios.png', 0.6, 1.55, 8.2, 4.28, 'Serie con años superpuestos y velocidad');
callout(s, 9.2, 1.6, 3.5, 'Años superpuestos', '2019 contra 2021 y 2022 mes a mes: evita confundir estacionalidad con efecto.', { h: 1.15 });
callout(s, 9.2, 2.95, 3.5, 'Cámara vs. control', 'Índice 2019 = 100 para comparar magnitudes distintas en un solo eje.', { h: 1.15 });
callout(s, 9.2, 4.3, 3.5, 'Velocidad P85', 'Tramos con y sin cámara frente al límite legal, en una gráfica aparte.', { h: 1.15 });
T(s, [
  { text: 'Hover en todas las gráficas. ', options: { bold: true } },
  { text: 'Al arrastrar sobre la franja inferior la serie se acerca: menos de 400 días pasa a semanas y menos de 100 a días.' },
], { x: 0.6, y: 6.05, w: 12.1, h: 0.7, fontSize: 14 });
s.addNotes('La pestaña Serie responde las tareas 1 y 5. Tres modos: línea de tiempo con zoom (meses, semanas o días según el rango), años superpuestos y cámara vs. control indexado. Debajo siempre está la velocidad P85 de Bitcarrier. En Av. Boyacá se ve que los tramos con cámara bajaron de ~47 a ~38 km/h en 2022.');

// ---------------------------------------------------------------- 8. A/B
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'El visor' });
s.addText('Meses A/B: una pantalla propia para comparar dos momentos', { placeholder: 'title' });
shot(s, 'crop-ab.png', 0.6, 1.55, 8.2, 4.77, 'Pantalla de comparación de meses A/B');
callout(s, 9.2, 1.6, 3.5, 'Clic para fijar A y B', 'Sobre la serie o con los menús; ⇄ intercambia.', { h: 1.0 });
callout(s, 9.2, 2.8, 3.5, 'Misma escala', 'Las barras de A y B comparten escala para no engañar.', { h: 1.0 });
callout(s, 9.2, 4.0, 3.5, 'Más que fatales', 'Cámaras instaladas, siniestros totales, víctimas y velocidad de cada mes.', { h: 1.2 });
T(s, 'Ejemplo: nov 2019 → nov 2021 en Av. Boyacá: de 0 a 15 cámaras instaladas; siniestros totales de 83 a 91.', { x: 0.6, y: 6.45, w: 12.1, h: 0.45, fontSize: 14, color: C.text2 });
s.addNotes('Por feedback, A/B pasó a pantalla completa sin mapa. Las tarjetas ahora incluyen el conteo de cámaras instaladas a la fecha (según la resolución de cada cámara) y siniestros de todas las gravedades. Advertimos que un mes suelto es ruidoso; sirve para explorar.');

// ---------------------------------------------------------------- 9. Hallazgo general
pres.addSection({ title: 'Hallazgos' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Hallazgos' });
s.addText('Cerca de las cámaras no bajó más que en el control', { placeholder: 'title' });
s.addChart(pres.charts.BAR, [
  { name: 'Zona con cámara (≤ 500 m)', labels: ['Con muertos', 'Heridos o muertos', 'Todos'], values: [25.0, -1.3, -17.9] },
  { name: 'Control (vías medidas > 500 m)', labels: ['Con muertos', 'Heridos o muertos', 'Todos'], values: [-3.3, -7.7, -27.5] },
], {
  x: 0.6, y: 1.5, w: 7.6, h: 5.2, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 60,
  chartColors: [HEX.accent3, HEX.accent4],
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '+0.0"%";-0.0"%"', dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt',
  showLegend: true, legendPos: 'b', legendFontSize: 12, legendFontFace: '+mn-lt', legendColor: HEX.dk2,
  showTitle: true, title: 'Cambio del promedio mensual, 2019 → 2021–22', titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 12, catAxisLabelFontFace: '+mn-lt', catAxisLineShow: false,
  valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt', valAxisLabelFormatCode: '0"%"',
  valGridLine: { color: 'E7E1D6', size: 0.75 }, catGridLine: { style: 'none' }, valAxisMinVal: -30, valAxisMaxVal: 30, valAxisMajorUnit: 10,
  objectName: 'grafica cambio zona vs control',
});
card(s, 8.65, 1.6, 4.05, 1.5, 'dato fatales');
T(s, [{ text: '+25 % vs. −3 %', options: { bold: true, fontSize: 26, fontFace: THEME.headFontFace, color: C.accent1, breakLine: true } }, { text: 'siniestros con muertos: zona con cámara vs. control' }], { x: 8.85, y: 1.75, w: 3.7, h: 1.25, fontSize: 14, color: C.text2 });
T(s, [
  { text: 'En los tres niveles de gravedad el control mejoró más que la zona con cámara.', options: { bullet: true, breakLine: true } },
  { text: 'Los casos fatales cerca de cámaras son pocos (70 en 2019, 175 en 2021–22): el +25 % es ruidoso.', options: { bullet: true, breakLine: true } },
  { text: 'Los sitios se eligieron por ser críticos: la regresión a la media juega en contra de esta lectura simple.', options: { bullet: true } },
], { x: 8.65, y: 3.35, w: 4.05, h: 3.3, fontSize: 14, paraSpaceAfter: 10 });
s.addNotes('Hallazgo principal de toda la ciudad con radio 500 m. Promedio mensual 2019 vs 2021-22. Con muertos: zona 5,8 → 7,3 por mes (+25 %), control 16,3 → 15,7 (−3,3 %). Heridos o muertos: −1,3 % vs −7,7 %. Todos: −17,9 % vs −27,5 %. Conclusión honesta: a nivel agregado no vemos que las zonas con cámara mejoren más que el control. No es causal y hay pocos casos fatales.');

// ---------------------------------------------------------------- 10. Corredores
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Hallazgos' });
s.addText('El resultado cambia mucho entre corredores', { placeholder: 'title' });
s.addChart(pres.charts.BAR, [
  { name: 'Cambio %', labels: CORR_GRAVES.map((r) => r[0]), values: CORR_GRAVES.map((r) => r[1]) },
], {
  x: 0.6, y: 1.45, w: 7.9, h: 5.45, barDir: 'bar', barGapWidthPct: 35,
  chartColors: CORR_GRAVES.map((r) => (r[1] < -7.7 ? HEX.accent4 : r[1] < 0 ? 'A9C9BC' : HEX.accent1)),
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '+0"%";-0"%"', dataLabelFontSize: 10, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt',
  showLegend: false, showTitle: true, title: 'Siniestros con heridos o muertos a ≤ 500 m · cambio del promedio mensual', titleFontSize: 13, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 11, catAxisLabelFontFace: '+mn-lt', catAxisOrientation: 'maxMin', catAxisLineShow: false, catAxisLabelPos: 'low',
  valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 10, valAxisLabelFontFace: '+mn-lt', valAxisLabelFormatCode: '0"%"',
  valGridLine: { color: 'E7E1D6', size: 0.75 }, catGridLine: { style: 'none' }, valAxisMinVal: -50, valAxisMaxVal: 50, valAxisMajorUnit: 25,
  objectName: 'grafica cambio por corredor',
});
callout(s, 9.0, 1.6, 3.7, 'Mejor que el control', 'Verde: bajaron más que el −7,7 % del control (Caracas, Autopista Norte, Carrera 10, Carrera 68…).', { h: 1.5 });
callout(s, 9.0, 3.3, 3.7, 'Peor', 'Rojo: aumentaron (NQS, Américas, Autopista Sur, Calle 80, Ciudad de Cali…).', { h: 1.3 });
callout(s, 9.0, 4.85, 3.7, 'Por eso el visor baja a nivel de sitio', 'El promedio de ciudad esconde corredores que sí mejoraron.', { h: 1.3 });
s.addNotes('Tarea 6. Siniestros con heridos o muertos a 500 m por corredor; el control de ciudad bajó 7,7 %. Verde oscuro: mejor que el control; verde claro: bajó pero menos que el control; rojo: aumentó. Corredores con pocos casos (Carrera 9, Calle 139, Calle 63 Sur) deben leerse con cautela; el visor lo advierte cuando hay menos de 30 casos.');

// ---------------------------------------------------------------- 11. Velocidad
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Hallazgos' });
s.addText('La velocidad bajó más donde hay cámara en las vías rápidas', { placeholder: 'title' });
s.addChart(pres.charts.BAR, [
  { name: 'Tramos con cámara', labels: velRows.map((r) => r.c), values: velRows.map((r) => +r.cam.toFixed(1)) },
  { name: 'Tramos sin cámara (misma vía)', labels: velRows.map((r) => r.c), values: velRows.map((r) => +r.sin.toFixed(1)) },
], {
  x: 0.6, y: 1.45, w: 8.0, h: 5.45, barDir: 'bar', barGrouping: 'clustered', barGapWidthPct: 45,
  chartColors: [HEX.accent3, HEX.accent4],
  showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '+0.0;-0.0', dataLabelFontSize: 9, dataLabelColor: HEX.dk1, dataLabelFontFace: '+mn-lt',
  showLegend: true, legendPos: 'b', legendFontSize: 11, legendFontFace: '+mn-lt', legendColor: HEX.dk2,
  showTitle: true, title: 'Cambio de la velocidad P85 (km/h), 2019 → 2021–22', titleFontSize: 13, titleColor: HEX.dk1, titleFontFace: '+mn-lt',
  catAxisLabelColor: HEX.dk2, catAxisLabelFontSize: 11, catAxisLabelFontFace: '+mn-lt', catAxisOrientation: 'maxMin', catAxisLineShow: false, catAxisLabelPos: 'low',
  valAxisLabelColor: HEX.dk2, valAxisLabelFontSize: 10, valAxisLabelFontFace: '+mn-lt',
  valGridLine: { color: 'E7E1D6', size: 0.75 }, catGridLine: { style: 'none' }, valAxisMinVal: -12, valAxisMaxVal: 6, valAxisMajorUnit: 3,
  objectName: 'grafica velocidad',
});
const top3 = velRows.slice(0, 3);
card(s, 9.05, 1.6, 3.65, 1.85, 'dato velocidad');
T(s, [
  { text: `${nf(top3[0].cam)} km/h`, options: { bold: true, fontSize: 30, fontFace: THEME.headFontFace, color: C.accent3, breakLine: true } },
  { text: `${top3[0].c} con cámara (vs. ${nf(top3[0].sin)} sin cámara). También ${top3[1].c} y ${top3[2].c}.` },
], { x: 9.25, y: 1.75, w: 3.3, h: 1.6, fontSize: 14, color: C.text2 });
T(s, [
  { text: 'P85: velocidad que no supera el 85 % del tráfico (Bitcarrier), promedio de tramos con datos en los 4 años.', options: { bullet: true, breakLine: true } },
  { text: 'Es la velocidad del flujo, no la del vehículo del siniestro.', options: { bullet: true } },
], { x: 9.05, y: 3.75, w: 3.65, h: 2.4, fontSize: 14, color: C.text2, paraSpaceAfter: 8 });
s.addNotes('Respuesta a la sugerencia de incluir velocidad. En vías de alta velocidad la P85 bajó más en los tramos con cámara que en los demás tramos de la misma vía. En vías urbanas lentas la diferencia es pequeña o va en sentido contrario. Las cifras exactas salen de visor/public/data/velocidad.json.');

// ---------------------------------------------------------------- 12. Feedback
pres.addSection({ title: 'Feedback' });
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Feedback' });
s.addText('Probamos el wireframe con usuarios: 11 sugerencias', { placeholder: 'title' });
shot(s, 'feedback-whatsapp.png', 0.6, 1.6, 7.6, 3.35, 'Notas del feedback de los usuarios');
const res = [['9', 'implementadas tal cual', C.accent4], ['2', 'implementadas con un ajuste', C.accent5], ['0', 'descartadas por completo', C.accent6]];
res.forEach(([n, l, c], i) => {
  const y = 1.6 + i * 1.15;
  card(s, 8.7, y, 4.0, 0.95, `resumen ${l}`);
  T(s, n, { x: 8.9, y: y + 0.12, w: 0.8, h: 0.7, fontSize: 36, bold: true, color: c, fontFace: THEME.headFontFace });
  T(s, l, { x: 9.75, y: y + 0.27, w: 2.85, h: 0.5, fontSize: 15 });
});
T(s, [
  { text: 'Tres temas se repiten: ', options: { bold: true } },
  { text: 'filtrar más allá de los fatales, no dejar el mapa siempre fijo y explicar mejor cómo empezar (qué se cuenta y dónde hacer clic).' },
], { x: 0.6, y: 5.35, w: 12.1, h: 0.9, fontSize: 16 });
s.addNotes('Las notas vienen de dos rondas: nuestras observaciones y las del grupo de Diego. Agrupamos sugerencias repetidas (filtros por tipo, mapa fijo). Ninguna se descartó del todo; dos se implementaron con un ajuste que explicamos más adelante.');

// ---------------------------------------------------------------- 13. Tabla de sugerencias
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Feedback' });
s.addText('Qué pidieron y qué hicimos', { placeholder: 'title' });
const H = (t) => ({ text: t, options: { bold: true, color: HEX.lt1, fill: { color: HEX.dk1 } } });
const ok = { text: 'Hecho', options: { bold: true, color: '137A52' } };
const adj = { text: 'Con ajuste', options: { bold: true, color: 'B5501F' } };
const rows = [
  [H('Sugerencia'), H('Origen'), H('Estado'), H('Cómo quedó en el visor')],
  ['Hover sobre la serie (meses, o días si el rango es corto)', 'Grupo', adj, 'Tooltip en todas las gráficas; días solo al acercar a < 100 días'],
  ['Filtros por tipo de siniestro, no solo fatales', 'Ambos', ok, 'Gravedad (3 niveles), 6 tipos de siniestro, 11 actores, radio'],
  ['Incluir velocidad', 'Grupo', adj, 'P85 con vs. sin cámara y límite legal, en gráfica aparte'],
  ['Ver ambas gráficas / no dejar el mapa fijo', 'Ambos', ok, '«Ocultar mapa» deja ficha y serie lado a lado; barra para volver'],
  ['Varias líneas en la serie (antes vs. después)', 'Grupo', ok, 'Años superpuestos y cámara vs. control indexado'],
  ['Conteo de cámaras y siniestros en la comparación', 'Grupo', ok, 'Tarjetas A/B: cámaras instaladas, siniestros totales, víctimas, velocidad'],
  ['¿Se toma toda la vía o un tramo de la cámara?', 'Diego', ok, 'Línea de ámbito explícita, selector de sitio y radio de 150 a 1.000 m'],
  ['Comparación A/B en otra pantalla', 'Diego', ok, 'Pestaña A/B a pantalla completa, sin mapa'],
  ['Tutorial o landing para empezar', 'Diego', ok, 'Landing con 3 pasos y recorrido guiado de 9 pasos (botón «?»)'],
];
s.addTable(rows, {
  x: 0.6, y: 1.45, w: 12.1, colW: [4.1, 1.0, 1.3, 5.7], fontSize: 13, color: HEX.dk1, valign: 'middle',
  border: { type: 'solid', pt: 0.75, color: 'E2DBCF' }, rowH: 0.5, margin: [0.04, 0.1, 0.04, 0.1],
  fill: { color: HEX.lt1 }, autoPage: false, objectName: 'tabla sugerencias',
});
s.addNotes('Recorremos la tabla. «Grupo» son las notas de nuestra sesión; «Diego» las del otro grupo; «Ambos» cuando coincidieron. Las 11 notas originales quedan en 9 filas porque dos se repetían.');

// ---------------------------------------------------------------- 14. Ajustes
s = pres.addSlide({ masterName: 'CONTENIDO', sectionTitle: 'Feedback' });
s.addText('Dos sugerencias no valían la pena tal cual', { placeholder: 'title' });
shot(s, 'crop-dias.png', 0.6, 1.55, 5.6, 4.5, 'Serie acercada a días con tooltip');
card(s, 6.7, 1.55, 6.0, 2.15, 'ajuste dias');
T(s, [
  { text: 'Días siempre visibles → solo al acercar', options: { bold: true, breakLine: true } },
  { text: 'Por día, un corredor tiene 0 o 1 siniestros fatales: la serie diaria por defecto es puro ruido. La vista arranca en meses y pasa a semanas o días cuando el usuario acerca.', options: { color: C.text2 } },
], { x: 6.95, y: 1.75, w: 5.5, h: 1.85, fontSize: 14, paraSpaceAfter: 4 });
card(s, 6.7, 3.9, 6.0, 2.15, 'ajuste velocidad');
T(s, [
  { text: 'Velocidad en la misma gráfica → gráfica aparte', options: { bold: true, breakLine: true } },
  { text: 'Mezclar km/h y conteos exige doble eje, que induce correlaciones falsas. La velocidad va debajo, alineada en el tiempo y con el límite legal como referencia.', options: { color: C.text2 } },
], { x: 6.95, y: 4.1, w: 5.5, h: 1.85, fontSize: 14, paraSpaceAfter: 4 });
T(s, 'Tampoco ocultamos el mapa automáticamente: el usuario decide cuándo, y en A/B nunca aparece.', { x: 0.6, y: 6.3, w: 12.1, h: 0.45, fontSize: 14, color: C.text2 });
s.addNotes('Explicamos por qué no implementamos dos sugerencias al pie de la letra. Días: el ruido hace que la serie diaria no comunique nada si se muestra por defecto. Velocidad: un doble eje es uno de los errores más comunes en visualización; preferimos dos gráficas alineadas.');

// ---------------------------------------------------------------- 15. Cierre
pres.addSection({ title: 'Cierre' });
s = pres.addSlide({ masterName: 'CIERRE', sectionTitle: 'Cierre' });
s.addText('Limitaciones y próximos pasos', { placeholder: 'title' });
const colL = [
  'Antes = solo 2019; 2020 está afectado por la pandemia.',
  'Sitios elegidos por ser críticos: regresión a la media.',
  'Velocidad del flujo, no del vehículo del siniestro.',
  'Cambios descriptivos: no prueban un efecto causal.',
];
const colR = [
  'Diferencias en diferencias con event study (carpeta did/ pendiente en el repo).',
  'Normalizar por exposición (km y volumen de tráfico).',
  'Segunda ronda de pruebas con usuarios sobre el visor real.',
  'Publicar el visor (build estático, sin servidor).',
];
T(s, 'Limitaciones', { x: 0.6, y: 1.55, w: 5.8, h: 0.5, fontSize: 20, bold: true, color: C.background1, fontFace: THEME.headFontFace });
T(s, colL.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < colL.length - 1 } })), { x: 0.6, y: 2.2, w: 5.8, h: 3.6, fontSize: 16, color: C.background2, paraSpaceAfter: 12 });
T(s, 'Próximos pasos', { x: 6.9, y: 1.55, w: 5.8, h: 0.5, fontSize: 20, bold: true, color: C.background1, fontFace: THEME.headFontFace });
T(s, colR.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < colR.length - 1 } })), { x: 6.9, y: 2.2, w: 5.8, h: 3.6, fontSize: 16, color: C.background2, paraSpaceAfter: 12 });
[[0.6, 6.2, 0.45], [1.25, 6.35, 0.3], [11.9, 6.15, 0.5]].forEach(([x, y, d]) => sitio(s, x, y, d, { dark: true }));
T(s, 'Gracias · para correr el visor: cd visor && npm install && npm run dev', { x: 2.0, y: 6.3, w: 9.5, h: 0.4, fontSize: 14, color: C.background2, align: 'center' });
s.addNotes('Cerramos con lo que el visor no puede afirmar y lo que sigue. El LEEME menciona una carpeta did/ con el análisis de diferencias en diferencias, que todavía no está en el repositorio; cuando llegue se puede añadir como cuarta vista.');

(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log('OK', OUT);
})();
