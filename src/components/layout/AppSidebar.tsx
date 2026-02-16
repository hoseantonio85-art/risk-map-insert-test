import { 
  CheckSquare, 
  Target, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Bot,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: CheckSquare, label: 'Задачи' },
  { icon: Target, label: 'Инциденты' },
  { icon: BarChart3, label: 'Карта рисков', active: true },
  { icon: Shield, label: 'Меры' },
  { icon: AlertTriangle, label: 'Риск поведения' },
  { icon: Bot, label: 'Риски ИИ-агентов' },
];

export function AppSidebar() {
  return (
    <aside className="w-56 bg-sidebar text-sidebar-foreground flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                  stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-lg font-semibold text-white">Оракул</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              item.active 
                ? "bg-sidebar-accent text-sidebar-primary" 
                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
            {item.active && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>
        ))}
      </nav>
    </aside>
  );
}
