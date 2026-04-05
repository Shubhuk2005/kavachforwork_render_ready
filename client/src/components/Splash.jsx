import { useEffect, useState } from 'react';

export default function Splash({ onFinish }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'out'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 300);   // logo finishes scaling in
    const t2 = setTimeout(() => setPhase('out'), 1800);   // begin fade out
    const t3 = setTimeout(() => onFinish(), 2300);        // unmount
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'white',
        transition: 'opacity 0.5s ease',
        opacity: phase === 'out' ? 0 : 1,
      }}
    >
      {/* Logo bounce-in */}
      <div
        style={{
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
          transform: phase === 'in' ? 'scale(0.3)' : 'scale(1)',
          opacity: phase === 'in' ? 0 : 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          src="/logo.png"
          alt="KavachForWork"
          style={{ width: 140, height: 140, objectFit: 'contain' }}
          onError={(e) => {
            // fallback to shield SVG if image not found
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            fontWeight: 800,
            fontFamily: 'system-ui, sans-serif',
            color: '#1a1a1a',
            letterSpacing: '-0.5px',
          }}
        >
          Kavach<span style={{ color: '#e85d04' }}>ForWork</span>
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: '#888',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Climate Protection
        </div>
      </div>

      {/* Bottom spinner */}
      <div
        style={{
          position: 'absolute',
          bottom: 48,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          opacity: phase === 'in' ? 0 : 1,
          transition: 'opacity 0.4s ease 0.3s',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #ffe0cc',
            borderTop: '3px solid #e85d04',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
