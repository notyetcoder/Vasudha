
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ConnectPageSkeleton() {
  return (
    <div className="h-full flex flex-col gap-4 animate-pulse">
        <Card>
            <CardHeader className='pb-4'>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4">
                <Skeleton className="h-10 w-full md:w-1/3" />
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-10 w-[150px]" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </CardContent>
        </Card>
        <div className="flex-1 border rounded-lg bg-background shadow-sm overflow-hidden flex flex-col">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px] px-4"><Skeleton className="h-5 w-5" /></TableHead>
                        <TableHead className="w-[120px]"><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="min-w-[200px]"><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead className="min-w-[180px]"><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="min-w-[180px]"><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="min-w-[180px]"><Skeleton className="h-5 w-20" /></TableHead>
                        <TableHead className="text-right w-[160px]"><Skeleton className="h-5 w-24" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell className="px-4"><Skeleton className="h-5 w-5" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-full" />
                                    <div className='space-y-2'>
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
