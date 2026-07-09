import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '../store/StoreProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'FinanceFlow',
  description: 'Modern financial tracking and analytics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Everything inside here now has access to Redux! */}
        <StoreProvider>
          {children}
          <Toaster position="top-right" reverseOrder={false} />
        </StoreProvider>
      </body>
    </html>
  );
}
