import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerContent?: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
  floatingAboveFooter?: React.ReactNode;
}

export function FullscreenLightbox({ 
  isOpen, 
  onClose, 
  title, 
  children,
  actions,
  headerContent,
  wide = false,
  footer,
  floatingAboveFooter,
}: FullscreenLightboxProps) {
  if (!isOpen) return null;

  const maxW = wide ? 'max-w-[1240px]' : 'max-w-5xl';

  return (
    <div className="fullscreen-lightbox animate-fade-in flex flex-col h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm shrink-0">
        <div className={cn(maxW, "mx-auto px-8 py-4 flex items-center justify-between")}>
          {headerContent ? (
            <>
              <div className="flex-1 min-w-0">{headerContent}</div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {actions}
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
              <div className="flex items-center gap-3">
                {actions}
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className={cn(maxW, "mx-auto px-8 py-8")}>
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            {children}
          </div>
        </div>

        {/* Floating element above footer */}
        {floatingAboveFooter}
      </div>

      {/* Footer — always pinned to bottom */}
      {footer && (
        <div className="shrink-0 z-10 bg-card border-t border-border shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
          <div className={cn(maxW, "mx-auto px-8 py-4")}>
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
