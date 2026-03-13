import "./globals.css";
import AppShell from "../components/AppShell";
import { LanguageProvider } from "../lib/LanguageContext";

export const metadata = {
  title: "Green Mandi",
  description:
    "Problem Statement #1 solution: an offline-aware Nipani farm-to-retail marketplace with listings, bulk orders, UPI simulation, and logistics tracking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
