import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Trash2, AlertTriangle, Sparkles, Check, ChevronDown, ChevronRight, X, Eye } from 'lucide-react';
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
  causeType?: string;
  itService?: string;
}

const causeTypes = [
  'Человеческий фактор',
  'Сбой ИТ-систем',
  'Внешнее воздействие',
  'Нарушение процесса',
  'Мошенничество',
];

const itServices = [
  'Супербанк Онлайн',
  'АБС',
  'CRM',
  'Процессинг',
  'ДБО',
  'Хранилище данных',
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

function ClearableSelect({
  value,
  onValueChange,
  onClear,
  placeholder,
  options,
  label,
}: {
  value?: string;
  onValueChange: (v: string) => void;
  onClear: () => void;
  placeholder: string;
  options: string[];
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        <Select value={value || ''} onValueChange={onValueChange}>
          <SelectTrigger className="h-9 pr-8">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function ExtraParamsBlock({
  causeType,
  itService,
  onCauseTypeChange,
  onItServiceChange,
}: {
  causeType?: string;
  itService?: string;
  onCauseTypeChange: (v: string) => void;
  onItServiceChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(!!(causeType || itService));
  const hasBothFilled = !!(causeType && itService);
  const hasAnyFilled = !!(causeType || itService);

  const handleRemoveAll = () => {
    if (hasBothFilled) {
      if (!window.confirm('Удалить опции?')) return;
    }
    onCauseTypeChange('');
    onItServiceChange('');
    setOpen(false);
  };

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Дополнительные параметры
        </button>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Дополнительные параметры</span>
            <button
              type="button"
              onClick={handleRemoveAll}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Удалить опции
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ClearableSelect
              value={causeType}
              onValueChange={onCauseTypeChange}
              onClear={() => onCauseTypeChange('')}
              placeholder="Выберите тип"
              options={causeTypes}
              label="Тип причины"
            />
            <ClearableSelect
              value={itService}
              onValueChange={onItServiceChange}
              onClear={() => onItServiceChange('')}
              placeholder="Выберите услугу"
              options={itServices}
              label="ИТ-услуга"
            />
          </div>
        </div>
      )}
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
      <div className="flex items-center gap-3 px-5 py-3.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          disabled={!canRemove}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-border">

          <Textarea
            value={scenario.description}
            onChange={e => onUpdate('description', e.target.value)}
            placeholder="Опишите сценарий реализации риска..."
            className="min-h-[80px]"
          />

          <p className="text-xs font-medium text-muted-foreground mt-1">Потенциальные потери по сценарию</p>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Чистые</Label>
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

          {/* Optional extra params */}
          <ExtraParamsBlock
            causeType={scenario.causeType}
            itService={scenario.itService}
            onCauseTypeChange={(v) => onUpdate('causeType', v)}
            onItServiceChange={(v) => onUpdate('itService', v)}
          />
        </div>
      )}
    </div>
  );
}

export function RiskWizardForm({ isOpen, onClose, onSave, editRisk }: RiskWizardFormProps) {
  const isEditMode = !!editRisk;

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<WizardStep>>(new Set());

  // Step 1
  const [process, setProcess] = useState(editRisk?.process || '');
  const [riskProfile, setRiskProfile] = useState(editRisk?.riskProfile || '');

  // Step 2
  const [strategy, setStrategy] = useState(editRisk?.responseStrategy || '');
  const [qualitativeLosses, setQualitativeLosses] = useState(editRisk?.qualitativeLosses || '');

  const buildScenariosFromRisk = (risk: Risk | null | undefined): ScenarioFormData[] => {
    if (risk?.scenarios && risk.scenarios.length > 0) {
      return risk.scenarios.map(s => ({
        id: s.id,
        description: s.description,
        cleanOp: Math.round((risk.cleanOpRisk.value || 0) * s.percentage / 100),
        creditOp: Math.round((risk.creditOpRisk.value || 0) * s.percentage / 100),
        indirect: Math.round((risk.indirectLosses.value || 0) * s.percentage / 100),
        probability: 0,
        causeType: s.causeType,
        itService: s.itService,
      }));
    }
    return [];
  };

  const [scenarios, setScenarios] = useState<ScenarioFormData[]>(() => buildScenariosFromRisk(editRisk));

  const [cleanOpLimit, setCleanOpLimit] = useState(editRisk?.cleanOpRisk?.limit || 0);
  const [creditOpLimit, setCreditOpLimit] = useState(editRisk?.creditOpRisk?.limit || 0);
  const [indirectLimit, setIndirectLimit] = useState(editRisk?.indirectLosses?.limit || 0);

  // Step 3 — mirrors with editable limits per mirror
  const [mirrors, setMirrors] = useState<Mirror[]>(editRisk?.mirrors || []);
  
  // Per-mirror editable limits (keyed by mirror id)
  const [mirrorEditLimits, setMirrorEditLimits] = useState<Record<string, { cleanOp: number; creditOp: number; indirect: number }>>({});

  // Limits memo state — observe the limits block
  const limitsRef = useRef<HTMLDivElement>(null);
  const [limitsOutOfView, setLimitsOutOfView] = useState(false);
  const [memoDismissed, setMemoDismissed] = useState(false);

  // Reset all form state when editRisk changes or wizard opens/closes
  useEffect(() => {
    // Edit mode opens at step 2 (Risk Assessment) by default
    setCurrentStep(isEditMode ? 2 : 1);
    setCompletedSteps(isEditMode ? new Set<WizardStep>([1]) : new Set());
    setProcess(editRisk?.process || '');
    setRiskProfile(editRisk?.riskProfile || '');
    setStrategy(editRisk?.responseStrategy || '');
    setQualitativeLosses(editRisk?.qualitativeLosses || '');
    setScenarios(buildScenariosFromRisk(editRisk));
    setCleanOpLimit(editRisk?.cleanOpRisk?.limit || 0);
    setCreditOpLimit(editRisk?.creditOpRisk?.limit || 0);
    setIndirectLimit(editRisk?.indirectLosses?.limit || 0);
    setMirrors(editRisk?.mirrors || []);
    setMirrorEditLimits({});
    setMemoDismissed(false);
    setLimitsOutOfView(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRisk?.id, isOpen]);


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

  const getMirrorLimitValues = (mirrorId: string, idx: number) => {
    if (mirrorEditLimits[mirrorId]) return mirrorEditLimits[mirrorId];
    return mirrorLimits[idx] || { cleanOp: 0, creditOp: 0, indirect: 0 };
  };

  const updateMirrorLimit = (mirrorId: string, field: 'cleanOp' | 'creditOp' | 'indirect', value: number) => {
    setMirrorEditLimits(prev => ({
      ...prev,
      [mirrorId]: { ...(prev[mirrorId] || { cleanOp: 0, creditOp: 0, indirect: 0 }), [field]: value },
    }));
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
    setCompletedSteps(prev => new Set(prev).add(1));
    setCurrentStep(2);
  };

  const handleContinueToStep3 = () => {
    setCompletedSteps(prev => new Set(prev).add(2));
    setCurrentStep(3);
  };

  const handleGoToStep = (step: WizardStep) => {
    // Always allow free navigation — both in create and edit mode
    setCurrentStep(step);
  };

  const handleSave = () => {

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
        causeType: s.causeType,
        itService: s.itService,
      })),
      mirrors,
      author: editRisk?.author || 'Садыков Илья',
      createdAt: editRisk?.createdAt || new Date().toLocaleDateString('ru-RU'),
      source: editRisk?.source || 'Ручное создание',
    };

    onSave(newRisk);
    // Note: onClose is handled by the parent (Index.tsx) after onSave to allow navigation logic
  };

  const step1Valid = !!process && !!riskProfile;
  const step2Valid = scenarios.length > 0 && !!strategy;

  const steps = [
    { num: 1 as WizardStep, label: 'Общая информация' },
    { num: 2 as WizardStep, label: 'Оценка рисков' },
    { num: 3 as WizardStep, label: 'Зеркалирование' },
  ];

  // Risk level badge — shown in header
  const riskLevelForHeader: Risk['riskLevel'] | null = isEditMode
    ? calculatedRiskLevel
    : (totals.total > 0 ? calculatedRiskLevel : null);

  const headerContent = (
    <div className="flex items-start gap-4 min-w-0 flex-1">
      {/* Title block */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <h1 className="text-lg font-semibold leading-snug line-clamp-2">
          {editRisk ? `${editRisk.id}: ${editRisk.riskName}` : 'Создание риска'}
        </h1>
        {/* In edit mode show process/profile context; in create mode keep header stable */}
        {editRisk && (
          <p className="text-sm text-muted-foreground truncate">
            {editRisk.process}
            {editRisk.riskProfile && ` • ${editRisk.riskProfile}`}
          </p>
        )}
      </div>

      {/* Risk level block — stable, always present */}
      <div className="shrink-0 flex flex-col items-end gap-1 pl-4 border-l border-border ml-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
          Уровень риска
        </span>
        {riskLevelForHeader ? (
          <RiskLevelBadge level={riskLevelForHeader} />
        ) : (
          <span className="text-xs px-2.5 py-0.5 rounded-md font-medium border border-muted-foreground/20 bg-muted/40 text-muted-foreground">
            Не оценён
          </span>
        )}
      </div>
    </div>
  );

  const footerContent = (
    <div className="flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onClose}>Отмена</Button>
      <Button onClick={handleSave}>
        Сохранить
      </Button>
    </div>
  );

  // Limits memo — rendered as a separate floating element above footer
  const limitsMemoElement = (
    <>
      {showLimitsMemo && (
        <div className="sticky bottom-0 z-10 mx-auto px-8" style={{ maxWidth: '1240px' }}>
          <div className="flex items-start gap-6 px-4 py-3 rounded-lg border border-border bg-card shadow-sm">
            {/* Лимиты */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Лимиты</p>
              <div className="flex items-center gap-5">
                <span className="text-xs">
                  <span className="text-muted-foreground">Чистые </span>
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
            </div>
            {/* Потенциальные потери */}
            <div className="flex-1 min-w-0 border-l border-border pl-6">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Потенциальные</p>
              <div className="flex items-center gap-5">
                <span className="text-xs">
                  <span className="text-muted-foreground">Чистые </span>
                  <span className="font-semibold text-foreground">{formatNum(totals.cleanOp)} ₽</span>
                </span>
                <span className="text-xs">
                  <span className="text-muted-foreground">Кредитные </span>
                  <span className="font-semibold text-foreground">{formatNum(totals.creditOp)} ₽</span>
                </span>
                <span className="text-xs">
                  <span className="text-muted-foreground">Косвенные </span>
                  <span className="font-semibold text-foreground">{formatNum(totals.indirect)} ₽</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setMemoDismissed(true)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors shrink-0 self-start"
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
    // In edit mode all steps are always accessible
    const isDisabled = false;

    // Step validity indicator — all steps always accessible, show completion state
    const getStepState = () => {
      if (isActive) return 'active';
      if (isCompleted) return 'completed';
      return 'accessible';
    };
    const stepState = getStepState();

    return (
      <button
        onClick={() => handleGoToStep(step)}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-3 w-full px-5 py-4 text-left transition-colors",
          isActive && "rounded-t-xl",
          !isActive && "rounded-xl hover:bg-muted/40",
        )}
      >
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
          stepState === 'completed' ? "bg-primary text-primary-foreground" : stepState === 'active' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}>
          {stepState === 'completed' && !isActive ? <Check className="w-3 h-3" /> : step}
        </div>
        <span className="text-base font-semibold flex-1">{label}</span>
        {isActive ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
    );
  };

  const stepperContent = (
    <div className="py-3">
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isActive = currentStep === step.num;
          const isCompleted = completedSteps.has(step.num);
          // All steps always accessible — no blocking in create or edit mode
          return (
            <div key={step.num} className="flex items-center flex-1">
              <button
                onClick={() => handleGoToStep(step.num)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-1.5 rounded-lg transition-colors w-full",
                  isActive && "bg-primary/10 text-primary",
                  !isActive && isCompleted && "text-primary hover:bg-primary/5",
                  !isActive && !isCompleted && "text-muted-foreground hover:bg-muted",
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
  );

  return (
    <FullscreenLightbox
      isOpen={isOpen}
      onClose={onClose}
      title=""
      headerContent={headerContent}
      wide
      footer={footerContent}
      floatingAboveFooter={limitsMemoElement}
      stickySubHeader={stepperContent}
    >
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

              {/* Продолжить — in both modes, not a gate */}
              <div className="flex justify-end pt-2">
                <Button variant={isEditMode ? "outline" : "default"} onClick={handleContinueToStep2}>
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
              {/* In edit mode show a subtle context hint; in create mode — no AI banner */}
              {isEditMode && (
                <div className="p-4 rounded-xl border border-[hsl(var(--ai-alert-border))]" style={{ backgroundColor: 'hsl(var(--ai-alert))' }}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(var(--ai-alert-foreground))' }} />
                    <p className="text-sm" style={{ color: 'hsl(var(--ai-alert-foreground))' }}>
                      Оценка и сценарии загружены из текущих данных риска. Проверьте и скорректируйте при необходимости.
                    </p>
                  </div>
                </div>
              )}

              {/* === Рамка 1: Лимиты === */}
              <div ref={limitsRef} className="p-6 rounded-xl border border-border bg-card space-y-4">
                <h3 className="text-base font-semibold">Лимиты</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Чистые</Label>
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

              {/* === Рамка 2: Потенциальные потери + Сценарии === */}
              <div className="p-6 rounded-xl border border-border bg-card space-y-5">
                <div className="space-y-0.5">
                  <h3 className="text-base font-semibold">Потенциальные потери</h3>
                  <p className="text-[12px] text-muted-foreground leading-normal">
                    Рассчитываются из сценариев. Мелкие случаи можно объединять.
                  </p>
                </div>

                {/* Read-only totals */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Чистые</p>
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

                {/* Scenarios inside this frame */}
                <div className="space-y-3 pt-1">
                  {scenarios.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      Сценарии ещё не добавлены. Нажмите «Добавить сценарий» ниже.
                    </p>
                  )}
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
              </div>

              {/* === Решение по риску === */}
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

              {/* Продолжить — in both modes, not a gate */}
              <div className="flex justify-end pt-2">
                <Button variant={isEditMode ? "outline" : "default"} onClick={handleContinueToStep3}>
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

              {mirrors.map((mirror, idx) => {
                const lv = getMirrorLimitValues(mirror.id, idx);
                return (
                <div key={mirror.id} className="p-5 rounded-xl bg-muted/40 border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Зеркало {idx + 1}</h4>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeMirror(mirror.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

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

                  {/* Mirror limits — editable */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Чистые</Label>
                      <FormattedInput
                        value={lv.cleanOp}
                        onChange={v => updateMirrorLimit(mirror.id, 'cleanOp', v)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Кредитные потери</Label>
                      <FormattedInput
                        value={lv.creditOp}
                        onChange={v => updateMirrorLimit(mirror.id, 'creditOp', v)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Косвенные потери</Label>
                      <FormattedInput
                        value={lv.indirect}
                        onChange={v => updateMirrorLimit(mirror.id, 'indirect', v)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                );
              })}

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
