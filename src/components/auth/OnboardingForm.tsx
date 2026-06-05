'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export function OnboardingForm() {
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('activate_coach_profile', {
        p_business_name: businessName.trim() || null,
      });

      if (rpcError) throw rpcError;

      const result = data as { success?: boolean; error?: string } | null;
      if (!result?.success) {
        throw new Error(result?.error || 'Aktivointi epäonnistui');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tapahtui virhe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Aloita valmentaminen</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Käytät samaa Sportvault-tiliä kuin urheilija-sovelluksessa. Omat treenipohjasi
          näkyvät automaattisesti, kun annat ohjelmia asiakkaillesi.
        </p>
      </div>

      <form onSubmit={handleActivate} className="space-y-5">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="businessName" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Yrityksen tai tiimin nimi (valinnainen)
          </Label>
          <div className="relative group">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <Input
              id="businessName"
              type="text"
              placeholder="Valmennus Oy"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isLoading}
              className={cn(
                'pl-10 h-12',
                'focus:border-primary/50 focus:ring-0 outline-none'
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 font-bold"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2">
              Aloita valmentaminen
              <ArrowRight size={18} />
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
