'use client';

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Building, ArrowRight, Loader2, Dumbbell, Weight, Trophy, Timer, Flame, Heart, Target, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import PulsingLogo from '@/components/loading/PulsingLogo';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AuthFormProps {
  defaultTab?: "login" | "register";
}

export function AuthForm({ defaultTab = "login" }: AuthFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = React.useState<"login" | "register">(defaultTab)
  
  // Form states
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [businessName, setBusinessName] = React.useState("");
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetError, setResetError] = React.useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = React.useState(false);

  const isRegistering = activeTab === "register"

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError(null);
    window.history.pushState(null, '', `/${tab}`);
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);
    setResetLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo,
      });

      if (resetError) {
        throw resetError;
      }

      setResetSuccess(true);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Salasanan palautus epäonnistui');
    } finally {
      setResetLoading(false);
    }
  };

  const openForgotPassword = () => {
    setResetEmail(email);
    setResetError(null);
    setResetSuccess(false);
    setForgotPasswordOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'coach',
              business_name: businessName,
            }
          }
        });
        
        if (signUpError) {
          throw signUpError;
        }
        
        router.push('/');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }

        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tapahtui virhe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-black relative overflow-hidden">
      {/* Decorative background gradients */}
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
          <p className="text-white/50 text-sm">
            {isRegistering
              ? 'Hallitse valmennustasi ammattimaisesti'
              : 'Kirjaudu Sportvault-tililläsi'}
          </p>
        </div>

        <motion.div
          layout
          className="bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-xl overflow-hidden glass-panel"
          transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        >
          <div className="grid grid-cols-2 p-1 gap-1 bg-[#1A1A1A] rounded-lg mb-8">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "relative py-2 text-sm font-medium transition-colors duration-200 rounded-md z-10",
                  activeTab === tab ? "text-black" : "text-white/60 hover:text-white"
                )}
                type="button"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#00FF41] rounded-md -z-10 shadow-neon-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab === 'login' ? 'Kirjaudu' : 'Rekisteröidy'}
              </button>
            ))}
          </div>

          <div className="">
            <form onSubmit={onSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl mb-6"
                >
                  {error}
                </motion.div>
              )}

              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-5"
                >
                  {isRegistering && (
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <Label htmlFor="businessName" className="text-xs uppercase tracking-wider text-white/40 font-semibold ml-1">
                        Yrityksen tai tiimin nimi
                      </Label>
                      <div className="relative group">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF41] transition-colors duration-300" size={18} />
                        <Input
                          id="businessName"
                          type="text"
                          placeholder="Valmennus Oy"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          required={isRegistering}
                          disabled={isLoading}
                          className={cn(
                            "pl-10 bg-[#1A1A1A] border-white/5 h-12 transition-all duration-300 text-white placeholder:text-white/20 rounded-xl",
                            "focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none"
                          )}
                        />
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-white/40 font-semibold ml-1">
                      Sähköposti
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF41] transition-colors duration-300" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="nimi@esimerkki.fi"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className={cn(
                          "pl-10 bg-[#1A1A1A] border-white/5 h-12 transition-all duration-300 text-white placeholder:text-white/20 rounded-xl",
                          "focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none"
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-white/40 font-semibold ml-1">
                      Salasana
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
                          "pl-10 bg-[#1A1A1A] border-white/5 h-12 transition-all duration-300 text-white placeholder:text-white/20 rounded-xl",
                          "focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none"
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
                        {isRegistering ? 'Luo tili' : 'Kirjaudu sisään'}
                        <ArrowRight size={18} />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            </form>

            {!isRegistering && (
              <div className="mt-6 text-center space-y-2">
                <p className="text-white/40 text-xs">
                  Käytät jo Sportvaultia? Kirjaudu samalla tilillä ja aloita valmentaminen onboarding-vaiheessa.
                </p>
                <Button
                  variant="link"
                  type="button"
                  className="text-white/30 hover:text-[#00FF41] text-sm font-normal transition-colors"
                  disabled={isLoading}
                  onClick={openForgotPassword}
                >
                  Unohditko salasanan?
                </Button>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Decorative Icons matching the app */}
        <div className="mt-8 flex justify-center gap-6 text-white/20">
          <Dumbbell size={20} />
          <Weight size={20} />
          <Trophy size={20} />
          <Timer size={20} />
          <Flame size={20} />
          <Heart size={20} />
          <Target size={20} />
          <Zap size={20} />
        </div>
        <p className="mt-6 text-center text-white/50 text-sm">© SportVault {new Date().getFullYear()}</p>
      </div>

      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-[#121212] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Palauta salasana</DialogTitle>
            <DialogDescription className="text-white/50">
              Syötä sähköpostiosoitteesi, niin lähetämme sinulle linkin salasanan vaihtamiseen.
            </DialogDescription>
          </DialogHeader>

          {resetSuccess ? (
            <div className="space-y-4">
              <p className="text-sm text-[#00FF41]">
                Palautuslinkki on lähetetty osoitteeseen <strong>{resetEmail}</strong>. Tarkista sähköpostisi.
              </p>
              <Button
                type="button"
                className="w-full bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-bold"
                onClick={() => setForgotPasswordOpen(false)}
              >
                Sulje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {resetError && (
                <p className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
                  {resetError}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-xs uppercase tracking-wider text-white/40 font-semibold">
                  Sähköposti
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00FF41] transition-colors duration-300" size={18} />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="nimi@esimerkki.fi"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    disabled={resetLoading}
                    className={cn(
                      "pl-10 bg-[#1A1A1A] border-white/5 h-12 text-white placeholder:text-white/20 rounded-xl",
                      "focus:border-[#00FF41]/50 focus:bg-[#202020] focus:ring-0 outline-none"
                    )}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#00FF41] hover:bg-[#00FF41]/90 text-black font-bold"
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Lähetä palautuslinkki'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
