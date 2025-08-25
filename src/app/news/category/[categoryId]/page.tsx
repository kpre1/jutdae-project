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
  journal: string;
  topic_id: number;
  topic: {
    name: string;
  };
}

// 환경 카테고리 추가된 업데이트된 카테고리 목록
const categories = [
  { id: 1, name: '정치' },
  { id: 2, name: '경제' },
  { id: 3, name: '사회' },
<<<<<<< HEAD
  { id: 4, name: '생활/문화' }, // '문화' → '생활/문화'로 수정
  { id: 5, name: 'IT/과학' },
  { id: 6, name: '스포츠' },
  { id: 7, name: '국제' },
  { id: 8, name: '환경' }, // 환경 카테고리 추가
=======
  { id: 4, name: '생활/문화' },
  { id: 5, name: '세계' },
  { id: 6, name: 'IT/과학' },
>>>>>>> bed1f6822658e1113a1fded44f53e3d04b81b764
];

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // 뉴스 데이터 가져오기
  const fetchNews = async (categoryId?: number) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(50); // 최신 50개만

      if (categoryId) {
        query = query.eq('topic_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('뉴스 가져오기 오류:', error);
        return;
      }

      // 데이터 변환 (카테고리명 매핑)
      const transformedData = data?.map(item => ({
        ...item,
        topic: {
          name: categories.find(c => c.id === item.topic_id)?.name || '기타'
        }
      })) || [];

      setNews(transformedData);
      setLastUpdate(new Date().toLocaleTimeString());
      
      console.log(`${transformedData.length}개 뉴스 로드됨`);
      
      // 카테고리별 개수 로그
      const categoryCount = {};
      transformedData.forEach(item => {
        categoryCount[item.topic_id] = (categoryCount[item.topic_id] || 0) + 1;
      });
      console.log('카테고리별 뉴스 개수:', categoryCount);

    } catch (error) {
      console.error('뉴스 로딩 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 로드 시 뉴스 가져오기
  useEffect(() => {
    fetchNews();
  }, []);

  // 카테고리 변경 시 뉴스 다시 가져오기
  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    fetchNews(categoryId);
  };

  // 수동 새로고침 함수
  const handleRefresh = () => {
    console.log('수동 새로고침 시작...');
    fetchNews(selectedCategory);
  };

  // 자동 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('자동 새로고침...');
      fetchNews(selectedCategory);
    }, 30000); // 30초

    return () => clearInterval(interval);
  }, [selectedCategory]);

  if (loading && news.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">뉴스를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📰 실시간 뉴스</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            마지막 업데이트: {lastUpdate}
          </span>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? '새로고침 중...' : '🔄 새로고침'}
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleCategoryChange(null)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 뉴스 목록 */}
      {news.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {selectedCategory 
              ? `${categories.find(c => c.id === selectedCategory)?.name} 카테고리에 뉴스가 없습니다.`
              : '뉴스가 없습니다.'
            }
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {news.map((item) => (
            <article key={item.news_id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 이미지 */}
                {item.image_url && (
                  <div className="md:w-64 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-48 md:h-32 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* 내용 */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {item.topic.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.published_at).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                    {item.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-3 line-clamp-3">
                    {item.content.substring(0, 200)}...
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      출처: 네이버 뉴스
                    </span>
                    {item.journal && (
                      <a
                        href={item.journal}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        원문 보기 →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 로딩 표시 (추가 로딩 시) */}
      {loading && news.length > 0 && (
        <div className="text-center py-4">
          <div className="text-gray-600">업데이트 중...</div>
        </div>
      )}
    </div>
  );
}