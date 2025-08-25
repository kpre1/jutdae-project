import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// OpenAI 연결 (선택사항)
//let openAi = null;
//if (process.env.OPENAI_API_KEY) {
 //openAi = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//}

// 카테고리 매핑 (일관된 구조로 통일)
const categories = {
  '100': { id: 1, name: '정치', section: '100' },
  '101': { id: 2, name: '경제', section: '101' },
  '102': { id: 3, name: '사회', section: '102' },
  '103': { id: 4, name: '생활/문화', section: '103' },
  '105': { id: 5, name: 'IT/과학', section: '105' },
  '107': { id: 6, name: '스포츠', section: '107' },
  '104': { id: 7, name: '국제', section: '104' },
  '108': { id: 8, name: '환경', section: '102' } // 환경은 사회 섹션에서 키워드로 필터링
};

const newsArray = [];

// 환경 관련 키워드
const environmentKeywords = [
  '환경', '기후', '탄소', '에너지', '재생', '친환경', 
  '온실가스', '지구온난화', '미세먼지', '대기오염',
  '수질오염', '재활용', '태양광', '풍력', '녹색'
];

// 환경 뉴스 판별 함수
function isEnvironmentNews(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  return environmentKeywords.some(keyword => text.includes(keyword));
}

// 뉴스 상세 정보 추출 함수
async function extractNewsDetails(page, link) {
  try {
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 10000 });

    // 제목 추출 (여러 selector 시도)
    let title = '';
    const titleSelectors = [
      '#title_area > span',
      '.media_end_head_headline',
      'h3#articleTitle',
      '.end_tit'
    ];

    for (const selector of titleSelectors) {
      try {
        title = await page.$eval(selector, el => el.innerText.trim());
        if (title) break;
      } catch (e) { continue; }
    }

    // 본문 추출 (여러 selector 시도)
    let content = '';
    const contentSelectors = [
      '#dic_area',
      '#articleBodyContents',
      '.go_trans._article_content',
      '#content'
    ];

    for (const selector of contentSelectors) {
      try {
        content = await page.$eval(selector, el => {
          // 불필요한 요소 제거
          const elementsToRemove = el.querySelectorAll('script, style, .ad, .advertisement');
          elementsToRemove.forEach(el => el.remove());
          return el.innerText.trim();
        });
        if (content) break;
      } catch (e) { continue; }
    }

    // 이미지 URL 추출
    let image_url = null;
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '#img1'
    ];

    for (const selector of imageSelectors) {
      try {
        image_url = await page.$eval(selector, el => {
          return selector.includes('meta') ? el.content : el.src;
        });
        if (image_url && image_url.startsWith('http')) break;
      } catch (e) { continue; }
    }

    // 발행일 추출
    let published_at = new Date().toISOString();
    try {
      const dateText = await page.$eval('.media_end_head_info_datestamp_time', el => el.innerText);
      const publishedDate = new Date(dateText);
      if (!isNaN(publishedDate.getTime())) {
        published_at = publishedDate.toISOString();
      }
    } catch (e) {
      // 날짜 추출 실패 시 현재 시간 사용
    }

    return { title, content, image_url, published_at };
  } catch (error) {
    console.log(`뉴스 상세 정보 추출 실패: ${link} - ${error.message}`);
    return null;
  }
}

(async () => {
  console.log('🔄 네이버 뉴스 크롤링 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // User Agent 설정
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // 뉴스 크롤링
  for (const [sectionId, categoryInfo] of Object.entries(categories)) {
    console.log(`\n=== ${categoryInfo.name} 뉴스 크롤링 시작 ===`);
    const naverNewsUrl = `https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=${categoryInfo.section}`;

    try {
      await page.goto(naverNewsUrl, { waitUntil: 'networkidle2', timeout: 15000 });
      await page.waitForTimeout(2000);

      // 뉴스 링크 추출 (여러 selector 시도)
      const linkSelectors = [
        'ul.type06_headline li dt a',
        'ul.type06 li dt a', 
        '.cluster_body .cluster_text a',
        '.headline_area a'
      ];

      let aTagList = [];
      for (const selector of linkSelectors) {
        try {
          aTagList = await page.$$eval(selector, elements => 
            elements.map(e => e.href).filter(href => 
              href && href.includes('news.naver.com/main/read.naver')
            )
          );
          if (aTagList.length > 0) {
            console.log(`${categoryInfo.name}: ${selector}로 ${aTagList.length}개 링크 발견`);
            break;
          }
        } catch (e) { continue; }
      }

      if (aTagList.length === 0) {
        console.log(`${categoryInfo.name}: 뉴스 링크를 찾을 수 없습니다.`);
        continue;
      }

      // 최대 5개 뉴스 처리
      const maxNews = Math.min(aTagList.length, 5);
      for (let i = 0; i < maxNews; i++) {
        const link = aTagList[i];
        console.log(`처리중 (${i+1}/${maxNews}): ${link}`);

        const newsDetails = await extractNewsDetails(page, link);
        if (!newsDetails) continue;

        const { title, content, image_url, published_at } = newsDetails;
        
        if (!title || !content) {
          console.log(' 제목 또는 본문이 없어 스킵');
          continue;
        }

        // 환경 뉴스 특별 처리
        let finalTopicId = categoryInfo.id;
        if (categoryInfo.section === '102' && isEnvironmentNews(title, content)) {
          finalTopicId = 8; // 환경 카테고리
          console.log(' 환경 뉴스로 분류됨');
        }

        newsArray.push({ 
          topic_id: finalTopicId,
          title: title.substring(0, 200), // 제목 길이 제한
          content: content.substring(0, 2000), // 본문 길이 제한
          journal: link, // 실제 뉴스 URL 저장
          image_url,
          published_at
        });

        console.log(`✅ ${categoryInfo.name} - ${title.substring(0, 40)}...`);
        await page.waitForTimeout(1000); // 1초 대기
      }
    } catch (error) {
      console.log(` ${categoryInfo.name} 카테고리 크롤링 실패:`, error.message);
    }
  }

  await browser.close();
  console.log(`\n 총 ${newsArray.length}개 뉴스 수집 완료`);

  // 원본 JSON 저장
  fs.writeFileSync('news_data.json', JSON.stringify(newsArray, null, 2), 'utf8');
  console.log(' 원본 데이터 저장 완료: news_data.json');

  // OpenAI 요약 (옵션)
  if (openAi && newsArray.length > 0) {
    try {
      console.log(' AI 요약 생성 중...');
      const response = await openAi.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `다음은 topic_id별로 분류된 뉴스 데이터입니다. 각 카테고리별로 주요 뉴스를 요약해주세요.
카테고리: 1-정치, 2-경제, 3-사회, 4-생활문화, 5-IT과학, 6-스포츠, 7-국제, 8-환경` 
          },
          { role: 'user', content: JSON.stringify(newsArray.slice(0, 10)) } // 처음 10개만 요약
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      const summary = response.choices[0].message.content;
      fs.writeFileSync('news_summary.md', summary, 'utf8');
      console.log(' AI 요약 완료: news_summary.md');

    } catch (error) {
      console.log(' OpenAI API 오류:', error.message);
    }
  }

  // Supabase 저장
  if (newsArray.length > 0) {
    try {
      console.log('\n Supabase에 뉴스 저장 중...');
      
      // 중복 확인
      const titles = newsArray.map(n => n.title);
      const { data: existingNews } = await supabase
        .from('news')
        .select('title')
        .in('title', titles);

      const existingTitles = new Set(existingNews?.map(n => n.title) || []);
      const newNews = newsArray.filter(news => !existingTitles.has(news.title));
      
      if (newNews.length === 0) {
        console.log(' 모든 뉴스가 이미 존재합니다.');
      } else {
        // 배치 처리로 저장 (한번에 너무 많이 저장하지 않도록)
        const batchSize = 10;
        let savedCount = 0;
        
        for (let i = 0; i < newNews.length; i += batchSize) {
          const batch = newNews.slice(i, i + batchSize);
          
          const { data, error } = await supabase
            .from('news')
            .insert(batch);
          
          if (error) {
            console.error(` 배치 ${Math.floor(i/batchSize) + 1} 저장 오류:`, error);
          } else {
            savedCount += batch.length;
            console.log(` 배치 ${Math.floor(i/batchSize) + 1}: ${batch.length}개 저장`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기
        }
        
        console.log(`🎉 총 ${savedCount}개 뉴스 저장 완료`);
        console.log(`📊 중복 제외: ${newsArray.length - newNews.length}개`);
      }
    } catch (err) {
      console.error(' 데이터베이스 저장 오류:', err);
    }
  }

  console.log('\n 크롤링 완료!');
})();