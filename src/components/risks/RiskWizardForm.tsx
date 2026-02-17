import { useState, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, Sparkles, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FullscreenLightbox } from '@/components/ui/fullscreen-lightbox';
import { Risk, Mirror } from '@/types/risk';
import { cn } from '@/lib/utils';

interface RiskWizardFormProps {
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

const subdivisions = [
  'Экосистемы B2C/ Дивизион ЗиС',
  'Блок ТБ / Дивизион КК',
  'Блок Розница / Дивизион ПЛ',
  'Блок ИТ / Дивизион Инфра',
];

interface ScenarioFormData {
  id: string;
  description: string;
  cleanOp: number;
  creditOp: number;
  indirect: number;
  probability: number;
}

const defaultScenarios: ScenarioFormData[] = [
  {
    id: 'ai-1',
    description: 'Клиент предоставляет подложные документы при оформлении. Потери возникают при невозврате средств.',
    cleanOp: 120,
    creditOp: 80,
    indirect: 30,
    probability: 45,
  },
  {
    id: 'ai-2',
    description: 'Системная ошибка или человеческий фактор при проверке данных клиента приводит к одобрению заявки.',
    cleanOp: 60,
    creditOp: 45,
    indirect: 15,
    probability: 25,
  },
];

type WizardStep = 1 | 2 | 3;

function RiskLevelBadge({ level }: { level: Risk['riskLevel'] }) {
  const map: Record<Risk['riskLevel'], string> = {
    'Высокий': 'bg-destructive/10 text-destructive border-destructive/30',
    'Средний': 'bg-[hsl(var(--chart-yellow))]/10 text-[hsl(var(--chart-yellow))] border-[hsl(var(--chart-yellow))]/30',
    'Низкий': 'bg-primary/10 text-primary border-primary/30',
  };
  return (
    <span className={cn("text-xs px-2 py-0.5 rounded font-medium border", map[level])}>
      {level}
    </span>
  );
}

export function RiskWizardForm({ isOpen, onClose, onSave, editRisk }: RiskWizardFormProps) {
  const isEditMode = !!editRisk;

  // Step state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [aiPrefilled, setAiPrefilled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 1 fields
  const [process, setProcess] = useState(editRisk?.process || '');
  const [riskProfile, setRiskProfile] = useState(editRisk?.riskProfile || '');

  // Step 2 fields (strategy & qualitative moved here)
  const [strategy, setStrategy] = useState(editRisk?.responseStrategy || '');
  const [qualitativeLosses, setQualitativeLosses] = useState(editRisk?.qualitativeLosses || '');

  const [scenarios, setScenarios] = useState<ScenarioFormData[]>(() => {
    if (editRisk?.scenarios && editRisk.scenarios.length > 0) {
      return editRisk.scenarios.map(s => ({
        id: s.id,
        description: s.description,
        cleanOp: Math.round((editRisk.cleanOpRisk.value || 0) * s.percentage / 100),
        creditOp: Math.round((editRisk.creditOpRisk.value || 0) * s.percentage / 100),
        indirect: Math.round((editRisk.indirectLosses.value || 0) * s.percentage / 100),
        probability: 0,
      }));
    }
    return [];
  });

  const [cleanOpLimit, setCleanOpLimit] = useState(editRisk?.cleanOpRisk?.limit?.toString() || '0');
  const [creditOpLimit, setCreditOpLimit] = useState(editRisk?.creditOpRisk?.limit?.toString() || '0');
  const [indirectLimit, setIndirectLimit] = useState(editRisk?.indirectLosses?.limit?.toString() || '0');

  // Step 3 fields
  const [mirrors, setMirrors] = useState<Mirror[]>(editRisk?.mirrors || []);

  // Calculations
  const totals = useMemo(() => {
    const cleanOp = scenarios.reduce((sum, s) => sum + s.cleanOp, 0);
    const creditOp = scenarios.reduce((sum, s) => sum + s.creditOp, 0);
    const indirect = scenarios.reduce((sum, s) => sum + s.indirect, 0);
    const total = cleanOp + creditOp + indirect;
    return { cleanOp, creditOp, indirect, total };
  }, [scenarios]);

  const scenarioPercentages = useMemo(() => {
    const total = totals.total;
    if (total === 0) return scenarios.map(() => 0);
    return scenarios.map(s => {
      const scenarioTotal = s.cleanOp + s.creditOp + s.indirect;
      return Math.round((scenarioTotal / total) * 100);
    });
  }, [scenarios, totals.total]);

  const calculatedRiskLevel = useMemo((): Risk['riskLevel'] => {
    if (totals.total > 500) return 'Высокий';
    if (totals.total > 100) return 'Средний';
    return 'Низкий';
  }, [totals.total]);

  const forecast = useMemo(() => {
    const forecastValue = Math.round(totals.total * 1.12);
    const delta = totals.total > 0 ? Math.round(((forecastValue - totals.total) / totals.total) * 100) : 0;
    return { value: forecastValue, delta };
  }, [totals.total]);

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

  // Mirror limit calculations
  const mirrorLimits = useMemo(() => {
    const cleanLim = parseFloat(cleanOpLimit) || 0;
    const creditLim = parseFloat(creditOpLimit) || 0;
    const indirectLim = parseFloat(indirectLimit) || 0;
    return mirrors.map(m => ({
      cleanOp: Math.round(cleanLim * m.percentage / 100 * 10) / 10,
      creditOp: Math.round(creditLim * m.percentage / 100 * 10) / 10,
      indirect: Math.round(indirectLim * m.percentage / 100 * 10) / 10,
    }));
  }, [mirrors, cleanOpLimit, creditOpLimit, indirectLimit]);

  const riskLevelColor: Record<Risk['riskLevel'], string> = {
    'Высокий': 'text-destructive',
    'Средний': 'text-[hsl(var(--chart-yellow))]',
    'Низкий': 'text-primary',
  };

  // Scenario helpers
  const addScenario = () => {
    setScenarios(prev => [...prev, {
      id: Date.now().toString(),
      description: '',
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

  // Mirror helpers
  const addMirror = () => {
    setMirrors(prev => [...prev, { id: Date.now().toString(), subdivision: '', percentage: 0 }]);
  };

  const removeMirror = (id: string) => {
    setMirrors(prev => prev.filter(m => m.id !== id));
  };

  const updateMirror = (id: string, field: keyof Mirror, value: string | number) => {
    setMirrors(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // Step navigation
  const handleContinueToStep2 = () => {
    if (!process || !riskProfile) return;
    setCompletedSteps(prev => new Set(prev).add(1));
    setCurrentStep(2);

    // AI prefill for new risks
    if (!isEditMode && scenarios.length === 0 && !aiPrefilled) {
      setAiLoading(true);
      setTimeout(() => {
        setScenarios(defaultScenarios);
        setCleanOpLimit('250');
        setCreditOpLimit('150');
        setIndirectLimit('60');
        setStrategy('Минимизировать');
        setQualitativeLosses('Нет');
        setAiPrefilled(true);
        setAiLoading(false);
      }, 800);
    }
  };

  const handleContinueToStep3 = () => {
    if (scenarios.length === 0 || !strategy) return;
    setCompletedSteps(prev => new Set(prev).add(2));
    setCurrentStep(3);
  };

  const handleGoToStep = (step: WizardStep) => {
    if (step === currentStep) return;
    if (step < currentStep || completedSteps.has(step) || completedSteps.has((step - 1) as WizardStep)) {
      setCurrentStep(step);
    }
  };

  const handleSave = () => {
    if (scenarios.length === 0) return;

    const newRisk: Partial<Risk> = {
      id: editRisk?.id || `QNR-${Math.floor(10000 + Math.random() * 90000)}`,
      status: editRisk?.status || 'В работе',
      block: editRisk?.block || 'Блок Сеть продаж',
      subdivision: editRisk?.subdivision || 'Управление продаж и обслуживания',
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
        groupScenario: s.description.slice(0, 60),
        percentage: scenarioPercentages[i],
      })),
      mirrors,
      author: editRisk?.author || 'Садыков Илья',
      createdAt: editRisk?.createdAt || new Date().toLocaleDateString('ru-RU'),
      source: editRisk?.source || 'Ручное создание',
    };

    onSave(newRisk);
    onClose();
  };

  // Step validation
  const step1Valid = !!process && !!riskProfile;
  const step2Valid = scenarios.length > 0 && !!strategy;

  const steps = [
    { num: 1 as WizardStep, label: 'Общая информация' },
    { num: 2 as WizardStep, label: 'Оценка рисков' },
    { num: 3 as WizardStep, label: 'Зеркалирование' },
  ];

  const headerContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold truncate">
          {editRisk ? `${editRisk.id}: ${editRisk.riskName}` : 'Создание риска'}
        </h1>
        <RiskLevelBadge level={calculatedRiskLevel} />
      </div>
      {(editRisk || process) && (
        <p className="text-sm text-muted-foreground truncate">
          {process || editRisk?.process}
          {riskProfile && ` • ${riskProfile}`}
        </p>
      )}
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onClose}>Отмена</Button>
      <Button onClick={handleSave} disabled={!step1Valid || !step2Valid}>
        Сохранить
      </Button>
    </div>
  );

  return (
    <FullscreenLightbox
      isOpen={isOpen}
      onClose={onClose}
      title=""
      headerContent={headerContent}
      wide
      footer={footerContent}
    >
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-2">
        {steps.map((step, i) => {
          const isActive = currentStep === step.num;
          const isCompleted = completedSteps.has(step.num);
          const isAccessible = step.num <= currentStep || isCompleted || completedSteps.has((step.num - 1) as WizardStep);

          return (
            <div key={step.num} className="flex items-center flex-1">
              <button
                onClick={() => handleGoToStep(step.num)}
                disabled={!isAccessible}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2 rounded-lg transition-colors w-full",
                  isActive && "bg-primary/10 text-primary",
                  !isActive && isCompleted && "text-primary hover:bg-primary/5",
                  !isActive && !isCompleted && !isAccessible && "text-muted-foreground/50 cursor-not-allowed",
                  !isActive && !isCompleted && isAccessible && "text-muted-foreground hover:bg-muted",
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2 transition-colors",
                  isActive && "bg-primary text-primary-foreground border-primary",
                  isCompleted && !isActive && "bg-primary text-primary-foreground border-primary",
                  !isActive && !isCompleted && "border-border bg-card text-muted-foreground",
                )}>
                  {isCompleted && !isActive ? <Check className="w-3.5 h-3.5" /> : step.num}
                </div>
                <span className="text-sm font-medium truncate">{step.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  "h-px w-8 shrink-0",
                  completedSteps.has(step.num) ? "bg-primary" : "bg-border"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Sticky mini-summary (edit mode only) */}
      {isEditMode && (
        <div className="sticky top-0 z-10 -mx-8 px-8 py-3 mb-4 bg-card border-b border-border">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Прямые</span>
              <span className="text-sm font-bold">{totals.cleanOp.toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Кредитные</span>
              <span className="text-sm font-bold">{totals.creditOp.toLocaleString('ru-RU')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Косвенные</span>
              <span className="text-sm font-bold">{totals.indirect.toLocaleString('ru-RU')}</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Рискоёмкость</span>
              <span className="text-sm font-bold">{totals.total.toLocaleString('ru-RU')} млн</span>
            </div>
            <RiskLevelBadge level={calculatedRiskLevel} />
          </div>
        </div>
      )}

      {/* ===== STEP 1: General Info ===== */}
      <div className="space-y-0">
        <button
          onClick={() => handleGoToStep(1)}
          className={cn(
            "flex items-center gap-3 w-full py-4 text-left border-b border-border",
            currentStep === 1 && "border-b-0"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            completedSteps.has(1) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}>
            {completedSteps.has(1) ? <Check className="w-3 h-3" /> : '1'}
          </div>
          <span className="text-base font-semibold flex-1">Общая информация</span>
          {currentStep === 1 ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {currentStep === 1 && (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Процесс<span className="text-destructive">*</span></Label>
                <Select value={process} onValueChange={setProcess}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Выберите процесс" />
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
                    <SelectValue placeholder="Выберите профиль" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {riskProfiles.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleContinueToStep2} disabled={!step1Valid}>
                Продолжить
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ===== STEP 2: Risk Assessment ===== */}
      <div className="space-y-0">
        <button
          onClick={() => handleGoToStep(2)}
          disabled={!completedSteps.has(1) && currentStep < 2}
          className={cn(
            "flex items-center gap-3 w-full py-4 text-left border-b border-border",
            currentStep === 2 && "border-b-0",
            !completedSteps.has(1) && currentStep < 2 && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            completedSteps.has(2) ? "bg-primary text-primary-foreground" : currentStep === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}>
            {completedSteps.has(2) ? <Check className="w-3 h-3" /> : '2'}
          </div>
          <span className="text-base font-semibold flex-1">Оценка рисков</span>
          {currentStep === 2 ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {currentStep === 2 && (
          <div className="py-6 space-y-6">
            {/* AI message */}
            {aiLoading ? (
              <div className="p-4 rounded-xl border border-[hsl(var(--ai-alert-border))]" style={{ backgroundColor: 'hsl(var(--ai-alert))' }}>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 animate-pulse" style={{ color: 'hsl(var(--ai-alert-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--ai-alert-foreground))' }}>
                    Заполняю оценку и сценарии на основе справочника и ретро-данных…
                  </p>
                </div>
              </div>
            ) : aiPrefilled || isEditMode ? (
              <div className="p-4 rounded-xl border border-[hsl(var(--ai-alert-border))]" style={{ backgroundColor: 'hsl(var(--ai-alert))' }}>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--ai-alert-foreground))' }} />
                  <p className="text-sm" style={{ color: 'hsl(var(--ai-alert-foreground))' }}>
                    {isEditMode
                      ? 'Оценка и сценарии загружены из текущих данных риска. Проверьте и скорректируйте при необходимости.'
                      : 'Я заполнил оценку и сценарии на основе справочника и ретро-данных. Проверьте и скорректируйте при необходимости.'}
                  </p>
                </div>
              </div>
            ) : null}

            {/* === Assessment Widget === */}
            <div className="p-6 rounded-xl border border-border bg-card space-y-6">
              <h3 className="text-base font-semibold">Оценка рисков</h3>

              {/* A) Лимиты на риск */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Лимиты на риск</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Прямые потери (млн)</Label>
                    <Input
                      value={cleanOpLimit}
                      onChange={e => setCleanOpLimit(e.target.value)}
                      placeholder="0"
                    />
                    {limitWarnings.cleanOp && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Превышение лимита
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
                        Превышение лимита
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
                        Превышение лимита
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* B) Потенциальные потери (read-only from scenarios) */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Потенциальные потери</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Прямые потери</p>
                    <p className="text-lg font-bold">{totals.cleanOp.toLocaleString('ru-RU')} <span className="text-xs font-normal text-muted-foreground">млн</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Кредитные потери</p>
                    <p className="text-lg font-bold">{totals.creditOp.toLocaleString('ru-RU')} <span className="text-xs font-normal text-muted-foreground">млн</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Косвенные потери</p>
                    <p className="text-lg font-bold">{totals.indirect.toLocaleString('ru-RU')} <span className="text-xs font-normal text-muted-foreground">млн</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Рискоёмкость</p>
                    <p className="text-lg font-bold">{totals.total.toLocaleString('ru-RU')} <span className="text-xs font-normal text-muted-foreground">млн</span></p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">Прогноз:</span>
                      <span className="text-xs font-semibold">{forecast.value.toLocaleString('ru-RU')}</span>
                      <span className={cn("text-xs font-semibold", forecast.delta > 0 ? "text-destructive" : "text-primary")}>
                        {forecast.delta > 0 ? '+' : ''}{forecast.delta}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Уровень риска:</span>
                  <span className={cn("text-sm font-semibold", riskLevelColor[calculatedRiskLevel])}>
                    {calculatedRiskLevel}
                  </span>
                </div>
              </div>

              {/* C) Стратегия реагирования */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Стратегия реагирования<span className="text-destructive">*</span></Label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Выберите стратегию" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {strategies.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* D) Качественные потери */}
                <div className="space-y-2">
                  <Label>Качественные потери</Label>
                  <Select value={qualitativeLosses} onValueChange={setQualitativeLosses}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Выберите тип" />
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

            {/* === Scenarios === */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Сценарии реализации риска</h3>
              {scenarios.map((scenario, index) => (
                <div key={scenario.id} className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-semibold">Сценарий {index + 1}</h4>
                      <span className="text-xs text-muted-foreground">
                        Доля: <span className="font-semibold text-foreground">{scenarioPercentages[index]}%</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Потери: <span className="font-semibold text-foreground">{(scenario.cleanOp + scenario.creditOp + scenario.indirect).toLocaleString('ru-RU')} млн</span>
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
                    <Textarea
                      value={scenario.description}
                      onChange={e => updateScenario(scenario.id, 'description', e.target.value)}
                      placeholder="Опишите сценарий реализации риска..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Прямые потери (млн)</Label>
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
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Вероятность (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={scenario.probability || ''}
                        onChange={e => updateScenario(scenario.id, 'probability', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
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

            <div className="flex justify-end pt-2">
              <Button onClick={handleContinueToStep3} disabled={!step2Valid}>
                Продолжить
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ===== STEP 3: Mirroring ===== */}
      <div className="space-y-0">
        <button
          onClick={() => handleGoToStep(3)}
          disabled={!completedSteps.has(2) && currentStep < 3}
          className={cn(
            "flex items-center gap-3 w-full py-4 text-left border-b border-border",
            currentStep === 3 && "border-b-0",
            !completedSteps.has(2) && currentStep < 3 && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
            completedSteps.has(3) ? "bg-primary text-primary-foreground" : currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}>
            {completedSteps.has(3) ? <Check className="w-3 h-3" /> : '3'}
          </div>
          <span className="text-base font-semibold flex-1">Зеркалирование</span>
          {currentStep === 3 ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {currentStep === 3 && (
          <div className="py-6 space-y-4">
            {mirrors.length === 0 && (
              <p className="text-sm text-muted-foreground">Зеркала не добавлены. Добавьте подразделение для зеркалирования лимитов.</p>
            )}

            {mirrors.map((mirror, idx) => (
              <div key={mirror.id} className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Зеркало {idx + 1}</h4>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMirror(mirror.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-[1fr,120px] gap-4">
                  <div className="space-y-1.5">
                    <Label>Подразделение<span className="text-destructive">*</span></Label>
                    <Select value={mirror.subdivision} onValueChange={v => updateMirror(mirror.id, 'subdivision', v)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Выберите подразделение" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {subdivisions.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Доля (%)<span className="text-destructive">*</span></Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={mirror.percentage || ''}
                      onChange={e => updateMirror(mirror.id, 'percentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                      placeholder="30"
                    />
                  </div>
                </div>

                {/* Mirror limits — read-only, calculated */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Лимит: Прямые</p>
                    <p className="text-sm font-semibold">{mirrorLimits[idx]?.cleanOp || 0} млн</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Лимит: Кредитные</p>
                    <p className="text-sm font-semibold">{mirrorLimits[idx]?.creditOp || 0} млн</p>
                  </div>
                  <div className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-xs text-muted-foreground mb-0.5">Лимит: Косвенные</p>
                    <p className="text-sm font-semibold">{mirrorLimits[idx]?.indirect || 0} млн</p>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="ghost" className="gap-2 text-primary hover:text-primary hover:bg-primary/10" onClick={addMirror}>
              <Plus className="w-5 h-5 bg-primary text-primary-foreground rounded-full p-0.5" />
              Добавить зеркало
            </Button>
          </div>
        )}
      </div>
    </FullscreenLightbox>
  );
}
