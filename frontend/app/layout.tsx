import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { OrgProvider } from '@/context/OrgContext';
import { ToastProvider } from '@/context/ToastContext';
import { MuiProvider } from '@/components/providers/MuiProvider';

export const metadata: Metadata = {
  title: {
    default: 'OneOps AI',
    template: '%s — OneOps AI',
  },
  description: 'Enterprise workflow orchestration powered by AI',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body>
        <MuiProvider>
          <AuthProvider>
            <OrgProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </OrgProvider>
          </AuthProvider>
        </MuiProvider>
      </body>
    </html>
  );
}
