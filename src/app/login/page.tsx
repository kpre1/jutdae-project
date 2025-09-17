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
  <div className="min-h-screen bg-[#F8F8FC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-indigo-900">줏대 있게 살아</h1>
        <h2 className="mt-6 text-2xl font-semibold text-indigo-900">로그인</h2>
        <p className="mt-2 text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-500"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-6 shadow sm:rounded-lg">
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-full placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-full placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="비밀번호를 입력하세요"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-[#1E0E62] hover:bg-[#150A45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E0E62] disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>

          <div className="mt-6 text-center">
      
             <Link href="/forgot-password" className="text-indigo-900 hover:text-blue-500 text-sm">
              비밀번호 찾기
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  </div>
);

}