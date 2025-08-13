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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload as PricePoint
      return (
        <div className="rounded-md border bg-background p-3 shadow-sm text-sm">
          <div className="font-medium">{label}</div>
          <div className="text-primary font-semibold">{currency(p.value)}</div>
          {typeof p.pctChange === 'number' && p.prevValue !== undefined && (
            <div className="mt-1 text-muted-foreground">
              {p.pctChange >= 0 ? 'Variação: +' : 'Variação: '}
              {percent(p.pctChange)} desde o mês anterior
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
        <LineChart data={data}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-20} interval={0} dy={10} fontSize={12} />
          <YAxis tickFormatter={(v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke="none" fill={`url(#${gradientId})`} />
          <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
