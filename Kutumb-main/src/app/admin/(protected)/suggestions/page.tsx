
import { getSuggestions } from '@/actions/suggestions';
import SuggestionsClient from './_components/SuggestionsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuggestionsPage() {
    const initialSuggestions = await getSuggestions();

    return <SuggestionsClient initialSuggestions={initialSuggestions} />;
}
