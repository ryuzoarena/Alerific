import { useState, useEffect } from 'react';
import { Shield, Users, Music, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: string;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  created_at: string;
}

export function AdminView() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchSongs();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, created_at')
      .order('created_at', { ascending: false });

    if (profiles) {
      // Fetch roles for all users
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const enriched = profiles.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.user_id)?.role || 'user',
      }));
      setUsers(enriched);
    }
    setLoadingUsers(false);
  };

  const fetchSongs = async () => {
    setLoadingSongs(true);
    const { data } = await supabase
      .from('songs')
      .select('id, title, artist, album, duration, created_at')
      .order('created_at', { ascending: false });
    if (data) setSongs(data);
    setLoadingSongs(false);
  };

  const deleteSong = async (id: string, title: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSongs(s => s.filter(song => song.id !== id));
      toast({ title: 'Deleted', description: `"${title}" has been removed.` });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(songSearch.toLowerCase()) ||
    s.artist.toLowerCase().includes(songSearch.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield size={28} className="text-primary" />
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Panel</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users size={18} />
            <span className="text-sm">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{users.length}</p>
        </div>
        <div className="bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Music size={18} />
            <span className="text-sm">Total Songs</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{songs.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-card mb-4">
          <TabsTrigger value="users" className="gap-2">
            <Users size={16} /> Users
          </TabsTrigger>
          <TabsTrigger value="songs" className="gap-2">
            <Music size={16} /> Songs
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="bg-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found</TableCell>
                  </TableRow>
                ) : filteredUsers.map(user => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-foreground">
                          {(user.display_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-foreground font-medium">{user.display_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={cn(
                        user.role === 'admin' && 'bg-primary text-primary-foreground'
                      )}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Songs Tab */}
        <TabsContent value="songs">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              value={songSearch}
              onChange={e => setSongSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="bg-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSongs ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading...</TableCell>
                  </TableRow>
                ) : filteredSongs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No songs found</TableCell>
                  </TableRow>
                ) : filteredSongs.map(song => (
                  <TableRow key={song.id}>
                    <TableCell>
                      <span className="text-foreground font-medium">{song.title}</span>
                      {song.album && <p className="text-xs text-muted-foreground">{song.album}</p>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{song.artist}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDuration(song.duration)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSong(song.id, song.title)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
