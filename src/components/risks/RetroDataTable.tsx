import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Risk } from '@/types/risk';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RetroDataTableProps {
  risk: Risk;
  draftLimits?: {
    cleanOpRisk: number;
    creditOpRisk: number;
    indirectLosses: number;
    potentialLosses: number;
  };
  onLimitChange?: (riskId: string, field: 'cleanOpRisk' | 'creditOpRisk' | 'indirectLosses' | 'potentialLosses', value: number) => void;
}

interface LossRow {
  label: string;
  field: 'cleanOpRisk' | 'creditOpRisk' | 'indirectLosses' | 'potentialLosses';
  fact2024?: number;
  fact2025?: number;
  forecast2025?: number;
  currentLimit?: number;
  newLimit: number;
}

export function RetroDataTable({ risk, draftLimits, onLimitChange }: RetroDataTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  const rows: LossRow[] = [
    {
      label: 'Прямые потери',
      field: 'cleanOpRisk',
      fact2024: risk.cleanOpRisk.fact2024,
      fact2025: risk.cleanOpRisk.fact2025,
      forecast2025: risk.cleanOpRisk.forecast2025,
      currentLimit: risk.cleanOpRisk.limit,
      newLimit: draftLimits?.cleanOpRisk ?? (risk.cleanOpRisk.limit || 0),
    },
    {
      label: 'Кредитные потери',
      field: 'creditOpRisk',
      fact2024: risk.creditOpRisk.fact2024,
      fact2025: risk.creditOpRisk.fact2025,
      forecast2025: risk.creditOpRisk.forecast2025,
      currentLimit: risk.creditOpRisk.limit,
      newLimit: draftLimits?.creditOpRisk ?? (risk.creditOpRisk.limit || 0),
    },
    {
      label: 'Косвенные потери',
      field: 'indirectLosses',
      fact2024: risk.indirectLosses.fact2024,
      fact2025: risk.indirectLosses.fact2025,
      forecast2025: risk.indirectLosses.forecast2025,
      currentLimit: risk.indirectLosses.limit,
      newLimit: draftLimits?.indirectLosses ?? (risk.indirectLosses.limit || 0),
    },
    {
      label: 'Потенциальные потери',
      field: 'potentialLosses',
      currentLimit: risk.potentialLosses,
      newLimit: draftLimits?.potentialLosses ?? (risk.potentialLosses || 0),
    },
  ];

  const formatValue = (val?: number) => {
    if (val === undefined || val === null) return '—';
    return val.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Ретроспективные данные и лимиты
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2.5 px-3 font-medium text-muted-foreground w-[200px]">Вид потерь</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Факт 2024</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Факт 2025</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Прогноз 2025</th>
                  <th className="text-center py-2.5 px-3 font-medium text-muted-foreground">Текущий лимит</th>
                  {onLimitChange && (
                    <th className="text-center py-2.5 px-3 font-medium text-foreground">Новый лимит</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.field} className="border-b border-border last:border-0">
                    <td className="py-2.5 px-3 text-foreground font-medium">{row.label}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{formatValue(row.fact2024)}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{formatValue(row.fact2025)}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{formatValue(row.forecast2025)}</td>
                    <td className="py-2.5 px-3 text-center text-muted-foreground">{formatValue(row.currentLimit)}</td>
                    {onLimitChange && (
                      <td className="py-2 px-3">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            value={row.newLimit}
                            onChange={(e) => onLimitChange(risk.id, row.field, parseFloat(e.target.value) || 0)}
                            className="h-8 w-24 text-center text-sm font-semibold"
                            step="0.1"
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
