import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Risk } from '@/types/risk';
import { Checkbox } from '@/components/ui/checkbox';
import { RiskRowAccordion } from './RiskRowAccordion';

type ScreenMode = 'view' | 'edit';

interface RiskRowProps {
  risk: Risk;
  mode: ScreenMode;
  draftLimits?: {
    cleanOpRisk: number;
    creditOpRisk: number;
    indirectLosses: number;
    potentialLosses: number;
  };
  onLimitChange?: (riskId: string, field: 'cleanOpRisk' | 'creditOpRisk' | 'indirectLosses' | 'potentialLosses', value: number) => void;
  onRiskClick: (risk: Risk) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (riskId: string) => void;
}

function StatusTag({ status }: { status: Risk['status'] }) {
  const colorMap: Record<Risk['status'], string> = {
    'Черновик': 'text-muted-foreground border-muted-foreground/40',
    'В работе': 'text-foreground border-border',
    'На согласовании': 'text-orange-500 border-orange-300',
    'Утверждён': 'text-primary border-primary/40',
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium border bg-transparent leading-none", colorMap[status])}>
      {status}
    </span>
  );
}

function RiskLevelBadge({ level }: { level: Risk['riskLevel'] }) {
  const colorMap: Record<Risk['riskLevel'], string> = {
    'Низкий': 'bg-primary/15 text-primary',
    'Средний': 'bg-yellow-100 text-yellow-700',
    'Высокий': 'bg-destructive/15 text-destructive',
  };

  return (
    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-semibold leading-none", colorMap[level])}>
      {level}
    </span>
  );
}

function LossItem({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-xs text-muted-foreground">
      <span className="text-muted-foreground/70">{label}:</span>{' '}
      <span className={cn("font-medium", value > 0 ? "text-foreground" : "text-muted-foreground/50")}>
        {value > 0 ? `${value.toLocaleString('ru-RU')}` : '—'}
      </span>
    </span>
  );
}

export function RiskRow({
  risk,
  mode,
  onRiskClick,
  selectionMode,
  isSelected,
  onToggleSelect,
}: RiskRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn(
      "border border-border rounded-lg bg-card transition-colors",
      isSelected && "ring-2 ring-primary/30 border-primary/30",
    )}>
      <div className="px-4 py-3 space-y-1.5">
        {/* Row 1: ID + Status + Risk Level + Chevron */}
        <div className="flex items-center gap-2">
          {selectionMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect?.(risk.id)}
              className="shrink-0"
            />
          )}
          <button
            onClick={() => onRiskClick(risk)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {risk.id}
          </button>
          <StatusTag status={risk.status} />
          <RiskLevelBadge level={risk.riskLevel} />
          <div className="flex-1" />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            {isOpen
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        </div>

        {/* Row 2: Risk name */}
        <button
          onClick={() => onRiskClick(risk)}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left block w-full truncate"
          title={risk.riskName}
        >
          {risk.riskName}
        </button>

        {/* Row 3: Context */}
        <div className="text-xs text-muted-foreground truncate">
          ↳ {risk.process} · {risk.subdivision} · {risk.block}
        </div>

        {/* Row 4: Losses */}
        <div className="flex items-center gap-4 pt-1 border-t border-border/50">
          <LossItem label="Чистый" value={risk.cleanOpRisk.value} />
          <LossItem label="Кредит" value={risk.creditOpRisk.value} />
          <LossItem label="Косвенные" value={risk.indirectLosses.value} />
          <LossItem label="Потенц." value={risk.potentialLosses} />
        </div>
      </div>

      {/* Accordion */}
      {isOpen && (
        <RiskRowAccordion risk={risk} />
      )}
    </div>
  );
}
