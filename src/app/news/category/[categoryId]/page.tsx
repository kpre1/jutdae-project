'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  image_url: string;
  published_at: string;
  link: string;
  category_id: number;
  category_name: string;
}

const categories = [
  { id: 100, name: '정치' },
  { id: 101, name: '경제' },
  { id: 102, name: '사회' },
  { id: 103, name: '생활/문화' },
  { id: 104, name: '세계' },
  { id: 105, name: 'IT/과학' },
];

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  useEffect(() => {
    fetchNews(1, selectedCategory);
  }, [selectedCategory]);

  const fetchNews = async (pageNum = 1, categoryId: number | null = null) => {
    setLoading(true);
    const itemsPerPage = 10;
    const from = (pageNum - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from('news')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false })
      .range(from, to);

    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, error, count } = await query;

    if (error) {
      console.error('뉴스 가져오기 오류:', error);
    } else {
      if (pageNum === 1) setNews(data || []);
      else setNews(prev => [...prev, ...(data || [])]);

      setHasMore((count || 0) > pageNum * itemsPerPage);
    }

    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage, selectedCategory);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}시간 전`;
    else if (diffDays < 7) return `${diffDays}일 전`;
    else return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">뉴스</h1>

        {/* 카테고리 버튼 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-md border ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            전체
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-md border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 뉴스 목록 */}
        <div className="space-y-6">
          {news.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-500">
              뉴스가 없습니다.
            </div>
          ) : (
            news.map(item => (
              <article
                key={item.news_id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="mb-4 rounded"
                  />
                )}
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                    {item.category_name}
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatDate(item.published_at)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                  <Link
                    href={`/news/${item.news_id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {item.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                  {item.content.length > 200
                    ? `${item.content.substring(0, 200)}...`
                    : item.content}
                </p>
                <div className="flex items-center space-x-4">
                  <Link
                    href={`/news/${item.news_id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    자세히 보기 →
                  </Link>

                  {/* 🔽 새로 추가된 버튼 */}
                <Link href={`/news/summary/${item.news_id}`}>
                  기사 읽고 요약해보기 
                </Link>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    원문 보기 ↗
                  </a>
                </div>
              </article>
            ))
          )}
        </div>

        {hasMore && (
          <div className="text-center pt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-3 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-400 rounded-full border-t-transparent"></div>
                  <span>로딩 중...</span>
                </span>
              ) : (
                '더 보기'
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
