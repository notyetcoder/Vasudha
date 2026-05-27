import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Vasudha Connect — Community Family Tree';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 50%, #0a1628 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'serif',
        }}
      >
        {/* Decorative circle */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)',
          border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
          fontSize: 56,
        }}>
          🌳
        </div>

        <h1 style={{
          fontSize: 64, fontWeight: 700, color: '#4ade80',
          margin: 0, textAlign: 'center', lineHeight: 1.1,
        }}>
          Vasudha Connect
        </h1>

        <p style={{
          fontSize: 28, color: '#94a3b8', marginTop: 16,
          textAlign: 'center',
        }}>
          વસુધૈવ કુટુમ્બકમ્
        </p>

        <p style={{
          fontSize: 20, color: '#64748b', marginTop: 8,
          textAlign: 'center',
        }}>
          Community Family Tree · vasu-dha.vercel.app
        </p>
      </div>
    ),
    { ...size }
  );
}
