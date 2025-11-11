'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, BookOpen, Pen, User } from "lucide-react";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupaUser } from '@supabase/supabase-js';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupaUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <html lang="ko">
<body className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-800 bg-gradient-to-br from-indigo-400 via-blue-400 to-purple-400`}>

        {/* 상단 네비게이션 */}
        <header className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 shadow-sm fixed w-full top-0 left-0 z-50 backdrop-blur-md border-b border-indigo-100/40">
          <div className="max-w-[1400px] mx-auto px-10 flex justify-between items-center h-24">
            {/* 로고 영역 */}
            <Link
              href="/"
              className="flex items-center gap-3 text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-indigo-500 hover:from-indigo-900 hover:to-indigo-600 transition-all"
            >
              <BookOpen size={38} className="text-indigo-700 drop-shadow-sm" />
              <span>줏대 있게 살아</span>
            </Link>

            {/* 로그인 / 로그아웃 영역 */}
            <div>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full bg-indigo-100 text-indigo-800 font-semibold hover:bg-indigo-200 transition"
                >
                  로그아웃
                </button>
              ) : (
                <div className="flex items-center gap-5">
                  <Link
                    href="/login"
                    className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="text-indigo-800 hover:text-indigo-600 font-semibold transition"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 본문 레이아웃 */}
        <div className="pt-32 flex justify-center">
          <div className="max-w-[1400px] w-full flex gap-10 px-10 pb-20">
            {/* 사이드바 */}
            <aside className="w-[260px] flex-shrink-0 bg-gradient-to-b from-white to-indigo-50 rounded-3xl shadow-md border border-indigo-100 p-6 sticky top-32 self-start transition-all">
              <nav className="space-y-2">
                <Link href="/" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition">
                  <Home size={20} />
                  요약하기
                </Link>
                <Link href="/levelup" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition">
                  <BookOpen size={20} />
                  레벨업 모드
                </Link>
                <Link href="/my-posts" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition">
                  <Pen size={20} />
                  내가 쓴 글
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 font-medium transition">
                  <User size={20} />
                  마이페이지
                </Link>
              </nav>

              {user && (
                <div className="mt-10 pt-6 border-t border-indigo-100 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                    {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                  </div>
                  <p className="mt-2 font-semibold text-gray-800">{user.user_metadata?.name || user.email}</p>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              )}
            </aside>
            {/* 메인 콘텐츠 */} 
            <main className="flex-1 rounded-3xl bg-white rounded-3xl shadow-lg border border-indigo-100 p-2 min-h-[80vh]"> {children} </main>

          </div>
        </div>
      </body>
      
    </html>



  );
}
