
import { getAllUsersForAdmin } from '@/actions/users';
import ConnectPageClient from './_components/ConnectPageClient';

export const dynamic = 'force-dynamic';

export type ConnectPageSearchParams = {
    page?: string;
    search?: string;
    marital?: string;
    deceased?: string;
    unlinked?: string;
    family?: string;
};

type ConnectPageProps = {
    searchParams: ConnectPageSearchParams;
};

const PAGE_SIZE = 50;

export default async function ConnectPage({ searchParams }: ConnectPageProps) {
    const page = Number(searchParams.page) || 1;
    const { users, total } = await getAllUsersForAdmin(page, PAGE_SIZE);

    return (
        <ConnectPageClient 
            initialUsers={users}
            initialTotal={total}
            pageSize={PAGE_SIZE}
            searchParams={searchParams}
        />
    );
}
