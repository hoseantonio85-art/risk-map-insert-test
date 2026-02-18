import { cn } from '@/lib/utils';

interface ProcessCardProps {
  processName: string;
  riskCount: number;
  maxRiskLevel: 'Высокий' | 'Средний' | 'Низкий' | 'Критичный';
  statusBreakdown: Record<string, number>;
  directLosses: number;
  creditLosses: number;
  indirectLosses: number;
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

function LossChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 min-w-[120px] bg-muted/60 rounded-lg px-3 py-2 h-[52px] flex flex-col justify-center">
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      <span className="text-sm font-semibold text-foreground leading-tight">
        {formatCurrency(value)}
      </span>
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

      {/* Row 3: Loss chips */}
      <div className="flex items-center gap-2 pt-1.5 border-t border-border/50">
        <LossChip label="Прямые" value={directLosses} />
        <LossChip label="Кредитные" value={creditLosses} />
        <LossChip label="Косвенные" value={indirectLosses} />
      </div>
    </button>
  );
}
