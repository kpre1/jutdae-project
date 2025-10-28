'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
  journal: string;
  topic_id: number;
  topics?: {
    name: string;
  };
}

interface UserPost {
  summary_id: number;
  user_summary: string;
  created_at: string;
  user_table: {
    name: string;
    nickname: string;
  } | null;
  likes_count: number;
  is_liked: boolean;
  feedback_stats?: Record<number, number>;
}

interface FeedbackOption {
  id: number;
  content: string;
  emoji: string;
}

// 카테고리 매핑
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
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [userSummary, setUserSummary] = useState('');
  const [showCommunityPosts, setShowCommunityPosts] = useState(false);
  const [communityPosts, setCommunityPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // 사용자 정보 가져오기
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // 피드백 옵션들
  const feedbackOptions: FeedbackOption[] = [
    { id: 1, content: '좋아요', emoji: '👍' },
    { id: 2, content: '별로예요', emoji: '👎' },
    { id: 3, content: '보완이 필요해요', emoji: '💡' },
    { id: 4, content: '완벽해요', emoji: '✨' },
    { id: 5, content: '이해하기 어려워요', emoji: '🤔' },
    { id: 6, content: '더 자세히 설명해주세요', emoji: '📝' }
  ];

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

  // 요약하기 버튼 클릭 핸들러
  const handleSummarizeClick = (newsItem: NewsItem) => {
    setSelectedNews(newsItem);
    setUserSummary('');
    setShowCommunityPosts(false);
    setPostsLoaded(false);
    setCommunityPosts([]);
  };

  // 게시글 보기 버튼 클릭 핸들러
  const handleShowCommunityPosts = async () => {
    setShowCommunityPosts(true);
    
    if (postsLoaded) return;
    
    setLoadingPosts(true);
    
    try {
      // 1. 요약글 가져오기
      const { data: summaries, error: summaryError } = await supabase
        .from('summary')
        .select(`
          summary_id,
          user_summary,
          created_at,
          user_table (
            name,
            nickname
          )
        `)
        .eq('news_id', selectedNews!.news_id)
        .order('created_at', { ascending: false });

      if (summaryError) {
        console.error('요약글 조회 오류:', summaryError);
        setCommunityPosts([]);
        setPostsLoaded(true);
        setLoadingPosts(false);
        return;
      }

      if (!summaries || summaries.length === 0) {
        setCommunityPosts([]);
        setPostsLoaded(true);
        setLoadingPosts(false);
        return;
      }

      // 2. 모든 summary_id 배열로 만들기
      const summaryIds = summaries.map(s => s.summary_id);

      // 3. 좋아요 수 한 번에 가져오기
      const { data: allLikes } = await supabase
        .from('summary_likes')
        .select('summary_id, user_id')
        .in('summary_id', summaryIds);

      // 4. 피드백 한 번에 가져오기
      const { data: allFeedbacks } = await supabase
        .from('feedback')
        .select('summary_id, option_id')
        .in('summary_id', summaryIds);

      // 5. summary_id별로 좋아요 수 계산
      const likesCountMap: Record<number, number> = {};
      const userLikesMap: Record<number, boolean> = {};
      
      allLikes?.forEach(like => {
        likesCountMap[like.summary_id] = (likesCountMap[like.summary_id] || 0) + 1;
        if (user && like.user_id === user.id) {
          userLikesMap[like.summary_id] = true;
        }
      });

      // 6. summary_id별로 피드백 통계 계산
      const feedbackStatsMap: Record<number, Record<number, number>> = {};
      
      allFeedbacks?.forEach(feedback => {
        if (!feedbackStatsMap[feedback.summary_id]) {
          feedbackStatsMap[feedback.summary_id] = {};
        }
        const optionId = feedback.option_id;
        feedbackStatsMap[feedback.summary_id][optionId] = 
          (feedbackStatsMap[feedback.summary_id][optionId] || 0) + 1;
      });

      // 7. 데이터 합치기
      const postsWithStats: UserPost[] = summaries.map(summary => ({
        summary_id: summary.summary_id,
        user_summary: summary.user_summary,
        created_at: summary.created_at,
        user_table: summary.user_table,
        likes_count: likesCountMap[summary.summary_id] || 0,
        is_liked: userLikesMap[summary.summary_id] || false,
        feedback_stats: feedbackStatsMap[summary.summary_id] || {}
      }));

      setCommunityPosts(postsWithStats);
      setPostsLoaded(true);
    } catch (error) {
      console.error('요약글 가져오기 실패:', error);
      setCommunityPosts([]);
      setPostsLoaded(true);
    }
    
    setLoadingPosts(false);
  };

  // 좋아요 토글
  const toggleLike = async (summaryId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    const currentPost = communityPosts.find(p => p.summary_id === summaryId);
    const wasLiked = currentPost?.is_liked || false;

    // UI 즉시 업데이트
    setCommunityPosts(prevPosts => 
      prevPosts.map(post => 
        post.summary_id === summaryId 
          ? { 
              ...post, 
              is_liked: !post.is_liked,
              likes_count: post.is_liked ? post.likes_count - 1 : post.likes_count + 1
            }
          : post
      )
    );
    
    try {
      if (wasLiked) {
        // 좋아요 취소
        const { error } = await supabase
          .from('summary_likes')
          .delete()
          .eq('summary_id', summaryId)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // 좋아요 추가
        const { error } = await supabase
          .from('summary_likes')
          .insert({ 
            summary_id: summaryId, 
            user_id: user.id 
          });
        
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('좋아요 처리 실패:', error);
      
      // 실패 시 UI 롤백
      setCommunityPosts(prevPosts => 
        prevPosts.map(post => 
          post.summary_id === summaryId 
            ? { 
                ...post, 
                is_liked: wasLiked,
                likes_count: wasLiked 
                  ? post.likes_count + 1 
                  : post.likes_count - 1
              }
            : post
        )
      );
      
      alert('좋아요 처리에 실패했습니다: ' + error.message);
    }
  };

  // 피드백 제출
  const submitFeedback = async (summaryId: number, feedbackOptionId: number) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    const option = feedbackOptions.find(f => f.id === feedbackOptionId);
    
    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          option_id: feedbackOptionId,
          summary_id: summaryId,
          user_id: user.id
        });
      
      if (error) {
        console.error('피드백 저장 오류:', error);
        alert('피드백 전송에 실패했습니다: ' + error.message);
        return;
      }
      
      alert(`"${option?.emoji} ${option?.content}" 피드백을 보냈습니다!`);
      
      // 피드백 후 통계 새로고침
      setPostsLoaded(false);
      await handleShowCommunityPosts();
    } catch (error) {
      console.error('피드백 처리 실패:', error);
      alert('피드백 전송에 실패했습니다.');
    }
  };

  // 사용자 요약 저장
  const saveUserSummary = async () => {
    if (!userSummary.trim()) return;
    
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    
    try {
      // 1. user_table 확인 및 생성
      const { data: existingUser, error: userCheckError } = await supabase
        .from('user_table')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (userCheckError && userCheckError.code === 'PGRST116') {
        const { error: insertUserError } = await supabase
          .from('user_table')
          .insert({
            user_id: user.id,
            email: user.email || '',
            name: user.email?.split('@')[0] || '사용자',
            nickname: user.email?.split('@')[0] || 'user',
            email_verified: user.email_confirmed_at !== null
          });

        if (insertUserError) {
          console.error('사용자 생성 오류:', insertUserError);
          alert('사용자 정보 생성에 실패했습니다: ' + insertUserError.message);
          return;
        }
      }

      // 2. summary 저장
      const { error } = await supabase
        .from('summary')
        .insert({
          user_summary: userSummary,
          news_id: selectedNews!.news_id,
          user_id: user.id
        });

      if (error) {
        console.error('DB 저장 오류:', error);
        alert('저장에 실패했습니다: ' + error.message);
        return;
      }

      setPostsLoaded(false);
      alert('요약이 저장되었습니다!');
      setUserSummary('');
    } catch (error) {
      console.error('요약 저장 실패:', error);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 요약 화면 닫기
  const closeSummaryView = () => {
    setSelectedNews(null);
    setUserSummary('');
    setShowCommunityPosts(false);
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

  // 내용 미리보기
  const getPreview = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  // 통계 대시보드 컴포넌트
  const StatsOverview = () => {
    const totalLikes = communityPosts.reduce((sum, post) => sum + post.likes_count, 0);
    const totalFeedbacks = communityPosts.reduce((sum, post) => {
      const feedbackCount = Object.values(post.feedback_stats || {})
        .reduce((a, b) => a + b, 0);
      return sum + feedbackCount;
    }, 0);

    const mostLikedPost = communityPosts.length > 0 
      ? communityPosts.reduce((prev, current) => 
          (current.likes_count > prev.likes_count) ? current : prev
        )
      : null;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">📊 이 기사의 통계</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{communityPosts.length}</div>
            <div className="text-sm text-gray-600">총 요약글</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{totalLikes}</div>
            <div className="text-sm text-gray-600">총 좋아요</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalFeedbacks}</div>
            <div className="text-sm text-gray-600">총 피드백</div>
          </div>
        </div>

        {/* 피드백 분포 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 text-gray-700">피드백 분포</h4>
          <div className="flex gap-2 flex-wrap">
            {feedbackOptions.map(option => {
              const count = communityPosts.reduce((sum, post) => 
                sum + (post.feedback_stats?.[option.id] || 0), 0
              );
              if (count === 0) return null;
              return (
                <div key={option.id} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-sm">
                  <span>{option.emoji}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 인기 요약글 */}
        {mostLikedPost && mostLikedPost.likes_count > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2 text-gray-700">🏆 가장 인기있는 요약</h4>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">{mostLikedPost.user_table?.name}</span>
                <span className="text-red-500 text-sm">❤️ {mostLikedPost.likes_count}</span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">
                {mostLikedPost.user_summary}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 요약 화면이 열려있으면 해당 화면 렌더링
  if (selectedNews) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">뉴스 상세 + 요약 화면</h1>
              <button
                onClick={closeSummaryView}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="container mx-auto px-4 py-6">
          {!showCommunityPosts ? (
            /* 기사 원문 + 요약 작성 화면 */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
              {/* 왼쪽: 기사 원문 */}
              <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {getCategoryName(selectedNews.topic_id)}
                  </span>
                  <time className="text-sm text-gray-500">
                    {formatDate(selectedNews.published_at)}
                  </time>
                </div>

                <h2 className="text-xl font-bold mb-4 leading-tight">
                  {selectedNews.title}
                </h2>

                {selectedNews.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedNews.content}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Link 
                    href={selectedNews.journal} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    원문 링크 보기
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* 오른쪽: 사용자 요약 작성 */}
              <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">기사 요약 작성</h3>
                  <div className="text-sm text-gray-500">
                    {userSummary.length}/500자
                  </div>
                </div>

                <div className="mb-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <h4 className="font-medium text-yellow-800 mb-2">📝 요약 작성 팁</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• 기사의 핵심 내용을 3-5문장으로 요약해보세요</li>
                      <li>• 누가, 언제, 어디서, 무엇을, 왜, 어떻게를 포함해보세요</li>
                      <li>• 객관적이고 중립적인 시각으로 작성해보세요</li>
                    </ul>
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <textarea
                    value={userSummary}
                    onChange={(e) => setUserSummary(e.target.value)}
                    placeholder="이 기사를 읽고 나만의 요약을 작성해보세요...

예시:
- 주요 사건이나 발표 내용
- 관련된 인물이나 기관
- 중요한 수치나 데이터
- 향후 전망이나 영향"
                    className="flex-1 w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={500}
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setUserSummary('')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    초기화
                  </button>
                  <button
                    onClick={saveUserSummary}
                    disabled={!userSummary.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    요약 저장하기
                  </button>
                  <button
                    onClick={handleShowCommunityPosts}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12V8a2 2 0 012-2h6a2 2 0 012 2v4a2 2 0 01-2 2H9z" />
                    </svg>
                    게시글 보기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 커뮤니티 게시글 화면 */
            <div className="max-w-4xl mx-auto">
              {/* 뒤로가기 버튼 */}
              <div className="mb-6">
                <button
                  onClick={() => setShowCommunityPosts(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  요약 작성으로 돌아가기
                </button>
              </div>

              {/* 기사 정보 */}
              <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex items-start gap-4">
                  {selectedNews.image_url && (
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                      {getCategoryName(selectedNews.topic_id)}
                    </span>
                    <h3 className="font-semibold text-lg mb-1">{selectedNews.title}</h3>
                    <p className="text-gray-500 text-sm">{formatDate(selectedNews.published_at)}</p>
                  </div>
                </div>
              </div>

              {/* 통계 대시보드 */}
              {communityPosts.length > 0 && <StatsOverview />}

              {/* 게시글 목록 */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">이 기사에 대한 다른 사용자들의 요약 ({communityPosts.length})</h3>
                
                {loadingPosts ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
                  </div>
                ) : communityPosts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 text-lg mb-2">📝</div>
                    <p className="text-gray-600 mb-2">아직 이 기사에 대한 요약글이 없습니다.</p>
                    <p className="text-gray-500 text-sm">첫 번째로 요약을 작성해보세요!</p>
                  </div>
                ) : (
                  <>
                    {communityPosts.map((post) => (
                      <div key={post.summary_id} className="bg-white rounded-lg shadow-md p-6">
                        {/* 사용자 정보 */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                              {post.user_table?.nickname?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{post.user_table?.name || '익명'}</p>
                              <p className="text-sm text-gray-500">@{post.user_table?.nickname || 'unknown'} • {formatDate(post.created_at)}</p>
                            </div>
                          </div>
                        </div>

                        {/* 요약 내용 */}
                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {post.user_summary}
                          </p>
                        </div>

                        {/* 상호작용 버튼들 */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => toggleLike(post.summary_id)}
                              className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                                post.is_liked 
                                  ? 'bg-red-100 text-red-600' 
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                              }`}
                            >
                              <svg className="w-4 h-4" fill={post.is_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span className="text-sm font-medium">{post.likes_count}</span>
                            </button>
                          </div>

                          {/* 피드백 옵션들 */}
                          <div className="flex gap-2">
                            {feedbackOptions.map(option => (
                              <button
                                key={option.id}
                                onClick={() => submitFeedback(post.summary_id, option.id)}
                                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                                title={option.content}
                              >
                                <span>{option.emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 기본 뉴스 목록 화면
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">최신 뉴스</h1>
      
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`px-4 py-2 rounded-full transition-colors ${
            selectedCategory === null 
              ? 'bg-indigo-600 text-white' 
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
                ? 'bg-indigo-600 text-white' 
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
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {getPreview(item.content)}
                  </p>

                  {/* 버튼들 */}
                  <div className="flex gap-2">
                    <Link 
                      href={item.journal} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center text-indigo-600 hover:text-blue-800 text-sm font-medium border border-blue-200 hover:border-blue-300 rounded-lg py-2 px-3 transition-colors"
                    >
                      전문 보기
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                    
                    <button
                      onClick={() => handleSummarizeClick(item)}
                      className="flex-1 inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg py-2 px-3 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      요약하기
                    </button>
                  </div>
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