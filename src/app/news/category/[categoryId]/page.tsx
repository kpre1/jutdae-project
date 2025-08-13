// app/news/category/[categoryId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; // ✅ 수정됨!
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';


interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  journal: string;
  published_at: string;
  topic: {
    name: string;
    topic_id: number;
  };
}

interface Category {
  topic_id: number;
  name: string;
}

const CategoryNewsPage: React.FC = () => {
  const params = useParams();
  const categoryId = params.categoryId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // 사용자 정보 가져오기
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // 카테고리 정보 및 뉴스 가져오기
    if (categoryId) {
      fetchCategoryInfo();
      fetchNews();
    }
  }, [categoryId]);

  const fetchCategoryInfo = async () => {
    const { data, error } = await supabase
      .from('topic')
      .select('*')
      .eq('topic_id', parseInt(categoryId))
      .single();

    if (error) {
      console.error('카테고리 정보 가져오기 오류:', error);
    } else {
      setCategory(data);
    }
  };

  const fetchNews = async (pageNum = 1) => {
    setLoading(true);
    
    const itemsPerPage = 10;
    const from = (pageNum - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error, count } = await supabase
      .from('news')
      .select(`
        *,
        topic(name, topic_id)
      `, { count: 'exact' })
      .eq('topic_id', parseInt(categoryId))
      .order('published_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('뉴스 가져오기 오류:', error);
    } else {
      if (pageNum === 1) {
        setNews(data || []);
      } else {
        setNews(prev => [...prev, ...(data || [])]);
      }
      
      // 더 불러올 데이터가 있는지 확인
      const totalItems = count || 0;
      setHasMore(totalItems > pageNum * itemsPerPage);
    }
    
    setLoading(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const extractDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 네비게이션 */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                줏대 있게 살아
              </Link>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link href="/news/upload" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      글 쓰기
                    </Link>
                    <button 
                      onClick={() => supabase.auth.signOut()}
                      className="text-gray-700 hover:text-red-600"
                    >
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="text-gray-700 hover:text-blue-600">
                    로그인
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* 로딩 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              줏대 있게 살아
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link href="/news/upload" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    글 쓰기
                  </Link>
                  <span className="text-gray-700">{user.email}</span>
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
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              홈
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-gray-900 font-medium">
              {category?.name || '카테고리'}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category?.name} 뉴스
          </h1>
          <p className="text-gray-600">
            {category?.name} 관련 최신 뉴스를 확인하고 요약을 작성해보세요.
          </p>
        </div>

        {/* 뉴스 목록 */}
        <div className="space-y-6">
          {news.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                아직 뉴스가 없습니다
              </h3>
              <p className="text-gray-500 mb-6">
                이 카테고리에 첫 번째 뉴스를 등록해보세요!
              </p>
              {user && (
                <Link
                  href="/news/upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  뉴스 등록하기
                </Link>
              )}
            </div>
          ) : (
            <>
              {news.map((item, index) => (
                <article 
                  key={item.news_id} 
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 메타 정보 */}
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                          {item.topic?.name}
                        </span>
                        {item.journal && (
                          <span className="text-sm text-gray-500">
                            {extractDomain(item.journal)}
                          </span>
                        )}
                        <span className="text-sm text-gray-400">
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      {/* 제목 */}
                      <h2 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                        <Link 
                          href={`/news/${item.news_id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {item.title}
                        </Link>
                      </h2>

                      {/* 내용 미리보기 */}
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {item.content.length > 200 
                          ? `${item.content.substring(0, 200)}...` 
                          : item.content}
                      </p>

                      {/* 액션 버튼 */}
                      <div className="flex items-center space-x-4">
                        <Link 
                          href={`/news/${item.news_id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                        >
                          자세히 보기 →
                        </Link>
                        {item.journal && (
                          <a 
                            href={item.journal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
                          >
                            원문 보기 ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* 더보기 버튼 */}
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
            </>
          )}
        </div>

        {/* 카테고리 네비게이션 */}
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">다른 카테고리</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['정치', '경제', '사회', '문화', 'IT/과학', '스포츠', '국제', '환경'].map((categoryName, index) => (
              <Link
                key={index}
                href={`/news/category/${index + 1}`}
                className={`p-3 text-center rounded-lg border transition-colors ${
                  parseInt(categoryId) === index + 1
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{categoryName}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}