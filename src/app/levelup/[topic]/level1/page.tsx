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
  link: string | null;
  topic_id: number | null;
  level_id: number | null;
  
}

interface QuizItem {
  quiz_id: number;
  question_type: string;
  quiz_content: string;
  option_data: string[] | null;
  correct_answer: string;
  level_id: number;
  news_id: number | null;
}

export default function Level1Page() {
  const { topic } = useParams();
  const router = useRouter();
  const [levelId, setLevelId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [news, setNews] = useState<NewsItem | null>(null);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Record<number, boolean | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topic) return;
    const fetchUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error("유저 조회 실패", error);
    else setCurrentUser(user);
      };
      fetchUser();

    const fetchData = async () => {
      
      try {
        // 1️⃣ topic_id 가져오기
        const { data: topicData, error: topicError } = await supabase
          .from("topic")
          .select("topic_id")
          .eq("slug", topic)
          .maybeSingle();

        if (topicError || !topicData) {
          console.error("토픽 조회 오류:", topicError);
          setLoading(false);
          return;
        }

        const topicId = topicData.topic_id;

        // 2️⃣ level_id 가져오기 (difficulty=1)
        const { data: levelData, error: levelError } = await supabase
          .from("level")
          .select("*")
          .eq("topic_id", topicId)
          .eq("difficulty", 1)
          .maybeSingle();

        if (levelError || !levelData) {
          console.error("레벨 조회 오류:", levelError);
          setLoading(false);
          return;
        }

        const levelId = levelData.level_id;

        // 3️⃣ 뉴스 조회 (level_id 기준)
        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("level_id", levelId);

        if (newsError) {
          console.error("뉴스 조회 오류:", newsError);
          setLoading(false);
          return;
        }

        if (!newsData || newsData.length === 0) {
          setNews(null);
          setLoading(false);
          return;
        }

        // 첫 번째 뉴스만 사용
        const selectedNews = newsData[0];
        setNews(selectedNews);

        const fetchedLevelId = levelData.level_id;
        setLevelId(fetchedLevelId);


    // 4️⃣ 퀴즈 조회 (news_id 기준)
const { data: quizData, error: quizError } = await supabase
  .from("quiz")
  .select("*")
  .eq("news_id", selectedNews.news_id);

if (quizError) {
  console.error("퀴즈 조회 오류:", quizError);
  setQuizzes([]);
} else {
  const parsedQuizzes: QuizItem[] = (quizData || []).map((q: any) => {
  return {
    ...q,
    // option_data가 존재하면 배열 그대로, 없으면 null
    option_data: Array.isArray(q.option_data) ? q.option_data : null,
  };
});
setQuizzes(parsedQuizzes);



}



      } catch (e) {
        console.error("데이터 불러오기 실패:", e);
      } finally {
        setLoading(false);
      }
    };



    fetchData();
  }, [topic]);
  

  const handleAnswerChange = (quizId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [quizId]: value }));
  };

const handleSubmit = async () => {
  const newResults: Record<number, boolean> = {};
  quizzes.forEach((quiz) => {
    const userAnswer = (answers[quiz.quiz_id] || "").trim();
    const correct = quiz.correct_answer.trim();
    newResults[quiz.quiz_id] = userAnswer.toLowerCase() === correct.toLowerCase();
  });
  setResults(newResults);

  const allCorrect = Object.values(newResults).every(Boolean);

  if (!currentUser) {
    console.warn("저장 실패: 로그인된 유저가 없습니다.");
    return;
  }
  if (!levelId) {
    console.warn("저장 실패: levelId가 없습니다.");
    return;
  }

  if (allCorrect) {
    try {
      // ✅ 1) 기존 챌린지 데이터 확인
      const { data: existing, error: existErr } = await supabase
        .from("challenge")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("level_id", levelId)
        .maybeSingle();

      if (existErr) {
        console.error("챌린지 조회 중 오류:", existErr);
        return;
      }

      if (existing) {
        // ✅ 이미 클리어한 경우 업데이트
        await supabase
          .from("challenge")
          .update({
            is_cleared: true,
            cleared_at: new Date().toISOString(),
          })
          .eq("challenge_id", existing.challenge_id);
      } else {
        // ✅ 처음 클리어 시 삽입
        await supabase.from("challenge").insert({
          user_id: currentUser.id,
          level_id: levelId,
          is_cleared: true,
          cleared_at: new Date().toISOString(),
        });
      }

      // ✅ 2) 다음 레벨 찾기 (difficulty 기준)
      const { data: currentLevel } = await supabase
        .from("level")
        .select("difficulty, topic_id")
        .eq("level_id", levelId)
        .maybeSingle();

      if (!currentLevel) {
        console.warn("현재 레벨 정보를 찾을 수 없습니다.");
        return;
      }

      const nextDiff = currentLevel.difficulty + 1;

      // ✅ 3) 다음 레벨 조회
      const { data: nextLevelData, error: nextErr } = await supabase
        .from("level")
        .select("level_id")
        .eq("topic_id", currentLevel.topic_id)
        .eq("difficulty", nextDiff)
        .maybeSingle();

      if (nextErr) {
        console.error("다음 레벨 조회 오류:", nextErr);
        return;
      }

      // ✅ 4) 다음 레벨 존재 여부 확인
      if (nextLevelData?.level_id) {
        alert(`🎯 ${nextDiff}단계로 이동합니다!`);
        router.push(`/levelup/${topic}/level${nextDiff}`);
      } else {
        alert("🎉 모든 레벨을 클리어했습니다! 축하합니다!");
      }
    } catch (e) {
      console.error("챌린지 저장 중 예외:", e);
    }
  } else {
    alert("❌ 일부 문제를 틀렸습니다. 다시 시도해보세요!");
  }
};




  const allCorrect = Object.values(results).every(Boolean);
  


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-500"></div>
        <span className="ml-3 text-gray-600">불러오는 중...</span>
      </div>
    );
  }

  // ✅ topic에 따른 한글 이름 및 아이콘 매핑
const topicTitles: Record<string, { emoji: string; name: string }> = {
  economy: { emoji: "💰", name: "경제" },
  society: { emoji: "🧠", name: "사회" },
  culture: { emoji: "🎭", name: "문화" },
  politics: { emoji: "🏛️", name: "정치" },
  science: { emoji: "🔬", name: "과학" },
};

// ✅ 현재 토픽에 맞는 타이틀 설정
const currentTopic =
  topicTitles[String(topic)] || { emoji: "📰", name: "일반" };


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
  <div className="min-h-screen bg-white">
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* 상단 타이틀 영역 */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
          {currentTopic.emoji} {currentTopic.name} 레벨업
        </h1>
        <p className="text-gray-600 text-lg">
          뉴스를 파악하여 문제를 풀어보세요. 모든 정답을 맞히면 다음 단계로 이동합니다!
        </p>
        <div className="mt-6 h-1 w-24 bg-blue-600 mx-auto rounded-full"></div>
      </header>
      <div className="flex flex-col lg:flex-row gap-8">

        
        {/* 뉴스 */}
        <article className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 flex-1 transition hover:shadow-xl">
          {news.image_url && (
            <img
              src={news.image_url}
              alt={news.title}
              className="w-full max-h-[400px] object-cover rounded-2xl mb-6"
            />
          )}
          <h1 className="text-3xl font-bold mb-6">{news.title}</h1>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
            {news.content}
          </p>
          {news.link && (
            <a
              href={news.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              원문 보기 ↗
            </a>
          )}
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
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition"
                >
                  <p className="font-medium mb-4">{quiz.quiz_content}</p>

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
                              className="accent-blue-500"
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
                      className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
                className="mt-6 w-full bg-indigo-400 text-white py-3 rounded-xl hover:bg-blue-700 transition"
              >
                제출하기
              </button>

              {/* 전체 결과 */}
              {Object.keys(results).length > 0 && (
                <div className="mt-6 p-4 border-t border-gray-300 bg-gray-50 rounded-lg">
                  <p className="font-semibold">
                    총 {quizzes.length}문제 중{" "}
                    {Object.values(results).filter(Boolean).length}문제 정답
                  </p>
                  <p className="font-semibold text-lg mt-1">
                    챌린지{" "}
                    {Object.values(results).every(Boolean)
                      ? "클리어 ✅"
                      : "실패 ❌"}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  </div>
);

}
