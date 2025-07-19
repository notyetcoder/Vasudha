
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterAdminPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <ShieldOff className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <CardTitle className="text-2xl font-bold tracking-tight">Registration Disabled</CardTitle>
                    <CardDescription>
                        The super-administrator account is created via the server. New user creation is handled by administrators inside the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/admin/login">Go to Login</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
