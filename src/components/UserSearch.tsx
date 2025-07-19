
'use client';
import { useState, useMemo } from 'react';
import type { User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { findUserById } from '@/lib/user-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserSearch({ users, allUsers }: { users: User[], allUsers: User[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [surnameFilter, setSurnameFilter] = useState('all');
    const [familyFilter, setFamilyFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');

    const allSurnamesInDb = useMemo(() => {
        const maidenNames = allUsers.map(u => u.maidenName).filter(Boolean);
        const currentSurnames = allUsers.map(u => u.surname).filter(Boolean);
        return [...new Set([...maidenNames, ...currentSurnames])].sort((a,b) => b.length - a.length);
    }, [allUsers]);

    const uniqueSurnames = useMemo(() => {
        const surnames = new Set<string>();
        users.forEach(user => {
            if (user.surname) surnames.add(user.surname);
            if (user.maidenName) surnames.add(user.maidenName);
        });
        return Array.from(surnames).sort();
    }, [users]);

    const uniqueFamilies = useMemo(() => {
        const families = new Set<string>();
        users.forEach(user => {
            if (user.family) families.add(user.family);
        });
        return Array.from(families).sort();
    }, [users]);
    

    const getFirstName = (fullName?: string) => {
        if (!fullName) return '';
        let potentialFirstName = fullName;
        for (const surname of allSurnamesInDb) {
            if (potentialFirstName.endsWith(surname)) {
                return potentialFirstName.substring(0, potentialFirstName.length - surname.length).trim();
            }
        }
        return potentialFirstName;
    };

    const filteredUsers = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();

        return users.filter(user => {
            const father = findUserById(user.fatherId, allUsers);
            const mother = findUserById(user.motherId, allUsers);
            const spouse = findUserById(user.spouseId, allUsers);
            const fatherName = father ? father.name : getFirstName(user.fatherName);
            const motherName = mother ? mother.name : getFirstName(user.motherName);
            const spouseName = spouse ? spouse.name : getFirstName(user.spouseName);

            const searchString = [
                user.name,
                user.surname,
                user.maidenName,
                fatherName,
                motherName,
                spouseName,
                user.description,
                getFirstName(user.fatherName), // Also search raw names
                getFirstName(user.motherName),
                getFirstName(user.spouseName),
            ].filter(Boolean).join(' ').toLowerCase();
            const searchMatch = !lowercasedTerm || searchString.includes(lowercasedTerm);

            const surnameMatch = surnameFilter === 'all' || user.surname === surnameFilter || user.maidenName === surnameFilter;
            const familyMatch = familyFilter === 'all' || user.family === familyFilter;
            const genderMatch = genderFilter === 'all' || user.gender === genderFilter;

            return searchMatch && surnameMatch && familyMatch && genderMatch;
        });
    }, [searchTerm, users, allUsers, getFirstName, surnameFilter, familyFilter, genderFilter]);

    const hasActiveFilters = searchTerm !== '' || surnameFilter !== 'all' || familyFilter !== 'all' || genderFilter !== 'all';
    
    const getParentDisplay = (user: User) => {
        const fatherName = getFirstName(user.fatherName);
        const motherName = getFirstName(user.motherName);
        const relation = user.gender === 'male' ? 's/o' : 'd/o';

        if (fatherName && motherName) {
            return `${relation} ${fatherName} & ${motherName}`;
        }
        if (fatherName) {
            return `${relation} ${fatherName}`;
        }
        if (motherName) {
            return `${relation} ${motherName}`;
        }
        return null;
    }

    return (
        <div className="space-y-8">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, surname, parents, spouse, or profession..."
                        className="w-full pl-10 h-11"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Select value={surnameFilter} onValueChange={setSurnameFilter}>
                        <SelectTrigger><SelectValue placeholder="All Surnames" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Surnames</SelectItem>
                            {uniqueSurnames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={familyFilter} onValueChange={setFamilyFilter}>
                        <SelectTrigger><SelectValue placeholder="All Families" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Families</SelectItem>
                             {uniqueFamilies.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <Select value={genderFilter} onValueChange={setGenderFilter}>
                        <SelectTrigger><SelectValue placeholder="All Genders" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Genders</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredUsers.map(user => (
                        <Link key={user.id} href={`/profile/${user.id}`} className="group block">
                            <Card className="h-full overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:border-primary/30 group-hover:-translate-y-1">
                                <CardContent className="p-4 text-center">
                                    <Image
                                        src={user.profilePictureUrl}
                                        alt={user.name}
                                        width={100}
                                        height={100}
                                        data-ai-hint="profile avatar"
                                        className="rounded-full mx-auto mb-4 border-4 border-background shadow-md"
                                    />
                                    <h3 className="font-semibold text-lg text-primary truncate">{user.name} {user.surname}</h3>
                                    
                                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                                        {getParentDisplay(user) && 
                                            <p className="truncate">{getParentDisplay(user)}</p>
                                        }
                                        {user.maritalStatus === 'married' && user.spouseName &&
                                            <p className="truncate">{user.gender === 'male' ? 'h/o' : 'w/o'} {getFirstName(user.spouseName)}</p>
                                        }
                                    </div>

                                    {user.description && (
                                        <Badge variant="secondary" className="mt-3 whitespace-nowrap">
                                            {user.description}
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <p className="text-lg text-muted-foreground">
                        {hasActiveFilters ? "No matching profiles found with the current filters." : "Use the search bar or filters to find community members."}
                    </p>
                </div>
            )}
        </div>
    );
}
