import { cn } from '@/lib/utils';

interface ProcessCardProps {
  processName: string;
  riskCount: number;
  maxRiskLevel: 'Высокий' | 'Средний' | 'Низкий' | 'Критичный';
  statusBreakdown: Record<string, number>;
  directLosses: number;
  creditLosses: number;
  indirectLosses: number;
  potentialLosses: number;
  directUtilization: number;
  creditUtilization: number;
  indirectUtilization: number;
  onClick: () => void;
}

function ProcessLevelBadge({ level }: { level: string }) {
  const colorMap: Record<string, string> = {
    'Низкий': 'bg-primary/15 text-primary',
    'Средний': 'bg-yellow-100 text-yellow-700',
    'Высокий': 'bg-destructive/15 text-destructive',
    'Критичный': 'bg-destructive/25 text-destructive font-bold',
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold leading-none", colorMap[level] || colorMap['Низкий'])}>
      {level}
    </span>
  );
}

function formatCurrency(value: number): string {
  if (value === 0) return '0';
  return value.toLocaleString('ru-RU');
}

function getBarColor(utilization: number): string {
  if (utilization > 80) return 'bg-destructive';
  if (utilization >= 50) return 'bg-yellow-500';
  return 'bg-primary';
}

function LossChipWithBar({ label, value, utilization }: { label: string; value: number; utilization: number }) {
  const cappedUtil = Math.min(utilization, 100);

  return (
    <div className="flex-1 min-w-0 bg-muted/60 rounded-lg px-2 py-1.5 flex flex-col justify-between overflow-hidden">
      <span className="text-[10px] text-muted-foreground leading-tight truncate">{label}</span>
      <span className="text-sm font-bold text-foreground leading-tight">
        {formatCurrency(value)}
      </span>
      <div className="w-full h-[3px] bg-border/60 rounded-sm mt-1">
        <div
          className={cn("h-full rounded-sm", getBarColor(utilization))}
          style={{ width: `${cappedUtil}%` }}
        />
      </div>
    </div>
  );
}

export function ProcessCard({
  processName,
  riskCount,
  maxRiskLevel,
  statusBreakdown,
  directLosses,
  creditLosses,
  indirectLosses,
  potentialLosses,
  directUtilization,
  creditUtilization,
  indirectUtilization,
  onClick,
}: ProcessCardProps) {
  const statusParts = Object.entries(statusBreakdown)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${status}: ${count}`);

  return (
    <button
      onClick={onClick}
      className="w-full text-left border border-border rounded-lg bg-card hover:bg-muted/30 transition-colors px-4 py-3 space-y-1.5"
    >
      {/* Row 1: Process name + level */}
      <div className="flex items-start gap-2">
        <span className="text-sm font-medium text-foreground line-clamp-2 flex-1">
          {processName}
        </span>
        <ProcessLevelBadge level={maxRiskLevel} />
      </div>

      {/* Row 2: Risk count + status breakdown */}
      <div className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Рисков: {riskCount}</span>
        {statusParts.length > 0 && (
          <span className="ml-2">· {statusParts.join(' · ')}</span>
        )}
      </div>

      {/* Row 3: Loss chips with progress bars */}
      <div className="flex items-stretch gap-1.5 pt-1.5 border-t border-border/50">
        <LossChipWithBar label="Чистые" value={directLosses} utilization={directUtilization} />
        <LossChipWithBar label="Кредитные" value={creditLosses} utilization={creditUtilization} />
        <LossChipWithBar label="Косвенные" value={indirectLosses} utilization={indirectUtilization} />
      </div>

      {/* Row 4: Potential losses */}
      {potentialLosses > 0 && (
        <div className="text-xs text-muted-foreground pt-1">
          Потенциальные потери: <span className="font-medium text-foreground">{formatCurrency(potentialLosses)} ₽</span>
        </div>
      )}
    </button>
  );
}
