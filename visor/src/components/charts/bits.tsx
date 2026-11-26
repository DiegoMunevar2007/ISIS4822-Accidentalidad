import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { C, fmt, showTip, hideTip } from '@/charts.js'

export interface LegendItem {
  label: string
  color: string
  dash?: boolean
  /** Franja sombreada: la guía es un cuadro en lugar de una línea. */
  area?: boolean
}

export function ChartLegend({ items, children }: { items: LegendItem[]; children?: ReactNode }) {
  return (
    <div className="chart-legend">
      {items.map((s) => (
        <span key={s.label}>
          {s.area ? (
            <svg width="18" height="12" aria-hidden="true"><rect width="18" height="12" rx="2" fill={s.color} /></svg>
          ) : (
            <svg width="18" height="8" aria-hidden="true">
              <line x1="0" y1="4" x2="18" y2="4" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dash ? '4 3' : undefined} />
            </svg>
          )}
          {s.label}
        </span>
      ))}
      {children}
    </div>
  )
}

export function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const w = max > 0 ? Math.min(100, (100 * value) / max) : 0
  return (
    <div className="meter">
      <div style={{ width: `${w}%`, background: color }} />
    </div>
  )
}

export interface PBRow {
  label: string
  a: number
  b: number
  delta: number | null
  tip?: string
  /** Escala propia de la fila (si no, usa `max` global). */
  max?: number
}

/** Barras horizontales pareadas (antes gris / después rojo). */
export function PairedBars({ rows, max, fmtVal = fmt.dec }: { rows: PBRow[]; max?: number; fmtVal?: (v: number) => string }) {
  const mx = max ?? Math.max(1, ...rows.map((r) => Math.max(r.a, r.b)))
  return (
    <div>
      {rows.map((r) => {
        const m = r.max ?? mx
        return (
          <div
            key={r.label}
            className="pb-row"
            onMouseMove={r.tip ? (ev) => showTip(r.tip, ev.nativeEvent) : undefined}
            onMouseLeave={hideTip}
          >
            <div className="pb-label">{r.label}</div>
            <div className="pb-bars">
              <div className="pb-line">
                <div className="pb-bar" style={{ width: `${(100 * r.a) / m}%`, background: C.antes }} />
                <b>{fmtVal(r.a)}</b>
              </div>
              <div className="pb-line">
                <div className="pb-bar" style={{ width: `${(100 * r.b) / m}%`, background: C.despues }} />
                <b>{fmtVal(r.b)}</b>
              </div>
            </div>
            {r.delta != null && (
              <div className={`pb-delta ${r.delta < 0 ? 'down' : r.delta > 0 ? 'up' : ''}`}>{fmt.pct(r.delta)}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export interface ChangeRow {
  label: string
  cambio: number | null
  color: string
  detail: string
  tip?: string
  icon?: LucideIcon
  /** Pocos siniestros: la barra se dibuja con trama, igual que en la lista de corredores. */
  bajo?: boolean
}

/** Cambio porcentual de varias filas en una misma escala, con barras que parten de cero. */
export function ChangeBars({ rows }: { rows: ChangeRow[] }) {
  // El cero se coloca según los datos: si todo baja, las barras usan todo el ancho hacia la izquierda.
  const vals = rows.map((r) => r.cambio ?? 0)
  const lo = Math.min(0, ...vals), hi = Math.max(0, ...vals)
  const span = Math.max(0.1, hi - lo)
  const zero = (-lo / span) * 100
  return (
    <div className="cb">
      {rows.map((r) => {
        const w = r.cambio == null ? 0 : (Math.abs(r.cambio) / span) * 100
        return (
          <div key={r.label} className={`cb-row${r.bajo ? ' low' : ''}`} onMouseMove={r.tip ? (ev) => showTip(r.tip, ev.nativeEvent) : undefined} onMouseLeave={hideTip}>
            <div className="cb-label">
              <span className="flex items-center gap-1.5">{r.icon && <r.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />}{r.label}</span>
              <small>{r.detail}{r.bajo ? ', pocos siniestros' : ''}</small>
            </div>
            <div className="cb-track" aria-hidden="true" style={{ '--zero': `${zero}%` } as React.CSSProperties}>
              <i style={{ background: r.color, ...((r.cambio ?? 0) < 0 ? { right: `${100 - zero}%` } : { left: `${zero}%` }), width: `${w}%` }} />
            </div>
            <div className="cb-val">{fmt.pct(r.cambio)}</div>
          </div>
        )
      })}
    </div>
  )
}
