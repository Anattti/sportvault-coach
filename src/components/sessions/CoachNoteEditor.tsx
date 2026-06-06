'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check } from 'lucide-react';

interface CoachNoteEditorProps {
  sessionId: string;
  initialNote: string | null;
}

export default function CoachNoteEditor({ sessionId, initialNote }: CoachNoteEditorProps) {
  const [note, setNote] = useState(initialNote || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    try {
      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user) throw new Error('Not authenticated');

      if (note.trim() === '') {
        await supabase
          .from('coach_session_notes')
          .delete()
          .eq('session_id', sessionId)
          .eq('coach_id', userResp.user.id);
      } else {
        const { error } = await supabase
          .from('coach_session_notes')
          .upsert(
            {
              coach_id: userResp.user.id,
              session_id: sessionId,
              content: note.trim(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'coach_id, session_id' },
          );

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Virhe muistiinpanon tallennuksessa:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4">
        <h3 className="text-base font-semibold text-primary">Valmentajan palaute</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Näkyy urheilijalle hänen sovelluksessaan tässä treenisessiossa.
        </p>
      </div>
      <div className="space-y-4 p-5">
        <Textarea
          placeholder="Kirjoita palaute urheilijalle... (esim. 'Hyvin pidetty RPE kurissa!')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[120px] resize-y rounded-xl border-white/10 bg-black/40 focus-visible:ring-primary"
        />
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="flex items-center text-sm text-primary">
              <Check className="mr-1 h-4 w-4" /> Tallennettu
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || note === initialNote}
            className="font-semibold"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tallenna palaute
          </Button>
        </div>
      </div>
    </div>
  );
}
