import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

export async function POST(req: NextRequest) {
  console.log('=== Gemini 반론 요청 시작 ===');
  try {
    const { articleTitle, articleContent, userSummary } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY가 설정되어 있지 않습니다.');
      return NextResponse.json({ error: '서버 환경변수 누락' }, { status: 500 });
    }

    if (!articleTitle || !articleContent || !userSummary) {
      return NextResponse.json({ error: '기사 제목, 내용, 사용자 요약이 필요합니다.' }, { status: 400 });
    }

    const prompt = `
당신은 비판적 사고를 돕는 AI 분석가입니다.
아래의 기사와 사용자가 작성한 요약을 읽고, **건설적인 반론이나 보완점**을 제시해주세요.

기사 제목: ${articleTitle}

기사 본문:
${articleContent}

사용자 요약:
${userSummary}

다음 관점에서 분석해주세요:
1. 사용자가 놓친 중요한 정보가 있나요?
2. 다른 시각이나 해석의 여지가 있나요?
3. 보완하면 좋을 점은 무엇인가요?

200자 이내로 친절하고 건설적으로 답변해주세요.
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
            temperature: 0.5,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();
    console.log('Gemini 응답 상태:', response.status);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gemini 호출 실패', details: data },
        { status: response.status }
      );
    }

    const rebuttal =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '반론 생성 실패';

    return NextResponse.json({ rebuttal });
  } catch (err: any) {
    console.error('서버 오류:', err);
    return NextResponse.json({ error: '서버 오류', details: err.message }, { status: 500 });
  }
}