type ExportProgressOverlayProps = {
  visible: boolean;
  progressPct: number;
  phase?: string;
  processedCoupons: number;
  totalCoupons: number;
  title: string;
  subtitle?: string;
};

function phaseMessage(phase: string | undefined, title: string): string {
  if (phase === "zipping") return "Packaging ZIP file…";
  if (phase === "ready") return "Downloading ZIP…";
  return title;
}

export default function ExportProgressOverlay({
  visible,
  progressPct,
  phase,
  processedCoupons,
  totalCoupons,
  title,
  subtitle,
}: ExportProgressOverlayProps) {
  if (!visible) return null;

  const pct = Math.min(100, Math.max(0, Math.round(progressPct)));
  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference * (1 - pct / 100);
  const message = phaseMessage(phase, title);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1E2633]/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-label="Export in progress"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl animate-[fadeIn_0.25s_ease-out]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative h-28 w-28">
            <svg
              className="h-28 w-28 -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#F3F4F6"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#F97316"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-orange-600">
                {pct}%
              </span>
            </div>
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-orange-300/40" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-[#1E2633]">{message}</p>
            {subtitle ? (
              <p className="text-sm text-gray-500">{subtitle}</p>
            ) : totalCoupons > 0 ? (
              <p className="text-sm text-gray-500 tabular-nums">
                {processedCoupons.toLocaleString()} / {totalCoupons.toLocaleString()} coupons
              </p>
            ) : null}
          </div>

          <div className="w-full h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            >
              <div className="export-shimmer absolute inset-0" />
            </div>
          </div>

          <p className="text-xs text-center text-gray-400 leading-relaxed">
            Keep this tab open. Large batches can take a while — you can retry if interrupted and export will resume.
          </p>
        </div>
      </div>
    </div>
  );
}
