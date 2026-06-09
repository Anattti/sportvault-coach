'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export default function DeleteClientProgramButton({
  workoutId,
}: {
  workoutId: string;
  clientId: string;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Haluatko varmasti poistaa tämän treeniohjelman?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (error) throw error;
      toast('Treeniohjelma poistettu', 'success');
      router.refresh();
    } catch {
      toast('Poisto epäonnistui', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      aria-label="Poista ohjelma"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}
