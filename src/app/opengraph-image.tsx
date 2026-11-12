import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'LabasApp - Learn Lithuanian Online with AI Tutor Leonas';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #047857 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '450px',
            height: '450px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(253,185,19,0.25) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: '#FDB913',
              color: '#0f172a',
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            🇱🇹 Lithuania&apos;s #1 Language Platform
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.12)',
              fontSize: '15px',
              fontWeight: 700,
              color: '#A7F3D0',
            }}
          >
            Powered by Stellar Web3 Rewards
          </div>
        </div>

        {/* Center Main Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1
              style={{
                fontSize: '80px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                margin: 0,
                color: '#FFFFFF',
                lineHeight: 1.05,
              }}
            >
              Labas<span style={{ color: '#10B981' }}>App</span>
            </h1>
            <span
              style={{
                fontSize: '22px',
                fontWeight: 800,
                background: '#047857',
                padding: '6px 14px',
                borderRadius: '12px',
                color: '#FDB913',
                border: '1px solid rgba(253, 185, 19, 0.4)',
              }}
            >
              AI Speaking Tutor
            </span>
          </div>

          <p
            style={{
              fontSize: '30px',
              color: '#E2E8F0',
              maxWidth: '880px',
              margin: 0,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            Learn Lithuanian with gamified lessons, interactive native audio, Leonas AI speaking tutor, and earn real $LABAS crypto rewards on Stellar!
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '28px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🗣️</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>
                AI Voice Pronunciation
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#F1F5F9' }}>
                Bite-sized Gamified Units
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🪙</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#FDB913' }}>
                Earn $LABAS on Stellar
              </span>
            </div>
          </div>

          <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>
            labasapp.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
