'use server';

/**
 * @fileOverview An AI flow to validate that an uploaded image contains a real human face.
 *
 * - validateHumanImage - A function that handles the image validation.
 * - ValidateHumanImageInput - The input type for the validateHumanImage function.
 * - ValidateHumanImageOutput - The return type for the validateHumanImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateHumanImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be validated, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ValidateHumanImageInput = z.infer<typeof ValidateHumanImageInputSchema>;

const ValidateHumanImageOutputSchema = z.object({
  isHumanFace: z
    .boolean()
    .describe('Whether or not the image contains a real human face. This should be false for cartoons, avatars, objects, or animals.'),
  reason: z.string().describe('A brief explanation for the decision.'),
});
export type ValidateHumanImageOutput = z.infer<
  typeof ValidateHumanImageOutputSchema
>;

export async function validateHumanImage(
  input: ValidateHumanImageInput
): Promise<ValidateHumanImageOutput> {
  return validateHumanImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'validateHumanImagePrompt',
  input: {schema: ValidateHumanImageInputSchema},
  output: {schema: ValidateHumanImageOutputSchema},
  prompt: `You are an image validation expert for a community profile website. Your task is to determine if an image contains a real, identifiable human face.

Analyze the following image.

Photo: {{media url=photoDataUri}}

Rules for validation:
- The image MUST contain a real human.
- The image must NOT be a cartoon, anime character, 3D avatar, emoji, or any form of illustration.
- The image must NOT be an animal, object, or scenery.
- A clear face should be visible.

Based on these rules, set the 'isHumanFace' field to true or false and provide a short, user-friendly reason for your decision. For example, if it's a cartoon, the reason could be "The image appears to be a cartoon or illustration, not a real photo." If it's an object, "The image does not contain a human face." If it is valid, the reason can be "The image appears to be a valid profile picture."`,
});

const validateHumanImageFlow = ai.defineFlow(
  {
    name: 'validateHumanImageFlow',
    inputSchema: ValidateHumanImageInputSchema,
    outputSchema: ValidateHumanImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
