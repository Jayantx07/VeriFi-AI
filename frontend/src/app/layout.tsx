import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VeriFi AI — Transaction-Authorization Layer',
  description: 'Multimodal Fraud Interception Layer correlating communication sensors with ERP payments via Neo4j Graph Lineage and FIDO2 Passkeys',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
