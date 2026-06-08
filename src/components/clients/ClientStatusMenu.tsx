'use client';

import { useState } from 'react';
import { Loader2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type ClientStatus = 'active' | 'paused' | 'ended';

export default function ClientStatusMenu({
  relationshipId,
  currentStatus,
  compact = false,
  className,
}: {
  relationshipId: string;
  currentStatus: ClientStatus;
  compact?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const updateStatus = async (status: ClientStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('coach_clients')
        .update({ status })
        .eq('id', relationshipId);

      if (error) throw error;
      toast(
        status === 'active'
          ? 'Asiakassuhde aktivoitu'
          : status === 'paused'
            ? 'Asiakas asetettu tauolle'
            : 'Asiakassuhde päätetty',
        'success'
      );
      router.refresh();
    } catch {
      toast('Tilan päivitys epäonnistui', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size={compact ? 'default' : 'sm'}
            disabled={loading}
            className={cn(compact && 'w-full', className)}
            aria-label="Hallitse asiakassuhdetta"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
            {!compact && 'Hallitse suhdetta'}
            {compact && <span className="truncate">Suhde</span>}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {currentStatus !== 'active' && (
          <DropdownMenuItem onClick={() => updateStatus('active')}>
            Aktivoi
          </DropdownMenuItem>
        )}
        {currentStatus === 'active' && (
          <DropdownMenuItem onClick={() => updateStatus('paused')}>
            Aseta tauolle
          </DropdownMenuItem>
        )}
        {currentStatus !== 'ended' && (
          <DropdownMenuItem onClick={() => updateStatus('ended')}>
            Päätä suhde
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
