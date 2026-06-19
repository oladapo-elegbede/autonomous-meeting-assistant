import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { clientEnv } from '@/lib/env/client';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Autonomous AI Meeting Assistant',
  description: 'Transform meeting recordings into structured intelligence using AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={clientEnv.clerk.publishableKey}
      signInUrl={clientEnv.clerk.signInUrl}
      signUpUrl={clientEnv.clerk.signUpUrl}
      signInFallbackRedirectUrl={clientEnv.clerk.afterSignInUrl}
      signUpFallbackRedirectUrl={clientEnv.clerk.afterSignUpUrl}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
