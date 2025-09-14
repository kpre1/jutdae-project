'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, BookOpen } from "lucide-react";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 현재 사용자 확인
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 네비게이션 바 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-2xl font-bold text-blue-600">
                  줏대 있게 살아
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="text-gray-500">로딩중...</div>
                ) : user ? (
                  // 로그인된 상태
                  <>
                    <span className="text-gray-700">
                      안녕하세요, {user.user_metadata?.name || user.email}님!
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-blue-600"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  // 로그인되지 않은 상태
                  <>
                    <Link href="/login" className="text-gray-700 hover:text-blue-600">
                      로그인
                    </Link>
                    <Link
                      href="/register"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      회원가입
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 전체 레이아웃 */}
        <div className="flex">
          {/* 사이드바 */}
          <aside className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 h-screen p-6 border-r sticky top-0">
            <nav className="space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
              >
                <Home size={18} />
                <span>요약하기</span>
              </Link>
              <Link
                href="/levelup"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
              >
                <BookOpen size={18} />
                <span>레벨업 모드</span>
              </Link>
            </nav>
          </aside>

          {/* 본문 영역 */}
          <main className="flex-1 p-10 bg-gray-50 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}