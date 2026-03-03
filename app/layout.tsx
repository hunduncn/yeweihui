import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getServerUser } from "@/lib/server-auth";
import { AuthProvider } from "@/components/AuthProvider";
import { NavUserMenu } from "@/components/NavUserMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "业委会工作留存系统",
  description: "业委会工作证据留存，有据可查",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getServerUser();

  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} antialiased bg-slate-50 min-h-screen`}>
        <AuthProvider user={user}>
          <nav className="bg-slate-900 sticky top-0 z-10 shadow-md">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                <span className="text-indigo-400">业委会</span>
                <span className="text-white">工作留存</span>
              </Link>
              <div className="flex items-center gap-5 text-sm">
                <Link href="/" className="text-slate-300 hover:text-white transition-colors">首页</Link>
                <Link href="/records" className="text-slate-300 hover:text-white transition-colors">记录列表</Link>
                <Link href="/contracts" className="text-slate-300 hover:text-white transition-colors">合同管理</Link>
                <Link href="/settings" className="text-slate-300 hover:text-white transition-colors">设置</Link>
                {user?.role === 'admin' && (
                  <Link href="/records/new" className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-lg font-medium transition-colors text-sm">
                    + 新增
                  </Link>
                )}
                {user && <NavUserMenu user={user} />}
              </div>
            </div>
          </nav>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
