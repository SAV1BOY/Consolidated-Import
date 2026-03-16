import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ILUMINAR - Gestão de Importação',
  description: 'Sistema de gestão de importação consolidada',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">
        <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/consolidacoes" className="text-lg font-bold text-brand-green">
              ILUMINAR
            </Link>
            <Link href="/consolidacoes" className="text-sm text-gray-400 hover:text-gray-200">
              Consolidações
            </Link>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
