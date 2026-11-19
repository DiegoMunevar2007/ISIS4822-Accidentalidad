# ISIS4822-Accidentalidad

¿Las cámaras salvavidas realmente salvan vidas? Visor interactivo de siniestralidad cerca de las cámaras de Bogotá (2019–2022).

## Estructura

| Carpeta / archivo | Qué es |
|---|---|
| `*.csv`, `*.geojson`, `LEEME.md` | Datos crudos y su diccionario (ver `LEEME.md`) |
| `scripts/build_data.py` | Convierte los datos crudos en JSON compactos para el visor (solo librería estándar) |
| `visor/` | Aplicación web (Vite + D3 + Leaflet) |
| `presentacion/` | Diapositivas del proyecto (`Visor_Camaras_Salvavidas.pptx`), su generador y las capturas |

## Correr el visor

```bash
cd visor
npm install
npm run datos   # regenera visor/public/data/*.json desde los CSV (solo si cambian los datos)
npm run dev     # http://localhost:5173
```

`npm run build` deja un sitio estático en `visor/dist/` que se puede publicar en cualquier hosting.
Agrega `?sinlanding` a la URL para saltar la pantalla de bienvenida.

## Vistas

- **Mapa y ficha**: selecciona un corredor o un sitio (en el mapa o en los menús) y lee el antes/después contra el control, por año y por condición de la víctima. El botón «Ocultar mapa» deja ficha y serie lado a lado.
- **Serie**: línea de tiempo con zoom (meses → semanas → días), años superpuestos, cámara vs. control indexado y velocidad P85 de Bitcarrier.
- **Meses A/B**: pantalla completa para comparar dos meses: siniestros, víctimas, cámaras instaladas y velocidad.

Filtros: periodo, gravedad, tipo de siniestro, actor involucrado, radio alrededor de la cámara (150–1.000 m) y exclusión de intersecciones ambiguas.

## Regenerar la presentación

```bash
cd presentacion
npm install pptxgenjs   # una vez, en cualquier carpeta accesible por NODE_PATH
node build_deck.js
```
