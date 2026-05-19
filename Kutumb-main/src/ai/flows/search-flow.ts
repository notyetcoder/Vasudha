
'use server';
/**
 * @fileOverview An AI flow for interpreting natural language search queries for the family tree.
 */
import { ai } from '@/ai/genkit';
import type { User } from '@/lib/types';
import { z } from 'zod';
import { findUserById } from '@/lib/user-utils';
import { findChildrenAction, findSiblingsAction } from '@/actions/users';

const RelationQueryInputSchema = z.object({
  query: z.string().describe('The user\'s natural language search query.'),
  users: z.custom<User[]>().describe('An array of all available user objects to search within.'),
});
export type RelationQueryInput = z.infer<typeof RelationQueryInputSchema>;

const RelationQueryOutputSchema = z.object({
  reasoning: z.string().describe('A brief, user-friendly explanation of what the AI understood and is showing. For example, "Showing children of Trikambhai".'),
  userIds: z.array(z.string()).describe('An array of user IDs that match the query.'),
});
export type RelationQueryResponse = z.infer<typeof RelationQueryOutputSchema>;

// Exported wrapper function to be called by the application
export async function queryByRelation(input: RelationQueryInput): Promise<RelationQueryResponse> {
  return searchFlow(input);
}

const findPeopleTool = ai.defineTool(
  {
    name: 'findPeople',
    description: 'Finds people based on a name. Returns a list of user objects that are potential matches.',
    inputSchema: z.object({
      name: z.string().describe("The name of the person to find. This should be just the first name."),
    }),
    outputSchema: z.array(z.custom<User>()),
  },
  async (input) => {
    const { name, users } = input as any; // The users array is passed through context
    if (!users || !Array.isArray(users)) return [];
    
    const lowerCaseName = name.toLowerCase();
    
    return users.filter((user: User) =>
      user.name.toLowerCase().includes(lowerCaseName)
    );
  }
);


const getChildrenTool = ai.defineTool(
    {
        name: 'getChildren',
        description: "Gets the children of a specific person, given that person's full user object.",
        inputSchema: z.custom<User>(),
        outputSchema: z.array(z.custom<User>()),
    },
    async (user) => {
       return findChildrenAction(user.id);
    }
);

const getSiblingsTool = ai.defineTool(
    {
        name: 'getSiblings',
        description: "Gets the siblings of a specific person, given that person's full user object.",
        inputSchema: z.custom<User>(),
        outputSchema: z.array(z.custom<User>()),
    },
    async (user) => {
       return findSiblingsAction(user);
    }
);

const getSpouseTool = ai.defineTool(
    {
        name: 'getSpouse',
        description: "Gets the spouse of a specific person, given that person's full user object.",
        inputSchema: z.custom<User>(),
        outputSchema: z.custom<User>().optional(),
    },
    async (user, context) => {
       if (!user.spouseId) return undefined;
       // The `users` array is available in the context of the flow execution
       const allUsers = (context as any).users as User[];
       return findUserById(user.spouseId, allUsers);
    }
);

const searchFlow = ai.defineFlow(
  {
    name: 'searchFlow',
    inputSchema: RelationQueryInputSchema,
    outputSchema: RelationQueryOutputSchema,
  },
  async ({ query, users }) => {
    
    const llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      tools: [findPeopleTool, getChildrenTool, getSiblingsTool, getSpouseTool],
      prompt: `The user wants to search the family tree. Your goal is to understand their query, use tools to find the right people, and return a list of user IDs.

User Query: "${query}"

Follow these steps:
1.  First, use the \`findPeople\` tool to locate the main person mentioned in the query. If multiple people are found, assume the first one is correct.
2.  Based on the query's intent (e.g., "children of", "spouse of", "siblings of"), use the appropriate tool (\`getChildren\`, \`getSpouse\`, \`getSiblings\`) with the person object you found in step 1.
3.  If the query is just a name, return the result from \`findPeople\`.
4.  If no specific relationship is asked for, but a name is provided, just return the user IDs of the people found by \`findPeople\`.
5.  Formulate a user-friendly "reasoning" string explaining your action.
6.  Return the final list of user IDs. If a tool returns a single user, return their ID in an array.

Examples:
- If query is "children of Suresh", first find "Suresh", then get his children. Reasoning: "Showing children of Suresh".
- If query is "Suresh", just find him. Reasoning: "Showing results for Suresh".
- If query is "spouse of Sita", find "Sita", then get her spouse. Reasoning: "Showing spouse of Sita".
`,
      // Pass the full user list into the tool execution context.
      // This makes it available to all tools without needing to be an explicit parameter for each.
      context: { users },
      output: {
          schema: RelationQueryOutputSchema
      }
    });

    return llmResponse.output() || { reasoning: "Could not understand the query.", userIds: [] };
  }
);
