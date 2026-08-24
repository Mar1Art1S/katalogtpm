import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Каталог професійних полімерних матеріалів',
  description: 'Поліуретанові клеї, рідкі пластики, покриття та гідроізоляційні матеріали для партнерів і продавців.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
