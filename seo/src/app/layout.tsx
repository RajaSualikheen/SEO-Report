// src/app/layout.tsx
import './globals.css'; // Your global styles, including Tailwind directives
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Example font, adjust if you use a different one

// Corrected import paths: @/ now points to src/, so remove 'src/' from the path
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

const inter = Inter({ subsets: ['latin'] });

// Define metadata for your app (important for SEO in Next.js)
export const metadata: Metadata = {
  title: 'CrestNova.Sol - AI-Powered SEO Mastery',
  description: 'Elevate your digital presence with deep analytics, actionable strategies, and real-time performance insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Navbar will appear on all pages */}
        <Navbar />

        {/* The 'main' tag wraps the content of the current page */}
        <main className="flex-grow"> {/* Added flex-grow to ensure content pushes footer down */}
          {children}
        </main>

        {/* This div is the portal root for your AppModals component */}
        {/* It must be outside the main content area but inside the body */}
        <div id="modal-root"></div>

        {/* Footer will appear on all pages */}
        <Footer />
      </body>
    </html>
  );
}