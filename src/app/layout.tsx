import "./globals.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import { ThemeProvider } from "../lib/contexts/ThemeContext";
import { Metadata } from "next";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "90 Day Run Tracker",
  description: "Track your running progress over 90 days",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--apple-gray-50)] dark:bg-[var(--apple-gray-900)]">
        <AuthProvider>
          <ThemeProvider>
            <div className="flex flex-col md:flex-row h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-auto md:pl-64 pl-0">
                <Navbar />
                <main className="h-full p-4 md:p-6">
                  {children}
                </main>
              </div>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
