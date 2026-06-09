'use client';

import { useState } from 'react';
import { Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface Props {
  cycleWeeks: number;
  activeCycleWeek: number;
  onCopy: (fromWeek: number, toWeek: number) => void;
  trigger: React.ReactElement;
}

function defaultToWeek(activeCycleWeek: number, cycleWeeks: number): number {
  if (activeCycleWeek < cycleWeeks) return activeCycleWeek + 1;
  return Math.max(1, activeCycleWeek - 1);
}

export default function CopyWeekDialog({
  cycleWeeks,
  activeCycleWeek,
  onCopy,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [fromWeek, setFromWeek] = useState(activeCycleWeek);
  const [toWeek, setToWeek] = useState(defaultToWeek(activeCycleWeek, cycleWeeks));

  const weekOptions = Array.from({ length: cycleWeeks }, (_, i) => i + 1);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFromWeek(activeCycleWeek);
      setToWeek(defaultToWeek(activeCycleWeek, cycleWeeks));
    }
    setOpen(nextOpen);
  };

  const handleCopy = () => {
    if (fromWeek === toWeek) return;
    onCopy(fromWeek, toWeek);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kopioi viikon sarjat</DialogTitle>
          <DialogDescription>
            Kopioi kaikkien liikkeiden sarjat yhdeltä viikolta toiselle. Kohdeviikon
            aiemmat sarjat korvataan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Lähdeviikko
            </label>
            <Select
              value={String(fromWeek)}
              onValueChange={(v) => v && setFromWeek(parseInt(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Viikko {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kohdeviikko
            </label>
            <Select
              value={String(toWeek)}
              onValueChange={(v) => v && setToWeek(parseInt(v))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((w) => (
                  <SelectItem key={w} value={String(w)}>
                    Viikko {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Peruuta
          </Button>
          <Button
            onClick={handleCopy}
            disabled={fromWeek === toWeek}
            className="bg-primary text-primary-foreground"
          >
            <Copy className="mr-2 h-4 w-4" />
            Kopioi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
