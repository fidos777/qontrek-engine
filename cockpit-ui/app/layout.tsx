import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark cockpit">
      <head>
        <title>Qontrek Cockpit UI</title>
      </head>
      <body style={{
        background: 'var(--bg-canvas)',
        color: 'var(--text-1)',
        minHeight: '100vh'
      }}>
        {children}
      </body>
    </html>
  );
}
