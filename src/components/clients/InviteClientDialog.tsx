'use client';

import { useState } from 'react';
import { Plus, Check, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { buildCoachInviteUrl } from '@/lib/invite';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export default function InviteClientDialog({ coachId }: { coachId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const inviteUrl = inviteCode ? buildCoachInviteUrl(inviteCode) : '';

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('coach_invitations')
        .insert({
          coach_id: coachId,
          client_email: email.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setInviteCode(data.invite_code);
      router.refresh();
    } catch (err) {
      console.error('Error creating invite:', err);
      toast('Kutsun luonti epäonnistui', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast('Kutsulinkki kopioitu', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setInviteCode(null);
        setEmail('');
        setCopied(false);
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-[0_0_8px_rgba(0,255,65,0.3)]" />}>
        <Plus className="mr-2 h-4 w-4" />
        Kutsu asiakas
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Kutsu uusi asiakas</DialogTitle>
          <DialogDescription>
            Luo kutsulinkki, jonka urheilija avaa SportVault-mobiilisovelluksessa.
          </DialogDescription>
        </DialogHeader>

        {!inviteCode ? (
          <form onSubmit={handleCreateInvite} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Urheilijan sähköposti (valinnainen)</Label>
              <Input
                id="email"
                type="email"
                placeholder="matti@esimerkki.fi"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Jos täytät sähköpostin, vain kyseinen tili voi hyväksyä kutsun.
              </p>
            </div>
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Luo kutsulinkki
            </Button>
          </form>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-accent/10 border border-accent/20 rounded-md">
              <p className="text-sm font-medium text-accent mb-2">Kutsu luotu onnistuneesti!</p>
              <p className="text-sm text-muted-foreground mb-4">
                Kopioi linkki ja lähetä se urheilijalle. Linkki avaa SportVault-sovelluksen,
                jossa hän voi hyväksyä kutsun.
              </p>

              <div className="flex items-center space-x-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="bg-background text-muted-foreground font-mono text-xs"
                />
                <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full" variant="secondary">
              Sulje
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
