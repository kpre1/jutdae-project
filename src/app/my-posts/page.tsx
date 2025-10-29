'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Calendar, Eye, ThumbsUp, MessageCircle, Trash2, Edit } from 'lucide-react';

interface MyPost {
  summary_id: number;
  user_summary: string;
  ai_summary: string | null;
  created_at: string;
  news: {
    news_id: number;
    title: string;
    image_url: string | null;
    topic_id: number;
  };
  topic?: {
    name: string;
  };
  likes_count?: number;
  comments_count?: number;
}

interface UserPost {
  id?: number;
  summary_id: number;
  user_summary: string;
  created_at: string;
  user_table: {
    name: string;
    nickname: string;
  } | null;
  likes_count: number;
  is_liked: boolean;
}

interface FeedbackOption {
  id: number;
  content: string;
  emoji: string;
}

// 카테고리 매핑 (DB topic 테이블과 일치)
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

export default function MyPostsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  // 피드백 옵션들
  const feedbackOptions: FeedbackOption[] = [
    { id: 1, content: '좋아요', emoji: '👍' },
    { id: 2, content: '별로예요', emoji: '👎' },
    { id: 3, content: '보완이 필요해요', emoji: '💡' },
    { id: 4, content: '완벽해요', emoji: '✨' },
    { id: 5, content: '이해하기 어려워요', emoji: '🤔' },
    { id: 6, content: '더 자세히 설명해주세요', emoji: '📝' }
  ];
  useEffect(() => {
    const fetchUserAndPosts = async () => {
      // 사용자 정보 확인
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

  // 내 게시글 가져오기
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

      // 카테고리별 필터링
      let filteredData = data || [];
      if (selectedCategory) {
        filteredData = filteredData.filter(post => 
          post.news?.topic_id === selectedCategory
        );
      }

      setPosts(filteredData as MyPost[]);
    } catch (error) {
      console.error('게시글 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 정렬 및 필터 변경 시 다시 조회
  useEffect(() => {
    if (user) {
      fetchMyPosts(user.id);
    }
  }, [sortBy, selectedCategory, user]);

  // 카테고리명 반환
  const getCategoryName = (topicId: number): string => {
    const category = categories.find(cat => cat.id === topicId);
    return category ? category.name : '기타';
  };

  // 날짜 포맷팅
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

// 게시글 삭제
 const deletePost = async (summaryId: number) => {
  if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

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


  // 게시글 수정 시작
  const startEditing = (post: MyPost) => {
    setEditingPost(post.summary_id);
    setEditContent(post.user_summary);
  };

  // 게시글 수정 완료
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

      // 성공 시 목록 업데이트
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

  // 수정 취소
  const cancelEdit = () => {
    setEditingPost(null);
    setEditContent('');
  };

  // 로그인하지 않은 경우
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내가 쓴 글</h1>
          <p className="text-gray-600">
            총 {posts.length}개의 요약글을 작성하셨습니다.
          </p>
        </div>

        {/* 필터 및 정렬 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* 카테고리 필터 */}
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

            {/* 정렬 */}
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

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">게시글을 불러오는 중...</p>
          </div>
        )}

        {/* 게시글 목록 */}
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
                    {/* 게시글 헤더 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* 뉴스 이미지 */}
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
                          {/* 카테고리 및 날짜 */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                              {getCategoryName(post.news?.topic_id || 0)}
                            </span>
                            <div className="flex items-center text-gray-500 text-sm">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(post.created_at)}
                            </div>
                          </div>

                          {/* 원본 뉴스 제목 */}
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                            {post.news?.title}
                          </h3>
                        </div>
                      </div>

                      {/* 액션 버튼들 */}
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

                    {/* 내 요약 내용 */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">내 요약:</h4>
                      {editingPost === post.summary_id ? (
                        // 수정 모드
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
                        // 일반 모드
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-lg">
                          {post.user_summary}
                        </p>
                      )}
                    </div>

                    {/* AI 요약 (있는 경우) */}
                    {post.ai_summary && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI 요약:</h4>
                        <p className="text-gray-600 leading-relaxed bg-blue-50 p-3 rounded-lg text-sm">
                          {post.ai_summary}
                        </p>
                      </div>
                    )}

  




                  
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