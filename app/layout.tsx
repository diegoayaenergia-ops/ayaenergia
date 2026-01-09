import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="h-screen w-screen overflow-hidden bg-slate-950 text-white">
        {children}
      </body>
    </html>
  );
}
