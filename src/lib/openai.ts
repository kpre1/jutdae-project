import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRebuttal(summaryContent: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 비판적 사고를 돕는 AI입니다. 주어진 요약에 대해 다른 관점이나 반박 의견을 제시해주세요. 건설적이고 논리적인 반박을 해주세요."
        },
        {
          role: "user",
          content: `다음 요약에 대한 반박 의견을 작성해주세요: ${summaryContent}`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API 오류:', error);
    throw error;
  }
}