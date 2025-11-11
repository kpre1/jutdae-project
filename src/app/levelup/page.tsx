// app/levelup/page.tsx
"use client";

import Link from "next/link";

type Topic = {
  slug: string;
  label: string;
  emoji: string;
  hint: string;
  badgeClass: string;
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
    <div className="min-h-screen bg-gray-50 flex justify-center rounded-3xl">
     <main className="space-y-24 px-6 py-10 bg-gradient-to-b from-white to-indigo-50 rounded-xl w-full max-w-6xl">

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
              className="group block bg-white rounded-3xl border border-indigo-100 p-6 shadow-lg hover:shadow-xl hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${t.badgeClass}`}>
                  {t.label}
                </span>
                <span className="text-3xl">{t.emoji}</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                {t.label} 레벨업 시작
              </h2>
              <p className="text-gray-600 mt-2">{t.hint}</p>

              <div className="mt-4 flex items-center text-sm text-indigo-700 group-hover:translate-x-1 transition-transform">
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
