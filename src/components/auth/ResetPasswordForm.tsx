'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import PulsingLogo from '@/components/loading/PulsingLogo';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = React.useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Salasanat eivät täsmää');
      return;
    }

    if (password.length < 6) {
      setError('Salasanan tulee olla vähintään 6 merkkiä');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase-ympäristömuuttujat puuttuvat');
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Salasanan päivitys epäonnistui';
      setError(
        message.includes('No API key found') || message.includes('ympäristömuuttujat')
          ? 'Supabase API -avain puuttuu. Aseta NEXT_PUBLIC_SUPABASE_URL ja NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          : message
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-black relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#00FF41]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#00FF41]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto space-y-8 z-10 relative">
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-3xl font-bold tracking-tighter text-[#00FF41]">
              SportVault Coach
            </h1>
            <PulsingLogo width={28} height={28} />
          </div>
          <p className="text-white/50 text-sm">Aseta uusi salasana</p>
        </div>

        <motion.div
          layout
          className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl overflow-hidden glass-panel"
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-white/40 font-semibold ml-1">
                Uusi salasana
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF41] transition-colors duration-300" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className={cn(
                    'pl-10 bg-[#1A1A1A] border-white/5 h-12 transition-all duration-300 text-white placeholder:text-white/20 rounded-xl',
                    'focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none'
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-white/40 font-semibold ml-1">
                Vahvista salasana
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF41] transition-colors duration-300" size={18} />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className={cn(
                    'pl-10 bg-[#1A1A1A] border-white/5 h-12 transition-all duration-300 text-white placeholder:text-white/20 rounded-xl',
                    'focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none'
                  )}
                />
              </div>
            </div>

            <Button
              className="w-full h-12 mt-4 bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-bold text-base tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,65,0.2)] rounded-xl"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Päivitä salasana
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
