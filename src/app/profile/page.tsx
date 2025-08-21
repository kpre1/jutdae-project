'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
  last_sign_in_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('유저 정보 불러오기 오류:', error.message);
        return;
      }
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-500">
        로그인 필요
      </div>
    );
  }

  const cards = [
    {
      title: '프로필 수정',
      subtitle: '개인정보, 비밀번호 변경',
      content: '계정 정보를 수정할 수 있습니다',
    },
    {
      title: '환경설정',
      content: '앱 설정 및 알림 관리',
    },
    {
      title: '고객 센터',
      content: '문의사항 및 도움말',
    },
    {
      title: '계정 탈퇴',
      content: '계정을 삭제할 수 있습니다',
      isDelete: true,
    },
  ];

  const handleAccountDelete = () => {
    alert('계정 탈퇴 로직 실행'); // 실제 구현 시 서버 API 호출 필요
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-6">마이메뉴</h2>
        <ul className="space-y-2 text-gray-700">
          {['뉴스', '레벨업 하기', '내가 쓴 글'].map((menu) => (
            <li key={menu} className="px-3 py-2 rounded hover:bg-gray-100 cursor-default">
              {menu}
            </li>
          ))}
        </ul>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 p-8">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-800">마이페이지</h1>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 text-center mb-10">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-200 mb-4">
            <img
              src={
                user.user_metadata?.avatar_url ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`
              }
              alt="프로필"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-lg font-semibold text-gray-800 mb-1">
            {user.user_metadata?.name || '이름 없음'}
          </div>
          <div className="text-sm text-gray-500 mb-2">{user.email}</div>
          <div className="text-sm text-gray-500">
            최근 로그인: {new Date(user.last_sign_in_at).toLocaleString()}
          </div>
        </div>

        {/* 카드 그리드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`bg-white border border-gray-200 rounded-xl shadow p-6 text-center cursor-pointer transform transition hover:-translate-y-1 ${
                card.isDelete ? 'text-red-500' : ''
              }`}
              onClick={card.isDelete ? handleAccountDelete : undefined}
            >
              <div className="text-gray-800 font-medium mb-1">{card.title}</div>
              {card.subtitle && <div className="text-gray-500 text-sm mb-2">{card.subtitle}</div>}
              <div className={`text-sm ${card.isDelete ? 'text-red-500' : 'text-gray-500'}`}>
                {card.content}
              </div>
            </div>
          ))}
        </div>

        {/* 푸터 */}
        <div className="text-center text-gray-400 text-sm py-10">
          © 2025 마이페이지
        </div>
      </div>
    </div>
  );
}
