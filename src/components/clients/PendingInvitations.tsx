'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Clock, Copy, Check, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { buildCoachInviteUrl } from '@/lib/invite';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

export interface PendingInvitation {
  id: string;
  invite_code: string;
  client_email: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export default function PendingInvitations({
  invitations,
}: {
  invitations: PendingInvitation[];
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  if (invitations.length === 0) return null;

  const handleCopy = async (invitation: PendingInvitation) => {
    const url = buildCoachInviteUrl(invitation.invite_code);
    await navigator.clipboard.writeText(url);
    setCopiedId(invitation.id);
    toast('Kutsulinkki kopioitu', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (invitationId: string) => {
    setRevokingId(invitationId);
    try {
      const { error } = await supabase
        .from('coach_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
      toast('Kutsu peruutettu', 'success');
      router.refresh();
    } catch {
      toast('Kutsun peruutus epäonnistui', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          Odottavat kutsut
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md border border-border bg-background/50"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {inv.client_email || 'Yleinen kutsulinkki'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Luotu {inv.created_at ? format(new Date(inv.created_at), 'd.M.yyyy HH:mm', { locale: fi }) : '—'}
                {' · '}
                Vanhenee {inv.expires_at ? format(new Date(inv.expires_at), 'd.M.yyyy', { locale: fi }) : '—'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-muted-foreground">
                Odottaa hyväksyntää
              </Badge>
              <Button
                size="icon"
                variant="outline"
                onClick={() => handleCopy(inv)}
                title="Kopioi linkki"
              >
                {copiedId === inv.id ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleRevoke(inv.id)}
                disabled={revokingId === inv.id}
                title="Peruuta kutsu"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
