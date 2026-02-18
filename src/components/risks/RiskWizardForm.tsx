import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertTriangle, Sparkles, Check, ChevronDown, ChevronRight, X, Eye, ChevronsUpDown } from 'lucide-react';
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

const subdivisionsList = [
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

/** Format number with thousand separators (spaces) — full numbers, no "млн" */
function formatNum(val: number): string {
  return val.toLocaleString('ru-RU');
}

/** Format a raw string into a display string with thousand separators */
function formatInputDisplay(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('ru-RU');
}

/** Parse a formatted display string back to numeric value */
function parseInputValue(formatted: string): number {
  const digits = formatted.replace(/[^\d]/g, '');
  return parseInt(digits, 10) || 0;
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

/** Formatted number input — displays with thousand separators, stores raw numeric value.
 *  Shows a non-interactive ₽ suffix when `showCurrency` is true (default). */
function FormattedInput({ 
  value, 
  onChange, 
  placeholder = '0',
  className,
  min,
  max,
  showCurrency = true,
}: { 
  value: number; 
  onChange: (val: number) => void; 
  placeholder?: string;
  className?: string;
  min?: number;
  max?: number;
  showCurrency?: boolean;
}) {
  const [display, setDisplay] = useState(() => value ? formatNum(value) : '');
  
  useEffect(() => {
    setDisplay(value ? formatNum(value) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatInputDisplay(raw);
    setDisplay(formatted);
    let parsed = parseInputValue(raw);
    if (min !== undefined) parsed = Math.max(min, parsed);
    if (max !== undefined) parsed = Math.min(max, parsed);
    onChange(parsed);
  };

  if (!showCurrency) {
    return (
      <Input
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div className="relative">
      <Input
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn("pr-8", className)}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">
        ₽
      </span>
    </div>
  );
}

function CollapsibleScenario({
  scenario,
  index,
  scenarioTotal,
  percentage,
  onRemove,
  canRemove,
  onUpdate,
}: {
  scenario: ScenarioFormData;
  index: number;
  scenarioTotal: number;
  percentage: number;
  onRemove: () => void;
  canRemove: boolean;
  onUpdate: (field: keyof ScenarioFormData, value: string | number) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl bg-muted/40 border border-border overflow-hidden">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-muted/60 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <h4 className="text-sm font-semibold shrink-0">Сценарий {index + 1}</h4>
        {!isOpen && (
          <span className="text-xs text-muted-foreground truncate">
            Потенциальные потери: <span className="font-medium text-foreground">{formatNum(scenarioTotal)} ₽</span>
            {' · '}Доля: <span className="font-medium text-foreground">{percentage}%</span>
            {scenario.probability > 0 && (
              <>{' · '}Вероятность: <span className="font-medium text-foreground">{scenario.probability}%</span></>
            )}
          </span>
        )}
        <div className="flex-1" />
        {isOpen && (
          <>
            <span className="text-xs text-muted-foreground shrink-0">
              Доля: <span className="font-semibold text-foreground">{percentage}%</span>
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              Потенциальные потери: <span className="font-medium text-foreground">{formatNum(scenarioTotal)} ₽</span>
            </span>
          </>
        )}
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              disabled={!canRemove}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Textarea
            value={scenario.description}
            onChange={e => onUpdate('description', e.target.value)}
            placeholder="Опишите сценарий реализации риска..."
            className="min-h-[80px]"
          />

          <p className="text-xs font-medium text-muted-foreground mt-1">Потенциальные потери по сценарию</p>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Прямые потери</Label>
              <FormattedInput
                value={scenario.cleanOp}
                onChange={v => onUpdate('cleanOp', v)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Кредитные потери</Label>
              <FormattedInput
                value={scenario.creditOp}
                onChange={v => onUpdate('creditOp', v)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Косвенные потери</Label>
              <FormattedInput
                value={scenario.indirect}
                onChange={v => onUpdate('indirect', v)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Вероятность (%)</Label>
              <FormattedInput
                value={scenario.probability}
                onChange={v => onUpdate('probability', v)}
                placeholder="0"
                min={0}
                max={100}
                showCurrency={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RiskWizardForm({ isOpen, onClose, onSave, editRisk }: RiskWizardFormProps) {
  const isEditMode = !!editRisk;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());
  const [aiPrefilled, setAiPrefilled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Step 1
  const [process, setProcess] = useState(editRisk?.process || '');
  const [riskProfile, setRiskProfile] = useState(editRisk?.riskProfile || '');

  // Step 2
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

  const [cleanOpLimit, setCleanOpLimit] = useState(editRisk?.cleanOpRisk?.limit || 0);
  const [creditOpLimit, setCreditOpLimit] = useState(editRisk?.creditOpRisk?.limit || 0);
  const [indirectLimit, setIndirectLimit] = useState(editRisk?.indirectLosses?.limit || 0);

  // Step 3
  const [mirrors, setMirrors] = useState<Mirror[]>(editRisk?.mirrors || []);

  // Limits memo state
  const limitsRef = useRef<HTMLDivElement>(null);
  const [limitsOutOfView, setLimitsOutOfView] = useState(false);
  const [memoDismissed, setMemoDismissed] = useState(false);

  const hasLimits = useMemo(() => {
    return cleanOpLimit > 0 || creditOpLimit > 0 || indirectLimit > 0;
  }, [cleanOpLimit, creditOpLimit, indirectLimit]);

  // Reset dismissed when limits change
  const handleLimitChange = useCallback((setter: (v: number) => void, value: number) => {
    setter(value);
    setMemoDismissed(false);
  }, []);

  // IntersectionObserver for limits block
  useEffect(() => {
    const el = limitsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setLimitsOutOfView(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [currentStep]);

  const showLimitsMemo = limitsOutOfView && hasLimits && !memoDismissed;

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

  const limitWarnings = useMemo(() => {
    return {
      cleanOp: cleanOpLimit > 0 && totals.cleanOp > cleanOpLimit,
      creditOp: creditOpLimit > 0 && totals.creditOp > creditOpLimit,
      indirect: indirectLimit > 0 && totals.indirect > indirectLimit,
    };
  }, [totals, cleanOpLimit, creditOpLimit, indirectLimit]);

  const mirrorLimits = useMemo(() => {
    return mirrors.map(m => ({
      cleanOp: Math.round(cleanOpLimit * m.percentage / 100 * 10) / 10,
      creditOp: Math.round(creditOpLimit * m.percentage / 100 * 10) / 10,
      indirect: Math.round(indirectLimit * m.percentage / 100 * 10) / 10,
    }));
  }, [mirrors, cleanOpLimit, creditOpLimit, indirectLimit]);

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

    if (!isEditMode && scenarios.length === 0 && !aiPrefilled) {
      setAiLoading(true);
      setTimeout(() => {
        setScenarios(defaultScenarios);
        setCleanOpLimit(250);
        setCreditOpLimit(150);
        setIndirectLimit(60);
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
      cleanOpRisk: { value: totals.cleanOp, utilization: 0, limit: cleanOpLimit },
      creditOpRisk: { value: totals.creditOp, utilization: 0, limit: creditOpLimit },
      indirectLosses: { value: totals.indirect, utilization: 0, limit: indirectLimit },
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

  // Limits memo — rendered as a separate floating element above footer
  const limitsMemoElement = (
    <>
      {showLimitsMemo && (
        <div className="sticky bottom-0 z-10 mx-auto px-8" style={{ maxWidth: '1240px' }}>
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg border border-border bg-card shadow-sm">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Лимиты:</span>
            <div className="flex items-center gap-5 flex-1 min-w-0">
              <span className="text-xs">
                <span className="text-muted-foreground">Прямые </span>
                <span className="font-semibold text-foreground">{formatNum(cleanOpLimit)} ₽</span>
              </span>
              <span className="text-xs">
                <span className="text-muted-foreground">Кредитные </span>
                <span className="font-semibold text-foreground">{formatNum(creditOpLimit)} ₽</span>
              </span>
              <span className="text-xs">
                <span className="text-muted-foreground">Косвенные </span>
                <span className="font-semibold text-foreground">{formatNum(indirectLimit)} ₽</span>
              </span>
            </div>
            <button
              onClick={() => setMemoDismissed(true)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
      {limitsOutOfView && hasLimits && memoDismissed && (
        <div className="sticky bottom-0 z-10 mx-auto px-8" style={{ maxWidth: '1240px' }}>
          <button
            onClick={() => setMemoDismissed(false)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors py-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Показать лимиты
          </button>
        </div>
      )}
    </>
  );

  // Step accordion header renderer
  const renderStepHeader = (step: WizardStep, label: string) => {
    const isActive = currentStep === step;
    const isCompleted = completedSteps.has(step);
    const isAccessible = step <= currentStep || isCompleted || completedSteps.has((step - 1) as WizardStep);
    const isDisabled = !isAccessible;

    return (
      <button
        onClick={() => handleGoToStep(step)}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-3 w-full px-5 py-4 text-left transition-colors",
          isActive && "rounded-t-xl",
          !isActive && "rounded-xl",
          isDisabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
          isCompleted ? "bg-primary text-primary-foreground" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}>
          {isCompleted && !isActive ? <Check className="w-3 h-3" /> : step}
        </div>
        <span className="text-base font-semibold flex-1">{label}</span>
        {isActive ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
    );
  };

  return (
    <FullscreenLightbox
      isOpen={isOpen}
      onClose={onClose}
      title=""
      headerContent={headerContent}
      wide
      footer={footerContent}
      floatingAboveFooter={limitsMemoElement}
    >
      {/* Compact sticky stepper — under header, uses top offset to sit below the sticky header */}
      <div className="sticky top-[-32px] z-10 -mx-8 px-8 py-3 bg-card border-b border-border mb-6">
        <div className="flex items-center gap-0">
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
                    "flex items-center gap-2.5 px-4 py-1.5 rounded-lg transition-colors w-full",
                    isActive && "bg-primary/10 text-primary",
                    !isActive && isCompleted && "text-primary hover:bg-primary/5",
                    !isActive && !isCompleted && !isAccessible && "text-muted-foreground/50 cursor-not-allowed",
                    !isActive && !isCompleted && isAccessible && "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border-2 transition-colors",
                    isActive && "bg-primary text-primary-foreground border-primary",
                    isCompleted && !isActive && "bg-primary text-primary-foreground border-primary",
                    !isActive && !isCompleted && "border-border bg-card text-muted-foreground",
                  )}>
                    {isCompleted && !isActive ? <Check className="w-3 h-3" /> : step.num}
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
      </div>

      {/* Steps as card-style accordions */}
      <div className="space-y-4">

        {/* ===== STEP 1: General Info ===== */}
        <div className={cn(
          "rounded-xl border border-border bg-card overflow-hidden transition-shadow",
          currentStep === 1 && "shadow-sm"
        )}>
          {renderStepHeader(1, 'Общая информация')}

          {currentStep === 1 && (
            <div className="px-5 pb-6 pt-2 space-y-6 border-t border-border">
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
        <div className={cn(
          "rounded-xl border border-border bg-card overflow-hidden transition-shadow",
          currentStep === 2 && "shadow-sm"
        )}>
          {renderStepHeader(2, 'Оценка рисков')}

          {currentStep === 2 && (
            <div className="px-5 pb-6 pt-2 space-y-8 border-t border-border">
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

              {/* === Block A: Лимиты на риск === */}
              <div ref={limitsRef} className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h3 className="text-base font-semibold">Лимиты на риск</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Прямые потери</Label>
                    <FormattedInput
                      value={cleanOpLimit}
                      onChange={v => handleLimitChange(setCleanOpLimit, v)}
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
                    <Label className="text-xs text-muted-foreground">Кредитные потери</Label>
                    <FormattedInput
                      value={creditOpLimit}
                      onChange={v => handleLimitChange(setCreditOpLimit, v)}
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
                    <Label className="text-xs text-muted-foreground">Косвенные потери</Label>
                    <FormattedInput
                      value={indirectLimit}
                      onChange={v => handleLimitChange(setIndirectLimit, v)}
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

              {/* === Block B: Потенциальные потери (read-only) === */}
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h3 className="text-base font-semibold">Потенциальные потери</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Прямые потери</p>
                    <p className="text-base font-medium">{formatNum(totals.cleanOp)} <span className="text-sm font-normal text-muted-foreground">₽</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Кредитные потери</p>
                    <p className="text-base font-medium">{formatNum(totals.creditOp)} <span className="text-sm font-normal text-muted-foreground">₽</span></p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Косвенные потери</p>
                    <p className="text-base font-medium">{formatNum(totals.indirect)} <span className="text-sm font-normal text-muted-foreground">₽</span></p>
                  </div>
                </div>
              </div>

              {/* === Block C: Решение по риску === */}
              <div className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h3 className="text-base font-semibold">Решение по риску</h3>
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
                {scenarios.map((scenario, index) => {
                  const scenarioTotal = scenario.cleanOp + scenario.creditOp + scenario.indirect;
                  return (
                    <CollapsibleScenario
                      key={scenario.id}
                      scenario={scenario}
                      index={index}
                      scenarioTotal={scenarioTotal}
                      percentage={scenarioPercentages[index]}
                      onRemove={() => removeScenario(scenario.id)}
                      canRemove={scenarios.length > 1}
                      onUpdate={(field, value) => updateScenario(scenario.id, field, value)}
                    />
                  );
                })}

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
        <div className={cn(
          "rounded-xl border border-border bg-card overflow-hidden transition-shadow",
          currentStep === 3 && "shadow-sm"
        )}>
          {renderStepHeader(3, 'Зеркалирование')}

          {currentStep === 3 && (
            <div className="px-5 pb-6 pt-2 space-y-4 border-t border-border">
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
                          {subdivisionsList.map(s => (
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
                      <p className="text-sm font-medium">{formatNum(mirrorLimits[idx]?.cleanOp || 0)} <span className="text-xs font-normal text-muted-foreground">₽</span></p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Лимит: Кредитные</p>
                      <p className="text-sm font-medium">{formatNum(mirrorLimits[idx]?.creditOp || 0)} <span className="text-xs font-normal text-muted-foreground">₽</span></p>
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border">
                      <p className="text-xs text-muted-foreground mb-0.5">Лимит: Косвенные</p>
                      <p className="text-sm font-medium">{formatNum(mirrorLimits[idx]?.indirect || 0)} <span className="text-xs font-normal text-muted-foreground">₽</span></p>
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
      </div>
    </FullscreenLightbox>
  );
}
