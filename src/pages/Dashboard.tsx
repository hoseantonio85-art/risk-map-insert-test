import { useState, useMemo } from 'react';
import { Bot, TrendingUp, TrendingDown, AlertTriangle, Bell, ArrowRight, Plus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockRisks, summaryMetrics } from '@/data/mockRisks';
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
const probLabelsShort = ['Несущ', 'Низ', 'Сред', 'Выс', 'Оч. выс'];
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

const sparklineData = [
  { v: 5.2 }, { v: 6.1 }, { v: 5.8 }, { v: 7.3 }, { v: 8.0 }, { v: 7.6 }, { v: 9.1 }, { v: 10.4 },
];

function ForecastKpiCard({ value, delta, trendingUp }: { value: string; delta: number; trendingUp: boolean }) {
  const color = trendingUp ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">Прогноз потерь</p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className={cn("text-[11px] font-medium mt-0.5", trendingUp ? 'text-destructive' : 'text-primary')}>
              {delta >= 0 ? '+' : ''}{delta}% к факту
            </p>
          </div>
          <div className="w-16 h-8 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={false}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="none"
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    if (index === sparklineData.length - 1) {
                      return <circle cx={cx} cy={cy} r={2.5} fill={color} />;
                    }
                    return <circle r={0} />;
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function UtilKpiCard({ title, value, utilization, limit }: { title: string; value: string; utilization: number; limit: number }) {
  const utilColor = utilization > 100 ? 'text-util-over' : utilization > 80 ? 'text-util-high' : utilization > 50 ? 'text-util-medium' : 'text-util-low';
  const strokeColor = utilization > 100 ? 'hsl(330, 81%, 60%)' : utilization > 80 ? 'hsl(0, 84%, 60%)' : utilization > 50 ? 'hsl(45, 93%, 58%)' : 'hsl(160, 84%, 39%)';
  const pct = Math.min(utilization, 100);
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (pct / 100) * circ;

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{title}</p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              лимит {limit.toFixed(1)} млн
            </p>
          </div>
          <div className="relative w-[52px] h-[52px] shrink-0">
            <svg viewBox="0 0 52 52" className="w-full h-full -rotate-90">
              <circle cx="26" cy="26" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
              <circle cx="26" cy="26" r={r} fill="none" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset} className="transition-all duration-500" />
            </svg>
            <span className={cn("absolute inset-0 flex items-center justify-center text-[11px] font-bold", utilColor)}>
              {utilization}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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
  const forecastDelta = totalForecast > 0 ? Math.round(((totalForecast - totalFactLosses) / totalFactLosses) * 100) : 0;
  const forecastTrending = forecastDelta >= 0; // true = increasing (worse)

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

        {/* KPI Cards — Loss types */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <UtilKpiCard
            title="Прямые потери"
            value={`${summaryMetrics.cleanOpRisk.total.toFixed(1)} млн ₽`}
            utilization={summaryMetrics.cleanOpRisk.utilization}
            limit={summaryMetrics.cleanOpRisk.limit}
          />
          <UtilKpiCard
            title="Косвенные потери"
            value={`${summaryMetrics.indirectLosses.total.toFixed(1)} млн ₽`}
            utilization={summaryMetrics.indirectLosses.utilization}
            limit={summaryMetrics.indirectLosses.limit}
          />
          <UtilKpiCard
            title="Кредитные потери"
            value={`${summaryMetrics.creditOpRisk.total.toFixed(1)} млн ₽`}
            utilization={summaryMetrics.creditOpRisk.utilization}
            limit={summaryMetrics.creditOpRisk.limit}
          />
          {/* Потенциальные потери — sparkline instead of circular */}
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Потенциальные потери</p>
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground">{summaryMetrics.potentialLosses.total.toFixed(1)} млн ₽</p>
                  <p className={cn("mt-0.5 text-[11px] font-medium", forecastTrending ? 'text-destructive' : 'text-primary')}>
                    {forecastDelta >= 0 ? '+' : ''}{forecastDelta}% к факту
                  </p>
                </div>
                <div className="h-8 w-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparklineData}>
                      <Line type="monotone" dataKey="v" stroke={forecastTrending ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} strokeWidth={1.5} dot={false} activeDot={false} />
                      <Line type="monotone" dataKey="v" stroke="none" dot={(props: any) => {
                        const { cx, cy, index } = props;
                        if (index === sparklineData.length - 1) return <circle cx={cx} cy={cy} r={2.5} fill={forecastTrending ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />;
                        return <circle r={0} />;
                      }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main analytical block — fixed 488px height */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4" style={{ height: 488 }}>
          {/* Heat Map */}
          <Card className="flex flex-col overflow-hidden h-full">
            <CardHeader className="pb-0 pt-2 px-3 shrink-0">
              <CardTitle className="text-sm">Матрица рисков</CardTitle>
            </CardHeader>
            <CardContent className="pb-1.5 px-3 pt-0 flex-1 flex flex-col justify-center min-h-0">
              <div className="flex flex-1 min-h-0">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between pr-1" style={{ width: 68 }}>
                  {[...probLabels].reverse().map((label) => (
                    <div key={label} className="flex-1 flex items-center">
                      <span className="text-[9px] text-muted-foreground leading-tight text-right w-full">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex-1 flex flex-col justify-center min-h-0">
                  <div className="grid grid-cols-4 grid-rows-5 gap-px flex-1 min-h-0" style={{ maxHeight: 380 }}>
                    {[...heatMap].reverse().map((row) =>
                      row.map((cell) => (
                        <Tooltip key={`${cell.probIdx}-${cell.impIdx}`}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleCellClick(cell)}
                              className={cn(
                                'rounded flex items-center justify-center text-xs font-extrabold transition-all border w-full h-full',
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
                  <div className="grid grid-cols-4 gap-px mt-0.5 shrink-0">
                    {impLabels.map((label) => (
                      <div key={label} className="text-center">
                        <span className="text-[9px] text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Axis titles */}
              <div className="flex justify-between mt-1 text-[9px] text-muted-foreground shrink-0">
                <span className="italic">← Вероятность</span>
                <span className="italic">Ущерб →</span>
              </div>
            </CardContent>
          </Card>

          {/* Donut widget — fills full 488px */}
          <ZoneDonutWidget />
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
