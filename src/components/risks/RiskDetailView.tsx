import { useState } from 'react';
import { History, Plus, FileText, Sparkles, TrendingUp, TrendingDown, ArrowRight, Pencil, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FullscreenLightbox } from '@/components/ui/fullscreen-lightbox';
import { UtilizationDrawer } from './UtilizationDrawer';
import { HistoryDrawer } from './HistoryDrawer';
import { UtilizationCard } from './UtilizationCard';
import { Risk } from '@/types/risk';
import { cn } from '@/lib/utils';
import { mockMeasures } from '@/data/mockRisks';

interface RiskDetailViewProps {
  risk: Risk | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (risk: Risk) => void;
  onOpenWizard?: (risk: Risk) => void;
}

function RiskLevelBadge({ level }: { level: Risk['riskLevel'] }) {
  const map: Record<Risk['riskLevel'], string> = {
    'Высокий': 'bg-destructive/8 text-destructive/80 border-destructive/20',
    'Средний': 'bg-[hsl(var(--chart-yellow))]/8 text-[hsl(var(--chart-yellow))]/80 border-[hsl(var(--chart-yellow))]/20',
    'Низкий': 'bg-primary/8 text-primary/80 border-primary/20',
  };
  return (
    <span className={cn("text-xs px-2.5 py-0.5 rounded-md font-medium border", map[level])}>
      {level}
    </span>
  );
}

function StatusTag({ status }: { status: Risk['status'] }) {
  const colorMap: Record<Risk['status'], string> = {
    'Черновик': 'text-muted-foreground border-muted-foreground/40',
    'В работе': 'text-foreground border-border',
    'На согласовании': 'text-orange-500 border-orange-300',
    'Утверждён': 'text-primary border-primary/40',
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border bg-transparent", colorMap[status])}>
      {status}
    </span>
  );
}

const sections = [
  { id: 'utilization', label: 'Утилизация' },
  { id: 'potential', label: 'Потенциальные потери' },
  { id: 'scenarios', label: 'Сценарии' },
  { id: 'connections', label: 'Связи' },
];

type SidebarTab = 'info' | 'approvers';

import type { Scenario } from '@/types/risk';

function ScenarioDetailCard({ scenario, risk, fmtVal }: { scenario: Scenario; risk: Risk; fmtVal: (v: number) => string }) {
  const [expanded, setExpanded] = useState(false);

  // Mock fact/forecast per scenario based on percentage
  const factClean = Math.round((risk.cleanOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factCredit = Math.round((risk.creditOpRisk.value || 0) * scenario.percentage / 100 * 10) / 10;
  const factIndirect = Math.round((risk.indirectLosses.value || 0) * scenario.percentage / 100 * 10) / 10;
  const totalFact = factClean + factCredit + factIndirect;

  const forecastClean = Math.round(factClean * 1.2 * 10) / 10;
  const forecastCredit = Math.round(factCredit * 1.15 * 10) / 10;
  const forecastIndirect = Math.round(factIndirect * 1.1 * 10) / 10;
  const totalForecast = forecastClean + forecastCredit + forecastIndirect;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 space-y-2">
        <p className="text-sm text-foreground">{scenario.description}</p>

        {/* Tags */}
        {(scenario.causeType || scenario.itService) && (
          <div className="flex items-center gap-2 flex-wrap">
            {scenario.causeType && (
              <span className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/50 text-muted-foreground">
                {scenario.causeType}
              </span>
            )}
            {scenario.itService && (
              <span className="text-[11px] px-2 py-0.5 rounded-md border border-border bg-muted/50 text-muted-foreground">
                {scenario.itService}
              </span>
            )}
          </div>
        )}

        {/* Summary line */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">Факт: <span className="font-semibold text-foreground">{fmtVal(totalFact)} ₽</span></span>
          <span className="text-muted-foreground">Прогноз: <span className="font-semibold text-foreground">{fmtVal(totalForecast)} ₽</span></span>
        </div>

        {/* Expand toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline pt-1"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Подробнее
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-border">
          <div className="pt-3 grid grid-cols-2 gap-4">
            {/* Fact breakdown */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Потери (Факт)</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Чистые</span><span className="font-medium">{fmtVal(factClean)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Кредитные</span><span className="font-medium">{fmtVal(factCredit)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Косвенные</span><span className="font-medium">{fmtVal(factIndirect)} ₽</span></div>
              </div>
            </div>
            {/* Forecast breakdown */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Прогноз</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Чистые</span><span className="font-medium">{fmtVal(forecastClean)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Кредитные</span><span className="font-medium">{fmtVal(forecastCredit)} ₽</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Косвенные</span><span className="font-medium">{fmtVal(forecastIndirect)} ₽</span></div>
              </div>
            </div>
          </div>
          {/* Source */}
          <div className="text-xs text-muted-foreground pt-1">
            Источник: <span className="text-foreground">Ручное создание</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskDetailView({ risk, isOpen, onClose, onEdit, onOpenWizard }: RiskDetailViewProps) {
  const [utilizationOpen, setUtilizationOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('info');

  /** Compact format for monitoring: 1.2 млрд / 5.1 млн / 250 тыс / 42 */
  const fmtVal = (val: number) => {
    if (val >= 1_000_000_000) {
      const v = val / 1_000_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} млрд`;
    }
    if (val >= 1_000_000) {
      const v = val / 1_000_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} млн`;
    }
    if (val >= 1_000) {
      const v = val / 1_000;
      return `${Number.isInteger(v) ? v : v.toFixed(1)} тыс`;
    }
    return val.toLocaleString('ru-RU');
  };

  if (!risk) return null;

  // AI message based on risk level
  const aiMessage = risk.riskLevel === 'Высокий'
    ? 'Уровень риска высокий. Рекомендуется проработать мероприятия по снижению или пересмотреть стратегию реагирования.'
    : 'Показатели риска в пределах нормы. Продолжайте мониторинг в рамках текущей стратегии.';

  const headerContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold truncate">
          {risk.id}: {risk.riskName}
        </h1>
        <RiskLevelBadge level={risk.riskLevel} />
      </div>
      <p className="text-sm text-muted-foreground truncate">
        {risk.process} • {risk.riskProfile}
      </p>
    </div>
  );

  const headerActions = (
    <Button variant="outline" size="sm" className="gap-2" onClick={() => onOpenWizard?.(risk)}>
      <Pencil className="w-3.5 h-3.5" />
      Редактировать
    </Button>
  );

  return (
    <>
      <FullscreenLightbox
        isOpen={isOpen}
        onClose={onClose}
        title=""
        headerContent={headerContent}
        actions={headerActions}
        wide
      >
        <div className="grid grid-cols-[1fr,320px] gap-8 px-2">
          {/* Main content */}
          <div className="space-y-6">
            {/* AI Alert */}
            <div className="p-4 rounded-xl border" style={{
              backgroundColor: 'hsl(var(--ai-alert))',
              borderColor: 'hsl(var(--ai-alert-border))',
            }}>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--ai-alert-foreground))' }} />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--ai-alert-foreground))' }}>
                    Рекомендация AI-ассистента
                  </p>
                  <p className="text-sm text-muted-foreground">{aiMessage}</p>
                  {risk.riskLevel === 'Высокий' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 text-sm font-medium bg-gradient-to-r from-[hsl(var(--ai-alert-foreground))/10] to-[hsl(var(--ai-alert-border))/20] hover:from-[hsl(var(--ai-alert-foreground))/20] hover:to-[hsl(var(--ai-alert-border))/30] border border-[hsl(var(--ai-alert-border))]"
                      style={{ color: 'hsl(var(--ai-alert-foreground))' }}
                      onClick={() => onOpenWizard?.(risk)}
                    >
                      Переоценить риск
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Nav chips */}
            <div className="sticky top-0 z-10 bg-card py-2 -mx-1 px-1 flex gap-2">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/40 hover:text-primary transition-colors text-muted-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Utilization */}
            <section id="utilization" className="space-y-3">
              <h2 className="text-base font-semibold">Утилизация лимитов</h2>
              <div className="grid grid-cols-3 gap-5">
                <UtilizationCard title="Чистые" lossLimit={risk.cleanOpRisk} onExpand={() => setUtilizationOpen(true)} />
                <UtilizationCard title="Кредитные" lossLimit={risk.creditOpRisk} onExpand={() => setUtilizationOpen(true)} />
                <UtilizationCard title="Косвенные" lossLimit={risk.indirectLosses} onExpand={() => setUtilizationOpen(true)} />
              </div>
            </section>

            {/* Potential Losses */}
            <section id="potential" className="space-y-3">
              <h2 className="text-base font-semibold">Потенциальные потери</h2>
              <div className="grid grid-cols-3 gap-4">
                {([
                  { label: 'Чистые', value: risk.cleanOpRisk.value, delta: 12 },
                  { label: 'Кредитные', value: risk.creditOpRisk.value, delta: -5 },
                  { label: 'Косвенные', value: risk.indirectLosses.value, delta: 3 },
                ] as const).map((item) => (
                  <div key={item.label} className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold">{fmtVal(item.value)}</p>
                    <div className="flex items-center gap-1.5">
                      {item.delta > 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-primary" />
                      )}
                      <span className={cn("text-xs font-medium", item.delta > 0 ? "text-destructive" : "text-primary")}>
                        {item.delta > 0 ? '+' : ''}{item.delta}%
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">к пред. периоду</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Scenarios */}
            <section id="scenarios" className="space-y-3">
              <h2 className="text-base font-semibold">Сценарии реализации риска</h2>
              {risk.scenarios.length > 0 ? (
                <div className="space-y-3">
                  {risk.scenarios.map((scenario) => (
                    <ScenarioDetailCard key={scenario.id} scenario={scenario} risk={risk} fmtVal={fmtVal} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Сценарии не добавлены</p>
              )}
            </section>

            {/* Connections */}
            <section id="connections" className="space-y-4">
              <h2 className="text-base font-semibold">Связи</h2>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Меры</h3>
                {mockMeasures.map((measure) => (
                  <div key={measure.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{measure.title}</p>
                      <p className="text-xs text-muted-foreground">{measure.id} • {measure.plannedDate}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/40 shrink-0">
                      {measure.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Решения по рискам</h3>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Пересмотр стратегии реагирования</p>
                    <p className="text-xs text-muted-foreground">RSK-001 • 10.02.2026</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">В работе</Badge>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Segmented control */}
            <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                onClick={() => setSidebarTab('info')}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                  sidebarTab === 'info' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Информация
              </button>
              <button
                onClick={() => setSidebarTab('approvers')}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
                  sidebarTab === 'approvers' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Согласующие
              </button>
            </div>

            {sidebarTab === 'info' ? (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h3 className="font-semibold text-sm">Детали</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Статус</span>
                    <StatusTag status={risk.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Источник</span>
                    <span>{risk.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Стратегия</span>
                    <span className="font-medium">{risk.responseStrategy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Подразделение</span>
                    <span className="text-right max-w-[160px] text-xs">{risk.subdivision}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Автор</span>
                    <span className="text-right text-xs">{risk.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создан</span>
                    <span>{risk.createdAt}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <h3 className="font-semibold text-sm">Согласующие</h3>
                <div className="space-y-3 text-sm">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Риск-партнер</span>
                    <p className="font-medium">Петров П.П.</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Согласующий зеркало</span>
                    <p className="font-medium">Сидоров С.С.</p>
                  </div>
                  {risk.mirrors.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Участники зеркалирования</span>
                      {risk.mirrors.map((m) => (
                        <p key={m.id} className="text-xs">{m.subdivision}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={() => setHistoryOpen(true)}>
              <History className="w-4 h-4" />
              История изменений
              <ArrowRight className="w-3.5 h-3.5 ml-auto" />
            </Button>

            <Button variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Добавить меру
            </Button>

            {/* Workflow actions */}
            <div className="sticky top-4 space-y-2 pt-2 border-t border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Действия</p>
              <Button variant="default" className="w-full" size="sm">
                Согласовать
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Вернуть на доработку
              </Button>
              <Button variant="secondary" className="w-full gap-2" size="sm">
                <XCircle className="w-3.5 h-3.5" />
                Закрыть риск
              </Button>
            </div>
          </div>
        </div>
      </FullscreenLightbox>

      <UtilizationDrawer
        isOpen={utilizationOpen}
        onClose={() => setUtilizationOpen(false)}
      />
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}
