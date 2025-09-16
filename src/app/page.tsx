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
        topic(name)
      `)
      .order('published_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('뉴스 가져오기 오류:', error);
    } else {
      setRecentNews(data || []);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('topic').select('*');

    if (error) {
      console.error('카테고리 가져오기 오류:', error);
    } else {
      setCategories(data || []);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      {/* 헤더 */}
      <div className="max-w-5xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-extrabold text-indigo-900 mb-4">
          줏대 있게 살아
        </h1>
        <p className="text-lg text-gray-600">
          뉴스를 요약하고, 의견을 나누며, AI와 토론하세요
        </p>
      </div>

      {/* 카테고리 섹션 */}
<section className="max-w-6xl mx-auto my-16 px-4">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">
    주제 선택
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {categories.map((category) => (
      <div
        key={category.topic_id}
        className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl border border-gray-200"
      >
        {/* 이미지 영역 */}
        {category.image_url && (
          <div className="w-full h-48 lg:h-56">
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 제목 + 버튼 */}
        <div className="p-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-indigo-900">
            {category.name}
          </h3>
          <Link
            href={`/news/category/${category.topic_id}`}
            className="bg-indigo-900 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-indigo-800 transition-colors"
          >
            보기
          </Link>
        </div>
      </div>
    ))}
  </div>
</section>


      {/* 최신 뉴스 섹션 */}
      <section className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">최신 뉴스</h2>
        <div className="space-y-6">
          {recentNews.map((news) => (
            <div
              key={news.news_id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      {news.topic?.name}
                    </span>
                    {news.journal && (
                      <span className="text-sm text-gray-500">
                        {news.journal}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link
                      href={`/news/${news.news_id}`}
                      className="hover:text-indigo-600"
                    >
                      {news.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {news.content.substring(0, 200)}...
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      {new Date(news.published_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/news/${news.news_id}`}
                      className="text-indigo-600 hover:underline"
                    >
                      자세히 보기
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 사용자 환영 메시지 */}
      {user && (
        <section className="max-w-5xl mx-auto mt-16 bg-indigo-50 border border-indigo-200 rounded-2xl p-8">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            환영합니다, {user.email}님!
          </h3>
          <p className="text-indigo-700">
            새로운 뉴스를 공유하고, 다른 사용자들의 요약에 의견을 남겨보세요.
          </p>
        </section>
      )}
    </main>
  );
}
