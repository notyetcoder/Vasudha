import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vasudha Connect',
    short_name: 'Vasudha',
    description: 'Community Family Tree — વસુધૈવ કુટુમ્બકમ્',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a1628',
    theme_color: '#22c55e',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
