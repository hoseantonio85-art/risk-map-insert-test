export interface Risk {
  id: string;
  status: 'Утверждён' | 'В работе' | 'На согласовании' | 'Черновик';
  block: string;
  subdivision: string;
  process: string;
  riskName: string;
  riskLevel: 'Высокий' | 'Средний' | 'Низкий';
  riskProfile: string;
  
  // Loss limits
  cleanOpRisk: LossLimit;
  creditOpRisk: LossLimit;
  indirectLosses: LossLimit;
  potentialLosses: number;
  
  // Strategy
  responseStrategy: string;
  qualitativeLosses: string;
  
  // Scenarios
  scenarios: Scenario[];
  
  // Mirroring
  mirrors: Mirror[];
  
  // Meta
  author: string;
  createdAt: string;
  source: string;
}

export interface LossLimit {
  value: number;
  utilization: number;
  limit?: number;
  fact2024?: number;
  fact2025?: number;
  forecast2025?: number;
}

export interface Scenario {
  id: string;
  description: string;
  percentage: number;
  groupScenario: string;
  causeType?: string;
  itService?: string;
}

export interface Mirror {
  id: string;
  subdivision: string;
  percentage: number;
  fact?: number;
  factPercentage?: number;
  limitLastYear?: number;
  utilizationLastYear?: string;
}

export interface Incident {
  id: string;
  title: string;
  date: string;
  directLosses: number;
  indirectLosses: number;
  status: 'Утверждён' | 'В работе';
}

export interface Measure {
  id: string;
  title: string;
  plannedDate: string;
  status: 'Новая' | 'В работе' | 'Выполнена';
}

export interface MonthlyLoss {
  month: string;
  directLosses: number;
  indirectLosses: number;
}
