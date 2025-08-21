import 'dotenv/config'; // 먼저 dotenv를 로드
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv 직접 경로 지정
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Supabase 연결
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) throw new Error('Supabase 환경변수가 로드되지 않았습니다.');
const supabase = createClient(supabaseUrl, supabaseKey);

// OpenAI 연결
const openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// 카테고리 매핑
const categories = {
  '100': '정치',
  '101': '경제',
  '102': '사회',
  '103': '생활/문화',
  '104': '세계',
  '105': 'IT/과학'
};

const newsArray = [];
const aTagElement = 'body > div > div#ct_wrap > div.ct_scroll_wrapper > div#newsct > div > div > ul > li > div > div > div.sa_text > a';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // ✅ 뉴스 크롤링
  for (const [categoryId, categoryName] of Object.entries(categories)) {
    console.log(`\n=== ${categoryName} 뉴스 크롤링 시작 ===`);
    const naverNewsUrl = `https://news.naver.com/section/${categoryId}`;

    try {
      await page.goto(naverNewsUrl, { waitUntil: 'networkidle2' });

      const aTagList = await page.$$eval(aTagElement, ele => ele.map(e => e.href));
      console.log(`${categoryName}: ${aTagList.length}개 뉴스 발견`);

      for (let i = 0; i < Math.min(aTagList.length, 3); i++) {
        const link = aTagList[i];
        try {
          await page.goto(link, { waitUntil: 'networkidle2' });

          const title = await page.$eval('#title_area > span', el => el.innerText);
          const content = await page.$eval('#dic_area', el => el.innerText);

          // ✅ 대표 이미지 (og:image) 추출
              let image_url = null;
              try {
                image_url = await page.$eval(
                  'meta[property="og:image"]',
                  el => el.content
                );
              } catch (e) {
                console.log('이미지 없음 (', link, ')');
              }

          newsArray.push({ category_id: categoryId, 
            category_name: categoryName, 
            title, 
            content, 
            link,
            image_url,
           });
          console.log(`✓ ${categoryName} - ${title.substring(0, 30)}...`);

        } catch (error) {
          console.log(`개별 뉴스 크롤링 실패: ${link}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`${categoryName} 카테고리 크롤링 실패:`, error.message);
    }
  }

  await browser.close();
  console.log(`\n총 ${newsArray.length}개 뉴스 수집 완료`);

  // ✅ 원본 JSON 저장 (항상)
  fs.writeFileSync('news_data.json', JSON.stringify(newsArray, null, 2), 'utf8');
  console.log(' 원본 데이터 저장 완료: news_data.json');

  // ✅ OpenAI 요약 (선택)
  try {
    const response = await openAi.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'category_name, title, content, link가 포함된 객체들의 배열입니다.' },
        { role: 'system', content: '각 뉴스를 카테고리별로 정리하여 markdown 형식으로 요약해주세요.' },
        { role: 'system', content: '형식: ## 카테고리명\n### 뉴스제목\n- 요약내용\n- [원문링크](링크)\n- 키워드: 태그1, 태그2\n' },
        { role: 'user', content: JSON.stringify(newsArray) }
      ],
      temperature: 0.4,
    });

    const summary = response.choices[0].message.content;
    fs.writeFileSync('category_news_summary.md', summary, 'utf8');
    console.log('📄 요약 파일 생성 완료: category_news_summary.md');

  } catch (error) {
    console.log(' OpenAI API 오류:', error.message);
  }

  // ✅ Supabase 삽입
  try {
    const { data, error } = await supabase.from('news').insert(newsArray);
    if (error) console.error('Supabase 저장 오류:', error);
    else console.log(`Supabase 저장 완료: ${data.length}개`);
  } catch (err) {
    console.error('코드 실행 오류:', err);
  }
})();
