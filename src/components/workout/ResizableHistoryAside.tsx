'use client';

import { useCallback, useRef, useState } from 'react';
import { GripVertical, History, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'sportvault-coach-history-panel-width';
const DEFAULT_WIDTH = 360;
const MIN_WIDTH = 280;
const MAX_WIDTH = 640;

function clampWidth(width: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

function readStoredWidth(): number {
  if (typeof window === 'undefined') return DEFAULT_WIDTH;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDTH;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? clampWidth(parsed) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

interface ResizableHistoryAsideProps {
  onUnpin: () => void;
  children: React.ReactNode;
}

export default function ResizableHistoryAside({ onUnpin, children }: ResizableHistoryAsideProps) {
  const [width, setWidth] = useState(readStoredWidth);
  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);

  const persistWidth = useCallback((nextWidth: number) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(nextWidth));
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const startResize = useCallback(
    (startX: number) => {
      setIsResizing(true);
      const startWidth = widthRef.current;

      const onMove = (event: PointerEvent) => {
        const next = clampWidth(startWidth + (event.clientX - startX));
        widthRef.current = next;
        setWidth(next);
      };

      const onUp = () => {
        setIsResizing(false);
        persistWidth(widthRef.current);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [persistWidth],
  );

  return (
    <div className="hidden shrink-0 lg:flex lg:sticky lg:top-4 lg:max-h-[calc(100vh-8rem)]">
      <aside
        style={{ width }}
        className="flex min-h-0 flex-col overflow-y-auto overflow-x-hidden pr-1"
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-primary" />
            Historia
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onUnpin}
            title="Irrota historia"
          >
            <PinOff className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </aside>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Muuta historian paneelin leveyttä"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={width}
        title="Vedä muuttaaksesi leveyttä"
        onPointerDown={(event) => {
          event.preventDefault();
          startResize(event.clientX);
        }}
        className={cn(
          'group relative mx-1 flex w-2 shrink-0 cursor-col-resize touch-none items-stretch justify-center',
          isResizing && 'bg-primary/10',
        )}
      >
        <div
          className={cn(
            'my-4 w-1 rounded-full bg-white/10 transition-colors group-hover:bg-primary/40',
            isResizing && 'bg-primary/60',
          )}
        />
        <GripVertical
          className={cn(
            'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100',
            isResizing && 'text-primary opacity-100',
          )}
        />
      </div>
    </div>
  );
}
