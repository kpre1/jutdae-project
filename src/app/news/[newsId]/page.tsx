"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Level1Page() {
  const { topic } = useParams();
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      console.log("📍 useEffect 실행됨, topic:", topic);

      try {
        const { data: topicData, error: topicError } = await supabase
          .from("topic")
          .select("topic_id, slug, topic_name")
          .eq("slug", topic)
          .single();

        console.log("✅ topicData 결과:", topicData);
        console.log("❌ topicError:", topicError);

        if (topicError || !topicData) {
          console.error("토픽 조회 오류:", topicError);
          setLoading(false);
          return;
        }

        const topicId = topicData.topic_id;

        const { data: newsData, error: newsError } = await supabase
          .from("news")
          .select("*")
          .eq("topic_id", topicId)
          .order("published_at", { ascending: false });

        console.log("📰 newsData:", newsData);
        console.log("❌ newsError:", newsError);

        if (newsError || !newsData) {
          console.error("뉴스 조회 오류:", newsError);
          setLoading(false);
          return;
        }

        setNewsList(newsData);
      } catch (e) {
        console.error("데이터 불러오기 실패:", e);
      } finally {
        setLoading(false);
      }
    };

    if (topic) fetchNews();
  }, [topic]);

  if (loading) return <p>로딩 중...</p>;
  if (newsList.length === 0) return <p>해당 토픽의 뉴스가 없습니다.</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">뉴스 목록</h1>
      <ul className="space-y-4">
        {newsList.map((news) => (
          <li key={news.news_id} className="p-4 bg-white rounded-lg shadow">
            <h2 className="font-semibold">{news.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{news.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
