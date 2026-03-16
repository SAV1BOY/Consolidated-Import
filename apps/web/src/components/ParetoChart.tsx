'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatBRL } from '@/lib/format';
import type { ABCItem } from '@/types/api';

const ABC_COLORS: Record<string, string> = {
  A: '#06D6A0',
  B: '#FFD166',
  C: '#EF476F',
};

export default function ParetoChart({ data }: { data: ABCItem[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-8">Sem dados para classificação ABC.</p>;
  }

  return (
    <div>
      <div className="flex gap-4 mb-4 text-sm">
        {(['A', 'B', 'C'] as const).map(cls => {
          const count = data.filter(d => d.abcClass === cls).length;
          return (
            <span key={cls} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: ABC_COLORS[cls] }} />
              Classe {cls}: {count} itens
            </span>
          );
        })}
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="code"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="value"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={v => formatBRL(v)}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickFormatter={v => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value: number, name: string) =>
              name === 'cumulativePercentage'
                ? [`${value.toFixed(1)}%`, 'Acumulado']
                : [formatBRL(value), 'Valor Nacionalizado']
            }
            labelFormatter={label => `Código: ${label}`}
          />
          <Bar yAxisId="value" dataKey="nationalizedValue" radius={[4, 4, 0, 0]}>
            {data.map((item, i) => (
              <Cell key={i} fill={ABC_COLORS[item.abcClass] || '#6b7280'} />
            ))}
          </Bar>
          <Line
            yAxisId="pct"
            dataKey="cumulativePercentage"
            stroke="#ffffff"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="py-2 px-2">Código</th>
              <th className="py-2 px-2">Descrição</th>
              <th className="py-2 px-2">Fornecedor</th>
              <th className="py-2 px-2 text-right">Valor</th>
              <th className="py-2 px-2 text-right">%</th>
              <th className="py-2 px-2 text-right">Acum.</th>
              <th className="py-2 px-2">Classe</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.itemId} className="border-b border-gray-800/50">
                <td className="py-2 px-2 font-mono">{item.code}</td>
                <td className="py-2 px-2 max-w-[200px] truncate">{item.description}</td>
                <td className="py-2 px-2 text-gray-400">{item.supplier}</td>
                <td className="py-2 px-2 text-right">{formatBRL(item.nationalizedValue)}</td>
                <td className="py-2 px-2 text-right">{item.percentage.toFixed(1)}%</td>
                <td className="py-2 px-2 text-right">{item.cumulativePercentage.toFixed(1)}%</td>
                <td className="py-2 px-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: `${ABC_COLORS[item.abcClass]}20`, color: ABC_COLORS[item.abcClass] }}
                  >
                    {item.abcClass}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
