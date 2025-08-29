"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
  link: string;
  category_name: string;
  level: number;
}

interface QuizItem {
  quiz_id: number;
  question_type: string;
  quiz_content: string;
  option_data: string[] | null;  // 객관식일 경우
  correct_answer: string;
}

export default function Level1Page() {
  const { topic } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // ✅ 1. 뉴스 가져오기
      const { data: newsData, error: newsError } = await supabase
        .from("news")
        .select("*")
        .eq("level", 1)
        .eq("topic_slug", topic)
        .single();

      if (newsError || !newsData) {
        console.error("뉴스 불러오기 오류:", newsError);
        setLoading(false);
        return;
      }

      setNews(newsData);

      // ✅ 2. 해당 뉴스와 연결된 퀴즈 가져오기
      const { data: quizData, error: quizError } = await supabase
        .from("quiz")
        .select("*")
        .eq("news_id", newsData.news_id);

      if (quizError) {
        console.error("퀴즈 불러오기 오류:", quizError);
      } else {
        setQuizzes(quizData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [topic]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-500"></div>
        <span className="ml-3 text-gray-600">불러오는 중...</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-gray-500">
        <p>레벨 1 뉴스가 없습니다.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:underline"
        >
          ← 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-8">
          {/* 뉴스 섹션 */}
          <article className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            {news.image_url && (
              <img
                src={news.image_url}
                alt={news.title}
                className="mb-6 rounded-lg w-full max-h-[400px] object-cover"
              />
            )}
            <div className="flex items-center justify-between mb-4">
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                {news.category_name}
              </span>
              <span className="text-sm text-gray-400">
                {formatDate(news.published_at)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">{news.title}</h1>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
              {news.content}
            </p>
            <div className="flex items-center justify-between border-t pt-6">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                ← 목록으로 돌아가기
              </button>
              <a
                href={news.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                원문 보기 ↗
              </a>
            </div>
          </article>

          {/* 문제 섹션 */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-semibold mb-6">퀴즈</h2>
            {quizzes.length === 0 ? (
              <p className="text-gray-500">등록된 문제가 없습니다.</p>
            ) : (
              <ul className="space-y-6">
                {quizzes.map((quiz) => (
                  <li key={quiz.quiz_id} className="border-b pb-4">
                    <p className="font-medium text-gray-800 mb-2">{quiz.quiz_content}</p>
                    {quiz.option_data ? (
                      <ul className="space-y-2">
                        {quiz.option_data.map((opt, idx) => (
                          <li key={idx}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name={`quiz-${quiz.quiz_id}`} />
                              <span>{opt}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <input
                        type="text"
                        placeholder="정답을 입력하세요"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
