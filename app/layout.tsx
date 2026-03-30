import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Lenny's Office Hours",
  description: 'Beluga-style PM learning simulator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
