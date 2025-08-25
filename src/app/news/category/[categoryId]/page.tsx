'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
  journal: string;
  topic_id: number;
  topics?: {  // topics 테이블과의 관계 (옵션)
    name: string;
  };
}

// 카테고리 매핑 (데이터베이스 구조와 일치)
const categories = [
  { id: 1, name: '정치' },
  { id: 2, name: '경제' },
  { id: 3, name: '사회' },
  { id: 4, name: '생활/문화' }, 
  { id: 5, name: 'IT/과학' },
  { id: 6, name: '스포츠' },
  { id: 7, name: '국제' },
  { id: 8, name: '환경' },
];

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // 카테고리명 반환 함수
  const getCategoryName = (topicId: number): string => {
    const category = categories.find(cat => cat.id === topicId);
    return category ? category.name : '기타';
  };

  // 뉴스 데이터 가져오기
  const fetchNews = async (categoryId?: number) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50);

      // 카테고리 필터 적용
      if (categoryId) {
        query = query.eq('topic_id', categoryId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('뉴스 조회 오류:', error);
        return;
      }
      
      setNews(data || []);
    } catch (err) {
      console.error('데이터 가져오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    fetchNews();
  }, []);

  // 카테고리 변경 핸들러
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchNews(categoryId || undefined);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 내용 미리보기 (150자로 제한)
  const getPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">최신 뉴스</h1>
      
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedCategory === null 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          전체
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === category.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      )}

      {/* 뉴스 목록 */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-600">뉴스가 없습니다.</p>
            </div>
          ) : (
            news.map((item) => (
              <article key={item.news_id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* 뉴스 이미지 */}
                {item.image_url && (
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 이미지 로드 실패 시 숨김
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* 카테고리 태그 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {getCategoryName(item.topic_id)}
                    </span>
                    <time className="text-xs text-gray-500">
                      {formatDate(item.published_at)}
                    </time>
                  </div>

                  {/* 뉴스 제목 */}
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2 hover:text-blue-600">
                    <Link href={item.journal} target="_blank" rel="noopener noreferrer">
                      {item.title}
                    </Link>
                  </h2>

                  {/* 뉴스 내용 미리보기 */}
                  <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                    {getPreview(item.content)}
                  </p>

                  {/* 읽기 링크 */}
                  <Link 
                    href={item.journal} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    전문 보기
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {/* 푸터 정보 */}
      <div className="text-center mt-12 pt-8 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          뉴스 데이터는 네이버 뉴스에서 수집됩니다.
        </p>
      </div>
    </div>
  );
}