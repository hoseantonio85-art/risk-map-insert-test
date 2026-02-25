import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FullscreenLightbox } from '@/components/ui/fullscreen-lightbox';
import { Risk, Mirror } from '@/types/risk';
import { cn } from '@/lib/utils';

interface CreateRiskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (risk: Partial<Risk>) => void;
  editRisk?: Risk | null;
}

const processes = [
  'П871 Обслуживание клиента в канале Супербанк Онлайн',
  'П868 Выдача потребительского кредита',
  'П2878 Управление продаж и обслуживания',
  'П1243 Кассовые операции',
  'П1034 Инкассация и хранение ценностей',
];

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
}

export function CreateRiskForm({ isOpen, onClose, onSave, editRisk }: CreateRiskFormProps) {
  const [process, setProcess] = useState(editRisk?.process || '');
  const [riskProfile, setRiskProfile] = useState(editRisk?.riskProfile || '');
  const [strategy, setStrategy] = useState(editRisk?.responseStrategy || '');
  const [qualitativeLosses, setQualitativeLosses] = useState(editRisk?.qualitativeLosses || '');

  // Scenarios
  const [scenarios, setScenarios] = useState<ScenarioFormData[]>(() => {
    if (editRisk?.scenarios && editRisk.scenarios.length > 0) {
      return editRisk.scenarios.map(s => ({
        id: s.id,
        description: s.description,
        groupScenario: s.groupScenario,
        cleanOp: 0,
        creditOp: 0,
        indirect: 0,
      }));
    }
    return [{
      id: Date.now().toString(),
      description: '',
      groupScenario: '',
      cleanOp: 0,
      creditOp: 0,
      indirect: 0,
    }];
  });

  // Limits
  const [cleanOpLimit, setCleanOpLimit] = useState(editRisk?.cleanOpRisk?.limit?.toString() || '0');
  const [creditOpLimit, setCreditOpLimit] = useState(editRisk?.creditOpRisk?.limit?.toString() || '0');
  const [indirectLimit, setIndirectLimit] = useState(editRisk?.indirectLosses?.limit?.toString() || '0');

  // Mirrors
  const [mirrors, setMirrors] = useState<Mirror[]>(editRisk?.mirrors || []);

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

  const riskLevelColor: Record<Risk['riskLevel'], string> = {
    'Высокий': 'text-destructive',
    'Средний': 'text-[hsl(var(--chart-yellow))]',
    'Низкий': 'text-primary',
  };

  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now().toString(),
      description: '',
      groupScenario: '',
      cleanOp: 0,
      creditOp: 0,
      indirect: 0,
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

  const handleSubmit = () => {
    if (scenarios.length === 0) return;

    const newRisk: Partial<Risk> = {
      id: editRisk?.id || `QNR-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'В работе',
      block: 'Блок Сеть продаж',
      subdivision: 'Управление продаж и обслуживания',
      process,
      riskProfile,
      riskName: riskProfile,
      riskLevel: calculatedRiskLevel,
      responseStrategy: strategy,
      qualitativeLosses,
      cleanOpRisk: { value: totals.cleanOp, utilization: 0, limit: parseFloat(cleanOpLimit) || 0 },
      creditOpRisk: { value: totals.creditOp, utilization: 0, limit: parseFloat(creditOpLimit) || 0 },
      indirectLosses: { value: totals.indirect, utilization: 0, limit: parseFloat(indirectLimit) || 0 },
      potentialLosses: totals.total,
      scenarios: scenarios.map((s, i) => ({
        id: s.id,
        description: s.description,
        groupScenario: s.groupScenario,
        percentage: scenarioPercentages[i],
      })),
      mirrors,
      author: 'Садыков Илья',
      createdAt: new Date().toLocaleDateString('ru-RU'),
      source: 'Ручное создание',
    };

    onSave(newRisk);
    onClose();
  };

  return (
    <FullscreenLightbox
      isOpen={isOpen}
      onClose={onClose}
      title={editRisk ? 'Редактирование риска' : 'Создание риска'}
      actions={
        <>
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button onClick={handleSubmit} disabled={scenarios.length === 0}>Сохранить</Button>
        </>
      }
    >
      {/* Risk Level Badge */}
      <div className="flex justify-end mb-6">
        <div className="px-4 py-2 border border-border rounded-lg bg-muted/30">
          <span className="text-sm text-muted-foreground">Уровень риска - </span>
          <span className={cn("text-sm font-medium", riskLevelColor[calculatedRiskLevel])}>{calculatedRiskLevel}</span>
        </div>
      </div>

      {/* Block 1 — Risk Parameters */}
      <div className="form-section">
        <h2 className="text-lg font-semibold mb-4">Параметры риска</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Процесс<span className="text-destructive">*</span></Label>
            <Select value={process} onValueChange={setProcess}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {processes.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2">
            <Label>Стратегия реагирования<span className="text-destructive">*</span></Label>
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выбрать" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {strategies.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Качественные потери</Label>
            <Select value={qualitativeLosses} onValueChange={setQualitativeLosses}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Выбрать" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {qualitativeLossTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Block 2 — Scenarios */}
      <div className="form-section">
        <h2 className="text-lg font-semibold mb-4">Сценарии реализации риска</h2>
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
      </div>

      {/* Block 3 — Calculated Totals (read-only) */}
      <div className="form-section">
        <h2 className="text-lg font-semibold mb-4">Итоговая оценка</h2>
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
      </div>

      {/* Block 4 — Limits */}
      <div className="form-section">
        <h2 className="text-lg font-semibold mb-4">Лимиты</h2>
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
      </div>

      {/* Block 5 — Mirroring */}
      <div className="form-section">
        <h2 className="text-lg font-semibold mb-4">Зеркалирование</h2>
        <div className="space-y-4">
          {mirrors.map((mirror) => (
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
      </div>
    </FullscreenLightbox>
  );
}
