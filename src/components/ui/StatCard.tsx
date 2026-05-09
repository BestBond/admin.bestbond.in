interface StatCardProps {
  icon: string
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative"
  color?: "orange" | "blue" | "green" | "purple"
}

const StatCard = ({
  icon,
  label,
  value,
  change,
  changeType = "positive",
  color = "orange",
}: StatCardProps) => {
  const colorClasses = {
    orange: "bg-brand-orange/10 text-brand-orange",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
  }

  return (
    <div className="bg-bg-white p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              changeType === "positive"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {changeType === "positive" ? "↑" : "↓"} {change}
          </span>
        )}
      </div>
      <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  )
}

export default StatCard
