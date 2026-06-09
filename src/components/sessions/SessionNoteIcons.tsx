import { MessageSquareText, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SessionNoteFlags {
  hasAthleteNote?: boolean;
  hasCoachNote?: boolean;
}

interface SessionNoteIconsProps extends SessionNoteFlags {
  className?: string;
  iconClassName?: string;
}

export default function SessionNoteIcons({
  hasAthleteNote = false,
  hasCoachNote = false,
  className,
  iconClassName = 'h-3.5 w-3.5',
}: SessionNoteIconsProps) {
  if (!hasAthleteNote && !hasCoachNote) return null;

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1', className)}>
      {hasAthleteNote && (
        <MessageSquareText
          className={cn(iconClassName, 'text-primary')}
          aria-label="Urheilijan muistiinpano"
        />
      )}
      {hasCoachNote && (
        <StickyNote
          className={cn(iconClassName, 'text-primary')}
          aria-label="Valmentajan muistiinpano"
        />
      )}
    </span>
  );
}
