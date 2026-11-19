"""Prepara los datos del visor (solo librería estándar de Python).

Lee los archivos crudos de la raíz del repo y escribe versiones compactas en
visor/public/data/:

  siniestros.json  columnar: una entrada por siniestro con lo mínimo para filtrar
  victimas.json    lista dispersa de víctimas heridas/muertas por siniestro
  geo.json         sitios, cámaras y tramos (coordenadas redondeadas)
  velocidad.json   P85 mensual (panel balanceado) por corredor, sitio y Bogotá

Uso:  python3 scripts/build_data.py
"""
import csv
import json
import os
import datetime as dt
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "visor", "public", "data")
os.makedirs(OUT, exist_ok=True)

DAY0 = dt.date(2019, 1, 1)
GRAVEDADES = ["Solo daños", "Con heridos", "Con muertos"]
CLASES = ["Choque", "Atropello", "Caida de ocupante", "Volcamiento", "Otro", "Incendio"]
FLAGS = ["CON_BICICLETA", "CON_CARGA", "CON_EMBRIAGUEZ", "CON_HUECOS", "CON_MENORES",
         "CON_MOTO", "CON_PEATON", "CON_PERSONA_MAYOR", "CON_RUTAS", "CON_TPI", "CON_VELOCIDAD"]
CONDICIONES = ["Peatón", "Motociclista", "Ciclista", "Pasajero", "Conductor"]

# Código de vía Bitcarrier (tramos.CORREDOR) que corresponde a cada corredor de cámaras.
CODIGOS_VIA = {
    "Av. Boyacá": ["KR72"],
    "Autopista Norte": ["AUTONORTE"],
    "Av. Ciudad de Cali": ["KR86"],
    "Av. NQS": ["NQS"],
    "Autopista Sur": ["NQS"],
    "Av. Calle 80": ["CL80"],
    "Av. Carrera 68": ["KR68"],
    "Av. Américas": ["AV.AMERICAS"],
    "Av. Caracas": ["AV.CARACAS", "CARACAS"],
    "Av. Primero de Mayo": ["AV.P.MAYO"],
    "Av. Carrera 7": ["KR7"],
    "Av. Carrera 10": ["KR10"],
    "Av. Carrera 9": ["KR9"],
    "Av Villavicencio": ["AV.VILLAVICENCIO"],
    "Av. Bosa": ["AV.CL59SUR"],
}


def r5(x):
    return round(x, 5)


def load_geo(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return json.load(f)["features"]


# ---------------------------------------------------------------- geografía
sitios = load_geo("sitios.geojson")
camaras = load_geo("camaras.geojson")
tramos = load_geo("tramos.geojson")

sitio_ids = [f["properties"]["SITIO_DEI"] for f in sitios]
sitio_idx = {s: i for i, s in enumerate(sitio_ids)}
corredores = sorted({f["properties"]["CORREDOR"] for f in sitios})
corr_idx = {c: i for i, c in enumerate(corredores)}
sitio_corr = {f["properties"]["SITIO_DEI"]: f["properties"]["CORREDOR"] for f in sitios}

geo = {
    "corredores": corredores,
    "sitios": [
        {
            "id": p["SITIO_DEI"], "corredor": p["CORREDOR"], "via": p["VIA_SECUNDARIA"],
            "localidad": p["LOCALIDAD"], "limite": p["LIMITE"], "n_camaras": p["N_CAMARAS"],
            "tipo": p["TIPO"], "fecha": p["FECHA_RESOLUCION"],
            "lon": r5(f["geometry"]["coordinates"][0]), "lat": r5(f["geometry"]["coordinates"][1]),
        }
        for f in sitios for p in [f["properties"]]
    ],
    "camaras": [
        {
            "id": p["ID_CAMARA"], "sitio": p["SITIO_DEI"], "nombre": p["NOMBRE"],
            "sentido": p["SENTIDO"], "calzada": p["CALZADA"], "carriles": p["CARRILES"],
            "limite": p["LIMITE"], "infracciones": p["INFRACCIONES"], "tipo": p["TIPO"],
            "fecha": p["FECHA_RESOLUCION"],
        }
        for f in camaras for p in [f["properties"]]
    ],
    "tramos": [],
}

codigo_a_corr = defaultdict(list)
for c, codes in CODIGOS_VIA.items():
    for code in codes:
        codigo_a_corr[code].append(c)

for f in tramos:
    p = f["properties"]
    lines = [[[r5(x), r5(y)] for x, y in line] for line in f["geometry"]["coordinates"]]
    # Corredor de cámaras al que pertenece el tramo (si es la misma vía)
    corr = None
    cands = codigo_a_corr.get(p["CORREDOR"], [])
    if len(cands) == 1:
        corr = cands[0]
    elif len(cands) > 1:  # NQS: Av. NQS o Autopista Sur según el sitio más cercano
        corr = sitio_corr.get(p["SITIO_DEI"]) if sitio_corr.get(p["SITIO_DEI"]) in cands else cands[0]
    geo["tramos"].append({
        "id": p["PAR_ID"], "via": p["CORREDOR"], "km": p["LONG_KM"], "cam": p["CON_CAMARA"],
        "sitio": p["SITIO_DEI"], "dist": p["DIST_CAM"], "corredor": corr, "lines": lines,
    })

with open(os.path.join(OUT, "geo.json"), "w", encoding="utf-8") as f:
    json.dump(geo, f, ensure_ascii=False, separators=(",", ":"))

# ---------------------------------------------------------------- siniestros
cols = {k: [] for k in ["d", "h", "g", "c", "f", "dc", "s", "p", "x", "lat", "lon", "loc"]}
localidades = []
loc_idx = {}
form_row = {}
with open(os.path.join(ROOT, "siniestros.csv"), encoding="utf-8") as fh:
    for i, r in enumerate(csv.DictReader(fh)):
        form_row[r["FORMULARIO"]] = i
        d = dt.date.fromisoformat(r["FECHA"])
        flags = 0
        for b, k in enumerate(FLAGS):
            if r[k] == "1":
                flags |= 1 << b
        loc = r["LOCALIDAD"] or "Sin dato"
        if loc not in loc_idx:
            loc_idx[loc] = len(localidades)
            localidades.append(loc)
        cols["d"].append((d - DAY0).days)
        cols["h"].append(int(r["HORA"]))
        cols["g"].append(GRAVEDADES.index(r["GRAVEDAD"]))
        cols["c"].append(CLASES.index(r["CLASE"]))
        cols["f"].append(flags)
        cols["dc"].append(int(round(float(r["DIST_CAM"]))))
        cols["s"].append(sitio_idx[r["SITIO_DEI"]])
        cols["p"].append(1 if r["PAR_ID"] else 0)
        cols["x"].append(int(r["CRUCE"]))
        cols["lat"].append(int(round(float(r["lat"]) * 1e5)))
        cols["lon"].append(int(round(float(r["lon"]) * 1e5)))
        cols["loc"].append(loc_idx[loc])

meta = {
    "day0": DAY0.isoformat(), "gravedades": GRAVEDADES, "clases": CLASES, "flags": FLAGS,
    "sitios": sitio_ids, "localidades": localidades, "n": len(cols["d"]),
}
with open(os.path.join(OUT, "siniestros.json"), "w", encoding="utf-8") as f:
    json.dump({"meta": meta, "cols": cols}, f, ensure_ascii=False, separators=(",", ":"))

# ---------------------------------------------------------------- víctimas
# Lista dispersa [fila, condición, 1=herido|2=muerto, cantidad]
agg = defaultdict(int)
with open(os.path.join(ROOT, "victimas.csv"), encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        g = {"Herido": 1, "Muerto": 2}.get(r["GRAVEDAD"])
        if not g or r["CONDICION"] not in CONDICIONES or r["FORMULARIO"] not in form_row:
            continue
        agg[(form_row[r["FORMULARIO"]], CONDICIONES.index(r["CONDICION"]), g)] += 1
vict = [[k[0], k[1], k[2], v] for k, v in sorted(agg.items())]
with open(os.path.join(OUT, "victimas.json"), "w", encoding="utf-8") as f:
    json.dump({"condiciones": CONDICIONES, "rows": vict}, f, ensure_ascii=False, separators=(",", ":"))

# ---------------------------------------------------------------- velocidad
# Meses 2019-01 .. 2022-12 (índice 0..47). Panel balanceado: tramos con dato en los 4 años.
mes = defaultdict(dict)  # PAR_ID -> {idx: P85}
with open(os.path.join(ROOT, "vel_tramo_mes.csv"), encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        if r["P85"] == "":
            continue
        idx = (int(r["ANIO"]) - 2019) * 12 + int(r["MES"]) - 1
        mes[r["PAR_ID"]][idx] = float(r["P85"])


def balanced(ids):
    out = []
    for t in ids:
        years = {k // 12 for k in mes.get(t, {})}
        if years >= {0, 1, 2, 3}:
            out.append(t)
    return out


def serie(ids):
    ids = balanced(ids)
    res = []
    for k in range(48):
        vals = [mes[t][k] for t in ids if k in mes[t]]
        res.append(round(sum(vals) / len(vals), 1) if len(vals) >= max(1, len(ids) // 2) else None)
    return {"n": len(ids), "p85": res}


tr = geo["tramos"]
vel = {"bogota": {
    "cam": serie([t["id"] for t in tr if t["cam"] == 1]),
    "sin": serie([t["id"] for t in tr if t["cam"] == 0]),
}, "corredor": {}, "sitio": {}}
limites = defaultdict(list)
for s in geo["sitios"]:
    limites[s["corredor"]].append(s["limite"])
for c in corredores:
    cam_ids = [t["id"] for t in tr if t["cam"] == 1 and t["corredor"] == c and sitio_corr.get(t["sitio"]) == c]
    sin_ids = [t["id"] for t in tr if t["cam"] == 0 and t["corredor"] == c]
    if cam_ids or sin_ids:
        vel["corredor"][c] = {"cam": serie(cam_ids), "sin": serie(sin_ids), "limite": max(limites[c])}
for s in geo["sitios"]:
    cam_ids = [t["id"] for t in tr if t["cam"] == 1 and t["sitio"] == s["id"]]
    if cam_ids:
        c = s["corredor"]
        sin_ids = [t["id"] for t in tr if t["cam"] == 0 and t["corredor"] == c]
        vel["sitio"][s["id"]] = {"cam": serie(cam_ids), "sin": serie(sin_ids), "limite": s["limite"]}

with open(os.path.join(OUT, "velocidad.json"), "w", encoding="utf-8") as f:
    json.dump(vel, f, ensure_ascii=False, separators=(",", ":"))

for name in ["siniestros.json", "victimas.json", "geo.json", "velocidad.json"]:
    print(f"{name:16s} {os.path.getsize(os.path.join(OUT, name)) / 1e6:6.2f} MB")
