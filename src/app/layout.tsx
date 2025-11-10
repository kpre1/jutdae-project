'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Home, BookOpen, Pen } from "lucide-react";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('news')
          .select('news_id, title')
          .eq('author_email', user.email)
          .order('published_at', { ascending: false });
        setMyPosts(data || []);
      }

      setLoading(false);
    };
    fetchUserAndPosts();

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
        <body className={`antialiased text-base sm:text-lg bg-white`}>
    <nav className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
    <div className="flex justify-between items-center py-5">
      {/* 로고 */}
      <Link href="/" className="text-2xl sm:text-3xl font-bold text-indigo-800">
        줏대 있게 살아
      </Link>

      {/* 로그인/회원가입 or 로그아웃 */}
      <div className="flex items-center space-x-4">
        {user ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            로그아웃
          </button>
        ) : (
          <>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
            >
              로그인
            </Link>
            <Link
              href="/register"
              className="text-gray-700 hover:text-indigo-600 font-medium"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </div>
  </div>
</nav>


        <div className="flex">
          {/* 사이드바 */}
          <aside className="w-72 sm:w-80 bg-gradient-to-b from-white to-gray-100 h-screen p-6 border-r sticky top-0 flex flex-col">
             {/* 프로필 영역 (사이드바 맨 아래) */}
            {user && (
              <div className="text-center mt-auto">
                <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                  {user.user_metadata?.name?.charAt(0) || user.email?.charAt(0)}
                </div>
                <p className="mt-2 font-medium text-gray-700">{user.user_metadata?.name || user.email}</p>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="mt-3 px-3 py-1 text-sm rounded border text-gray-700 hover:text-indigo-600"
                >
                  로그아웃
                </button>
              </div>
            )}
            
            <div className="h-6"></div>
            {/* 메뉴 영역 */} 
           <nav className="space-y-3 flex-2">
              <Link
                href="/"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-800 transition"
              >
                <Home size={20} />
                <span className="font-medium">요약하기</span>
              </Link>

              <Link
                href="/levelup"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-800 transition"
              >
                <BookOpen size={20} />
                <span className="font-medium">레벨업 모드</span>
              </Link>

               <Link
                href="/my-posts"
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-800 transition"
              >
                <Pen size={20} />
                <span className="font-medium">내가 쓴 글</span>
              </Link>
            
              <Link
               href="/profile"
               className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-indigo-100 hover:text-indigo-800 transition"
              >
               <span className="font-medium">마이페이지</span>
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
