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
  option_data: string[] | null; // 객관식일 경우
  correct_answer: string;
}

export default function Level1Page() {
  const { topic } = useParams();
  const router = useRouter();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: newsData } = await supabase
        .from("news")
        .select("*")
        .eq("level", 1)
        .eq("topic_slug", topic)
        .single();

      if (!newsData) {
        setLoading(false);
        return;
      }
      setNews(newsData);

      const { data: quizData } = await supabase
        .from("quiz")
        .select("*")
        .eq("news_id", newsData.news_id);

      setQuizzes(quizData || []);
      setLoading(false);
    };

    fetchData();
  }, [topic]);

  const handleAnswerChange = (quizId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [quizId]: value }));
  };

  const handleSubmit = () => {
    const newResults: Record<number, boolean> = {};
    quizzes.forEach((quiz) => {
      const userAnswer = (answers[quiz.quiz_id] || "").trim();
      const correct = quiz.correct_answer.trim();
      newResults[quiz.quiz_id] =
        userAnswer.toLowerCase() === correct.toLowerCase();
    });
    setResults(newResults);
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 뉴스 */}
          <article className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex-1">
            {news.image_url && (
              <img
                src={news.image_url}
                alt={news.title}
                className="mb-6 rounded-lg w-full max-h-[400px] object-cover"
              />
            )}
            <h1 className="text-3xl font-bold mb-6">{news.title}</h1>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-8">
              {news.content}
            </p>
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              원문 보기 ↗
            </a>
          </article>

          {/* 퀴즈 */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex-1">
            <h2 className="text-2xl font-semibold mb-6">퀴즈</h2>
            {quizzes.length === 0 ? (
              <p className="text-gray-500">등록된 문제가 없습니다.</p>
            ) : (
              <div className="space-y-6">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.quiz_id}
                    className="border p-4 rounded-lg inline-block"
                  >
                    <p className="font-medium mb-3">{quiz.quiz_content}</p>
                    {quiz.option_data ? (
                      <ul className="space-y-2">
                        {quiz.option_data.map((opt, idx) => (
                          <li key={idx}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`quiz-${quiz.quiz_id}`}
                                value={opt}
                                checked={answers[quiz.quiz_id] === opt}
                                onChange={() =>
                                  handleAnswerChange(quiz.quiz_id, opt)
                                }
                              />
                              <span>{opt}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <input
                        type="text"
                        placeholder="정답을 입력하세요"
                        value={answers[quiz.quiz_id] || ""}
                        onChange={(e) =>
                          handleAnswerChange(quiz.quiz_id, e.target.value)
                        }
                        className="border p-2 rounded w-fit"
                      />
                    )}

                    {results[quiz.quiz_id] !== undefined && (
                      <p
                        className={`mt-2 text-sm font-semibold ${
                          results[quiz.quiz_id]
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {results[quiz.quiz_id]
                          ? "정답입니다 ✅"
                          : `오답 ❌ (정답: ${quiz.correct_answer})`}
                      </p>
                    )}
                  </div>
                ))}

                {/* 제출 버튼 */}
                <button
                  onClick={handleSubmit}
                  className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  제출하기
                </button>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
