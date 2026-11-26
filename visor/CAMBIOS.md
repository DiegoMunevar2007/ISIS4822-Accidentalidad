# Evolución del visor: qué cambió y por qué

Este informe compara el visor **de la iteración anterior** (commit `158e209`, JavaScript sin framework) con el de esta sesión (rama `rediseño`). Para cada cambio indica tres cosas: **cómo estaba**, **qué se hizo** y **por qué**. Cuando una pieza pasó por varias versiones dentro de la sesión, se cuenta el recorrido, porque cada paso corrigió un problema del anterior.

| Estado en git | Contenido |
|---|---|
| Commit `9f9b5f3`, rama `rediseño` (sin co-autor) | La migración, el sistema de diseño, las cuatro vistas, el mapa, la historia, el recorrido y la pantalla de inicio. |
| Sin commitear | Recorrido guiado corregido, resumen de A y B movido a la tabla, referencia del promedio de 2019, cambio en los tooltips, trama de casos escasos en la ficha y miniaturas en la lista de corredores. |

> **Actualización de paleta (sin commitear).** Después de redactar este informe se cambió la identidad visual a los colores de la bandera de Bogotá (amarillo sobre rojo) y el fondo pasó a blanco. Donde el informe dice «verde azulado» como color de acento o de «después / con cámara», debe leerse **rojo `#C8102E`**. Detalles en la sección 4.5.

---

## 1. Resumen: tres hilos de cambio

1. **Legibilidad.** El visor original tenía textos de 10 a 12,5 px y mucha información apretada. Se subió el mínimo a 13 px, se rotularon los ejes y se redujo lo que compite por la atención.
2. **Sobriedad.** Los colores, los símbolos y la redacción delataban un diseño genérico («AI look»). Se pasó a un solo acento, una sola familia tipográfica, el kit de componentes y textos escritos para describir el dato en lugar de adornarlo.
3. **Lectura analítica.** Varias gráficas mostraban datos sin responder la pregunta del usuario (¿bajaron los siniestros donde hay cámara, frente a un control?). Se rediseñaron para comparar en una escala común, mostrar la diferencia directamente y marcar cuándo un dato es poco fiable.

---

## 2. Tabla de evolución

| Aspecto | Iteración anterior | Ahora | Por qué |
|---|---|---|---|
| Tecnología | JS vanilla, `innerHTML` en cada `render()` | React 19 + TypeScript, Zustand | Mantenible: el estado y la vista dejan de mezclarse y los componentes se reutilizan |
| Estilos | `style.css` | Tailwind v4 + componentes tipo shadcn/ui | Consistencia entre controles y menos CSS propio |
| Texto más pequeño | 10 a 12,5 px | Mínimo 13 px (`micro` 13, `small` 14, `body` 16) | Pedido explícito: «muy poco legible» |
| Color | Azul `#2360bd` y rojo `#c23128` | Un acento verde azulado `#0b5c6b` más grises | Quitar el aspecto genérico; sin «bueno/malo» implícito |
| Tipografía | Public Sans + Spectral (serifa) + IBM Plex Mono | Geist en todo | Pedido: sin serifas y más moderna |
| Footer | Presente | Eliminado | Cada nota debe ir pegada al dato que explica |
| Pestañas | Mapa y ficha · Serie · Panorama · Meses A/B | Mapa y cambios · Evolución · Corredores · Comparar meses | Los nombres no decían qué contenía cada vista |
| Filtros | Todos siempre visibles | Solo los que cambian la vista | Un filtro que no hace nada confunde |
| Gravedad inicial | «Con muertos» | «Todos» | Pedido del usuario |
| Comparación con y sin cámara | Barras pareadas con escalas distintas | Barras de cambio en escala común | Dos escalas distintas inducían a error |
| Panorama | Dumbbell + dot plot de 18 corredores | Lista ordenable + detalle + mapa enlazado | Mejor flujo y menos gráficas que respondían lo mismo |
| Meses A/B | Dos meses sueltos, tres tarjetas | Dos grupos de meses, gráfico y tabla de promedios | Un mes suelto tiene mucho ruido |
| Mapa | 109k puntos siempre | Densidad con poco zoom, cámara resaltada | Los puntos se tapaban entre sí |

---

## 3. Base técnica

**Antes.** Un `main.js` que reconstruía HTML con cadenas, `select.js`, `story.js`, `tour.js` y `style.css` (unas 2.100 líneas).

**Ahora.** React con TypeScript y Zustand (`useStore` para datos y filtros, `useUi` para pantalla de inicio, recorrido e historia). Se eliminaron los cinco archivos antiguos. Los cálculos se memoizan en dos capas (`keyBase` para filtros de atributo y `keyScope` para el ámbito). Se mantuvieron sin reescribir la carga y las agregaciones de `data.js` y la capa de puntos en canvas del mapa.

**Por qué.** El código antiguo era difícil de mantener y de extender (por ejemplo, cada filtro nuevo exigía tocar HTML y renders). Mantener `data.js` y el canvas del mapa evitó reescribir lo que ya funcionaba y comparar resultados numéricos sin riesgo.

Detalles técnicos que se tuvieron que resolver: Vite se subió a 8.3.8 por compatibilidad con el plugin de React, `tsconfig` pasó de `baseUrl` a `paths` (TypeScript 6 lo eliminó), el CLI de shadcn instalaba un paquete `cn` equivocado (se corrigió en cada ocasión), y Leaflet se monta una sola vez y nunca se desmonta, porque ocultar y mostrar el mapa lo rompía.

---

## 4. Legibilidad y diseño visual

### 4.1 Escala tipográfica
- **Antes:** unos 25 tamaños sueltos, ejes y leyendas de 10 a 12,5 px.
- **Ahora:** cuatro tamaños con nombre (`micro` 13, `small` 14, `body` 16, `kpi` 20), tooltips de 14 px, gráficas más altas.
- **Por qué:** era el pedido más directo de la sesión y condicionaba todo lo demás.

### 4.2 De «AI look» a sobrio (tres pasadas)
1. **Primera versión:** se migró a React manteniendo la paleta (azul y rojo) y se agrandó el texto.
2. **Primera crítica del usuario:** «todavía tiene un AI look» (colores, `→` y `·`). Se hizo un análisis y se eligió la dirección «más sobria»: un solo acento, superficies planas con reglas finas en lugar de cajas, sin colorear los cambios como buenos o malos.
3. **Pasadas posteriores:** se quitaron las píldoras (`Badge` ahora con esquinas casi rectas; la etiqueta del acto en la historia pasó a texto), se reemplazó el ícono de cámara dibujado por un punto sólido, se quitaron las líneas punteadas de guía y se dejó una sola familia tipográfica.
- **Por qué:** cada elemento «de plantilla» le resta credibilidad a un visor con vocación analítica.

### 4.5 Identidad «Bogotá» (paleta de la bandera, fondo blanco) *(sin commitear)*
- **Antes (esta misma sesión):** acento verde azulado `#0b5c6b` sobre un fondo gris cálido `#f4f4f1`.
- **Ahora:**
  - **Rojo `#C8102E`** para lo observado (después, con cámara, siniestros con muertos), las acciones principales y los marcadores de selección. **Rojo claro `#E2808F`** para 2021 y los meses «después» de las franjas.
  - **Amarillo `#FFCD00`** para el contexto y la selección: la zona de instalación (`#FFD84D` translúcido), el tono de resalte de los controles (`#FFF3C4`) y la base de la rampa de densidad.
  - **Ámbar `#E8A100`** para siniestros con heridos. Con los siniestros con muertos en rojo y los de solo daños en gris, la gravedad se lee como una escala de semáforo.
  - **Grises** para «antes», «sin cámara» y el contexto, como en la versión anterior.
  - **Fondo blanco** (`#ffffff`) y gris muy claro (`#f4f4f2`) para filas y chips.
  - **Franja de bandera** de 8 px (amarillo sobre rojo) en el borde superior y el mismo motivo en el favicon.
  - **Controles segmentados** (`Seg`) con la selección en tinta oscura: el rojo queda reservado para datos y acciones principales y no para todo control activo.
  - **Mapa:** densidad de amarillo a rojo, puntos rojos, ámbar y gris.
- **Por qué:** pedido de darle más identidad y que se sintiera «más Bogotá». El rojo y el amarillo son los colores de la bandera de la ciudad; el amarillo, además, resalta mejor que el verde azulado sobre fondo blanco para las zonas de contexto.
- **Matiz a vigilar:** el rojo suele asociarse a «malo». Aquí significa «lo que se observa» (después, con cámara) y no un juicio; el texto sigue sin calificar los cambios como buenos o malos.

### 4.3 Componentes del kit
- **Antes:** `<select>` nativos, un selector propio, botones con borde negro.
- **Ahora:** `Select`, `Tabs`, `ToggleGroup`, `Popover`, `Checkbox`, `Card`, `Alert`, `Table`, `Progress`, `Skeleton`, `Tooltip` con tokens estándar de shadcn y la identidad del visor. Se agregó la regla base de color de borde, que faltaba y dejaba los bordes casi negros.
- **Por qué:** el usuario pidió explícitamente usar un kit en lugar de cajas personalizadas para dar identidad; además, cualquier componente nuevo queda coherente sin retocarlo.

### 4.4 Tipografía
- **Antes:** Public Sans y Spectral (serifa).
- **Ahora:** Geist en todo, incluidos los títulos.
- **Por qué:** pedido directo de una tipografía moderna y sin serifas.

---

## 5. Navegación y filtros

- **Pestañas.** «Mapa y ficha» no describía su contenido y «Panorama» y «Serie» eran nombres de tipo de gráfico. Se renombraron a «Mapa y cambios», «Corredores», «Evolución» y «Comparar meses».
- **Filtros condicionales.** Antes, Corredor, Sitio y Periodo aparecían siempre. Ahora:
  - **Corredores:** sin Corredor, Sitio ni Periodo (la lista ya incluye todos los corredores y compara 2019 con 2021–22).
  - **Comparar meses:** sin Periodo (los meses se eligen en el gráfico).
  - **Por qué:** un filtro que no cambia la vista invita a probar algo que no hace nada.
- **Un solo selector de gravedad.** El Panorama tenía uno propio que duplicaba el global; ahora solo existe el global.
- **Línea de alcance.** Antes era una oración («Bogotá: 40 sitios con 92 cámaras, siniestros a menos de 500 m. Se cuentan todos los siniestros, 2019 frente a 2021–22.»). Ahora son etiquetas con datos (`40 sitios`, `92 cámaras`, `Radio 500 m`) más los filtros de «Más filtros» cuando están activos.
  - **Por qué:** la oración repetía lo que ya muestran los selectores y sonaba a plantilla. Las etiquetas dan solo lo que los selectores no dicen, y los filtros escondidos en el popover se hacen visibles.
- **Barra superior.** Botones con íconos y `Tooltip`, «Historia» destacado.

---

## 6. Mapa

| Aspecto | Antes | Ahora | Por qué |
|---|---|---|---|
| Colores | Puntos y tramos con la paleta antigua | Puntos y tramos en gris y verde azulado | Coherencia con la paleta |
| ~109k puntos | Siempre como puntos | Con poco zoom, celdas de densidad; los siniestros con muertos siguen como puntos | Los puntos se tapaban y no se veía el patrón (*overplotting*) |
| Sitio seleccionado | Un círculo blanco más | Punto sólido más grande, etiqueta fija con vía, tipo y límite, y radio rotulado | «No es tan claro dónde queda la cámara» |
| Quitar selección | Solo en la barra superior | También un botón dentro del mapa | Debe estar donde ocurre la selección |
| Ver todo el corredor | No existía | Casilla «Visualizar accidentes en corredor» | Al hacer clic en un tramo solo se veían los siniestros cercanos a las cámaras |
| Tooltips | Con «Clic para seleccionar…» | Solo datos | Una instrucción dentro de un tooltip confunde |
| Leyenda | Una línea corrida | Dos listas con viñetas | Difícil de leer en una sola línea |
| Resalte de corredor | No | Se dibuja en una capa superior, enlazado con la lista de Corredores | Los puntos tapaban el resalte; vista enlazada |

**Detalles de las decisiones**
- **Ícono de cámara:** se probó un ícono dibujado y el usuario lo descartó por parecer generado; quedó un marcador geométrico.
- **Casilla del corredor:** pasó por tres versiones (caja grande con explicación, caja reducida, texto final «Visualizar accidentes en corredor» pedido por el usuario). Se movió del extremo superior al inferior derecho, encima de la atribución de Leaflet.
- **Cálculo del alcance de 60 m:** los datos solo asignan cada siniestro a su cámara más cercana, así que se calcula la distancia de cada punto a las líneas de los tramos del corredor (rejilla de 120 m, cacheado por corredor). `scopeTest` usa esa máscara con la casilla activa; `zonaTest` sigue siendo por cámara, de modo que la comparación con y sin cámara no cambia de significado.

---

## 7. Mapa y cambios (antes «Mapa y ficha»)

**Antes.** Un panel «Bogotá: ficha» con un KPI, un gráfico anual, barras pareadas con **escalas propias** para la zona con cámara y el control, una frase de lectura con la diferencia y las víctimas por condición.

**Qué cambió y por qué**

| Cambio | Por qué |
|---|---|
| Título «Antes y después» en lugar de «Bogotá: ficha» | «Ficha» no dice nada del contenido |
| Dos barras de cambio porcentual **en una misma escala**, partiendo de cero | Con escalas distintas se comparaba la longitud de barras que no eran comparables; el resultado clave quedaba enterrado en una frase |
| Texto «de 435,4 a 357,7 **siniestros** por mes» | «¿Pollos?»: el número sin sustantivo era ambiguo |
| Descripción de para qué sirve cada gráfica en lugar del titular calculado | El usuario lo pidió explícitamente («pequeña descripción sobre para qué sirve cada visualización») |
| Se quitó la nota «descriptivo, no causal…» | Ya estaba en la pantalla de inicio y en la historia, esta era la tercera repetición; sin el porqué no informaba |
| Aviso de pocos casos como `Alert` y barra con trama cuando la zona tiene menos de 30 casos | Un +25 % con 9 casos no debe verse igual de firme que con 900 |
| «Control» renombrado a «vías sin cámara» | Término ambiguo; se define una vez («las vías a más de 500 m de cualquier cámara, que sirven de referencia») |

---

## 8. Evolución (antes «Serie»)

### 8.1 Línea de tiempo
- **Antes:** una línea negra con barras azules y rosas en la franja inferior, selector «Banda» (Instalación o Pandemia), rótulo «Fecha» y una nota larga debajo.
- **Ahora:** serie verde azulada y franja en gris/verde azulado; Instalación y Pandemia 2020 siempre visibles como zonas de contexto con etiqueta al pie; título dinámico («Siniestros por mes/semana/día»); referencia sólida del **promedio de 2019** y tooltip con el cambio respecto a esa referencia *(sin commitear)*.
- **Por qué:** el selector «Banda» hacía elegir algo que podía mostrarse siempre; la paleta de la franja era la antigua; sin referencia el ojo no puede estimar cuánto cayó o se recuperó.
- **Texto:** «109.137 en el rango. Arrastra sobre la franja de abajo para acercar de meses a semanas y días» sonaba a plantilla. Se evaluó si quitarlo o reescribirlo: el gesto no tiene pista visual, así que quedó «Arrastrar para acercar.» y, con selección, «Clic fuera de la selección para ver todo el periodo.».

### 8.2 Años superpuestos
- **Antes:** cuatro líneas cruzadas con etiquetas finales que se pisaban.
- **Ahora («Un año frente a otro»):** **pequeños múltiplos**, un recuadro por año con la misma escala y 2019 en gris detrás como referencia, con el total anual bajo cada título.
- **Por qué:** superponer cuatro series obliga a seguirlas con el ojo; los recuadros comparan por posición y la referencia fija permite ver cada año contra el anterior a la instalación.

### 8.3 Cámara contra control → «Con y sin cámara»
- **Antes:** dos líneas del «índice (2019 = 100)» casi idénticas. El usuario pidió explicar el índice («es muy ambiguo»).
- **Ahora:** arriba, las dos líneas como «% del nivel de 2019»; abajo, un **área divergente con la diferencia** entre ambas (verde azulado si con cámara está más alto, gris si más bajo, con etiquetas de qué lado es cuál).
- **Por qué:** cuando la pregunta es «¿cuánto difieren?», lo que debe verse es la diferencia, no dos líneas que se tapan. Además, la palabra «índice» se sustituyó por una explicación del 100 %.

### 8.4 Armonización
Se reconoció una «disparidad de estilos» entre la línea de tiempo y «Con y sin cámara». Se igualaron márgenes, alturas, color de la serie, etiqueta de la línea de multas («Multas desde may-2020») y se quitaron las etiquetas pegadas al final de las líneas (la leyenda ya las nombra) y el rótulo «Fecha».

### 8.5 Velocidad del tráfico
Se quitó el selector «Ambas / Con cámara / Sin cámara» porque, con las dos series ya nombradas en la leyenda, no aportaba. Mensaje sin datos: «No existe información de velocidad para este corredor» (antes nombraba a Bitcarrier).

---

## 9. Corredores (antes «Panorama»)

Fue la sección más rediseñada. Recorrido de versiones:

1. **Versión original.** Dumbbell de gravedad, dot plot de 18 corredores y dispersión de velocidad, más un selector de gravedad propio. *Problema:* varias gráficas respondían lo mismo, el flujo no llevaba al detalle y el selector duplicaba un filtro.
2. **Primer rediseño.** Titular calculado con la diferencia global, lista de corredores con una barra centrada en el control, orden por diferencia, casos o nombre, ocultar los de pocos casos, panel de detalle fijo con cifras y serie mensual, y la dispersión de velocidad plegada. *Problemas encontrados:* un corredor con 4 casos dominaba la escala y encogía a los demás (se fijó con una escala calculada solo con corredores de casos suficientes); `N_BAJO = 30` marcaba 14 de 18 corredores (se bajó a 10).
3. **Mapa al lado.** Mostrar el mapa en esta pestaña, columna derecha fija, para que el resalte enlazado entre la lista y los tramos del mapa tuviera dónde verse.
4. **Resalte enlazado.** Pasar el cursor por una fila dibuja el tramo en el mapa (negro con halo, en una capa sobre los puntos) y al revés. Solo se restilan los tramos, no los puntos.
5. **Detalle compacto.** El usuario señaló «mucho espacio muerto» en la tarjeta; se pasó a dos columnas con cifras en 2×2 y serie más baja, con el botón en la cabecera.
6. **Textos.** Se reemplazó el titular calculado por una descripción de qué muestra la vista. Los ejes dicen «Menos / Más casos que sin cámara».
7. **Miniaturas por corredor** *(sin commitear)*. Una línea pequeña por fila con la serie mensual del corredor y la instalación sombreada, para ver la forma del cambio sin abrir el detalle (escala propia: forma, no tamaño).

---

## 10. Comparar meses (antes «Meses A/B»)

Es la pieza con más iteraciones; cada versión corrigió la anterior:

| Versión | Qué era | Problema que motivó el siguiente paso |
|---|---|---|
| 0. Original | Dos meses sueltos, selectores A y B, tres tarjetas (A, B, «De A a B») con medidores | Demasiado texto («difícil sacar conclusiones»); un mes tiene mucho ruido |
| 1. Tabla | Una tabla (A, B, cambio), selectores de mes arriba | Poco gráfico; la línea de tiempo con dos rayas no gustó |
| 2. Barras | 48 barras con A y B coloreadas, valores escritos, guías punteadas | Las guías punteadas molestaron |
| 3. Grupos de meses | Clic, Shift + clic y arrastre sobre barras para formar grupos A y B, atajos de años | «Un poco complicada»; la línea de promedio atravesaba las barras y estorbaba |
| 4. Bandas | Dos bandas A y B arrastrables sobre el gráfico | Las manijas se veían muy gruesas; al usuario le gustaba poder seleccionar, pero resetear era difícil |
| 5. Intermedia | Selector «Bandas / Meses sueltos» conservando ambas formas, «Restablecer meses» con ícono, «Vaciar el grupo», manijas de 3 px | — |

**Decisiones del modelo actual**
- A y B son **grupos de meses**; todo se compara como **promedio mensual**, para que grupos de distinto tamaño sean comparables, y la tabla indica cuántos meses tiene cada uno.
- Un mes no puede estar en A y B a la vez; si dos bandas se solapan, la segunda vuelve a su lugar.
- El valor inicial es **2019 frente a 2021–22**, la comparación principal del análisis.
- El resumen de A y B pasó de la barra de filtros a los encabezados de la tabla *(sin commitear)*, porque estaba repetido; el botón «Intercambiar A y B» pasó a la cabecera del panel.
- Se eliminaron la nota «un solo mes tiene mucho ruido…», las tarjetas con medidores y el selector de mes.

---

## 11. Historia, recorrido y pantalla de inicio

### Historia
- **Antes:** actos «Contexto / Evidencia / Lectura» con pasos de tono dramático («Prueba:»), una tarjeta propia de CSS y puntos de 6 px.
- **Ahora:** títulos descriptivos, textos sin recursos retóricos, pasos adaptados a la lista de corredores nueva. El contenedor es un `Card`; hay una fila de barras rectas por paso, agrupadas por acto; la pista de interacción y el aviso de exploración libre son `Alert`; el paso de velocidad abre solo la sección plegable.
- **Por qué:** el copy anterior sonaba a plantilla y mezclaba narración con instrucciones; la nueva interfaz es consistente con el resto.

### Recorrido guiado
- **Antes:** tarjeta propia y posicionamiento que fallaba en pantallas de portátil.
- **Ahora** *(sin commitear)*: desplazamiento inmediato antes de medir, recuadro recalculado al desplazar o redimensionar, tarjeta ubicada donde no tapa lo destacado, y los pasos de mapa y filtros destacan exactamente lo que describen (`#map` y toda la fila `#filters`).
- **Por qué:** el usuario reportó que «el cómo usar no es exacto en la pantalla del usuario». La causa era medir el elemento mientras la página aún se movía y colocar el texto encima de lo destacado.

### Pantalla de inicio
- **Antes:** título largo en serifa, un párrafo largo, lista numerada 1-2-3 y tres botones sueltos.
- **Ahora:** una línea de contexto, título, dos frases, cuatro cifras grandes (92 cámaras, 40 sitios, 18 corredores, 109.137 siniestros), tres tarjetas de acción («Ver la historia» destacada) y las fuentes con la advertencia causal.
- **Por qué:** pedido de rediseño; el usuario además señaló como giveaway la etiqueta de píldora, que se reemplazó por una línea de texto.

---

## 12. Textos y terminología

| Antes | Ahora | Por qué |
|---|---|---|
| «Elige…», «Haz clic…», «Puedes…» | Infinitivos o impersonal («Elegir…», «Un clic en la serie fija el mes A») | El usuario pidió no tutear |
| «Control» | «Vías sin cámara» (definido una vez) | Término ambiguo |
| «Bogotá: ficha», «Panorama de Bogotá» | «Antes y después», «Cambio por corredor» | Títulos que dicen qué hay dentro, sin el lugar |
| «por mes» solo | «siniestros por mes» | La unidad faltaba |
| Titulares calculados en la ficha y Panorama | Descripción de para qué sirve cada gráfica | Pedido directo |
| «Todos los siniestros» como sustantivo | «siniestros» | «109.137 todos los siniestros» sonaba mal |
| Símbolos `→` y `·` | Palabras o paréntesis | Parte del «AI look» |
| «Bitcarrier no mide velocidades en este corredor» | «No existe información de velocidad para este corredor» | Pedido del usuario |

---

## 13. Criterios de Munzner aplicados

| Criterio | Dónde |
|---|---|
| Comparar con una escala común | Barras de cambio de la ficha; recuadros por año |
| Mostrar el dato derivado | Diferencia entre con y sin cámara |
| Pequeños múltiplos | Recuadros por año, miniaturas por corredor |
| Vistas enlazadas | Lista de corredores y tramos del mapa |
| Resolver el *overplotting* | Densidad con poco zoom |
| Resaltado preatentivo | Marcador y etiqueta de la cámara seleccionada |
| Referencia para juzgar el cambio | Promedio de 2019; 100 % en con y sin cámara |
| Detalle bajo demanda | Tooltips con datos y cambio, sin instrucciones |
| Señal frente a ruido | Trama en barras con pocos casos; grupos de varios meses |
| Menos memoria, más percepción | Eje Y rotulado y etiquetas directas dentro de los gráficos |

**Evaluado y no aplicado:** control local por sitio (cambia el método, no solo la visualización), tabla de los 40 sitios, leyenda flotante sobre el mapa, escala fija entre filtros.

---

## 14. Pruebas deshechas

Se probó fusionar gráficas para reducir repetición: Comparar meses como modo de Evolución, quitar «Siniestros por año» de la ficha y quitar la serie del detalle de corredor (con un botón «Ver evolución»). Funcionaba, pero **el usuario la deshizo** y se volvió al commit. Queda como propuesta abierta (sección 16).

---

## 15. Qué no cambió

- Los datos y los cálculos de `data.js` (misma carga, mismos tipos y misma agregación).
- La capa de puntos en canvas y la estructura del mapa.
- Los puntos de entrada de la historia y el recorrido (`?historia=N`, `?sinlanding`, `localStorage`).
- El diseño de rejilla del escenario y sus puntos de corte (640, 1000 y 1180 px).

---

## 16. Verificación y pendientes

**Verificado** con `tsc` y `vite build` limpios en cada paso y con pruebas en Chrome sin cabeza (clics reales, arrastres, hover y capturas de las cuatro vistas, filtros, historia, recorrido, pantalla de inicio y mapa), a 1366, 1440, 1600 y 1920 px de ancho. Sin errores de consola.

**No verificado:** varios pasos del recorrido tras la última corrección, la historia completa con los textos nuevos, el teclado en el modo de meses sueltos y el uso táctil.

**Pendiente**
1. Retomar la fusión de gráficas: Comparar meses dentro de Evolución, quitar los duplicados y unir Mapa y cambios con Corredores en una vista «Dónde».
2. Control local por sitio y tabla de los 40 sitios.
3. Leyenda flotante sobre el mapa y escala fija entre filtros.
4. Revisar a mano los pasos del recorrido y la historia que no se volvieron a abrir.
5. ~~Limpiar del estado `velModo` y `banda`~~ (hecho, sección 17).
6. Commitear los cambios sin guardar cuando se revisen.

---

## 17. Ajustes posteriores (sin commitear)

Cambios hechos después de la sección 16, casi todos por pedido directo.

| Área | Antes | Ahora | Por qué |
|---|---|---|---|
| Comparar meses | Selector «Bandas / Meses sueltos» | Solo meses sueltos (clic y arrastre) | Pedido: quitar bandas |
| Periodos (instalación, pandemia) | Franjas sombreadas detrás de barras y líneas | **Cinta pegada al eje X**, una fila por periodo con el rótulo dentro del tramo, en Siniestros por mes, Con y sin cámara y Comparar meses | Las franjas tapaban datos y se solapaban; la cinta comparte el eje con los datos (Munzner: contexto cerca y alineado) |
| Rótulo | «Instalación» | «Instalación de las cámaras» | Pedido |
| Descripciones de gráficas | Párrafos largos que empezaban con «Permite…» | Una línea declarativa + icono de ayuda con la explicación de cómo leer la gráfica | Es un dashboard, no una guía |
| Ayuda | Tooltip (solo con cursor) | Popover: cursor, foco, clic o toque | Que funcione en pantallas táctiles |
| Ficha, Con y sin cámara y Víctimas | Siempre 2019 frente a 2021–22 | El periodo elegido es el «después»: 2020 compara 2019 con 2020; «Antes» muestra un aviso | El filtro de periodo no cambiaba nada |
| Título de la ficha | «Antes y después» | «Cambio frente a 2019» | Ya no siempre es antes y después |
| Barras de cambio (ficha) | Cero siempre al centro (media barra vacía) | Cero según los datos; si todo baja, usan todo el ancho | Aprovechar el ancho |
| Gravedad | Con muertos, Heridos o muertos, Todos | Todos, Heridos, Heridos o muertos, Muertos (nuevo nivel «Heridos» sin muertos) | Pedido |
| Corredores | Mapa a la derecha; miniatura de 104 px | Mapa siempre a la izquierda; miniatura de 176 px con «2019» y «2022» | Pedido; la franja amarilla sin años no se entendía |
| Detalle de corredor | Cifras sin unidad («72,6») | «siniestros por mes» bajo cada cifra; gráfica más ancha con la cinta | «¿Pollos?» |
| Diferencias | «p.p.» | «%», sin espacio | Pedido; formato único |
| Línea de multas | Punteada y sin rótulo | Continua y con rótulo «Multas desde may-2020» | El punteado ya significa «sin cámara» |
| Velocidad con un sitio elegido | «Tramos con cámara (37)» | Nombre del sitio y «Resto de la vía, sin cámara» | Pedido |
| Tipos de siniestro | Otro entre medias | «Otro» al final | Pedido |
| Comillas | « » | " " | Pedido |
| «Quitar selección» | En la barra superior y dentro del mapa | Solo en el mapa; en la barra superior únicamente si el mapa está oculto | Duplicado |
| Vocabulario | «control», «Bitcarrier», «casos» y «siniestros» mezclados | «vías sin cámara» y «siniestros» | Consistencia |
| Cifras fijas | «109.137» escrito a mano | Calculado de los datos | Evitar cifras desfasadas |
| Estado | `banda`, `velModo` sin interfaz | Eliminados | Código muerto |
| Pantallas angostas | Pestañas cortadas a 640 px | Pestañas ajustadas (sin iconos a 640 px) | Responsive |
| Ficha | Sección «Cámaras» | Eliminada | Pedido |
| Corredor y Sitio | `Select` sin búsqueda | `Combobox` (Popover + `Command`, con búsqueda) | 18 corredores y 40 sitios son demasiados para recorrer a ojo |
| Filtros en pantallas angostas | Cuatro selectores apilados antes del mapa | Botón «Filtros» que abre un `Sheet` inferior | Dejar el mapa a la vista en el móvil |
| Lista de corredores | Lista de ~1.000 px que empujaba el detalle hacia abajo | `ScrollArea` de 540 px máximo | El detalle del corredor queda a la vista |
| Velocidad y gravedad por corredor | `<details>` nativo | `Collapsible` | Mismo componente que el resto |

**Pendiente:** el recorrido guiado y la historia no se volvieron a recorrer entera tras estos textos; la tabla de Comparar meses a 640 px requiere desplazamiento horizontal.

---

## 18. Cambios rehechos a partir de la versión publicada

Estos ajustes se habían quedado sin commit en otro equipo y se rehicieron tomando como referencia https://visor-ashen.vercel.app.

| Área | Cambio |
|---|---|
| Historia | Copa de martini: nueve pasos guiados y un décimo de exploración libre; las cifras salen de los datos y al terminar el visor queda como está |
| Bienvenida | Ventana "Preguntas que responde el visor (Why)" con las seis preguntas textuales |
| Velocidad del tráfico | Gráfica "Diferencia entre con y sin cámara" con su ayuda y tooltip |
| Corredores | Rótulos "Menos / Más casos que sin cámara"; franja y guía de instalación en el detalle; línea roja en la guía |
| Identidad | Favicon de cámara y algunos iconos |
| Textos | Frases completas y sin dos puntos |
