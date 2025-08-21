'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, PenTool, Eye, Calendar } from 'lucide-react';

const categories = [
  { id: 100, name: '정치' },
  { id: 101, name: '경제' },
  { id: 102, name: '사회' },
  { id: 103, name: '생활/문화' },
  { id: 104, name: '세계' },
  { id: 105, name: 'IT/과학' },
];

export default function NewsSummaryPage() {
  const [newsData, setNewsData] = useState(null);
  const [summaryTitle, setSummaryTitle] = useState('');
  const [summaryContent, setSummaryContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const newsId = params?.id || 1;

  useEffect(() => {
    checkUser();
    fetchNewsData();
  }, [newsId]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
  };

  const fetchNewsData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('news_id', newsId)
      .single();

    if (error) {
      console.error('뉴스 데이터 가져오기 오류:', error);
      setError('뉴스를 불러올 수 없습니다.');
    } else {
      setNewsData(data);
      // 뉴스 제목을 기반으로 요약 제목 자동 생성
      setSummaryTitle(`${data.title}에 대한 나의 생각`);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) return `${diffHours}시간 전`;
    else if (diffDays < 7) return `${diffDays}일 전`;
    else return date.toLocaleDateString('ko-KR');
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '기타';
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    if (!user) {
      setError('로그인이 필요합니다.');
      setIsSubmitting(false);
      return;
    }

    if (!summaryTitle.trim() || !summaryContent.trim() || !categoryId) {
      setError('모든 필드를 입력해주세요.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('summary')
        .insert([
          {
            title: summaryTitle,
            content: summaryContent,
            news_id: parseInt(newsId),
            topic_id: parseInt(categoryId),
            user_id: user.id,
          },
        ])
        .select();

      if (error) {
        setError('요약 저장 중 오류가 발생했습니다: ' + error.message);
      } else {
        // 성공 시 홈으로 이동
        router.push('/');
      }
    } catch (err) {
      setError('요약 저장 중 오류가 발생했습니다.');
      console.error('저장 오류:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 네비게이션 */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Link href="/" className="text-2xl font-bold text-blue-600">
                줏대 있게 살아
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                홈
              </Link>
              <span className="text-gray-700">{user?.email}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 뉴스 상세 영역 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <BookOpen className="w-4 h-4" />
                <span>원문 뉴스</span>
                {newsData?.category_id && (
                  <>
                    <span>•</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                      {getCategoryName(newsData.category_id)}
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {newsData?.title || '뉴스 제목'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{newsData?.published_at ? formatDate(newsData.published_at) : '날짜 정보 없음'}</span>
                </div>
                {newsData?.link && (
                  <a 
                    href={newsData.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>원문 보기</span>
                  </a>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {newsData?.image_url && (
                <img
                  src={newsData.image_url}
                  alt={newsData.title}
                  className="w-full rounded-lg mb-6"
                />
              )}
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {newsData?.content || '뉴스 내용을 불러오는 중...'}
                </div>
              </div>
            </div>
          </div>

          {/* 요약 작성 영역 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-blue-600 mb-2">
                <PenTool className="w-4 h-4" />
                <span>나의 생각 작성</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                이 뉴스에 대한 나의 의견을 남겨보세요
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="summaryTitle" className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="summaryTitle"
                    required
                    value={summaryTitle}
                    onChange={(e) => setSummaryTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="내 글의 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리 *
                  </label>
                  <select
                    id="category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="summaryContent" className="block text-sm font-medium text-gray-700 mb-2">
                    내 생각 *
                  </label>
                  <div className="text-xs text-gray-500 mb-2">
                    • 이 뉴스에 대한 나의 의견이나 분석을 작성해보세요<br/>
                    • 찬성/반대 의견, 추가 정보, 개인적 경험 등을 자유롭게 표현하세요
                  </div>
                  <textarea
                    id="summaryContent"
                    required
                    rows={12}
                    value={summaryContent}
                    onChange={(e) => setSummaryContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="이 뉴스를 읽고 든 생각이나 의견을 작성해주세요&#10;&#10;예시:&#10;- 이 사건에 대한 나의 의견은...&#10;- 기사에서 놓친 부분이 있다면...&#10;- 비슷한 경험이나 사례가 있다면..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '저장 중...' : '게시하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}