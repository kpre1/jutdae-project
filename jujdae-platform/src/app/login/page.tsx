

'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };
return (
  <div className="min-h-screen bg-[#F8F8FC] flex flex-col items-center justify-center py-12 px-4">
    {/* 중앙 프레임 */}
    <div className="relative w-[600px] bg-white rounded-[16px] shadow-lg p-8">
      {/* 제목 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#1E0E62] mb-2">
          줏대 있게 살아
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold text-[#151439] mb-4">
          로그인
        </h2>
        <p className="text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-blue-600 hover:text-blue-500">
            회원가입
          </Link>
        </p>
      </div>

      {/* 이메일 입력 */}
      <div className="relative mb-4">
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full h-[50px] px-4 border-2 border-[#EBEAED] rounded-[50px] placeholder-[#151439]/40 text-[#151439] font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 비밀번호 입력 */}
      <div className="relative mb-4">
        <input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full h-[50px] px-4 border-2 border-[#EBEAED] rounded-[50px] placeholder-[#151439]/40 text-[#151439] font-medium text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 로그인 버튼 */}
      <div className="relative mb-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[60px] bg-[#1E0E62] rounded-[50px] text-white font-semibold text-lg flex items-center justify-center hover:bg-[#3a1fb2] disabled:opacity-50"
          onClick={handleLogin}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </div>

      {/* 하단 링크 */}
      <div className="flex justify-center gap-12 mt-6 text-base text-[#5F5F5F] font-medium">
        <Link href="#" className="hover:underline">
          sds
        </Link>
        <Link href="#" className="hover:underline">
          sds
        </Link>
        <Link href="#" className="hover:underline">
          sds
        </Link>
      </div>
    </div>
  </div>
);

}