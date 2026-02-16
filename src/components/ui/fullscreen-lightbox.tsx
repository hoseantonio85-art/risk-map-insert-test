import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function FullscreenLightbox({ 
  isOpen, 
  onClose, 
  title, 
  children,
  actions 
}: FullscreenLightboxProps) {
  if (!isOpen) return null;

  return (
    <div className="fullscreen-lightbox animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
          {children}
        </div>
      </div>
    </div>
  );
}
