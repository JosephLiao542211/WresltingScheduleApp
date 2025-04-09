import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/react"
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Class Scheduler',
  description: 'The simplest way to sign up for classes',
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
          <Navbar />
          <main>{children}</main>
        </Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
