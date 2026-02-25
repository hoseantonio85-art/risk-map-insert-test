import { useState, useMemo } from 'react';
import { Plus, Pencil, Save, Send, X, ListTodo, CheckSquare, AlertTriangle, LayoutList, FolderKanban, SlidersHorizontal, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/risks/MetricCard';
import { RiskRow } from '@/components/risks/RiskRow';
import { ProcessCard } from '@/components/risks/ProcessCard';
import { RiskWizardForm } from '@/components/risks/RiskWizardForm';
import { RiskDetailView } from '@/components/risks/RiskDetailView';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { mockRisks } from '@/data/mockRisks';
import { Risk } from '@/types/risk';

type ViewMode = 'list' | 'processes';
type ScreenMode = 'view' | 'edit';
type PageMode = 'all' | 'my-events' | 'mirroring';

interface DraftLimits {
  [riskId: string]: {
    cleanOpRisk: number;
    creditOpRisk: number;
    indirectLosses: number;
    potentialLosses: number;
  };
}

const Index = () => {
  const [risks, setRisks] = useState<Risk[]>(mockRisks);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [wizardEditRisk, setWizardEditRisk] = useState<Risk | null>(null);
  
  const [screenMode, setScreenMode] = useState<ScreenMode>('view');
  const [draftLimits, setDraftLimits] = useState<DraftLimits>({});
  const [pendingChanges, setPendingChanges] = useState<DraftLimits>({});

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRiskIds, setSelectedRiskIds] = useState<Set<string>>(new Set());

  // Filter state
  const [pageMode, setPageMode] = useState<PageMode>('all');
  const [showTasksOnly, setShowTasksOnly] = useState(false);
  const [showHighRiskOnly, setShowHighRiskOnly] = useState(false);
  const [selectedSubdivision, setSelectedSubdivision] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026');
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Widget expand state — synchronized across all 4
  const [widgetsExpanded, setWidgetsExpanded] = useState(false);

  const subdivisions = useMemo(() => {
    return [...new Set(risks.map(r => r.subdivision))];
  }, [risks]);

  const filteredRisks = useMemo(() => {
    let filtered = risks;
    if (showTasksOnly) {
      filtered = filtered.filter(r => r.status === 'В работе' || r.status === 'На согласовании');
    }
    if (showHighRiskOnly) {
      filtered = filtered.filter(r => r.riskLevel === 'Высокий');
    }
    if (selectedSubdivision !== 'all') {
      filtered = filtered.filter(r => r.subdivision === selectedSubdivision);
    }
    if (selectedProcessFilter) {
      filtered = filtered.filter(r => r.process === selectedProcessFilter);
    }
    return filtered;
  }, [risks, showTasksOnly, showHighRiskOnly, selectedSubdivision, selectedProcessFilter]);

  const riskLevelPriority: Record<string, number> = { 'Низкий': 0, 'Средний': 1, 'Высокий': 2, 'Критичный': 3 };

  const processGroups = useMemo(() => {
    const groups: Record<string, {
      processName: string;
      risks: Risk[];
      directLosses: number;
      creditLosses: number;
      indirectLosses: number;
      potentialLosses: number;
      directLimit: number;
      creditLimit: number;
      indirectLimit: number;
      maxRiskLevel: string;
      statusBreakdown: Record<string, number>;
    }> = {};

    filteredRisks.forEach(risk => {
      const key = risk.process || 'Без процесса';
      if (!groups[key]) {
        groups[key] = {
          processName: key,
          risks: [],
          directLosses: 0,
          creditLosses: 0,
          indirectLosses: 0,
          potentialLosses: 0,
          directLimit: 0,
          creditLimit: 0,
          indirectLimit: 0,
          maxRiskLevel: 'Низкий',
          statusBreakdown: {},
        };
      }
      const g = groups[key];
      g.risks.push(risk);
      g.directLosses += risk.cleanOpRisk.value || 0;
      g.creditLosses += risk.creditOpRisk.value || 0;
      g.indirectLosses += risk.indirectLosses.value || 0;
      g.potentialLosses += risk.potentialLosses || 0;
      g.directLimit += risk.cleanOpRisk.limit || 0;
      g.creditLimit += risk.creditOpRisk.limit || 0;
      g.indirectLimit += risk.indirectLosses.limit || 0;
      if ((riskLevelPriority[risk.riskLevel] || 0) > (riskLevelPriority[g.maxRiskLevel] || 0)) {
        g.maxRiskLevel = risk.riskLevel;
      }
      g.statusBreakdown[risk.status] = (g.statusBreakdown[risk.status] || 0) + 1;
    });

    return Object.values(groups).sort((a, b) =>
      (riskLevelPriority[b.maxRiskLevel] || 0) - (riskLevelPriority[a.maxRiskLevel] || 0)
    );
  }, [filteredRisks]);

  const aggregates = useMemo(() => {
    const limitsToUse = screenMode === 'edit' ? draftLimits : pendingChanges;
    let cleanOpTotal = 0, cleanOpLimit = 0;
    let creditOpTotal = 0, creditOpLimit = 0;
    let indirectTotal = 0, indirectLimit = 0;
    let potentialTotal = 0;
    // For potential breakdown
    let potClean = 0, potCredit = 0, potIndirect = 0;

    filteredRisks.forEach(risk => {
      const draft = limitsToUse[risk.id];
      cleanOpTotal += risk.cleanOpRisk.value || 0;
      cleanOpLimit += draft?.cleanOpRisk ?? (risk.cleanOpRisk.limit || 0);
      creditOpTotal += risk.creditOpRisk.value || 0;
      creditOpLimit += draft?.creditOpRisk ?? (risk.creditOpRisk.limit || 0);
      indirectTotal += risk.indirectLosses.value || 0;
      indirectLimit += draft?.indirectLosses ?? (risk.indirectLosses.limit || 0);
      potentialTotal += risk.potentialLosses || 0;
      // Simple breakdown — attribute potential proportionally
      potClean += risk.cleanOpRisk.value || 0;
      potCredit += risk.creditOpRisk.value || 0;
      potIndirect += risk.indirectLosses.value || 0;
    });

    // Forecast — simple estimate (limit * 1.05)
    const cleanForecast = Math.round(cleanOpTotal * 1.05 * 10) / 10;
    const creditForecast = Math.round(creditOpTotal * 1.05 * 10) / 10;
    const indirectForecast = Math.round(indirectTotal * 1.05 * 10) / 10;

    return {
      cleanOpRisk: { total: cleanOpTotal, limit: cleanOpLimit, utilization: cleanOpLimit > 0 ? Math.round((cleanOpTotal / cleanOpLimit) * 100) : 0, forecast: cleanForecast },
      creditOpRisk: { total: creditOpTotal, limit: creditOpLimit, utilization: creditOpLimit > 0 ? Math.round((creditOpTotal / creditOpLimit) * 100) : 0, forecast: creditForecast },
      indirectLosses: { total: indirectTotal, limit: indirectLimit, utilization: indirectLimit > 0 ? Math.round((indirectTotal / indirectLimit) * 100) : 0, forecast: indirectForecast },
      potentialLosses: { total: potentialTotal, cleanBreakdown: potClean, creditBreakdown: potCredit, indirectBreakdown: potIndirect },
    };
  }, [filteredRisks, screenMode, draftLimits, pendingChanges]);

  const handleRiskClick = (risk: Risk) => {
    setSelectedRisk(risk);
    setIsDetailOpen(true);
  };

  const handleOpenWizardCreate = () => {
    setWizardEditRisk(null);
    setIsWizardOpen(true);
  };

  const handleOpenWizardEdit = (risk: Risk) => {
    setWizardEditRisk(risk);
    setIsDetailOpen(false);
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    if (wizardEditRisk) {
      setIsWizardOpen(false);
      setSelectedRisk(wizardEditRisk);
      setIsDetailOpen(true);
      setWizardEditRisk(null);
    } else {
      setIsWizardOpen(false);
      setWizardEditRisk(null);
    }
  };

  const handleWizardSave = (riskData: Partial<Risk>) => {
    if (wizardEditRisk) {
      const updatedRisk: Risk = { ...wizardEditRisk, ...riskData };
      setRisks(prev => prev.map(r => r.id === wizardEditRisk.id ? updatedRisk : r));
      setIsWizardOpen(false);
      setSelectedRisk(updatedRisk);
      setIsDetailOpen(true);
      setWizardEditRisk(null);
    } else {
      const fullRisk: Risk = {
        ...riskData,
        id: riskData.id || `QNR-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'В работе',
        block: 'Блок Сеть продаж',
        subdivision: riskData.subdivision || 'Управление продаж и обслуживания',
        process: riskData.process || '',
        riskName: riskData.riskProfile || '',
        riskLevel: riskData.riskLevel || 'Низкий',
        riskProfile: riskData.riskProfile || '',
        cleanOpRisk: riskData.cleanOpRisk || { value: 0, utilization: 0 },
        creditOpRisk: riskData.creditOpRisk || { value: 0, utilization: 0 },
        indirectLosses: riskData.indirectLosses || { value: 0, utilization: 0 },
        potentialLosses: riskData.potentialLosses || 0,
        responseStrategy: riskData.responseStrategy || '',
        qualitativeLosses: riskData.qualitativeLosses || '',
        scenarios: riskData.scenarios || [],
        mirrors: riskData.mirrors || [],
        author: 'Садыков Илья',
        createdAt: new Date().toLocaleDateString('ru-RU'),
        source: 'Ручное создание',
      } as Risk;
      setRisks(prev => [...prev, fullRisk]);
      setIsWizardOpen(false);
      setWizardEditRisk(null);
    }
  };

  const handleLimitChange = (riskId: string, field: 'cleanOpRisk' | 'creditOpRisk' | 'indirectLosses' | 'potentialLosses', value: number) => {
    const risk = risks.find(r => r.id === riskId);
    setDraftLimits(prev => ({
      ...prev,
      [riskId]: {
        cleanOpRisk: prev[riskId]?.cleanOpRisk ?? (risk?.cleanOpRisk.limit || 0),
        creditOpRisk: prev[riskId]?.creditOpRisk ?? (risk?.creditOpRisk.limit || 0),
        indirectLosses: prev[riskId]?.indirectLosses ?? (risk?.indirectLosses.limit || 0),
        potentialLosses: prev[riskId]?.potentialLosses ?? (risk?.potentialLosses || 0),
        [field]: value,
      },
    }));
  };

  const handleStartEdit = () => {
    const initialDraft: DraftLimits = {};
    risks.forEach(risk => {
      initialDraft[risk.id] = pendingChanges[risk.id] || {
        cleanOpRisk: risk.cleanOpRisk.limit || 0,
        creditOpRisk: risk.creditOpRisk.limit || 0,
        indirectLosses: risk.indirectLosses.limit || 0,
        potentialLosses: risk.potentialLosses || 0,
      };
    });
    setDraftLimits(initialDraft);
    setSelectionMode(false);
    setSelectedRiskIds(new Set());
    setScreenMode('edit');
  };

  const handleCancelEdit = () => {
    setDraftLimits({});
    setScreenMode('view');
  };

  const handleSaveLimits = () => {
    setPendingChanges(draftLimits);
    setScreenMode('view');
  };

  const handleSendForApproval = () => {
    const idsToSend = selectionMode && selectedRiskIds.size > 0
      ? [...selectedRiskIds]
      : Object.keys(pendingChanges);

    setRisks(risks.map(r => {
      if (idsToSend.includes(r.id) && pendingChanges[r.id]) {
        return {
          ...r,
          status: 'На согласовании' as const,
          cleanOpRisk: { ...r.cleanOpRisk, limit: pendingChanges[r.id].cleanOpRisk },
          creditOpRisk: { ...r.creditOpRisk, limit: pendingChanges[r.id].creditOpRisk },
          indirectLosses: { ...r.indirectLosses, limit: pendingChanges[r.id].indirectLosses },
        };
      }
      return r;
    }));
    setPendingChanges({});
    setDraftLimits({});
    setSelectionMode(false);
    setSelectedRiskIds(new Set());
  };

  const handleReturnForRevision = () => {
    setRisks(risks.map(r => r.status === 'На согласовании' ? { ...r, status: 'В работе' as const } : r));
  };

  const handleToggleSelect = (riskId: string) => {
    setSelectedRiskIds(prev => {
      const next = new Set(prev);
      if (next.has(riskId)) next.delete(riskId);
      else next.add(riskId);
      return next;
    });
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedRiskIds(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const pendingChangesCount = Object.keys(pendingChanges).filter(id => {
    const risk = risks.find(r => r.id === id);
    const pending = pendingChanges[id];
    if (!risk || !pending) return false;
    return (
      pending.cleanOpRisk !== (risk.cleanOpRisk.limit || 0) ||
      pending.creditOpRisk !== (risk.creditOpRisk.limit || 0) ||
      pending.indirectLosses !== (risk.indirectLosses.limit || 0) ||
      pending.potentialLosses !== (risk.potentialLosses || 0)
    );
  }).length;

  const awaitingApprovalCount = risks.filter(r => r.status === 'На согласовании').length;
  const tasksCount = risks.filter(r => r.status === 'В работе' || r.status === 'На согласовании').length;
  const highRiskCount = risks.filter(r => r.riskLevel === 'Высокий').length;

  const fmtMln = (v: number) => `${v.toLocaleString('ru-RU')} млн руб.`;

  // Advanced filter state
  const hasAdvancedFilters = selectedSubdivision !== 'all' || selectedPeriod !== '2026';

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* === HEADER === */}
        <div className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">Карта рисков</h1>
              {screenMode === 'edit' && (
                <Badge variant="default" className="gap-1.5">Режим редактирования</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {screenMode === 'view' && (
                <>
                  <Button variant="outline" onClick={handleStartEdit} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Редактировать лимиты
                  </Button>
                  <Button onClick={handleOpenWizardCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Создать риск
                  </Button>
                </>
              )}
              {screenMode === 'edit' && (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                    Отмена
                  </Button>
                  <Button onClick={handleSaveLimits} className="gap-2">
                    <Save className="w-4 h-4" />
                    Сохранить
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* === SCROLLABLE CONTENT === */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Section title */}
            <h2 className="text-base font-semibold text-foreground">Потери от операционных рисков</h2>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                title="Чистые"
                value={fmtMln(aggregates.cleanOpRisk.total)}
                subValue={`из ${fmtMln(aggregates.cleanOpRisk.limit)}`}
                utilization={aggregates.cleanOpRisk.utilization}
                isExpanded={widgetsExpanded}
                onToggleExpand={() => setWidgetsExpanded(!widgetsExpanded)}
                detailRows={[
                  { label: 'Лимит', value: `${fmtMln(aggregates.cleanOpRisk.limit)}` },
                  { label: 'Прогноз', value: `${fmtMln(aggregates.cleanOpRisk.forecast)}` },
                  { label: 'Лимит после ребаджета', value: '—' },
                ]}
              />
              <MetricCard
                title="Кредитные"
                value={fmtMln(aggregates.creditOpRisk.total)}
                subValue={`из ${fmtMln(aggregates.creditOpRisk.limit)}`}
                utilization={aggregates.creditOpRisk.utilization}
                isExpanded={widgetsExpanded}
                onToggleExpand={() => setWidgetsExpanded(!widgetsExpanded)}
                detailRows={[
                  { label: 'Лимит', value: `${fmtMln(aggregates.creditOpRisk.limit)}` },
                  { label: 'Прогноз', value: `${fmtMln(aggregates.creditOpRisk.forecast)}` },
                  { label: 'Лимит после ребаджета', value: '—' },
                ]}
              />
              <MetricCard
                title="Косвенные"
                value={fmtMln(aggregates.indirectLosses.total)}
                subValue={`из ${fmtMln(aggregates.indirectLosses.limit)}`}
                utilization={aggregates.indirectLosses.utilization}
                isExpanded={widgetsExpanded}
                onToggleExpand={() => setWidgetsExpanded(!widgetsExpanded)}
                detailRows={[
                  { label: 'Лимит', value: `${fmtMln(aggregates.indirectLosses.limit)}` },
                  { label: 'Прогноз', value: `${fmtMln(aggregates.indirectLosses.forecast)}` },
                  { label: 'Лимит после ребаджета', value: '—' },
                ]}
              />
              <MetricCard
                title="Потенциальные"
                value={fmtMln(aggregates.potentialLosses.total)}
                utilization={0}
                showDonut={false}
                isExpanded={widgetsExpanded}
                onToggleExpand={() => setWidgetsExpanded(!widgetsExpanded)}
                detailRows={[
                  { label: 'Чистые', value: `${fmtMln(aggregates.potentialLosses.cleanBreakdown)}` },
                  { label: 'Кредитные', value: `${fmtMln(aggregates.potentialLosses.creditBreakdown)}` },
                  { label: 'Косвенные', value: `${fmtMln(aggregates.potentialLosses.indirectBreakdown)}` },
                ]}
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              {/* Left: mode toggles */}
              <ToggleGroup
                type="single"
                value={pageMode}
                onValueChange={(val) => { if (val) setPageMode(val as PageMode); }}
              >
                <ToggleGroupItem value="all" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  Все
                </ToggleGroupItem>
                <ToggleGroupItem value="my-events" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Мои события
                </ToggleGroupItem>
                <ToggleGroupItem value="mirroring" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Зеркалирование
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="h-6 w-px bg-border" />

              {/* Quick status filters */}
              <ToggleGroup
                type="single"
                value={showTasksOnly ? 'tasks' : (showHighRiskOnly ? 'high' : '')}
                onValueChange={(val) => {
                  setShowTasksOnly(val === 'tasks');
                  setShowHighRiskOnly(val === 'high');
                }}
              >
                <ToggleGroupItem value="tasks" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <ListTodo className="w-3.5 h-3.5" />
                  Задачи
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-background/20 font-medium">{tasksCount}</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="high" className="gap-1.5 px-3 data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Высокий уровень
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-md bg-background/20 font-medium">{highRiskCount}</span>
                </ToggleGroupItem>
              </ToggleGroup>

              <div className="h-6 w-px bg-border" />

              {/* Advanced filters */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Фильтры
                    {hasAdvancedFilters && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 space-y-4" align="start">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Подразделение</label>
                    <Select value={selectedSubdivision} onValueChange={setSelectedSubdivision}>
                      <SelectTrigger>
                        <SelectValue placeholder="Подразделение" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все подразделения</SelectItem>
                        {subdivisions.map(sub => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Год</label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Период" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                        <SelectItem value="2026">2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {hasAdvancedFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedSubdivision('all');
                        setSelectedPeriod('2026');
                      }}
                    >
                      Сбросить фильтры
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              <div className="flex-1" />

              {/* Right: view switcher */}
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(val) => { if (val) setViewMode(val as ViewMode); }}
              >
                <ToggleGroupItem value="list" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <LayoutList className="w-3.5 h-3.5" />
                  Риски
                </ToggleGroupItem>
                <ToggleGroupItem value="processes" className="gap-1.5 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <FolderKanban className="w-3.5 h-3.5" />
                  Процессы
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Active process filter chip */}
            {selectedProcessFilter && (
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="gap-1.5 pr-1">
                  Процесс: {selectedProcessFilter}
                  <button
                    onClick={() => { setSelectedProcessFilter(null); setViewMode('list'); }}
                    className="ml-1 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}

            {/* Risk List or Process Cards */}
            {viewMode === 'list' ? (
              <div className="space-y-2">
                {filteredRisks.map((risk) => (
                  <RiskRow
                    key={risk.id}
                    risk={risk}
                    mode={screenMode}
                    draftLimits={screenMode === 'edit' ? draftLimits[risk.id] : undefined}
                    onLimitChange={handleLimitChange}
                    onRiskClick={handleRiskClick}
                    selectionMode={selectionMode}
                    isSelected={selectedRiskIds.has(risk.id)}
                    onToggleSelect={handleToggleSelect}
                  />
                ))}
                {filteredRisks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Нет рисков, соответствующих выбранным фильтрам
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {processGroups.map((group) => (
                  <ProcessCard
                    key={group.processName}
                    processName={group.processName}
                    riskCount={group.risks.length}
                    maxRiskLevel={group.maxRiskLevel as any}
                    statusBreakdown={group.statusBreakdown}
                    directLosses={group.directLosses}
                    creditLosses={group.creditLosses}
                    indirectLosses={group.indirectLosses}
                    potentialLosses={group.potentialLosses}
                    directUtilization={group.directLimit > 0 ? Math.round((group.directLosses / group.directLimit) * 100) : 0}
                    creditUtilization={group.creditLimit > 0 ? Math.round((group.creditLosses / group.creditLimit) * 100) : 0}
                    indirectUtilization={group.indirectLimit > 0 ? Math.round((group.indirectLosses / group.indirectLimit) * 100) : 0}
                    onClick={() => {
                      setSelectedProcessFilter(group.processName);
                      setViewMode('list');
                    }}
                  />
                ))}
                {processGroups.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    Нет процессов, соответствующих выбранным фильтрам
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === FOOTER: Workflow (View mode only) === */}
        {screenMode === 'view' && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant={selectionMode ? 'default' : 'ghost'}
                  size="sm"
                  onClick={toggleSelectionMode}
                  className="gap-1.5"
                >
                  <CheckSquare className="w-4 h-4" />
                  {selectionMode ? `Отменить выбор (${selectedRiskIds.size})` : 'Выбрать несколько'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {pendingChangesCount > 0 && (
                    <span><span className="font-medium text-foreground">{pendingChangesCount}</span> с изменёнными лимитами</span>
                  )}
                  {pendingChangesCount > 0 && awaitingApprovalCount > 0 && ' • '}
                  {awaitingApprovalCount > 0 && (
                    <span><span className="font-medium text-foreground">{awaitingApprovalCount}</span> на согласовании</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={awaitingApprovalCount === 0}
                  onClick={handleReturnForRevision}
                >
                  Вернуть на доработку
                </Button>
                <Button
                  disabled={pendingChangesCount === 0 && !(selectionMode && selectedRiskIds.size > 0)}
                  className="gap-2"
                  onClick={handleSendForApproval}
                >
                  <Send className="w-4 h-4" />
                  Отправить на согласование
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Wizard: Create / Edit */}
      <RiskWizardForm
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onSave={handleWizardSave}
        editRisk={wizardEditRisk}
      />

      {/* Detail View (monitoring) */}
      <RiskDetailView
        risk={selectedRisk}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onEdit={(risk) => handleOpenWizardEdit(risk)}
        onOpenWizard={handleOpenWizardEdit}
      />
    </MainLayout>
  );
};

export default Index;
