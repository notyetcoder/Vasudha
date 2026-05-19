
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Leaf, AlertTriangle, ArrowRight, Activity, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getAllUsersForAdmin } from '@/actions/users';

const DashboardPageSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32 rounded-xl bg-muted" />
            <Skeleton className="h-32 rounded-xl bg-muted" />
            <Skeleton className="h-32 rounded-xl bg-muted" />
        </div>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-80 rounded-xl bg-muted" />
            <Skeleton className="lg:col-span-3 h-80 rounded-xl bg-muted" />
        </div>
        <Skeleton className="h-40 rounded-xl bg-muted" />
    </div>
);

const StatCard = ({ title, value, description, icon: Icon, color, onClick }: { title: string, value: number | string, description: string, icon: React.ElementType, color: string, onClick?: () => void }) => (
    <Card 
        className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg rounded-xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:scale-[1.03] hover:shadow-xl cursor-pointer"
        onClick={onClick}
        role={onClick ? 'button' : 'figure'}
        tabIndex={onClick ? 0 : -1}
        onKeyDown={e => { if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick() }}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground/80">{title}</CardTitle>
             <div className="p-2 rounded-full" style={{ backgroundColor: color }}>
                <Icon className="h-4 w-4 text-white" />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-foreground/60">{description}</p>
        </CardContent>
    </Card>
);

export default function DashboardPage() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    const fetchData = useCallback(async (showToast = false) => {
        setIsLoading(true);
        try {
            const { users, total } = await getAllUsersForAdmin(1, 10000); // Fetch all for dashboard analytics
            setAllUsers(users);
            setTotalUsers(total);
            if (showToast) {
                 toast({ title: 'Data Refreshed', description: 'The latest user data has been loaded.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not load dashboard data.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleStatCardClick = (filter: string) => {
        router.push(`/admin/connect?${filter}`);
    };

    const handleChartClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const familyName = data.activePayload[0].payload.name;
            router.push(`/admin/connect?family=${encodeURIComponent(familyName)}`);
        }
    };
    
    const { deceasedCount, attentionCount, familyDistribution, recentUsers } = useMemo(() => {
        if (isLoading) return { deceasedCount: 0, attentionCount: 0, familyDistribution: [], recentUsers: [] };

        const deceased = allUsers.filter(u => u.isDeceased).length;
        const attention = allUsers.filter(u => u.maritalStatus === 'married' && !u.spouseId).length;
        
        const familyCounts: { [key: string]: number } = {};
        allUsers.forEach(user => {
            const family = user.family || 'Unknown';
            familyCounts[family] = (familyCounts[family] || 0) + 1;
        });
        const familyData = Object.entries(familyCounts)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        const recent = [...allUsers].sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5);

        return {
            deceasedCount: deceased,
            attentionCount: attention,
            familyDistribution: familyData,
            recentUsers: recent,
        };
    }, [allUsers, isLoading]);

    if (isLoading) {
        return <DashboardPageSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Refresh Data
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Total Users" value={totalUsers} description="Community members" icon={Users} color="#10b981" onClick={() => handleStatCardClick('status=all')} />
                <StatCard title="स्वर्गस्थ Members" value={deceasedCount} description="In loving memory" icon={Leaf} color="#f59e0b" onClick={() => handleStatCardClick('deceased=deceased')} />
                <StatCard title="Needs Attention" value={attentionCount} description="Profiles with missing links" icon={AlertTriangle} color="#ef4444" onClick={() => handleStatCardClick('unlinked=true')} />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Activity /> Family Distribution</CardTitle>
                        <CardDescription className="text-foreground/60">Number of registered members per family group.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={familyDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} onClick={handleChartClick} className="cursor-pointer">
                                <XAxis dataKey="name" stroke="hsl(var(--foreground) / 0.6)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--foreground) / 0.6)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--primary) / 0.2)' }}
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--background) / 0.5)', 
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3 bg-card/30 backdrop-blur-lg border-white/10 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle>Recent Registrations</CardTitle>
                         <CardDescription className="text-foreground/60">The latest members to join the community.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map(user => (
                                <div key={user.id} className="flex items-center group">
                                    <UserAvatar name={user.name} profilePictureUrl={user.profilePictureUrl} size={40} isDeceased={user.isDeceased} className="group-hover:scale-110 transition-transform" />
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name} {user.surname}</p>
                                        <p className="text-sm text-muted-foreground">{user.fatherName}</p>
                                    </div>
                                    <Link href={`/admin/connect?search=${user.id}`} className="ml-auto">
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Manage</Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/30 backdrop-blur-lg border-white/10 shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                     <Link href="/admin/connect" className="block p-4 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group">
                        <h3 className="font-semibold flex items-center">Manage All Users <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" /></h3>
                        <p className="text-sm text-muted-foreground">Go to the full user management table to edit, link, and organize profiles.</p>
                     </Link>
                </CardContent>
            </Card>
        </div>
    )
}
