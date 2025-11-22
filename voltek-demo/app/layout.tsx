import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voltek Demo - Gate 2 Dashboard',
  description: 'Payment Recovery Dashboard with Governance Feedback',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
