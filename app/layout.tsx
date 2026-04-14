import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Team Task Manager',
  description: 'Manage team tasks, clients, and distribution',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
