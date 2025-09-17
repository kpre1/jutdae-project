'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});

console.log("reset result:", error);

if (error) {
  setMessage('메일 전송 실패: ' + error.message);
} else {
  setMessage('비밀번호 재설정 메일을 보냈습니다.');
}


    if (error) {
      setMessage('메일 전송 실패: ' + error.message);
    } else {
      setMessage('비밀번호 재설정 메일을 보냈습니다.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">비밀번호 찾기</h1>
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-indigo-700 text-white py-2 rounded hover:bg-indigo-800"
        >
          비밀번호 재설정 메일 보내기
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
