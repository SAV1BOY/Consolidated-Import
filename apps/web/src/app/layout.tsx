import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ILUMINAR - Gestao de Importacao',
  description: 'Sistema de gestao de importacao consolidada',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
