
'use server';

import { genkit, type Plugin } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';

const plugins: Plugin[] = [googleAI({ apiVersion: 'v1' })];

// Dotprompt is a developer tool and not required for production.
// if (process.env.NODE_ENV === 'development') {
//   plugins.push(devLogger());
//   startDevServer();
// }

export const ai = genkit({
  plugins,
  logLevel: 'warn',
  enableTracingAndMetrics: true,
});
