import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      {/* Brand panel — hidden on mobile */}
      <div className="auth-layout-brand">
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: '1rem' }}>
            Enterprise AI Platform
          </div>
          <div className="auth-layout-brand-title">OneOps AI</div>
          <div className="auth-layout-brand-sub">
            Automate, orchestrate, and monitor your workflows at scale.
          </div>
          <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', zIndex: 1 }}>
            {['Workflow automation', 'Real-time monitoring', 'AI-powered insights', 'Team collaboration'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', flexShrink: 0 }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Form panel */}
      <div className="auth-layout-form">
        {children}
      </div>
    </div>
  );
}
