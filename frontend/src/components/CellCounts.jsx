import { Droplet, Shield, Activity } from 'lucide-react'

const CELLS = [
  {
    key: 'RBC',
    label: 'Red Blood Cells',
    icon: Droplet,
    gradient: 'from-red-50 to-red-100/50',
    iconBg: 'bg-red-100',
    accent: 'text-red-600',
  },
  {
    key: 'WBC',
    label: 'White Blood Cells',
    icon: Shield,
    gradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-100',
    accent: 'text-blue-600',
  },
  {
    key: 'Platelets',
    label: 'Platelets',
    icon: Activity,
    gradient: 'from-yellow-50 to-yellow-100/50',
    iconBg: 'bg-yellow-100',
    accent: 'text-yellow-600',
  },
]

export default function CellCounts({ counts, avgSize }) {
  if (!counts) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl skeleton-pearl" />
        ))}
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up">
      <h3 className="font-semibold text-text-primary tracking-tight mb-4">
        Cell Counts
      </h3>

      <div className="grid grid-cols-3 gap-4">
        {CELLS.map(({ key, label, icon: Icon, gradient, iconBg, accent }, i) => (
          <div
            key={key}
            className={`
              rounded-2xl bg-gradient-to-br ${gradient}
              border border-border-subtle
              p-4 shadow-[--shadow-card]
              hover:shadow-[--shadow-card-hover] hover:-translate-y-0.5
              transition-all duration-200
              animate-fade-in-up stagger-${i + 1}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${accent}`} />
              </div>
              <span className={`text-2xl font-bold ${accent} tabular-nums`}>
                {counts[key]}
              </span>
            </div>
            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">
              {label}
            </p>
          </div>
        ))}
      </div>

      {avgSize != null && (
        <div className="mt-4 rounded-2xl bg-card border border-border-subtle p-4 flex items-center justify-between shadow-[--shadow-card] animate-fade-in-up stagger-4">
          <span className="text-sm text-text-secondary font-medium">
            Average Cell Size
          </span>
          <span className="text-lg font-bold text-accent-blue tabular-nums">
            {avgSize.toFixed(2)} px
          </span>
        </div>
      )}
    </div>
  )
}
