import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

const inter = Inter({subsets: ['latin'], variable: '--font-sans'});

export const metadata: Metadata = {
  title: 'DataVision - Simple Data Visualizer',
  description: 'Upload your data and create visualizations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className='dark' style={{ colorScheme: 'dark' }}>
      <body className={`font-sans antialiased ${inter.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
