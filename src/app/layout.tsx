import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "똑디 인터뷰 - 홈페이지 제작 견적",
  description: "현대카드 스타일의 세련된 견적 인터뷰 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
