'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CoachClient } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, User, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ClientList({ clients }: { clients: CoachClient[] }) {
  const [search, setSearch] = useState('');

  const filteredClients = clients.filter((client) => {
    if (!search) return true;
    const name = client.profile?.nickname?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-primary/20 text-primary border-primary/50">Aktiivinen</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-muted-foreground">Odottaa</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Tauolla</Badge>;
      default:
        return <Badge variant="secondary">Ei aktiivinen</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Etsi nimellä..."
          className="pl-9 bg-card border-border"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-medium mb-1">Ei asiakkaita</h3>
            <p className="text-muted-foreground">
              {search ? 'Hakusanalla ei löytynyt tuloksia.' : 'Et ole vielä lisännyt asiakkaita. Lähetä kutsu aloittaaksesi.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card key={client.id} className="bg-card border-border hover:border-accent/50 transition-colors overflow-hidden">
              <div className="p-5 flex items-start gap-4">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/clients/${client.client_id}`} className="font-semibold text-lg hover:text-accent truncate">
                      {client.profile?.nickname || 'Nimetön urheilija'}
                    </Link>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                          <span className="sr-only">Avaa valikko</span>
                          <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem render={<Link href={`/clients/${client.client_id}`} />}>Näytä profiili</DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/clients/${client.client_id}/programs`} />}>Ohjelmat</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusBadge(client.status)}
                    <span className="text-xs text-muted-foreground truncate">
                      {client.profile?.experience_level || 'Taso ei tiedossa'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
