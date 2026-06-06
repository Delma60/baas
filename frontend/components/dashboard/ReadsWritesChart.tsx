"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDataPoint {
  date: string;
  reads: number;
  writes: number;
}

interface ReadsWritesChartProps {
  data: ChartDataPoint[];
}

export function ReadsWritesChart({ data }: ReadsWritesChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorWrites" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
        
        <XAxis 
          dataKey="date" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }} 
          dy={10}
        />
        
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
          tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value)}
        />
        
        <Tooltip
          contentStyle={{ 
            backgroundColor: 'var(--surface)', 
            borderColor: 'var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            color: 'var(--text-primary)'
          }}
          itemStyle={{ color: 'var(--text-primary)', fontWeight: 500 }}
        />
        
        <Area
          type="monotone"
          dataKey="reads"
          name="Reads"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorReads)"
          activeDot={{ r: 6, fill: "#3b82f6", stroke: "var(--surface)", strokeWidth: 2 }}
        />
        
        <Area
          type="monotone"
          dataKey="writes"
          name="Writes"
          stroke="#f59e0b"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorWrites)"
          activeDot={{ r: 6, fill: "#f59e0b", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}