import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>Qontrek Cockpit UI</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
