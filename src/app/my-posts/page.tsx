'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Calendar, Eye, ThumbsUp, MessageCircle, Trash2, Edit, MessageSquare } from 'lucide-react';

interface MyPost {
  summary_id: number;
  user_summary: string;
  ai_summary: string | null;
  created_at: string;
  news: {
    news_id: number;
    title: string;
    content?: string; // 반론 생성에 필요
    image_url: string | null;
    topic_id: number;
  };
  likes_count?: number;
  feedback_stats?: Record<number, number>;
  total_feedbacks?: number;
}

interface FeedbackOption {
  id: number;
  content: string;
  emoji: string;
}

const categories = [
  { id: 1, name: '정치' },
  { id: 2, name: '경제' },
  { id: 3, name: '사회' },
  { id: 4, name: '문화' }, 
  { id: 5, name: 'IT/과학' },
  { id: 6, name: '스포츠' },
  { id: 7, name: '국제' },
  { id: 8, name: '환경' },
];

const feedbackOptions: FeedbackOption[] = [
  { id: 1, content: '좋아요', emoji: '👍' },
  { id: 2, content: '별로예요', emoji: '👎' },
  { id: 3, content: '보완이 필요해요', emoji: '💡' },
  { id: 4, content: '완벽해요', emoji: '✨' },
  { id: 5, content: '이해하기 어려워요', emoji: '🤔' },
  { id: 6, content: '더 자세히 설명해주세요', emoji: '📝' }
];

export default function MyPostsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // AI 반론 관련 state
  const [aiRebuttals, setAiRebuttals] = useState<Record<number, string>>({});
  const [loadingRebuttal, setLoadingRebuttal] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      await fetchMyPosts(user.id);
    };

    fetchUserAndPosts();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    try {
      setLoading(true);

      let query = supabase
        .from('summary')
        .select(`
          summary_id,
          user_summary,
          ai_summary,
          created_at,
          news (
            news_id,
            title,
            content,
            image_url,
            topic_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: sortBy === 'oldest' });

      const { data, error } = await query;

      if (error) {
        console.error('게시글 조회 오류:', error);
        return;
      }

      let filteredData = data || [];
      if (selectedCategory) {
        filteredData = filteredData.filter(post => 
          post.news?.topic_id === selectedCategory
        );
      }

// 각 게시글의 좋아요와 피드백 통계 가져오기
const postsWithStats = await Promise.all(
  filteredData.map(async (post) => {
    // 좋아요 수 조회
    let likesCount = 0;
    try {
      const { count } = await supabase
        .from('summary_likes')
        .select('*', { count: 'exact', head: true })
        .eq('summary_id', post.summary_id);
      likesCount = count || 0;
    } catch (e) {
      console.log('좋아요 테이블 없음');
    } 
  
    // 피드백 통계 조회
    const { data: feedbacks } = await supabase
      .from('feedback')
      .select('option_id')
      .eq('summary_id', post.summary_id);

    const feedbackStats: Record<number, number> = {};
    let totalFeedbacks = 0;
    
    feedbacks?.forEach(feedback => {
      feedbackStats[feedback.option_id] = 
        (feedbackStats[feedback.option_id] || 0) + 1;
      totalFeedbacks++;
    });

    return {
      ...post,
      likes_count: likesCount,
      feedback_stats: feedbackStats,
      total_feedbacks: totalFeedbacks
    };
  })
);

// ✅ 여기 추가
setPosts(postsWithStats);

} catch (error) {
  console.error('내 글 조회 오류:', error);
} finally {
  setLoading(false);
}
}; // ✅ fetchMyPosts 함수 닫기

      

     

  useEffect(() => {
    if (user) {
      fetchMyPosts(user.id);
    }
  }, [sortBy, selectedCategory, user]);

  const getCategoryName = (topicId: number): string => {
    const category = categories.find(cat => cat.id === topicId);
    return category ? category.name : '기타';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const deletePost = async (summaryId: number) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
// 게시글 삭제
 const deletePost = async (summaryId: number) => {
  if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('summary')
        .delete()
        .eq('summary_id', summaryId)
        .eq('user_id', user!.id);

      if (error) {
        console.error('삭제 오류:', error);
        alert('삭제에 실패했습니다.');
        return;
      }

      setPosts(prevPosts => prevPosts.filter(post => post.summary_id !== summaryId));
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };
  try {
    const { error } = await supabase
      .from('summary')
      .delete()
      .eq('summary_id', summaryId); // ✅ 핵심 수정 부분

    if (error) throw error;

    setPosts(prevPosts => prevPosts.filter(p => p.summary_id !== summaryId));
    alert('게시글이 삭제되었습니다.');
  } catch (error) {
    console.error('삭제 실패:', error);
    alert('삭제에 실패했습니다.');
  }
};


  const startEditing = (post: MyPost) => {
    setEditingPost(post.summary_id);
    setEditContent(post.user_summary);
  };

  const saveEdit = async (summaryId: number) => {
    if (!editContent.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      const { error } = await supabase
        .from('summary')
        .update({ user_summary: editContent })
        .eq('summary_id', summaryId)
        .eq('user_id', user!.id);

      if (error) {
        console.error('수정 오류:', error);
        alert('수정에 실패했습니다.');
        return;
      }

      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.summary_id === summaryId 
            ? { ...post, user_summary: editContent }
            : post
        )
      );

      setEditingPost(null);
      setEditContent('');
      alert('게시글이 수정되었습니다.');
    } catch (error) {
      console.error('수정 실패:', error);
      alert('수정에 실패했습니다.');
    }
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  // ✅ AI 반론 생성 함수
  const generateRebuttal = async (post: MyPost) => {
    if (!post.news?.content) {
      alert('기사 원문을 불러올 수 없습니다.');
      return;
    }

    setLoadingRebuttal(prev => ({ ...prev, [post.summary_id]: true }));

    try {
      const response = await fetch('/api/aiRebuttal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: post.news.title,
          articleContent: post.news.content,
          userSummary: post.user_summary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI 반론 생성 실패');
      }

      setAiRebuttals(prev => ({
        ...prev,
        [post.summary_id]: data.rebuttal
      }));
    } catch (error: any) {
      console.error('AI 반론 생성 오류:', error);
      alert('AI 반론 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoadingRebuttal(prev => ({ ...prev, [post.summary_id]: false }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-8">내가 쓴 글을 보려면 먼저 로그인해주세요.</p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  // 전체 통계 계산
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0);
  const totalFeedbacks = posts.reduce((sum, post) => sum + (post.total_feedbacks || 0), 0);
  
  // 전체 피드백 분포 계산
  const totalFeedbackStats: Record<number, number> = {};
  posts.forEach(post => {
    if (post.feedback_stats) {
      Object.entries(post.feedback_stats).forEach(([optionId, count]) => {
        totalFeedbackStats[Number(optionId)] = (totalFeedbackStats[Number(optionId)] || 0) + count;
      });
    }
  });

  return (
    <div className="min-h-screen  bg-gradient-to-b from-white to-indigo-50 rounded-xl">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내가 쓴 글</h1>
          <p className="text-gray-600">
            총 {posts.length}개의 요약글을 작성하셨습니다.
          </p>
        </div>

        {/* 전체 통계 카드 */}
        {posts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 내 요약글 통계</h2>
            
            {/* 통계 숫자 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 mb-1">{posts.length}</div>
                <div className="text-sm text-gray-600">총 요약글</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-3xl font-bold text-red-600 mb-1">{totalLikes}</div>
                <div className="text-sm text-gray-600">총 좋아요</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600 mb-1">{totalFeedbacks}</div>
                <div className="text-sm text-gray-600">총 피드백</div>
              </div>
            </div>

            {/* 피드백 분포 */}
            {Object.keys(totalFeedbackStats).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">피드백 분포</h3>
                <div className="flex gap-3 flex-wrap">
                  {feedbackOptions.map(option => {
                    const count = totalFeedbackStats[option.id] || 0;
                    if (count === 0) return null;
                    return (
                      <div 
                        key={option.id} 
                        className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg"
                      >
                        <span className="text-xl">{option.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-gray-900">{count}</span>
                          <span className="text-xs text-gray-500">{option.content}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 가장 인기있는 요약글 */}
            {posts.length > 0 && (() => {
              const mostLikedPost = posts.reduce((prev, current) => 
                (current.likes_count || 0) > (prev.likes_count || 0) ? current : prev
              );
              
              if ((mostLikedPost.likes_count || 0) > 0) {
                return (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      👑 가장 인기있는 요약
                    </h3>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {mostLikedPost.news?.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4 text-red-500" />
                          {mostLikedPost.likes_count}개
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          {mostLikedPost.total_feedbacks || 0}개
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {mostLikedPost.user_summary}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedCategory === null 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                전체
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category.id 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="latest">최신순</option>
                <option value="oldest">오래된순</option>
              </select>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
          </div>
        )}

        {!loading && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  작성한 게시글이 없습니다
                </h3>
                <p className="text-gray-600 mb-6">
                  뉴스를 읽고 첫 번째 요약글을 작성해보세요!
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  뉴스 보러가기
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <article key={post.summary_id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        {post.news?.image_url && (
                          <img
                            src={post.news.image_url}
                            alt={post.news.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              {getCategoryName(post.news?.topic_id || 0)}
                            </span>
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(post.created_at)}
                            </div>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {post.news?.title}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => startEditing(post)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="수정"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePost(post.summary_id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">내 요약:</h4>
                      {editingPost === post.summary_id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows={4}
                            placeholder="수정할 내용을 입력하세요..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(post.summary_id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                          {post.user_summary}
                        </p>
                      )}
                    </div>

                    {post.ai_summary && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI 요약:</h4>
                        <p className="text-gray-600 leading-relaxed bg-blue-50 p-3 rounded-lg text-sm">
                          {post.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* ✅ AI 반론 섹션 */}
                    <div className="mb-4">
                      {!aiRebuttals[post.summary_id] ? (
                        <button
                          onClick={() => generateRebuttal(post)}
                          disabled={loadingRebuttal[post.summary_id]}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm rounded-lg transition-colors"
                        >
                          {loadingRebuttal[post.summary_id] ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>AI 반론 생성 중...</span>
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              <span>AI 반론하기</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                            <h4 className="text-sm font-medium text-purple-800">AI의 반론 및 보완점:</h4>
                          </div>
                          <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">
                            {aiRebuttals[post.summary_id]}
                          </p>
                          <button
                            onClick={() => setAiRebuttals(prev => {
                              const newState = { ...prev };
                              delete newState[post.summary_id];
                              return newState;
                            })}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-800 underline"
                          >
                            닫기
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 좋아요 및 피드백 통계 */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        {/* 좋아요 */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <ThumbsUp className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-gray-900">{post.likes_count || 0}</span>
                            <span className="text-gray-500">좋아요</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-gray-900">{post.total_feedbacks || 0}</span>
                            <span className="text-gray-500">피드백</span>
                          </div>
                        </div>

                        {/* 피드백 상세 분포 */}
                        {post.feedback_stats && Object.keys(post.feedback_stats).length > 0 && (
                          <div className="flex gap-2">
                            {feedbackOptions.map(option => {
                              const count = post.feedback_stats?.[option.id] || 0;
                              if (count === 0) return null;
                              return (
                                <div 
                                  key={option.id} 
                                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs"
                                  title={option.content}
                                >
                                  <span>{option.emoji}</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  
);
}