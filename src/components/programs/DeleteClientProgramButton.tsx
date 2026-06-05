'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export default function DeleteClientProgramButton({
  workoutId,
  clientId,
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
      className="text-muted-foreground hover:text-destructive"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
    </Button>
  );
}
