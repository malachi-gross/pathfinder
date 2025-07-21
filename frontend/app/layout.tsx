// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UNC Course Planner',
  description: 'Plan your courses at UNC Chapel Hill',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <a href="/" className="text-xl font-bold text-blue-600">
                      UNC Course Planner
                    </a>
                  </div>
                  <div className="flex items-center space-x-4">
                    <a href="/courses" className="text-gray-700 hover:text-blue-600">
                      Courses
                    </a>
                    <a href="/programs" className="text-gray-700 hover:text-blue-600">
                      Programs
                    </a>
                    <a href="/planner" className="text-gray-700 hover:text-blue-600">
                      My Plan
                    </a>
                  </div>
                </div>
              </div>
            </nav>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}