import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Risk, Scenario, Mirror } from '@/types/risk';
import { cn } from '@/lib/utils';

interface RiskEditFormProps {
  risk: Risk;
  onSave: (risk: Partial<Risk>) => void;
  onCancel: () => void;
}

const riskProfiles = [
  'Внутреннее мошенничество с целью получения выгоды',
  'Кредитный риск',
  'Операционный риск',
  'Регуляторный риск',
  'Имущественный риск',
];

const strategies = ['Принять', 'Минимизировать', 'Передать', 'Избежать'];
const qualitativeLossTypes = ['Нет', 'Репутационные', 'Регуляторные', 'Стратегические'];

interface ScenarioFormData {
  id: string;
  description: string;
  groupScenario: string;
  cleanOp: number;
  creditOp: number;
  indirect: number;
  probability: number;
}

export function RiskEditForm({ risk, onSave, onCancel }: RiskEditFormProps) {
  const [riskProfile, setRiskProfile] = useState(risk.riskProfile || '');
  const [strategy, setStrategy] = useState(risk.responseStrategy || '');
  const [qualitativeLosses, setQualitativeLosses] = useState(risk.qualitativeLosses || '');

  // Limits (editable in rebudget mode)
  const [cleanOpLimit, setCleanOpLimit] = useState(risk.cleanOpRisk?.limit?.toString() || '0');
  const [creditOpLimit, setCreditOpLimit] = useState(risk.creditOpRisk?.limit?.toString() || '0');
  const [indirectLimit, setIndirectLimit] = useState(risk.indirectLosses?.limit?.toString() || '0');

  // Scenarios with per-type losses
  const [scenarios, setScenarios] = useState<ScenarioFormData[]>(() => {
    if (risk.scenarios.length > 0) {
      return risk.scenarios.map(s => ({
        id: s.id,
        description: s.description,
        groupScenario: s.groupScenario,
        cleanOp: 0,
        creditOp: 0,
        indirect: 0,
        probability: s.percentage,
      }));
    }
    return [{
      id: Date.now().toString(),
      description: '',
      groupScenario: '',
      cleanOp: 0,
      creditOp: 0,
      indirect: 0,
      probability: 0,
    }];
  });

  // Mirrors
  const [mirrors, setMirrors] = useState<Mirror[]>(risk.mirrors || []);

  // Auto-calculated totals
  const totals = useMemo(() => {
    const cleanOp = scenarios.reduce((sum, s) => sum + s.cleanOp, 0);
    const creditOp = scenarios.reduce((sum, s) => sum + s.creditOp, 0);
    const indirect = scenarios.reduce((sum, s) => sum + s.indirect, 0);
    const total = cleanOp + creditOp + indirect;
    return { cleanOp, creditOp, indirect, total };
  }, [scenarios]);

  // Auto-calculated scenario percentages
  const scenarioPercentages = useMemo(() => {
    const total = totals.total;
    if (total === 0) return scenarios.map(() => 0);
    return scenarios.map(s => {
      const scenarioTotal = s.cleanOp + s.creditOp + s.indirect;
      return Math.round((scenarioTotal / total) * 100);
    });
  }, [scenarios, totals.total]);

  // Auto risk level
  const calculatedRiskLevel = useMemo((): Risk['riskLevel'] => {
    if (totals.total > 500) return 'Высокий';
    if (totals.total > 100) return 'Средний';
    return 'Низкий';
  }, [totals.total]);

  // Limit warnings
  const limitWarnings = useMemo(() => {
    const cleanLim = parseFloat(cleanOpLimit) || 0;
    const creditLim = parseFloat(creditOpLimit) || 0;
    const indirectLim = parseFloat(indirectLimit) || 0;
    return {
      cleanOp: cleanLim > 0 && totals.cleanOp > cleanLim,
      creditOp: creditLim > 0 && totals.creditOp > creditLim,
      indirect: indirectLim > 0 && totals.indirect > indirectLim,
    };
  }, [totals, cleanOpLimit, creditOpLimit, indirectLimit]);

  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now().toString(),
      description: '',
      groupScenario: '',
      cleanOp: 0,
      creditOp: 0,
      indirect: 0,
      probability: 0,
    }]);
  };

  const removeScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  const updateScenario = (id: string, field: keyof ScenarioFormData, value: string | number) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addMirror = () => {
    setMirrors(prev => [...prev, { id: Date.now().toString(), subdivision: '', percentage: 0 }]);
  };

  const removeMirror = (id: string) => {
    setMirrors(prev => prev.filter(m => m.id !== id));
  };

  const updateMirror = (id: string, field: keyof Mirror, value: string | number) => {
    setMirrors(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSave = () => {
    const updatedRisk: Partial<Risk> = {
      ...risk,
      riskProfile,
      riskName: riskProfile,
      responseStrategy: strategy,
      qualitativeLosses,
      riskLevel: calculatedRiskLevel,
      cleanOpRisk: { ...risk.cleanOpRisk, limit: parseFloat(cleanOpLimit) || 0 },
      creditOpRisk: { ...risk.creditOpRisk, limit: parseFloat(creditOpLimit) || 0 },
      indirectLosses: { ...risk.indirectLosses, limit: parseFloat(indirectLimit) || 0 },
      potentialLosses: totals.total,
      scenarios: scenarios.map((s, i) => ({
        id: s.id,
        description: s.description,
        groupScenario: s.groupScenario,
        percentage: scenarioPercentages[i],
      })),
      mirrors,
    };
    onSave(updatedRisk);
  };

  const riskLevelColor: Record<Risk['riskLevel'], string> = {
    'Высокий': 'text-destructive',
    'Средний': 'text-[hsl(var(--chart-yellow))]',
    'Низкий': 'text-primary',
  };

  return (
    <div className="space-y-6">
      {/* Block 1 — Risk Parameters */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Параметры риска</h2>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Процесс</Label>
            <Input value={risk.process} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>Профиль риска<span className="text-destructive">*</span></Label>
            <Select value={riskProfile} onValueChange={setRiskProfile}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {riskProfiles.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Стратегия реагирования<span className="text-destructive">*</span></Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {strategies.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Качественные потери</Label>
            <Select value={qualitativeLosses} onValueChange={setQualitativeLosses}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {qualitativeLossTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Block 2 — Scenarios */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Сценарии реализации риска</h2>
        <div className="space-y-4">
          {scenarios.map((scenario, index) => (
            <div key={scenario.id} className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h4 className="text-sm font-semibold">Сценарий {index + 1}</h4>
                  <span className="text-xs text-muted-foreground">
                    Доля: <span className="font-semibold text-foreground">{scenarioPercentages[index]}%</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeScenario(scenario.id)}
                  disabled={scenarios.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label>Название / групповой сценарий</Label>
                <Input
                  value={scenario.groupScenario}
                  onChange={e => updateScenario(scenario.id, 'groupScenario', e.target.value)}
                  placeholder="Предоставление недостоверных сведений клиентом"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Описание</Label>
                <Textarea
                  value={scenario.description}
                  onChange={e => updateScenario(scenario.id, 'description', e.target.value)}
                  placeholder="Описание сценария..."
                  className="min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Чистые (млн)</Label>
                  <Input
                    type="number"
                    value={scenario.cleanOp || ''}
                    onChange={e => updateScenario(scenario.id, 'cleanOp', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Кредитные потери (млн)</Label>
                  <Input
                    type="number"
                    value={scenario.creditOp || ''}
                    onChange={e => updateScenario(scenario.id, 'creditOp', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Косвенные потери (млн)</Label>
                  <Input
                    type="number"
                    value={scenario.indirect || ''}
                    onChange={e => updateScenario(scenario.id, 'indirect', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10" onClick={addScenario}>
            <Plus className="w-5 h-5 bg-primary text-primary-foreground rounded-full p-0.5" />
            Добавить сценарий
          </Button>
        </div>
      </section>

      {/* Block 3 — Calculated Totals (read-only) */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Итоговая оценка</h2>
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Чистые</p>
              <p className="text-lg font-bold">{totals.cleanOp} млн</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Кредитные потери</p>
              <p className="text-lg font-bold">{totals.creditOp} млн</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Косвенные потери</p>
              <p className="text-lg font-bold">{totals.indirect} млн</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Общая рискоёмкость</p>
              <p className="text-lg font-bold">{totals.total} млн</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Уровень риска:</span>
            <span className={cn("text-sm font-semibold", riskLevelColor[calculatedRiskLevel])}>
              {calculatedRiskLevel}
            </span>
          </div>
        </div>
      </section>

      {/* Block 4 — Limits (active in rebudget) */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Лимиты</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Чистые (млн)</Label>
            <Input
              value={cleanOpLimit}
              onChange={e => setCleanOpLimit(e.target.value)}
              placeholder="0"
            />
            {limitWarnings.cleanOp && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Сумма выше лимита на риск
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Кредитные потери (млн)</Label>
            <Input
              value={creditOpLimit}
              onChange={e => setCreditOpLimit(e.target.value)}
              placeholder="0"
            />
            {limitWarnings.creditOp && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Сумма выше лимита на риск
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Косвенные потери (млн)</Label>
            <Input
              value={indirectLimit}
              onChange={e => setIndirectLimit(e.target.value)}
              placeholder="0"
            />
            {limitWarnings.indirect && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Сумма выше лимита на риск
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Block 5 — Mirroring */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Зеркалирование</h2>
        <div className="space-y-3">
          {mirrors.map(mirror => (
            <div key={mirror.id} className="flex items-end gap-4">
              <div className="flex-1 space-y-1.5">
                <Label>Подразделение<span className="text-destructive">*</span></Label>
                <Input
                  value={mirror.subdivision}
                  onChange={e => updateMirror(mirror.id, 'subdivision', e.target.value)}
                  placeholder="Дивизион «Кошечки и собачки»"
                />
              </div>
              <div className="w-24 space-y-1.5">
                <Label>% зеркала<span className="text-destructive">*</span></Label>
                <Input
                  value={mirror.percentage || ''}
                  onChange={e => updateMirror(mirror.id, 'percentage', parseInt(e.target.value) || 0)}
                  placeholder="30%"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => removeMirror(mirror.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10" onClick={addMirror}>
            <Plus className="w-5 h-5 bg-primary text-primary-foreground rounded-full p-0.5" />
            Добавить зеркало
          </Button>
        </div>
      </section>
    </div>
  );
}
