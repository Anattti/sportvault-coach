'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface ClientNotesDialogProps {
  relationshipId: string;
  initialNotes: string | null;
  trigger: React.ReactElement;
}

export default function ClientNotesDialog({
  relationshipId,
  initialNotes,
  trigger,
}: ClientNotesDialogProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_clients')
        .update({ notes: notes.trim() || null })
        .eq('id', relationshipId);

      if (error) throw error;
      toast('Muistiinpanot tallennettu', 'success');
      setOpen(false);
      router.refresh();
    } catch {
      toast('Tallennus epäonnistui', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Asiakkaan muistiinpanot</DialogTitle>
          <DialogDescription>
            Sisäiset muistiinpanot vain valmentajalle. Urheilija ei näe näitä.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="client-notes">Muistiinpanot</Label>
            <Textarea
              id="client-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="bg-background"
              placeholder="Tavoitteet, rajoitteet, huomiot..."
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tallenna
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
