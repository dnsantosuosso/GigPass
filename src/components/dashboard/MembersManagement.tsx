import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  User,
  Shield,
  Calendar,
  Ticket,
  Download,
  Users,
  Activity,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  roles: string[];
  total_claims: number;
  recent_claims: Array<{
    event_title: string;
    claimed_at: string;
  }>;
}

export default function MembersManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'member'>(
    'all'
  );
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'claims'>(
    'date'
  );

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, roleFilter, sortBy]);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get claims count
      const { data: claimsData } = await supabase
        .from('ticket_claims')
        .select('user_id, event_id, claimed_at, events(title)');

      // Process members
      const processedMembers = (profilesData || []).map((profile) => {
        const userRoles =
          rolesData
            ?.filter((r) => r.user_id === profile.id)
            .map((r) => r.role) || [];
        const userClaims =
          claimsData?.filter((c) => c.user_id === profile.id) || [];

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          roles: userRoles,
          total_claims: userClaims.length,
          recent_claims: userClaims.slice(0, 3).map((c) => ({
            event_title: c.events?.title || 'Unknown Event',
            claimed_at: c.claimed_at,
          })),
        };
      });

      setMembers(processedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMembers = () => {
    let filtered = [...members];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.email.toLowerCase().includes(query) ||
          member.full_name?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((member) => member.roles.includes(roleFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
      } else if (sortBy === 'email') {
        return a.email.localeCompare(b.email);
      } else if (sortBy === 'claims') {
        return b.total_claims - a.total_claims;
      } else {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
    });

    setFilteredMembers(filtered);
  };

  const getStatistics = () => {
    const admins = members.filter((m) => m.roles.includes('admin')).length;
    const totalClaims = members.reduce((sum, m) => sum + m.total_claims, 0);
    const activeMembers = members.filter((m) => m.total_claims > 0).length;

    return {
      total: members.length,
      admins,
      totalClaims,
      activeMembers,
    };
  };

  const stats = getStatistics();

  const exportToCSV = () => {
    const headers = [
      'Email',
      'Full Name',
      'Roles',
      'Total Claims',
      'Joined Date',
    ];
    const rows = filteredMembers.map((member) => [
      member.email,
      member.full_name || 'N/A',
      member.roles.join('; '),
      member.total_claims.toString(),
      format(new Date(member.created_at), 'yyyy-MM-dd'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="animate-pulse"
            >
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Total Members
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Admins
                </p>
                <p className="text-2xl font-bold">{stats.admins}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Total Claims
                </p>
                <p className="text-2xl font-bold">{stats.totalClaims}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Active Members
                </p>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Role Filter */}
            <Select
              value={roleFilter}
              onValueChange={(v: 'all' | 'admin' | 'member') =>
                setRoleFilter(v)
              }
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="member">Members</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(v: 'name' | 'email' | 'date' | 'claims') =>
                setSortBy(v)
              }
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Join Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="claims">Claims</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="h-9"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {filteredMembers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              {searchQuery || roleFilter !== 'all'
                ? 'No members match your filters'
                : 'No members yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            Showing {filteredMembers.length} of {members.length} members
          </p>
          {filteredMembers.map((member) => (
            <Card
              key={member.id}
              className="overflow-hidden hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border-2 border-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {member.full_name || 'No name set'}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        {member.roles.includes('admin') && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {member.roles.includes('member') && (
                          <Badge
                            variant="secondary"
                            className="text-xs"
                          >
                            Member
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined{' '}
                        {format(new Date(member.created_at), 'MMM d, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {member.total_claims}{' '}
                        {member.total_claims === 1 ? 'claim' : 'claims'}
                      </span>
                      {member.recent_claims.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Last active{' '}
                          {format(
                            new Date(member.recent_claims[0].claimed_at),
                            'MMM d'
                          )}
                        </span>
                      )}
                    </div>

                    {member.recent_claims.length > 0 && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Recent Claims:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {member.recent_claims.map((claim, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                            >
                              {claim.event_title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
