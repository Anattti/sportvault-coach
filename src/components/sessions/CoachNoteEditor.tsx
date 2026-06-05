'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
        // Poista muistiinpano
        await supabase
          .from('coach_session_notes')
          .delete()
          .eq('session_id', sessionId)
          .eq('coach_id', userResp.user.id);
      } else {
        // Upsert muistiinpano
        const { error } = await supabase
          .from('coach_session_notes')
          .upsert({
            coach_id: userResp.user.id,
            session_id: sessionId,
            content: note.trim(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'coach_id, session_id' });

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
    <Card className="bg-card border-border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-primary">Valmentajan palaute</CardTitle>
        <CardDescription>
          Tämä muistiinpano näkyy urheilijalle hänen sovelluksessaan tässä treenisessiossa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Kirjoita palaute urheilijalle... (esim. 'Hyvin pidetty RPE kurissa!')"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[120px] bg-background border-border resize-y"
        />
        <div className="flex justify-end items-center gap-4">
          {saved && (
            <span className="text-sm text-primary flex items-center">
              <Check className="h-4 w-4 mr-1" /> Tallennettu
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving || note === initialNote} className="font-semibold">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tallenna palaute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
