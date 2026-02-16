import { useState } from 'react';
import { ChevronDown, ChevronRight, MoreVertical, Send, RotateCcw, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Risk } from '@/types/risk';
import { Checkbox } from '@/components/ui/checkbox';
import { RiskRowAccordion } from './RiskRowAccordion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
    <span className="text-[13px] text-muted-foreground">
      <span className="text-muted-foreground/70">{label}:</span>{' '}
      <span className={cn("font-semibold", value > 0 ? "text-foreground" : "text-muted-foreground/50")}>
        {value.toLocaleString('ru-RU')}
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
        {/* Row 1: ID + Risk Level + Status + Kebab */}
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
          <RiskLevelBadge level={risk.riskLevel} />
          <StatusTag status={risk.status} />
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-accent rounded transition-colors">
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Send className="w-3.5 h-3.5 mr-2" />Отправить на утверждение</DropdownMenuItem>
              <DropdownMenuItem><RotateCcw className="w-3.5 h-3.5 mr-2" />Вернуть на доработку</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem><ExternalLink className="w-3.5 h-3.5 mr-2" />Открыть в новой вкладке</DropdownMenuItem>
              <DropdownMenuItem><Copy className="w-3.5 h-3.5 mr-2" />Дублировать риск</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />Удалить</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2: Chevron + Risk name */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 hover:bg-accent rounded transition-colors shrink-0"
          >
            {isOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            }
          </button>
          <button
            onClick={() => onRiskClick(risk)}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors text-left truncate"
            title={risk.riskName}
          >
            {risk.riskName}
          </button>
        </div>

        {/* Row 3: Context */}
        <div className="text-xs text-muted-foreground truncate pl-6">
          ↳ {risk.process} · {risk.subdivision} · {risk.block}
        </div>

        {/* Row 4: Losses */}
        <div className="flex items-center gap-5 pt-1.5 border-t border-border/50">
          <LossItem label="Прямые" value={risk.cleanOpRisk.value} />
          <LossItem label="Кредитные" value={risk.creditOpRisk.value} />
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
