'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // 비밀번호 확인
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    // 비밀번호 길이 확인
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 사용자 계정 생성 - 트리거가 자동으로 프로필 생성
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: username,
            nickname: username,
          }
        }
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.');
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
      console.error('회원가입 오류:', err);
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-indigo-900">줏대 있게 살아</h1>
        <h2 className="mt-6 text-2xl font-bold text-[#1E0E62]">회원가입</h2>
        <p className="mt-2 text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            로그인
          </Link>
        </p>
      </div>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-6 shadow sm:rounded-2xl">
        <form className="space-y-6" onSubmit={handleRegister}>
          {/* 사용자명 */}
          <div>
            <label htmlFor="username" className="block text-base font-medium text-[#1E0E62]">
              사용자명
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-lg placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="사용자명을 입력하세요"
              />
            </div>
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-base font-medium text-[#1E0E62]">
              이메일
            </label>
            <div className="mt-1 flex space-x-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-lg placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="이메일을 입력하세요"
              />
              <button
                type="button"
                className="px-4 py-2 bg-[#EBEAED] text-[#1E0E62] text-sm font-medium rounded-full"
              >
                인증
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-base font-medium text-[#1E0E62]">
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
                className="appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-lg placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
              />
            </div>
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-base font-medium text-[#1E0E62]">
              비밀번호 확인
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#EBEAED] rounded-lg placeholder-gray-400 focus:outline-none focus:ring-[#1E0E62] focus:border-[#1E0E62] text-sm"
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>
          </div>

          {/* 오류 / 성공 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* 회원가입 버튼 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-base font-medium text-white bg-[#1E0E62] hover:bg-[#150A45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E0E62] disabled:opacity-50"
            >
              {loading ? "회원가입 중..." : "회원가입"}
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
            <Link href="/" className="text-blue-600 hover:text-blue-500 text-sm">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}