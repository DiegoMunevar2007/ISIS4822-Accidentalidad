# Bitácora del proyecto

ISIS4822, Visual Analytics. Grupo 4. Del 16 de octubre al 26 de noviembre de 2026.

## Fechas

| Fecha | Qué pasó |
|---|---|
| 16 de octubre | Empieza el proyecto. |
| 2 de noviembre | Salen los wireframes interactivos. |
| 5 de noviembre | Probamos el paper prototype y recibimos recomendaciones. |
| 12 de noviembre | Subimos al repositorio los datos procesados en ArcGIS. |
| 17 de noviembre | Programamos la primera versión. |
| 18 de noviembre | Hacemos ajustes, con la historia, la vista Panorama y un tema claro. |
| 19 de noviembre | Presentación. |
| 23 de noviembre | Reescribimos la interfaz. |
| 24 de noviembre | Validaciones con usuarios. |
| 25 de noviembre | Pequeños cambios. |
| 26 de noviembre | Presentación final. |

## Datos (16 de octubre a 2 de noviembre)

Lo primero fue ver con qué contábamos, que era un inventario de 92 cámaras, los vectores de la red Bitcarrier, cinco libros de siniestralidad y millones de registros de velocidad, cada cosa por su lado. Queríamos saber qué había pasado cerca de las cámaras y compararlo con vías sin ninguna, pero con los archivos así no había cómo.

Donde más nos trabamos fue en la ubicación, porque de 2019 a 2021 los anuarios solo dan la dirección escrita. Alcanzamos a pensar en geocodificar unas 86.500 direcciones, que además no habríamos podido revisar una por una, hasta que encontramos el histórico georreferenciado de la Secretaría Distrital de Movilidad y lo unimos con los anuarios en ArcGIS Pro.

Con el radio también nos tocó devolvernos. Dibujamos círculos de 150, 300 y 500 metros alrededor de cada cámara, pero los de cámaras vecinas se montaban unos sobre otros y el mismo siniestro salía contado dos o tres veces, con lo cual los sitios con varias cámaras habrían parecido más peligrosos solo por la forma en que los habíamos dibujado. Terminamos asignando a cada siniestro el sitio más cercano y guardando la distancia.

Como guardamos la distancia y no solo una marca de cerca o lejos, el radio se puede cambiar desde el dashboard sin volver a procesar los datos, y quien no esté de acuerdo con los 500 metros puede probar otro valor.

## Wireframes (2 de noviembre)

Los primeros wireframes parecían un boceto, pero se podían usar y tenían la red vial de Bogotá y conteos reales. Se recorrían en diez pasos o por libre, con el mapa a la izquierda y el análisis a la derecha, y tenían cuatro vistas, que eran Mapa y ficha, Serie, Víctimas y Meses A/B.

![Mapa de corredores y ficha anual de Bogotá](img/w_general.jpg)

Al seleccionar un corredor la vía se ponía roja y la ficha cambiaba, para que se viera de una de qué lugar eran las cifras.

![Selección de la Av. Boyacá](img/w_seleccion.jpg)

Víctimas iba aparte y mostraba toda la ciudad, porque no teníamos el dato por corredor y no queríamos que pareciera que la selección se estaba aplicando.

![Vista de víctimas por actor vial](img/w_victimas.jpg)

La serie mostraba los siniestros fatales por mes, con botones para ver el antes o el después.

![Serie de la Av. Boyacá con el filtro Después](img/w_despues.jpg)

Para comparar se escogía un mes A y un mes B.

![Comparación de dos meses](img/w_ab.jpg)

También pusimos una guía de diez pasos, pues con cuatro vistas sentíamos que no era claro por dónde empezar.

![Guía de diez pasos](img/w_guia.jpg)

## Paper prototype (5 de noviembre)

Para la prueba en papel dejamos un solo caso, la Av. Boyacá con los siniestros fatales de 2018 a 2022, tres vistas y tres meses, porque en papel cada combinación de filtros es otro recorte y lo que queríamos ver era si la gente podía seleccionar, filtrar y comparar. Además, mover un papelito no cuesta nada y uno no se pone a defenderlo como defendería algo ya programado, aunque a cambio no pudimos ver qué pasaba con muchos filtros a la vez y la vista de víctimas, que en los wireframes tenía pestaña, se quedó por fuera.

![Base de montaje del mapa y la ficha](img/paper-1.jpg)
![Ejemplo montado de la comparación A/B](img/paper-2.jpg)
![Controles para recortar](img/paper-3.jpg)
![Piezas que cambian al seleccionar](img/paper-4.jpg)
![Respuestas al filtro de periodo](img/paper-5.jpg)
![Tarjetas de los meses y sus resultados](img/paper-6.jpg)

En clase nosotros movíamos las piezas mientras la persona decía o señalaba lo que haría, de modo que cuando pedía algo que no teníamos previsto se notaba ahí mismo.

![Piezas sobre la mesa durante la prueba](img/clase1.jpg)
![Base montada durante la prueba](img/clase2.jpg)

### Recomendaciones

Esto fue lo que quedó anotado en el chat del grupo durante la prueba.

1. Hover sobre la serie, por meses o por días si la temporalidad es más pequeña.
2. Filtros por tipo de accidente, y no solo accidentes en general.
3. Quizá incluir la velocidad.
4. Poner ambas gráficas, es decir, quitar el mapa en ciertas circunstancias.
5. En la serie, pintar varias líneas al tiempo, como el antes frente al después.
6. Conteo de cámaras y de siniestros en la comparación.
7. Agregar los filtros de tipos de accidente para dar más agregado a la información disponible.
8. Aclarar si se toma toda la vía o solo un tramo detectado por la cámara.
9. No dejar siempre el mapa fijo.
10. Del grupo 2, cambiar el layout de la comparación A/B del mapa y ponerla en otra pantalla.
11. Del grupo 3, agregar un tutorial de inicio que muestre qué pulsar, o una landing page.

### Respuesta a las recomendaciones

| Recomendación | Qué hicimos | Cómo quedó |
|---|---|---|
| 1. Hover en la serie | Tooltips en la serie, con semanas y días al acercar un periodo. | Con ajuste |
| 2 y 7. Tipos de accidente | Filtros de gravedad, tipo de siniestro y actor involucrado. | Atendida |
| 3. Velocidad | Gráficas de velocidad aparte y la diferencia entre con y sin cámara. | Con ajuste |
| 4 y 9. Mapa que no sea fijo | Botón para ocultar el mapa, y Comparar meses sin mapa. | Atendida |
| 5. Varias líneas | Un año frente a otro y series con y sin cámara. | Atendida |
| 6. Conteos en la comparación | Filas de siniestros, víctimas, cámaras instaladas y velocidad. | Atendida |
| 8. Vía o tramo | Selector de sitio, radio ajustable y casilla para ver todo el corredor. | Atendida en dos pasos |
| 10. A/B en otra pantalla | Pestaña propia. | Atendida |
| 11. Tutorial o landing page | Pantalla de inicio, recorrido guiado e historia. | Atendida |

Los filtros de tipo y de actor los agregamos porque el total de siniestros revuelve cosas muy distintas, y no hay por qué esperar que una cámara de velocidad influya igual en todas. El mapa se puede ocultar porque al comparar meses lo que importa es cuándo pasó y el mapa quitaba espacio, mientras que la velocidad va en sus propias gráficas, ya que con doble eje dos líneas montadas parecen tener una relación que nadie ha mostrado. Los días solo salen al acercar, porque en cuatro años serían puro ruido, y la pantalla de entrada y el recorrido son para quien llega sin conocer los datos.

La pregunta sobre la vía o el tramo nos mostró que el alcance de lo que contábamos no estaba escrito en la pantalla. Nosotros lo teníamos claro por haber procesado los datos, pero quien la miraba no tenía cómo saberlo.

## Primera versión (17 de noviembre)

La primera versión la hicimos con Vite, D3 y Leaflet y ya traía los 18 corredores, porque con la Boyacá sola no había forma de saber si lo que veíamos pasaba también en otros. Tenía tres vistas, filtros en botones, fondo cálido, títulos con serifa y azul y rojo para el antes y el después. La de víctimas se pasó a la ficha, ya que la pregunta por peatones, motos y ciclistas es sobre el mismo lugar que uno está mirando y en otra pestaña tocaba acordarse de la selección, y como había sugerido el grupo 3 abría con una pantalla de entrada.

![Primera pantalla de entrada](img/v1_landing.jpg)
![Mapa y ficha en la primera versión](img/v1_mapa.jpg)
![Serie con la velocidad debajo](img/v1_serie.jpg)
![Meses A/B en su propia pantalla](img/v1_ab.jpg)

Cuando la miramos con calma no nos convenció, porque abría solo con los siniestros con muertos, pintaba todos los puntos a la vez, tenía la letra muy pequeña y dejaba la respuesta que importaba en una frase al final de una ficha apretada.

## Ajustes (18 de noviembre)

Probar corredor por corredor para saber cuál mejoraba o empeoraba no tenía sentido, así que hicimos una cuarta vista, Panorama. También armamos la historia guiada, porque alguien podía pasar por todas las vistas y filtros y quedarse sin saber si las cámaras habían servido. El fondo cálido no nos terminaba de gustar y lo cambiamos por un azul gris, y el periodo y la gravedad pasaron a menús con el nombre completo, pues con etiquetas cortas no se sabía a qué se referían.

![Pantalla de entrada con la historia](img/v2_landing.jpg)
![Panorama con la gravedad, los 18 corredores y la velocidad](img/v2_panorama_det.jpg)
![Meses A/B después de los ajustes](img/v2_ab.jpg)

Panorama quedó con tres gráficas y un selector de gravedad propio que repetía el filtro de arriba, y no era claro cuál había que mirar primero.

## Reescritura de la interfaz (23 de noviembre)

Pasamos todo a React, TypeScript y Tailwind porque el código viejo tenía los datos mezclados con la pantalla y por cada filtro nuevo había que tocar demasiadas cosas. La carga y las agregaciones de datos las dejamos como estaban, para poder comprobar que las cifras siguieran iguales. Era arriesgado hacerlo tan tarde, pero cada arreglo de diseño nos estaba tomando más que el anterior.

El diseño tampoco nos gustaba, pues se veía genérico, como sacado de una plantilla, y en un tema tan peleado como este eso, o un texto que suene a publicidad, hace dudar hasta de las cifras. Quitamos colores y adornos, quedamos con un verde azulado y una sola tipografía, subimos la letra mínima a 13 píxeles porque costaba leerla y cambiamos los nombres de las pestañas, ya que Panorama o Serie no decían qué había adentro.

![Pantalla de entrada de la interfaz reescrita](img/v3_landing.jpg)
![Mapa y cambios con densidad en lugar de puntos](img/v3_mapa.jpg)
![Corredores como lista ordenable](img/v3_corredores.jpg)
![Comparar meses con bandas arrastrables](img/v3_ab.jpg)

Después volvimos a cambiar el color, porque la versión sobria no nos gustaba del todo y ya no se sentía de Bogotá, y usamos el rojo y el amarillo de la bandera sobre fondo blanco, con el amarillo marcando además el contexto. Con el rojo seguimos con dudas, porque suele leerse como algo malo y para nosotros solo señala lo observado, de ahí que los textos no digan si un cambio es bueno o malo.

## Cambios en las gráficas

### Mapa

Eran 109.137 siniestros y los puntos se tapaban tanto que el mapa terminaba mostrando dónde hay calles. Ahora de lejos se agrupan en celdas y al acercar vuelven los puntos, coloreados por gravedad.

![Antes, todos los puntos](img/v1_mapa.jpg)
![Ahora, densidad y guía de colores](img/i_mapa.jpg)
![Al acercar aparecen los puntos](img/ex_zoom.jpg)

### Selección en el mapa

En papel la selección resaltaba la vía y eso lo dejamos, pero no era claro dónde quedaba la cámara elegida, así que atenuamos las otras. El botón para quitar la selección va sobre el mapa, que es donde uno selecciona.

![Av. Boyacá seleccionada en el dashboard](img/ex_boyaca.jpg)
![Un sitio de cámara con su radio de 500 metros](img/f_sitio.jpg)

### Barras de cambio y víctimas

Al principio cada zona tenía su propia escala, de manera que una caída pequeña podía verse tan larga como una grande justo en la comparación de la que depende todo el proyecto. Ahora son dos barras de cambio porcentual con la misma escala.

![Barras de cambio con y sin cámara](img/i_cambio.jpg)

Las víctimas van por condición, con 2019 y el después, porque en un total no se ve que a unos les puede ir mejor mientras a otros les va peor.

![Víctimas por condición](img/i_victimas.jpg)

### Comparación entre años

Las cuatro líneas se cruzaban, las etiquetas se pisaban y tocaba seguir un color mientras uno se acordaba de los otros. No nos gustaba ni se entendía, así que las separamos en un recuadro por año, todos con la misma escala y con 2019 en gris detrás.

![Antes, años superpuestos](img/v1_anios_det.jpg)
![Versión intermedia con pequeños múltiplos](img/v3_anios_det.jpg)
![Ahora](img/i_anios.jpg)

### Con cámara y sin cámara

La gráfica hablaba de un índice con base en 2019 que no se entendía, y para colmo las dos líneas parecían iguales. Explicamos el porcentaje y pusimos debajo la diferencia como un área, porque eso es lo que uno quiere saber y no tenía sentido que la persona la restara a ojo.

![Antes, cámara frente a control](img/v1_control_det.jpg)
![Versión intermedia con franjas sombreadas](img/v3_control_det.jpg)
![Ahora, con las franjas convertidas en una cinta junto al eje](img/i_indice.jpg)

Las franjas de instalación y pandemia tapaban datos y se montaban una sobre otra, y había además un selector llamado Banda para escoger algo que se podía mostrar siempre. Si alguien no lo activaba, podía achacarle a las cámaras una caída que en realidad coincidía con la pandemia. Por eso ahora se muestra siempre.

![El selector Banda de los ajustes del 18](img/v2_control_det.jpg)

### Serie y velocidad

Sin el promedio de 2019 sentíamos que no era claro cuánto bajaban o subían los siniestros, y en papel, con los fatales de un solo corredor, la línea además era puro zigzag. Ahora la serie abre con todos los siniestros y la gravedad queda como filtro.

![Serie con el promedio de 2019, las multas y el contexto](img/i_serie.jpg)
![Al acercar un periodo se ven las semanas](img/ex_semanas.jpg)

Con la velocidad nos pasó parecido, pues las dos líneas parecían paralelas hasta que dibujamos la diferencia en km/h.

![Velocidad y diferencia entre tramos](img/i_velocidad.jpg)

### Corredores

En Panorama había gráficas que respondían lo mismo y ninguna llevaba al detalle, mientras que una lista que se puede ordenar muestra de una cuál mejora o empeora y deja el detalle a un clic. Tampoco salió a la primera, porque un corredor con 4 siniestros se comía la escala y el aviso de pocos datos les salía a 14 de los 18 corredores. Ahora la escala se calcula con los que tienen suficientes datos y el umbral bajó a 10, ya que un aviso que sale casi siempre ya no avisa nada. Después vinieron las miniaturas y el mapa enlazado.

![Lista actual con miniaturas](img/i_corredores.jpg)

![Detalle de un corredor](img/i_detalle.jpg)

![Velocidad y gravedad, ahora en una sección plegada](img/i_dispersion.jpg)

### Comparar meses

| Versión | Qué era | Por qué la cambiamos |
|---|---|---|
| Inicial | Dos meses sueltos y tarjetas | Tenía mucho texto y un solo mes tiene mucho ruido. |
| Tabla | A, B y el cambio | Casi no tenía parte gráfica. |
| Barras | 48 meses con guías punteadas | Las guías no nos gustaban y estorbaban. |
| Grupos | Selección con clic, Shift y arrastre | Era complicada y la línea de promedio atravesaba las barras. |
| Bandas | Dos bandas arrastrables | Las manijas se veían muy gruesas y costaba reiniciar. |
| Actual | Meses sueltos con clic o arrastre | La conservamos, comparando el promedio mensual de cada grupo. |

![Resultado actual de Comparar meses](img/v4_ab.jpg)

Aquí fuimos corrigiendo una cosa y dañando otra, porque queríamos que seleccionar meses fuera muy potente y lo volvimos difícil. La versión de ahora deja hacer menos que algunas anteriores y aun así la preferimos, ya que se entiende sin explicación, y se comparan grupos de meses porque uno solo puede subir o bajar por azar.

## Filtros, ayuda e historia

Los filtros que no cambian una vista ya no aparecen ahí, porque uno los movía, no pasaba nada y quedaba la duda de si la gráfica estaba dañada. A corredor y sitio les pusimos búsqueda, ya que buscar a ojo entre 40 sitios es lento.

![Búsqueda de corredor](img/f_buscar.jpg)
![Filtros de tipo, actor, radio e intersecciones](img/f_mas.jpg)

Debajo de cada gráfica había explicaciones largas que lo hacían parecer un manual, y no nos gustaba que el texto compitiera con los datos. Tampoco quisimos borrarlas, porque hay quien no está acostumbrado a leer gráficas, así que quedaron en un icono de ayuda.

![Ayuda de una gráfica](img/f_ayuda.jpg)

El recorrido guiado en algunas pantallas señalaba donde no era, porque medía las cosas cuando la página todavía se estaba moviendo, y una ayuda así confunde más que no tener ninguna.

![Recorrido guiado](img/f_recorrido.jpg)

La historia tenía tres actos y un tono dramático que no nos gustaba y que además empujaba hacia una conclusión. Ahora los pasos solo describen y al final queda la exploración libre, para que cada quien revise la evidencia.

![Primer paso de la historia](img/h1.jpg)
![Un paso sobre los corredores](img/h6.jpg)
![Último paso, con la exploración libre](img/h10.jpg)

## Validaciones con usuarios (24 de noviembre)

Con el dashboard ya construido hicimos dos validaciones adicionales, en las que dos usuarios lo recorrieron y nos dieron su opinión.

![Primera sesión](img/val_usuario1.jpg)
![Segunda sesión](img/val_usuario2.jpg)

En general las vistas les parecieron claras, pero nos señalaron cosas de legibilidad y de consistencia que nosotros habíamos dejado pasar, porque ya sabíamos qué decía cada rótulo aunque estuviera cortado. Los cambios quedaron así.

| Lo que nos dijeron | Qué hicimos |
|---|---|
| Al ver la evolución por semanas hay texto cortado. | Los rótulos se acomodan para quedar dentro de la gráfica. |
| La gráfica de velocidad parece recortada porque faltan datos. | Los meses sin datos se sombrean, se anuncian en la leyenda y se listan debajo. |
| La etiqueta del promedio de 2019 queda cruzada por las líneas y se pierde. | Pasó a la leyenda y la línea ahora es punteada y oscura. |
| La barra de 2019 aporta poco porque es un solo dato. | Con un solo año mostramos la cifra y su promedio mensual. |
| Hay que cambiar el texto que dice con el cursor. | Reescribimos las indicaciones que empezaban así. |
| Los avisos tienen estilos distintos y el amarillo parece una advertencia. | Los dos usan el mismo recuadro blanco con borde. |
| Falta revisar los filtros. | Con el periodo anterior a la instalación quitamos los textos que anunciaban una comparación que no existe. |

En las velocidades el problema no era del dibujo, porque faltaban meses en los datos, y preferimos mostrar el hueco antes que unir las líneas y aparentar mediciones que no tenemos. El amarillo lo habíamos usado para que la indicación se viera, sin pensar en que a otra persona le sonaría a advertencia.

![Serie por semanas antes](img/val_semana_antes.jpg)
![Serie por semanas después](img/val_semana_despues.jpg)
![Velocidad antes](img/val_velocidad_antes.jpg)
![Velocidad después](img/val_velocidad_despues.jpg)
![Periodo de 2019 antes](img/val_periodo_antes.jpg)
![Periodo de 2019 después](img/val_periodo_despues.jpg)
![Avisos de la historia antes](img/val_aviso_antes.jpg)
![Avisos de la historia después](img/val_aviso_despues.jpg)

### Qué sacamos de las validaciones

Las dos validaciones miraron cosas distintas porque probaron objetos distintos, ya que con el papel nos hablaron de lo que faltaba y de cómo moverse, y con el dashboard construido de si lo que ya estaba se podía leer. Pensando en los tres perfiles del proyecto, que son una usuaria estratégica, un usuario táctico y una usuaria operativa, estos son los hallazgos, a quién creemos que afectan más y qué decisión cambió.

| Lo que decantamos | Perfil más afectado | Decisión que cambió |
|---|---|---|
| El alcance de lo que se cuenta debe estar a la vista y poder modificarse. | Estratégico | Selector de sitio, radio ajustable y casilla del corredor. |
| Comparar periodos necesita su propio espacio. | Estratégico y táctico | Comparar meses pasó a ser una vista sin mapa. |
| Un total de siniestros mezcla situaciones distintas. | Táctico | Filtros de gravedad, tipo y actor. |
| Quien llega por primera vez no sabe por dónde empezar. | Operativo | Pantalla de inicio, recorrido e historia. |
| Un texto cortado o una etiqueta tapada hace dudar de la gráfica. | Operativo | Rótulos acomodados y referencias en la leyenda. |
| La falta de datos se confunde con un error del dibujo. | Estratégico y táctico | Meses sin datos sombreados y listados. |
| El color de un aviso comunica más que su texto. | Operativo | Un solo estilo de aviso, sin amarillo. |

## Pequeños cambios (25 de noviembre)

Así quedó el dashboard después de los últimos ajustes.

![Pantalla de entrada](img/v4_landing.jpg)
![Mapa y cambios](img/v4_mapa.jpg)
![Evolución](img/v4_serie.jpg)
![Corredores](img/v4_corredores.jpg)
![Las seis preguntas, con acceso a su vista](img/preguntas.jpg)

## Reflexión

Al empezar creíamos que el trabajo consistía en mostrar si las cámaras habían funcionado, y terminamos viendo que la respuesta cambia según cómo se haga la pregunta. Con todos los siniestros, entre 2019 y 2021 y 2022 la zona con cámara bajó 17,9% y las vías sin cámara 27,5%, mientras que con los siniestros con muertos la zona con cámara subió 25% y las otras bajaron 3,3%. El radio, la gravedad y el año base los escogimos nosotros o los puede escoger quien usa el dashboard, así que la misma herramienta que permite revisar una afirmación también permite buscar el recorte que más le convenga a alguien. La primera versión abría solo con los siniestros con muertos, que son pocos y producen los porcentajes más llamativos, y hoy pensamos que el valor con el que abre una vista es una decisión tan importante como la gráfica, porque muchas personas no lo van a cambiar.

Las recomendaciones del 5 de noviembre también se ven distintas ahora. Casi todas trataban sobre qué agregar o cómo moverse, como más filtros, velocidad, conteos o un tutorial, y aunque una pedía ver el antes frente al después, ninguna pedía comparar con las vías sin cámara. Creemos que tiene que ver con lo que pusimos sobre la mesa, ya que el papel solo mostraba si un número subía o bajaba y era difícil que alguien echara de menos una referencia que nunca vio. La prueba nos sirvió para los controles, pero la pregunta de fondo del proyecto no estaba puesta a prueba.

Atender esas recomendaciones y las ideas propias nos llevó casi siempre a sumar, ya fueran vistas, filtros, gráficas o texto, y buena parte del trabajo posterior fue ordenar o quitar lo que habíamos puesto. Se nota en los requisitos, donde pedir mensajes claros y pocos controles quedó cumplido solo en parte. Habíamos decidido dar prioridad a quien analiza, pero cada control que le sirve a esa persona es uno más que tiene que entender quien solo quiere saber qué pasa en su ruta, y no logramos resolver las dos cosas en la misma pantalla.

Si volviéramos a empezar, definiríamos primero la comparación y sus valores iniciales, y después dibujaríamos las vistas a partir de ella. También llevaríamos esa comparación al papel, con todo y sus casos incómodos, como los corredores con tan pocos siniestros que un porcentaje no dice casi nada.
