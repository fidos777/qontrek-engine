import "./globals.css";
import { Toaster } from "react-hot-toast";

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
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
