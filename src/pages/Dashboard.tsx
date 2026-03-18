import { useState, useMemo } from 'react';
import { Bot, TrendingUp, TrendingDown, AlertTriangle, ShieldAlert, Activity, Bell, ArrowRight, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockRisks } from '@/data/mockRisks';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ZoneDonutWidget } from '@/components/risks/ZoneDonutWidget';

// Heat map data types
interface HeatMapCell {
  probability: string;
  impact: string;
  probIdx: number;
  impIdx: number;
  risks: typeof mockRisks;
  totalLoss: number;
}

const probLabels = ['Несущественная', 'Низкая', 'Средняя', 'Высокая', 'Очень высокая'];
const impLabels = ['Низкий', 'Средний', 'Высокий', 'Очень высокий'];

// Map risk level to impact index
function riskToImpact(level: string): number {
  switch (level) {
    case 'Низкий': return 0;
    case 'Средний': return 1;
    case 'Высокий': return 2;
    default: return 3;
  }
}

// Assign probability based on utilization
function riskToProbability(risk: typeof mockRisks[0]): number {
  const util = risk.cleanOpRisk.utilization;
  if (util > 100) return 4;
  if (util > 80) return 3;
  if (util > 50) return 2;
  if (util > 25) return 1;
  return 0;
}

// Cell severity color
function getCellColor(probIdx: number, impIdx: number): string {
  const score = probIdx + impIdx;
  if (score >= 6) return 'bg-destructive/80 text-destructive-foreground';
  if (score >= 4) return 'bg-util-high/70 text-destructive-foreground';
  if (score >= 3) return 'bg-chart-yellow/60 text-foreground';
  if (score >= 2) return 'bg-chart-yellow/30 text-foreground';
  return 'bg-primary/20 text-foreground';
}

function getCellBorderColor(probIdx: number, impIdx: number): string {
  const score = probIdx + impIdx;
  if (score >= 6) return 'border-destructive/40';
  if (score >= 4) return 'border-util-high/30';
  if (score >= 3) return 'border-chart-yellow/40';
  return 'border-primary/20';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);

  // Build heat map grid
  const heatMap = useMemo(() => {
    const grid: HeatMapCell[][] = probLabels.map((p, pi) =>
      impLabels.map((imp, ii) => ({
        probability: p,
        impact: imp,
        probIdx: pi,
        impIdx: ii,
        risks: [],
        totalLoss: 0,
      }))
    );

    mockRisks.forEach((risk) => {
      const pi = riskToProbability(risk);
      const ii = riskToImpact(risk.riskLevel);
      grid[pi][ii].risks.push(risk);
      grid[pi][ii].totalLoss += risk.cleanOpRisk.value;
    });

    return grid;
  }, []);

  // KPI calculations
  const totalFactLosses = mockRisks.reduce((s, r) => s + r.cleanOpRisk.value, 0);
  const totalForecast = mockRisks.reduce((s, r) => s + (r.cleanOpRisk.forecast2025 || r.cleanOpRisk.value), 0);
  const avgUtilization = Math.round(
    mockRisks.reduce((s, r) => s + r.cleanOpRisk.utilization, 0) / mockRisks.length
  );
  const criticalRisks = mockRisks.filter(r => r.riskLevel === 'Высокий').length;

  // Limit utilization data
  const directUtil = Math.round(mockRisks.reduce((s, r) => s + r.cleanOpRisk.utilization, 0) / mockRisks.length);
  const indirectUtil = Math.round(mockRisks.filter(r => r.indirectLosses.limit).reduce((s, r) => s + r.indirectLosses.utilization, 0) / Math.max(1, mockRisks.filter(r => r.indirectLosses.limit).length));
  const creditUtil = Math.round(mockRisks.filter(r => r.creditOpRisk.limit).reduce((s, r) => s + r.creditOpRisk.utilization, 0) / Math.max(1, mockRisks.filter(r => r.creditOpRisk.limit).length));


  const handleCellClick = (cell: HeatMapCell) => {
    if (cell.risks.length === 0) return;
    setSelectedCell(cell);
    setDrawerOpen(true);
  };

  const handleNavigateToRegistry = () => {
    setDrawerOpen(false);
    navigate('/risks');
  };

  // Loss sources
  const lossSources = [
    { label: 'Процессы и контроль', value: 11.9 },
    { label: 'Персонал и культура', value: 10.4 },
    { label: 'Законы и регуляторы', value: 7.6 },
    { label: 'Клиенты и продукты', value: 5.7 },
  ];
  const maxLoss = Math.max(...lossSources.map(s => s.value));

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* AI Summary */}
        <Card className="border-[hsl(var(--ai-alert-border))] bg-[hsl(var(--ai-alert))]">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[hsl(var(--ai-alert-border))] flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-5 h-5 text-[hsl(var(--ai-alert-foreground))]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[hsl(var(--ai-alert-foreground))]">
                Привет! Я риск-ассистент Норм.
              </p>
              <p className="text-sm text-[hsl(var(--ai-alert-foreground))]/80">
                3 риска ухудшились за период. 2 лимита близки к исчерпанию.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Факт потерь" value={`${totalFactLosses.toFixed(1)} млн ₽`} />
          <KpiCard title="Прогноз потерь" value={`${totalForecast.toFixed(1)} млн ₽`} />
          <KpiCard title="Утилизация лимита" value={`${avgUtilization}%`} highlight={avgUtilization > 80} />
          <KpiCard title="Критические риски" value={String(criticalRisks)} highlight={criticalRisks > 3} />
        </div>

        {/* Main analytical block — single row, equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-stretch">
          {/* Heat Map */}
          <Card className="flex flex-col">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-base">Матрица рисков</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4 pt-1 flex-1 flex flex-col justify-center">
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between pr-1.5 py-0.5" style={{ width: 80 }}>
                  {[...probLabels].reverse().map((label) => (
                    <div key={label} className="flex-1 flex items-center">
                      <span className="text-[10px] text-muted-foreground leading-tight text-right w-full">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-4 gap-1">
                    {[...heatMap].reverse().map((row, ri) =>
                      row.map((cell) => (
                        <Tooltip key={`${cell.probIdx}-${cell.impIdx}`}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCellClick(cell)}
                              className={cn(
                                'aspect-[4/3] rounded-md flex items-center justify-center text-xs font-extrabold transition-all border',
                                getCellColor(cell.probIdx, cell.impIdx),
                                getCellBorderColor(cell.probIdx, cell.impIdx),
                                cell.risks.length > 0
                                  ? 'hover:scale-105 hover:shadow-md cursor-pointer'
                                  : 'opacity-60 cursor-default'
                              )}
                            >
                              {cell.risks.length > 0 ? cell.risks.length : ''}
                            </button>
                          </TooltipTrigger>
                          {cell.risks.length > 0 && (
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-semibold text-xs mb-1">
                                Количество рисков: {cell.risks.length}
                              </p>
                              <p className="text-xs text-muted-foreground mb-2">
                                Суммарные потери: {cell.totalLoss.toFixed(1)} млн ₽
                              </p>
                              <p className="text-xs font-medium mb-1">Топ-3:</p>
                              {cell.risks
                                .sort((a, b) => b.cleanOpRisk.value - a.cleanOpRisk.value)
                                .slice(0, 3)
                                .map((r) => (
                                  <p key={r.id} className="text-xs text-muted-foreground truncate">
                                    • {r.riskName} ({r.cleanOpRisk.value} млн)
                                  </p>
                                ))}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))
                    )}
                  </div>

                  {/* X-axis labels */}
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {impLabels.map((label) => (
                      <div key={label} className="text-center">
                        <span className="text-[10px] text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Axis titles */}
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span className="italic">← Вероятность</span>
                <span className="italic">Ущерб →</span>
              </div>
            </CardContent>
          </Card>

          {/* Right column — stretches to match heat map */}
          <div className="flex flex-col gap-4">
            {/* Limit utilization */}
            <Card>
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-base">Утилизация лимитов</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 space-y-3">
                <LimitRow label="Прямые потери" value={directUtil} />
                <LimitRow label="Косвенные потери" value={indirectUtil} />
                <LimitRow label="Кредитные риски" value={creditUtil} />
              </CardContent>
            </Card>

            {/* Distribution by zones - donut — fills remaining space */}
            <div className="flex-1 flex flex-col min-h-0">
              <ZoneDonutWidget />
            </div>
          </div>
        </div>

        {/* Secondary analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loss sources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Топ источников потерь</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lossSources.map((src) => (
                <div key={src.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{src.label}</span>
                    <span className="font-medium">{src.value} млн ₽</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(src.value / maxLoss) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Risk dynamics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Динамика рисков</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DynamicRow icon={<TrendingUp className="w-4 h-4 text-destructive" />} label="Ухудшилось" count={3} color="text-destructive" />
              <DynamicRow icon={<TrendingDown className="w-4 h-4 text-primary" />} label="Улучшилось" count={1} color="text-primary" />
              <DynamicRow icon={<Plus className="w-4 h-4 text-chart-yellow" />} label="Новые риски" count={2} color="text-chart-yellow" />
            </CardContent>
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attention zones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Зоны внимания
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <AttentionItem text="Лимит превышен" badge="1 риск" variant="destructive" />
              <AttentionItem text="Очень высокий риск без мер" badge="2 риска" variant="warning" />
              <AttentionItem text="Разрыв в защите" badge="1 процесс" variant="outline" />
            </CardContent>
          </Card>

          {/* System events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                Важные события
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <EventRow label="Новые инциденты" count={4} />
              <EventRow label="Инциденты >500k" count={2} />
              <EventRow label="На согласовании" count={3} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Heat map drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">Риски</SheetTitle>
            {selectedCell && (
              <p className="text-sm text-muted-foreground">
                {selectedCell.probability} вероятность × {selectedCell.impact} ущерб
              </p>
            )}
          </SheetHeader>

          <div className="mt-6 space-y-3">
            {selectedCell?.risks.map((risk) => (
              <Card key={risk.id} className="border-border">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold">{risk.riskName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Потери: </span>
                      <span className="font-medium">{risk.cleanOpRisk.value} млн ₽</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Вероятность: </span>
                      <span className="font-medium">{probLabels[riskToProbability(risk)].toLowerCase()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ущерб: </span>
                      <span className="font-medium">{risk.riskLevel.toLowerCase()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Утилизация: </span>
                      <span className={cn(
                        "font-medium",
                        risk.cleanOpRisk.utilization > 100 ? 'text-util-over' :
                        risk.cleanOpRisk.utilization > 80 ? 'text-util-high' :
                        risk.cleanOpRisk.utilization > 50 ? 'text-util-medium' : 'text-util-low'
                      )}>
                        {risk.cleanOpRisk.utilization}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button onClick={handleNavigateToRegistry} className="w-full gap-2">
              Перейти к списку рисков
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </MainLayout>
  );
}

// Sub-components

function KpiCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
        <p className={cn("text-xl font-bold", highlight ? 'text-destructive' : 'text-foreground')}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function LimitRow({ label, value }: { label: string; value: number }) {
  const color = value > 100 ? 'text-util-over' : value > 80 ? 'text-util-high' : value > 50 ? 'text-util-medium' : 'text-util-low';
  const barColor = value > 100 ? 'bg-util-over' : value > 80 ? 'bg-util-high' : value > 50 ? 'bg-util-medium' : 'bg-util-low';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-bold", color)}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}



function DynamicRow({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm text-muted-foreground flex-1">{label}</span>
      <span className={cn("text-lg font-bold", color)}>{count}</span>
    </div>
  );
}

function AttentionItem({ text, badge, variant }: { text: string; badge: string; variant: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <span className="text-sm">{text}</span>
      <Badge variant={variant === 'destructive' ? 'destructive' : variant === 'warning' ? 'secondary' : 'outline'} className="text-xs">
        {badge}
      </Badge>
    </div>
  );
}

function EventRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  );
}
