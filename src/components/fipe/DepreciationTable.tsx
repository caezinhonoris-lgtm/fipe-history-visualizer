import React from 'react'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'

export type DepPoint = {
  name: string
  value: number
  formattedValue: string
  prevValue?: number
  pctChange?: number
}

export const DepreciationTable = ({ data }: { data: DepPoint[] }) => {
  const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const percent = (v: number) => `${(v * 100).toFixed(2)}%`

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mês</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Variação mensal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p, idx) => {
            const diff = p.prevValue !== undefined ? p.value - p.prevValue : undefined
            const isUp = (p.pctChange ?? 0) > 0
            const isDown = (p.pctChange ?? 0) < 0
            return (
              <TableRow key={idx}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="font-medium">{currency(p.value)}</TableCell>
                <TableCell>
                  {diff === undefined ? (
                    <div className="inline-flex items-center gap-2 text-muted-foreground">
                      <Minus className="h-4 w-4" />
                      —
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 ${isDown ? 'text-destructive' : isUp ? 'text-primary' : 'text-muted-foreground'}`}>
                      {isDown ? <TrendingDown className="h-4 w-4" /> : isUp ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      <span>
                        {diff >= 0 ? '+' : ''}
                        {currency(diff)} ({(p.pctChange ?? 0) >= 0 ? '+' : ''}
                        {percent(p.pctChange ?? 0)})
                      </span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
