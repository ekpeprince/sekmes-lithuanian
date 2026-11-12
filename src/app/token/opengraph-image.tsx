import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '$LABASCOIN - Official Stellar Mainnet Token of LabasApp';
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
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Amber Glow Accent */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '450px',
            height: '450px',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, rgba(253,185,19,0.3) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Top Header Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              fontSize: '16px',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FDB913',
            }}
          >
            ✦ Stellar Mainnet • SEP-0001
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1.5px solid rgba(255, 255, 255, 0.15)',
              fontSize: '16px',
              fontWeight: 700,
              color: '#A7F3D0',
            }}
          >
            Live AMM Liquidity
          </div>
        </div>

        {/* Center Main Pitch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', zIndex: 10 }}>
          <h1
            style={{
              fontSize: '76px',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#FFFFFF',
              lineHeight: 1.05,
            }}
          >
            $LABASCOIN
          </h1>
          <p
            style={{
              fontSize: '28px',
              color: '#D1FAE5',
              maxWidth: '850px',
              margin: 0,
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            The native micro-reward and liquidity token of LabasApp. Earn by mastering Lithuanian lessons and voice drills — trade 24/7 on Stellar DEX.
          </p>
        </div>

        {/* Bottom Feature Badges & URL */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '2px solid rgba(255, 255, 255, 0.15)',
            paddingTop: '32px',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', gap: '28px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6EE7B7', fontWeight: 700, letterSpacing: '0.05em' }}>
                Fixed Supply
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>
                100,000,000,000
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6EE7B7', fontWeight: 700, letterSpacing: '0.05em' }}>
                Settlement
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#FDB913' }}>
                3.5s Finality
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', textTransform: 'uppercase', color: '#6EE7B7', fontWeight: 700, letterSpacing: '0.05em' }}>
                Student Fees
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'white' }}>
                $0.00 Gasless
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '22px',
              fontWeight: 800,
              color: '#FDB913',
            }}
          >
            labasapp.com/token
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
