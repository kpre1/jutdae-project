'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [recentNews, setRecentNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // 사용자 정보 가져오기
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // 최신 뉴스 가져오기
    fetchRecentNews();
    
    // 카테고리 가져오기
    fetchCategories();
  }, []);

  const fetchRecentNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select(`
        *,
        categories(name),
        profiles(username)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('뉴스 가져오기 오류:', error);
    } else {
      setRecentNews(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error('카테고리 가져오기 오류:', error);
    } else {
      setCategories(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              {user ? (
                <>
                  <Link href="/news/upload" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    글 쓰기
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                    프로필
                  </Link>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="text-gray-700 hover:text-red-600"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-blue-600">
                    로그인
                  </Link>
                  <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            줏대 있게 살아
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            뉴스를 요약하고, 의견을 나누며, AI와 토론하세요
          </p>
        </div>

        {/* 카테고리 섹션 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">카테고리</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/news/category/${category.id}`}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 최신 뉴스 섹션 */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">최신 뉴스</h2>
          <div className="space-y-4">
            {recentNews.map((news) => (
              <div key={news.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {news.categories?.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        by {news.profiles?.username}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      <Link href={`/news/${news.id}`} className="hover:text-blue-600">
                        {news.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {news.content.substring(0, 200)}...
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{new Date(news.created_at).toLocaleDateString()}</span>
                      <Link href={`/news/${news.id}`} className="text-blue-600 hover:underline">
                        자세히 보기
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 사용자 환영 메시지 */}
        {user && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              환영합니다, {user.email}님!
            </h3>
            <p className="text-blue-700">
              새로운 뉴스를 공유하고, 다른 사용자들의 요약에 의견을 남겨보세요.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}