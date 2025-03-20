import "./globals.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import { ThemeProvider } from "../lib/contexts/ThemeContext";
import { Metadata } from "next";
import Sidebar from "../components/Sidebar";

export const metadata: Metadata = {
  title: "Green Machine Book Reports",
  description: "Track your daily reading and build a library of book reports",
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
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <div className="flex-1 overflow-auto pl-64">
                <main className="h-full p-6">
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
