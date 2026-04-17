import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Team Task Manager',
  description: 'Manage team tasks, clients, and distribution',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t) { document.documentElement.setAttribute('data-theme', t); }
              else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
