import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agora Hub",
  description: "Federation identity and reputation service for Christian Debate",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
