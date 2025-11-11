'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
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
  const [currentView, setCurrentView] = useState<'main' | 'profile' | 'settings' | 'support' | 'delete'>('main');

  // 프로필 수정
  const [editName, setEditName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');

  // 환경설정
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [emailNotification, setEmailNotification] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // 계정 탈퇴
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // 고객센터 (문의)
  const [supportType, setSupportType] = useState("서비스 이용");
  const [supportContent, setSupportContent] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('유저 정보 불러오기 오류:', error.message);
        return;
      }
     if (data?.user) {
  // User → UserProfile 변환
  const userProfile: UserProfile = {
    id: data.user.id,
    email: data.user.email || '',
    user_metadata: {
      name: data.user.user_metadata?.name,
      avatar_url: data.user.user_metadata?.avatar_url,
    },
    last_sign_in_at: data.user.last_sign_in_at || '',
  };

  setUser(userProfile);
  setEditName(userProfile.user_metadata?.name || '');
}

    };
    getUser();
  }, []);

  const handleProfileUpdate = async () => {
    if (!user) return;
    const updates: any = { data: { name: editName } };
    if (editPassword && editPassword === editPasswordConfirm) {
      updates.password = editPassword;
    }
    const { error } = await supabase.auth.updateUser(updates);
    if (error) {
      alert('업데이트 실패: ' + error.message);
    } else {
      alert('프로필이 업데이트되었습니다!');
      setEditPassword('');
      setEditPasswordConfirm('');
      setCurrentView('main');
    }
  };

  const handleAccountDelete = async () => {
    if (deleteConfirm !== '탈퇴하기') {
      alert('탈퇴 확인 문구를 정확히 입력해주세요.');
      return;
    }
    if (window.confirm('정말로 계정을 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await supabase.auth.signOut();
      alert('계정이 탈퇴되었습니다.');
      window.location.href = '/';
    }
  };

  const handleSupportSubmit = () => {
    if (!supportContent.trim()) {
      alert("문의 내용을 입력해주세요!");
      return;
    }
    alert(`문의가 정상적으로 전송되었습니다!\n문의 유형: ${supportType}\n내용: ${supportContent}`);
    setSupportType("서비스 이용");
    setSupportContent("");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-500">
        로그인 필요
      </div>
    );
  }

  // ===== 메인 뷰 =====
  if (currentView === 'main') {
    const cards = [
      { title: '프로필 수정', subtitle: '개인정보, 비밀번호 변경', view: 'profile' },
      { title: '환경설정', subtitle: '앱 설정 및 알림 관리', view: 'settings' },
      { title: '고객 센터', subtitle: '문의사항 및 도움말', view: 'support' },
      { title: '계정 탈퇴', subtitle: '계정을 삭제할 수 있습니다', view: 'delete', isDelete: true },
    ];

    return (
      <div className="min-h-screen  bg-gradient-to-b from-white to-indigo-50 rounded-xl p-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium text-gray-800">마이페이지</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow p-6 text-center mb-10">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden bg-gray-200 mb-4">
            <img
              src={user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`bg-white border border-gray-200 rounded-xl shadow p-6 text-center cursor-pointer transform transition hover:-translate-y-1 ${card.isDelete ? 'text-red-500' : ''}`}
              onClick={() => setCurrentView(card.view as any)}
            >
              <div className="text-gray-800 font-medium mb-1">{card.title}</div>
              {card.subtitle && <div className="text-gray-500 text-sm mb-2">{card.subtitle}</div>}
            </div>
          ))}
        </div>

        <div className="text-center text-gray-400 text-sm py-10">© 줏대 있게 살아</div>
      </div>
    );
  }

  // ===== 프로필 수정 =====
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 rounded-xl p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-medium text-gray-800">프로필 수정</h1>
            <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-200 rounded-lg transition">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="이름을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg  text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">비밀번호 변경</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">새 비밀번호</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="새 비밀번호 (선택사항)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
                  <input
                    type="password"
                    value={editPasswordConfirm}
                    onChange={(e) => setEditPasswordConfirm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="비밀번호 확인"
                  />
                  {editPassword && editPassword !== editPasswordConfirm && (
                    <p className="text-xs text-red-500 mt-1">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button onClick={() => setCurrentView('main')} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleProfileUpdate} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== 환경설정 =====
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen  bg-gradient-to-b from-white to-indigo-50 rounded-xl p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-medium text-gray-800">환경설정</h1>
            <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-200 rounded-lg transition">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">알림 설정</h3>
              {['푸시 알림', '이메일 알림'].map((label, idx) => {
                const state = idx === 0 ? notificationEnabled : emailNotification;
                const setter = idx === 0 ? setNotificationEnabled : setEmailNotification;
                const desc = idx === 0 ? '앱 알림을 받습니다' : '이메일로 소식을 받습니다';
                return (
                  <div key={idx} className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-gray-800 font-medium">{label}</div>
                      <div className="text-sm text-gray-500">{desc}</div>
                    </div>
                    <input type="checkbox" checked={state} onChange={(e) => setter(e.target.checked)} className="w-5 h-5" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== 고객센터 =====
  if (currentView === 'support') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 rounded-xl p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-medium text-gray-800">고객 센터</h1>
            <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-200 rounded-lg transition">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 자주 묻는 질문 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">자주 묻는 질문</h3>
              <div className="space-y-3">
                {[
                  { q: '비밀번호를 잊어버렸어요', a: '로그인 페이지에서 비밀번호 재설정을 이용해주세요.' },
                  { q: '회원 탈퇴는 어떻게 하나요?', a: '마이페이지 > 계정 탈퇴에서 진행하실 수 있습니다.' },
                  { q: '알림을 받고 싶지 않아요', a: '환경설정에서 알림 설정을 변경할 수 있습니다.' },
                ].map((faq, i) => (
                  <details key={i} className="group">
                    <summary className="cursor-pointer px-4 py-3 hover:bg-gray-50 rounded-lg transition list-none">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{faq.q}</span>
                        <span className="text-gray-400 group-open:rotate-180 transition">▼</span>
                      </div>
                    </summary>
                    <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 rounded-lg mt-2">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* 문의하기 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">문의하기</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    문의 유형
                  </label>
                  <select
                    value={supportType}
                    onChange={(e) => setSupportType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>서비스 이용</option>
                    <option>버그 신고</option>
                    <option>기능 제안</option>
                    <option>기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">문의 내용</label>
                  <textarea
                    rows={5}
                    value={supportContent}
                    onChange={(e) => setSupportContent(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="문의 내용을 입력해주세요"
                  />
                </div>

                <button
                  onClick={handleSupportSubmit}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                >
                  문의 보내기
                </button>
              </div>
            </div>

            {/* 연락처 */}
            <div className="bg-white border border-gray-200 rounded-xl shadow p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">연락처</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>📧 이메일: support@example.com</p>
                <p>📞 전화: 02-1234-5678</p>
                <p>🕐 운영시간: 평일 09:00 - 18:00</p>
              </div>
            </div>

          </div> {/* space-y-4 */}
        </div> {/* max-w-2xl */}
      </div> /* min-h-screen */
    );
  }

  // ===== 계정 탈퇴 =====
  if (currentView === 'delete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50 rounded-xl p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-medium text-red-600">계정 탈퇴</h1>
            <button onClick={() => setCurrentView('main')} className="p-2 hover:bg-gray-200 rounded-lg transition">
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="bg-white border border-red-200 rounded-xl shadow p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">정말 탈퇴하시겠습니까?</h2>
              <p className="text-sm text-gray-600">
                이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-red-800 mb-2">탈퇴 시 삭제되는 정보</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 계정 정보 및 프로필</li>
                <li>• 작성한 모든 콘텐츠</li>
                <li>• 활동 기록 및 통계</li>
                <li>• 저장된 설정 및 환경설정</li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                탈퇴 확인을 위해 <span className="text-red-600">"탈퇴하기"</span>를 입력해주세요
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="탈퇴하기"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentView('main')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                취소
              </button>
              <button
                onClick={handleAccountDelete}
                disabled={deleteConfirm !== '탈퇴하기'}
                className={`flex-1 px-6 py-3 rounded-lg transition ${
                  deleteConfirm === '탈퇴하기'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                계정 탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
