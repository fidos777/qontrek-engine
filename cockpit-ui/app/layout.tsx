import "./globals.css";
import { SafeModeProvider } from "@/lib/safeModeContext";
import SafeModeBadge from "@/components/SafeModeBadge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Qontrek Cockpit UI</title>
      </head>
      <body>
        <SafeModeProvider>
          <SafeModeBadge />
          {children}
        </SafeModeProvider>
      </body>
    </html>
  );
}
