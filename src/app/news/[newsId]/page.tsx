"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // ✅ 추가
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface NewsItem {
  news_id: number;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
  link: string;
  category_id: number;
  category_name: string;
}

export default function NewsDetailPage() {
  const { newsId } = useParams();
  const router = useRouter(); // ✅ router 선언
  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      const id = Number(newsId);
      if (isNaN(id)) return;

      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("news_id", id)
        .single();

      if (error) {
        console.error("뉴스 불러오기 오류:", error);
      } else {
        setNews(data);
      }
      setLoading(false);
    };

    fetchNews();
  }, [newsId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 rounded-full border-t-blue-500"></div>
        <span className="ml-3 text-gray-600">뉴스 불러오는 중...</span>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-gray-500">
        <p>해당 뉴스를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.back()} // ✅ 이전 페이지로
          className="mt-4 text-blue-600 hover:underline"
        >
          ← 뉴스 목록으로 돌아가기
        </button>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
  <div className="flex flex-col lg:flex-row gap-8">
    {/* 뉴스 섹션 */}
    <article className="flex-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
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

    {/* 글 작성 섹션 */}
    <aside className="w-full lg:w-1/2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4">요약 작성하기</h2>
      <textarea
        placeholder="뉴스 요약, 의견, 태그 등을 작성하세요..."
        className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-4"
      />
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        작성 완료
      </button>
    </aside>
  </div>
</main>

    </div>
  );
}
