
import React, { useId } from 'react'
import { ResponsiveContainer, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

export type PricePoint = {
  name: string
  value: number
  formattedValue: string
  prevValue?: number
  pctChange?: number
}

export const PriceHistoryChart = ({ data }: { data: PricePoint[] }) => {
  const gradientId = useId()

  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const percent = (v: number) => `${(v * 100).toFixed(2)}%`

  // Domínio dinâmico para dar mais "respiro" ao gráfico
  const values = data.map((d) => d.value)
  const minV = values.length ? Math.min(...values) : 0
  const maxV = values.length ? Math.max(...values) : 0
  const padding = values.length ? Math.max((maxV - minV) * 0.08, maxV * 0.02, 500) : 0
  const yDomain: [number, number] = [Math.max(0, minV - padding), maxV + padding]

  const trendColor = (pct?: number) => {
    if (typeof pct !== 'number' || Number.isNaN(pct)) return 'hsl(var(--muted-foreground))'
    if (pct > 0) return 'hsl(var(--primary))'
    if (pct < 0) return 'hsl(var(--destructive))'
    return 'hsl(var(--muted-foreground))'
  }

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const p = payload as PricePoint
    const isExtrema = p.value === minV || p.value === maxV
    const fill = trendColor(p.pctChange)
    const r = isExtrema ? 5 : 4
    return (
      <g>
        <circle cx={cx} cy={cy} r={r + 2} fill="hsl(var(--background))" stroke={fill} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r} fill={fill} />
      </g>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as PricePoint
      const color = trendColor(p.pctChange)
      const arrow = typeof p.pctChange === 'number' ? (p.pctChange > 0 ? '▲' : p.pctChange < 0 ? '▼' : '•') : ''
      return (
        <div className="rounded-md border bg-background p-3 shadow-sm text-sm">
          <div className="font-medium">{label}</div>
          <div className="font-semibold" style={{ color }}>{currency(p.value)}</div>
          {typeof p.pctChange === 'number' && p.prevValue !== undefined && (
            <div className="mt-1 text-muted-foreground">
              {arrow} {percent(p.pctChange)} desde o mês anterior
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 24, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-25} interval="preserveStartEnd" tickMargin={12} minTickGap={8} />
          <YAxis 
            domain={yDomain} 
            tickFormatter={(v) => {
              // Formatação mais limpa para o eixo Y
              if (v >= 1000000) {
                return `R$ ${(v / 1000000).toFixed(1)}M`
              } else if (v >= 1000) {
                return `R$ ${(v / 1000).toFixed(0)}k`
              } else {
                return `R$ ${v.toFixed(0)}`
              }
            }} 
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeDasharray: '3 3', opacity: 0.2 }} />
          <Area type="monotone" dataKey="value" stroke="none" fill={`url(#${gradientId})`} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={3.5}
            dot={<CustomDot />}
            activeDot={{ r: 6 }}
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
