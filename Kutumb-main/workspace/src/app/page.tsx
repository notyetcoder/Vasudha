
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import MainHeader from '@/components/MainHeader';
import Footer from '@/components/Footer';
import { ArrowRight, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllUsersForAdmin as getUsers } from '@/actions/users';
import type { User } from '@/lib/types';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';


const FeatureCard = ({ icon, title, description, href }: { icon: React.ReactNode, title: string, description: string, href: string }) => (
    <Link href={href} className="group block">
        <div className="bg-card/30 backdrop-blur-lg p-8 rounded-xl border border-white/10 text-left flex flex-col items-start transition-all duration-300 hover:border-primary/20 hover:scale-105 hover:shadow-2xl h-full">
            <div className="p-3 bg-primary/20 rounded-full mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
            <p className="text-muted-foreground flex-grow">{description}</p>
            <div className="mt-4 text-primary font-semibold flex items-center gap-2">
                Learn more <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
            </div>
        </div>
    </Link>
);

const ScrollingProfileLane = ({ users, duration = 60, direction = 'left' }: { users: User[], duration?: number, direction?: 'left' | 'right' }) => {
    if (users.length === 0) return null;

    const animationProps = direction === 'left' 
        ? { initial: { x: 0 }, animate: { x: '-50%' } }
        : { initial: { x: '-50%' }, animate: { x: 0 } };

    return (
        <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]">
            <motion.div 
                className="flex items-center justify-center md:justify-start"
                initial={animationProps.initial}
                animate={animationProps.animate}
                transition={{ duration: duration, repeat: Infinity, ease: 'linear' }}
            >
                {[...users, ...users].map((user, index) => (
                    <div key={`${user.id}-${index}`} className="flex-shrink-0 mx-4">
                        <Image
                            src={user.profilePictureUrl}
                            alt={user.name}
                            width={100}
                            height={100}
                            data-ai-hint="profile avatar"
                            className={cn("rounded-full object-cover aspect-square border-2 border-white/20 shadow-lg", user.isDeceased && "grayscale")}
                        />
                    </div>
                ))}
            </motion.div>
        </div>
    );
};


export default function Home() {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                setAllUsers(users);
            } catch (error) {
                console.error("Failed to fetch users for homepage animation:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const usersWithPictures = useMemo(() => {
        const filtered = allUsers.filter(u => u.profilePictureUrl && !u.profilePictureUrl.includes('placehold.co'));
        return filtered.sort(() => 0.5 - Math.random());
    }, [allUsers]);
    
    const extendedUsers = useMemo(() => {
        if (usersWithPictures.length === 0) return [];

        let extended: User[] = [];
        // Ensure there are at least 20 profiles for a smooth animation
        while (extended.length < 20) {
            extended = extended.concat(usersWithPictures);
        }
        return extended;
    }, [usersWithPictures]);


    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background">
                <div aria-hidden="true" className="aurora-background absolute--full-bleed pointer-events-none" />
            </div>
            <MainHeader />
            
            <main className="flex-1">
                <section className="flex flex-col items-center justify-center text-center pt-32 pb-24 px-4 container">
                    <h1 className="font-headline text-5xl sm:text-7xl font-bold tracking-tight text-primary animate-fade-in [animation-delay:200ms]">
                        वसुधैव कुटुम्बकम्
                    </h1>
                    <p className="mt-6 max-w-prose text-lg text-muted-foreground animate-fade-in [animation-delay:400ms]">
                        An interactive family tree platform to connect roots, document heritage, and build a stronger future for our community.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-in [animation-delay:600ms]">
                        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
                            <Link href="/explore">
                                Explore The Community <ArrowRight />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="bg-background/50">
                            <Link href="/register">
                                <UserPlus /> Register a Profile
                            </Link>
                        </Button>
                    </div>
                </section>

                {!isLoading && extendedUsers.length > 0 && (
                     <section className="py-12 space-y-8">
                        <ScrollingProfileLane users={extendedUsers} duration={80} direction="left" />
                        <ScrollingProfileLane users={[...extendedUsers].reverse()} duration={60} direction="right" />
                    </section>
                )}

                <section className="py-24 bg-background/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                             <h2 className="text-4xl font-bold tracking-tight text-foreground">A Unified Digital Village</h2>
                             <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                                Our platform is designed to bring our community closer, one connection at a time.
                             </p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <FeatureCard 
                                href="/explore"
                                icon={<Search className="h-8 w-8 text-primary" />}
                                title="Explore Connections"
                                description="Visually navigate through generations and discover how families are interconnected within the community."
                            />
                            <FeatureCard 
                                href="/register"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                                title="Add Your Branch"
                                description="Easily add new family members and link them to existing profiles to grow the collective tree."
                            />
                            <FeatureCard 
                                href="/contact"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary"><path d="M12 21v-2a4 4 0 0 0-4-4H4a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M16 21v-2a4 4 0 0 0-4-4h-4"/><path d="M22 17a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z"/></svg>}
                                title="Preserve Heritage"
                                description="Create a lasting digital record of our heritage for future generations to explore and appreciate."
                            />
                         </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
