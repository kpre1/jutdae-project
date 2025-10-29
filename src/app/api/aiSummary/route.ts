import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// 최신 Gemini 모델 (무료 티어 지원)
const GEMINI_MODEL = 'gemini-2.0-flash'; 

export async function POST(req: NextRequest) {
  console.log('=== Gemini 요약 요청 시작 ===');
  try {
    const { title, content } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY가 설정되어 있지 않습니다.');
      return NextResponse.json({ error: '서버 환경변수 누락' }, { status: 500 });
    }

    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용이 필요합니다.' }, { status: 400 });
    }

    const prompt = `
당신은 전문 뉴스 요약가입니다. 
아래의 기사를 읽고 **핵심 내용만 포함한 150자 이내의 객관적 요약문**을 작성하세요.

제목: ${title}

본문:
${content}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    const data = await response.json();
    console.log('Gemini 응답 상태:', response.status);
    console.log('Gemini 응답 데이터:', JSON.stringify(data).slice(0, 300));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gemini 호출 실패', details: data },
        { status: response.status }
      );
    }

    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '요약 생성 실패';

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('서버 오류:', err);
    return NextResponse.json({ error: '서버 오류', details: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    model: GEMINI_MODEL,
    hasApiKey: !!GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
}
