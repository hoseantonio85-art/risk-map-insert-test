import { Risk } from '@/types/risk';

interface RiskRowAccordionProps {
  risk: Risk;
}

function formatVal(val?: number) {
  if (val === undefined || val === null) return '—';
  return val.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function RiskRowAccordion({ risk }: RiskRowAccordionProps) {
  const rows = [
    {
      label: 'Прямые потери',
      fact2024: risk.cleanOpRisk.fact2024,
      fact2025: risk.cleanOpRisk.fact2025,
      forecast2025: risk.cleanOpRisk.forecast2025,
    },
    {
      label: 'Кредитные потери',
      fact2024: risk.creditOpRisk.fact2024,
      fact2025: risk.creditOpRisk.fact2025,
      forecast2025: risk.creditOpRisk.forecast2025,
    },
    {
      label: 'Косвенные потери',
      fact2024: risk.indirectLosses.fact2024,
      fact2025: risk.indirectLosses.fact2025,
      forecast2025: risk.indirectLosses.forecast2025,
    },
  ];

  return (
    <div className="border-t border-border px-4 py-3 bg-muted/30">
      <div className="space-y-3">
        {/* Process info */}
        <div className="text-sm">
          <span className="text-muted-foreground">Процесс: </span>
          <span className="font-medium">{risk.process}</span>
        </div>

        {/* Retro data table */}
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Вид потерь</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Факт 2024</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Факт 2025</th>
                <th className="text-right py-2 px-3 font-medium text-muted-foreground text-xs">Прогноз 2025</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="py-2 px-3 text-xs font-medium">{row.label}</td>
                  <td className="py-2 px-3 text-right text-xs text-muted-foreground">{formatVal(row.fact2024)}</td>
                  <td className="py-2 px-3 text-right text-xs text-muted-foreground">{formatVal(row.fact2025)}</td>
                  <td className="py-2 px-3 text-right text-xs text-muted-foreground">{formatVal(row.forecast2025)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Placeholder for history & comments */}
        <div className="text-xs text-muted-foreground italic">
          История изменений и комментарии будут здесь
        </div>
      </div>
    </div>
  );
}
