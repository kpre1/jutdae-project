// app/levelup/page.tsx
"use client";

import Link from "next/link";

type Topic = {
  slug: string;          // URL에 사용 (예: /levelup/politics/level/1)
  label: string;         // 카드 표기 (한글)
  emoji: string;         // 아이콘
  hint: string;          // 짧은 설명
  badgeClass: string;    // 배지 색상
};

const TOPICS: Topic[] = [
  { slug: "politics",    label: "정치",       emoji: "🏛️", hint: "국내 정치 이슈 파악",         badgeClass: "bg-red-100 text-red-700" },
  { slug: "economy",     label: "경제",       emoji: "💹", hint: "시장/기업/금융 흐름",         badgeClass: "bg-amber-100 text-amber-700" },
  { slug: "society",     label: "사회",       emoji: "🏙️", hint: "사회 전반의 주요 사건",        badgeClass: "bg-emerald-100 text-emerald-700" },
  { slug: "life-culture",label: "생활/문화",  emoji: "🎭", hint: "라이프/트렌드/문화",          badgeClass: "bg-pink-100 text-pink-700" },
  { slug: "world",       label: "세계",       emoji: "🌍", hint: "글로벌 주요 뉴스",            badgeClass: "bg-blue-100 text-blue-700" },
  { slug: "it-science",  label: "IT/과학",    emoji: "🧪", hint: "테크/AI/사이언스",            badgeClass: "bg-indigo-100 text-indigo-700" },
];

export default function LevelUpHome() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">레벨업 모드</h1>
          <p className="text-gray-600 mt-2">
            카테고리를 선택해 <span className="font-semibold">레벨 1</span>부터 시작하세요.
            뉴스 읽고, 3문제 중 2개 이상 맞히면 다음 레벨로 이동합니다.
          </p>
        </header>

        {/* 카테고리 카드 그리드 */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOPICS.map((t) => (
            <Link
              key={t.slug}
              href={`/levelup/${t.slug}/level1`}
              className="group block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs px-2 py-1 rounded ${t.badgeClass}`}>
                  {t.label}
                </span>
                <span className="text-2xl">{t.emoji}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {t.label} 레벨업 시작
              </h2>
              <p className="text-gray-600 mt-1">{t.hint}</p>

              <div className="mt-4 flex items-center text-sm text-blue-600 group-hover:translate-x-0.5 transition-transform">
                레벨 1로 이동하기
                <span className="ml-1">→</span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
