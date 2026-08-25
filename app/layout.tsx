import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Хімпостачальник — каталог полімерних матеріалів',
  description: 'Професійні поліуретанові клеї, рідкі пластики, покриття та гідроізоляційні матеріали.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
