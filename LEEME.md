# Datos para el visor – ¿Las cámaras salvan vidas realmente?

Paquete listo para un front en JavaScript. Coordenadas en **WGS84 (EPSG:4326)**, archivos **UTF-8**, campos sin tildes, banderas en **0/1**.
Fuentes: SDM – Histórico de siniestros georreferenciados + Anuarios SIGAT 2019–2022, Cámaras Salvavidas, Bitcarrier (velocidades 2019–2022).

> Hay que servir los archivos con un servidor local (`npx serve`, Live Server de VS Code). `fetch`/`d3.csv` no funcionan con `file://`.

## Archivos

| Archivo | Filas | Uno por | Para |
|---|---|---|---|
| `siniestros.csv` | 109.137 | siniestro 2019–2022 | Tareas 1, 2, 3, 4, 6 (mapa y conteos) |
| `victimas.csv` | 236.527 | persona involucrada | Tarea 2 |
| `sitios.geojson` | 40 | sitio de control (equipo DEI) | Mapa, buffers, tareas 3 y 6 |
| `camaras.geojson` | 92 | cámara | Detalle al hacer clic en un sitio |
| `tramos.geojson` | 397 | tramo Bitcarrier (ida y vuelta unidos) | Mapa de corredores, tarea 5 |
| `tramo_anio.csv` | 1.432 | tramo × año | Tarea 5 (velocidad vs gravedad) |
| `vel_tramo_mes.csv` | ~16 mil | tramo × año × mes | Tendencia de velocidad |
| `vel_tramo_hora.csv` | ~75 mil | tramo × año × tipo de día × hora | Horas críticas |

Llaves: `siniestros.FORMULARIO` ↔ `victimas.FORMULARIO`; `siniestros.SITIO_DEI` ↔ `sitios.SITIO_DEI` ↔ `camaras.SITIO_DEI`; `siniestros.PAR_ID` ↔ `tramos.PAR_ID` ↔ `tramo_anio.PAR_ID` ↔ `vel_*.PAR_ID`.

## Diccionario

### siniestros.csv
| Campo | Tipo | Descripción |
|---|---|---|
| FORMULARIO | texto | Código del formulario (llave) |
| CODIGO_ACC | entero | Código del accidente SIGAT |
| FECHA | texto ISO | `AAAA-MM-DD` |
| ANIO, MES | entero | Año, mes (1–12) |
| DIA_SEMANA | entero | 1 = lunes … 7 = domingo (cíclico) |
| HORA | entero | 0–23 (cíclico) |
| GRAVEDAD | categórico ordinal | `Solo daños` < `Con heridos` < `Con muertos` |
| GRAVE | 0/1 | Con heridos o con muertos |
| FATAL | 0/1 | Con al menos un muerto |
| CLASE | categórico | Choque, Atropello, Volcamiento, Caída de ocupante, … |
| LOCALIDAD | categórico | Localidad de Bogotá |
| lat, lon | número | Ubicación |
| CON_BICICLETA … CON_VELOCIDAD | 0/1 | 11 marcas presentes en los 4 años (bicicleta, carga, embriaguez, huecos, menores, moto, peatón, persona mayor, rutas, TPI, velocidad) |
| DIST_CAM | número (m) | Distancia al sitio de cámara más cercano. **Usar para el radio variable**: `DIST_CAM <= radio` |
| SITIO_DEI | texto | Sitio de cámara más cercano |
| CORREDOR_CAM, TIPO_CAM | texto | Corredor y tipo (`Velocidad` / `Semáforo`) de ese sitio |
| PAR_ID | texto / vacío | Tramo Bitcarrier al que pertenece (≤30 m). Vacío = vía no medida por Bitcarrier |
| DIST_TRAMO | número (m) | Distancia a ese tramo |
| CRUCE | 0/1 | A ≤30 m de dos corredores medidos distintos (intersección ambigua) |
| PERIODO | texto | `Antes` (2019) · `Transición` (2020) · `Después` (2021–2022) |
| ZONA_500 | texto | Valor por defecto con radio 500 m: `Cámara` (DIST_CAM ≤ 500), `Control` (sobre un tramo Bitcarrier y DIST_CAM > 500), `Otro` |

### victimas.csv
FORMULARIO · ANIO · CONDICION (`Conductor`, `Motociclista`, `Pasajero`, `Peatón`, `Ciclista`) · GRAVEDAD (`Ileso` < `Herido` < `Muerto`) · EDAD (vacía en 2022, el anuario no la trae) · SEXO.

### sitios.geojson (Point)
SITIO_DEI · CORREDOR · VIA_SECUNDARIA · LOCALIDAD · LIMITE (km/h) · N_CAMARAS · TIPO (`Velocidad` si alguna cámara detecta exceso de velocidad, si no `Semáforo`) · FECHA_RESOLUCION (más temprana del sitio).

### camaras.geojson (Point)
ID_CAMARA · SITIO_DEI · NOMBRE · DIRECCION · CORREDOR · VIA_SECUNDARIA · SENTIDO · CALZADA · CARRILES · LIMITE · LOCALIDAD · INFRACCIONES (C.29 velocidad, C.14 pico y placa, C.35 revisión técnico-mecánica, D.02 SOAT, D.04 semáforo en rojo) · TIPO · FECHA_RESOLUCION.

### tramos.geojson (MultiLineString)
PAR_ID · CORREDOR · LONG_KM (un sentido) · N_LINEAS · CON_CAMARA (sitio a ≤150 m) · DIST_CAM · SITIO_DEI.

### tramo_anio.csv
PAR_ID · ANIO · P85 (km/h) · VEL_MEDIA · N_SENTIDOS · N (siniestros a ≤30 m) · GRAVES · FATALES · PCT_GRAVES (solo si N ≥ 10) · SIN_KM · FAT_KM (por km, ese año).

### vel_tramo_mes.csv / vel_tramo_hora.csv
Velocidad por tramo (promedio de los dos sentidos). Mes: P85, P50, VEL_MEDIA, DIAS (mínimo entre sentidos), N_SENTIDOS. Hora: TIPO_DIA (`Laboral` / `Fin de semana`), HORA, N_FRANJAS, VEL_MEDIA.
Meses disponibles: 2019 feb–dic (junio parcial), 2020 y 2021 completos, 2022 ene–nov. El número de tramos medidos cambia entre años: para comparar años usar los mismos tramos.

## Cómo resolver cada tarea en el navegador

```js
const [S, V] = await Promise.all([d3.csv("siniestros.csv", d3.autoType), d3.csv("victimas.csv", d3.autoType)]);
let radio = 500;                                   // slider 150–1000
const enZona = d => d.DIST_CAM <= radio;
const control = d => d.PAR_ID !== null && d.DIST_CAM > radio;
```

| Tarea | Cálculo |
|---|---|
| **1** ¿Cuándo cambia la tendencia de fatales? | `d3.rollup(S.filter(enZona), v => d3.sum(v, d => d.FATAL), d => d.ANIO, d => d.MES)` y lo mismo para `control`. Línea mensual; marcar instalación (dic-2019 a mar-2020) e inicio de operación (mayo-2020) |
| **2** ¿Cambiaron las víctimas? | Unir `victimas` con `siniestros` por FORMULARIO, filtrar zona y gravedad, contar por `CONDICION` y `PERIODO` |
| **3** ¿Bajó más con cámara que sin cámara? | Siniestros por año en `enZona` vs `control`; cambio % = (promedio 2021–22 − 2019) / 2019 |
| **4** ¿Dónde ocurren los fatales antes y después? | Puntos con `FATAL == 1`, mapas lado a lado por `PERIODO` (juntar años) |
| **5** ¿Tramos rápidos = más graves? | `tramo_anio.csv` + `tramos.geojson`: scatter `P85` vs `PCT_GRAVES` / `FAT_KM`, color `CON_CAMARA` |
| **6** ¿Qué sitio/corredor mejora o empeora más? | Agrupar `S.filter(enZona)` por `SITIO_DEI` (o `CORREDOR_CAM`) y calcular cambio %; color divergente |

Filtros sugeridos para todas: gravedad, marcas `CON_*`, tipo de cámara (`TIPO_CAM`), excluir `CRUCE == 1`.

## Análisis causal (carpeta `did/`)
Diferencias en Diferencias del efecto de las cámaras sobre la velocidad y los siniestros: resultados, event study y series mensuales listos para graficar. Ver `did/LEEME_DiD.md`.

## Validación
Siniestros fatales por año: 2019: 493 · 2020: 369 · 2021: 462 · 2022: 538 (anuarios SIGAT: 492 · 369 · 460 · 540).
Siniestros 2019: 32.628 en el histórico georreferenciado vs 34.990 en el anuario (≈7 % sin ubicación).

## Limitaciones a mostrar en el visor
- Antes = solo 2019; 2020 afectado por la pandemia; las cámaras empezaron a multar después de mayo de 2020.
- Los sitios se eligieron por ser críticos (regresión a la media): comparar siempre contra zonas de control.
- La velocidad Bitcarrier es la del tráfico del tramo, no la del vehículo del siniestro.
