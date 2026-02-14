import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function Histogram({ data }) {
  if (!data) {
    return <div className="h-72 rounded-2xl skeleton-pearl" />
  }

  return (
    <div className="rounded-2xl bg-card border border-border-subtle p-5 shadow-[--shadow-card] animate-fade-in-up stagger-2">
      <h3 className="font-semibold text-text-primary tracking-tight mb-5">
        Size Distribution
      </h3>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barCategoryGap="20%">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8E4DF"
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 11, fill: '#8a8a9a', fontFamily: 'Inter' }}
            axisLine={{ stroke: '#E8E4DF' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#8a8a9a', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FEFDFB',
              border: '1px solid #E8E4DF',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Inter',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
            cursor={{ fill: 'rgba(201, 184, 168, 0.1)' }}
          />
          <Bar
            dataKey="count"
            fill="url(#barGradient)"
            radius={[6, 6, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-3 text-xs text-text-muted">
        {data.reduce((s, d) => s + d.count, 0)} cells across{' '}
        {data.filter((d) => d.count > 0).length} size ranges
      </p>
    </div>
  )
}
