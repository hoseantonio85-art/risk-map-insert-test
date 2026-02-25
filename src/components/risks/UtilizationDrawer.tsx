import { useState } from 'react';
import { X, ChevronLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { mockMonthlyLosses, mockIncidents } from '@/data/mockRisks';
import { Badge } from '@/components/ui/badge';

interface UtilizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UtilizationDrawer({ isOpen, onClose }: UtilizationDrawerProps) {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [showNonUtilized, setShowNonUtilized] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[500px] sm:max-w-[500px] p-0 bg-card">
        <div className="h-full flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="hover:bg-muted p-1 rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <SheetTitle className="text-lg font-semibold">Утилизация лимита</SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
            {/* Year Tabs */}
            <Tabs value={selectedYear} onValueChange={setSelectedYear}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="2026" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  2026
                </TabsTrigger>
                <TabsTrigger value="2025">2025</TabsTrigger>
                <TabsTrigger value="2024">2024</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Чистые</span>
                  <Badge variant="outline" className="text-xs bg-util-high/10 text-util-high border-util-high">
                    11%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">1 340 500 ₽</span>
                  <span className="text-sm text-muted-foreground">12 000 000 ₽</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Косвенные потери</span>
                  <Badge variant="outline" className="text-xs bg-chart-cyan/10 text-chart-cyan border-chart-cyan">
                    72%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">4 300 000 ₽</span>
                  <span className="text-sm text-muted-foreground">6 000 000 ₽</span>
                </div>
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-yellow" />
                <span className="text-sm">Чистые</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-cyan" />
                <span className="text-sm">Косвенные потери</span>
              </div>
            </div>

            {/* Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMonthlyLosses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="directLosses" 
                    stroke="hsl(var(--chart-yellow))" 
                    strokeWidth={2}
                    dot={false}
                    name="Чистые"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="indirectLosses" 
                    stroke="hsl(var(--chart-cyan))" 
                    strokeWidth={2}
                    dot={false}
                    name="Косвенные потери"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Events Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">События <span className="text-muted-foreground font-normal">6</span></h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Показать невошедшие в утилизацию</span>
                  <Switch checked={showNonUtilized} onCheckedChange={setShowNonUtilized} />
                </div>
              </div>

              <div className="space-y-3">
                {mockIncidents.map((incident) => (
                  <div 
                    key={incident.id}
                    className="p-4 bg-muted/30 rounded-lg border border-border space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm">{incident.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {incident.id} • Дата: {incident.date}
                        </p>
                        <p className="text-xs">
                          Прямые: <span className="text-destructive font-medium">{incident.directLosses.toLocaleString('ru-RU')} ₽</span>
                          {' '}• Косвенные: <span className="font-medium">{incident.indirectLosses.toLocaleString('ru-RU')} ₽</span>
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "shrink-0",
                          incident.status === 'Утверждён' 
                            ? "bg-primary/10 text-primary border-primary"
                            : "bg-chart-yellow/10 text-chart-yellow border-chart-yellow"
                        )}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
