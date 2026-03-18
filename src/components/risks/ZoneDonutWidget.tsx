import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockRisks } from '@/data/mockRisks';
import { useNavigate } from 'react-router-dom';

interface ZoneData {
  label: string;
  shortLabel: string;
  count: number;
  totalLoss: number;
  forecastLoss: number;
  color: string;
  cssColor: string;
  risks: typeof mockRisks;
}

function buildZones(): ZoneData[] {
  const zones: Omit<ZoneData, 'count' | 'totalLoss' | 'forecastLoss' | 'risks'>[] = [
    { label: '≥ 100% лимита', shortLabel: '>100%', color: 'hsl(330, 81%, 60%)', cssColor: 'bg-util-over' },
    { label: '≥ 80%', shortLabel: '>80%', color: 'hsl(0, 84%, 60%)', cssColor: 'bg-util-high' },
    { label: '≥ 50%', shortLabel: '>50%', color: 'hsl(45, 93%, 58%)', cssColor: 'bg-util-medium' },
    { label: '< 50%', shortLabel: '<50%', color: 'hsl(160, 84%, 39%)', cssColor: 'bg-util-low' },
  ];

  return zones.map((z) => {
    const filtered = mockRisks.filter((r) => {
      const u = r.cleanOpRisk.utilization;
      if (z.shortLabel === '>100%') return u > 100;
      if (z.shortLabel === '>80%') return u > 80 && u <= 100;
      if (z.shortLabel === '>50%') return u > 50 && u <= 80;
      return u <= 50;
    });
    return {
      ...z,
      count: filtered.length,
      totalLoss: filtered.reduce((s, r) => s + r.cleanOpRisk.value, 0),
      forecastLoss: filtered.reduce((s, r) => s + (r.cleanOpRisk.forecast2025 || r.cleanOpRisk.value), 0),
      risks: filtered,
    };
  });
}

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 3}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

export function ZoneDonutWidget() {
  const navigate = useNavigate();
  const [showForecast, setShowForecast] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ZoneData | null>(null);

  const zones = useMemo(() => buildZones(), []);

  const totalLoss = useMemo(
    () => zones.reduce((s, z) => s + (showForecast ? z.forecastLoss : z.totalLoss), 0),
    [zones, showForecast]
  );

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => (showForecast ? b.forecastLoss - a.forecastLoss : b.totalLoss - a.totalLoss)),
    [zones, showForecast]
  );

  const chartData = sortedZones.map((z) => ({
    name: z.shortLabel,
    value: showForecast ? z.forecastLoss : z.totalLoss,
  }));

  const handleZoneClick = (zone: ZoneData) => {
    if (zone.count === 0) return;
    setSelectedZone(zone);
    setDrawerOpen(true);
  };

  const handlePieClick = (_: any, index: number) => {
    handleZoneClick(sortedZones[index]);
  };

  return (
    <>
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-1 pt-2.5 px-4 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Распределение по зонам</CardTitle>
            <div className="flex items-center gap-1.5">
              <Label htmlFor="forecast-toggle" className="text-[10px] text-muted-foreground cursor-pointer">
                Прогноз
              </Label>
              <Switch
                id="forecast-toggle"
                checked={showForecast}
                onCheckedChange={setShowForecast}
                className="scale-75 origin-right"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-0 flex-1 flex flex-col items-center justify-center gap-1 min-h-0">
          {/* Donut — large */}
          <div className="relative w-[200px] h-[200px] shrink-0">
            <PieChart width={200} height={200}>
              <Pie
                data={chartData}
                cx={95}
                cy={95}
                innerRadius={52}
                outerRadius={82}
                paddingAngle={2}
                dataKey="value"
                activeIndex={activeIndex !== null ? activeIndex : undefined}
                activeShape={renderActiveShape}
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={handlePieClick}
                className="cursor-pointer"
              >
                {sortedZones.map((z, i) => (
                  <Cell key={i} fill={z.color} stroke="transparent" />
                ))}
              </Pie>
            </PieChart>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-muted-foreground leading-tight">
                {showForecast ? 'Прогноз' : 'Потери'}
              </span>
              <span className="text-sm font-bold leading-tight">{totalLoss.toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">млн ₽</span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-0.5 shrink-0">
            {sortedZones.map((zone, i) => {
              const lossVal = showForecast ? zone.forecastLoss : zone.totalLoss;
              const pct = totalLoss > 0 ? Math.round((lossVal / totalLoss) * 100) : 0;
              return (
                <div
                  key={zone.shortLabel}
                  className={cn(
                    'flex items-center gap-2 px-2 py-0.5 rounded transition-colors cursor-pointer text-xs',
                    activeIndex === i ? 'bg-muted' : 'hover:bg-muted/50',
                    zone.count === 0 && 'opacity-50 cursor-default'
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => handleZoneClick(zone)}
                >
                  <div className={cn('w-2 h-2 rounded-full shrink-0', zone.cssColor)} />
                  <span className="text-muted-foreground w-10">{zone.shortLabel}</span>
                  <span className="font-semibold w-4 text-center">{zone.count}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="font-medium">{lossVal.toFixed(1)}</span>
                  <span className="text-muted-foreground ml-auto">{pct}%</span>
                </div>
              );
            })}
            <div className="flex justify-between pt-1 border-t border-border px-2">
              <span className="text-[11px] font-medium text-muted-foreground">Всего</span>
              <span className="text-xs font-bold">{mockRisks.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">Риски — {selectedZone?.label}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {selectedZone?.count} рисков · {(showForecast ? selectedZone?.forecastLoss : selectedZone?.totalLoss)?.toFixed(1)} млн ₽
            </p>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {selectedZone?.risks.map((risk) => (
              <Card key={risk.id} className="border-border">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-semibold">{risk.riskName}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Потери: </span>
                      <span className="font-medium">{risk.cleanOpRisk.value} млн ₽</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Утилизация: </span>
                      <span className={cn(
                        'font-medium',
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
            <Button onClick={() => { setDrawerOpen(false); navigate('/risks'); }} className="w-full gap-2">
              Перейти к списку рисков
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
