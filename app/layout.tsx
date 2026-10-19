import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Scan&Dine | Contactless Restaurant Ordering', description: 'QR-powered restaurant ordering, kitchen tickets and service point of sale.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
