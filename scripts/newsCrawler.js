// scripts/updateNews.js
// 네이버 뉴스 크롤링 + Supabase 저장을 한 번에 처리하는 통합 스크립트

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경변수 로드
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase 연결
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 카테고리 매핑
const categories = {
  '100': { id: 1, name: '정치', section: '100' },
  '101': { id: 2, name: '경제', section: '101' },
  '102': { id: 3, name: '사회', section: '102' },
  '103': { id: 4, name: '생활/문화', section: '103' },
  '105': { id: 5, name: 'IT/과학', section: '105' },
  '107': { id: 6, name: '스포츠', section: '107' },
  '104': { id: 7, name: '국제', section: '104' },
  '108': { id: 8, name: '환경', section: '102' }
};

// 환경 관련 키워드
const environmentKeywords = [
  '환경', '기후', '탄소', '에너지', '재생', '친환경', 
  '온실가스', '지구온난화', '미세먼지', '대기오염',
  '수질오염', '재활용', '태양광', '풍력', '녹색',
  '생태', '오존', '플라스틱', '쓰레기', '폐기물',
  '전기차', '수소', '바이오', 'ESG', '지속가능'
];

function isEnvironmentNews(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  return environmentKeywords.some(keyword => text.includes(keyword));
}

// 날짜 파싱 함수
function parseDate(dateStr) {
  try {
    let cleanDate = dateStr.replace(/[가-힣]/g, '').trim();
    cleanDate = cleanDate.replace(/\s+/g, ' ');
    
    const now = new Date();
    
    if (cleanDate.includes('오전') || cleanDate.includes('오후')) {
      const timeMatch = cleanDate.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        const minute = parseInt(timeMatch[2]);
        const isAM = cleanDate.includes('오전');
        
        const resultDate = new Date(now);
        resultDate.setHours(isAM ? hour : hour + 12, minute, 0, 0);
        return resultDate.toISOString();
      }
    }
    
    const parsedDate = new Date(cleanDate);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString();
    }
    
    return now.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// 뉴스 상세 정보 추출
async function extractNewsDetails(page, link) {
  try {
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForTimeout(2000);

    // 제목 추출
    let title = '';
    const titleSelectors = [
      '#title_area > span',
      '.media_end_head_headline',
      'h3#articleTitle',
      '.end_tit',
      '.news_headline',
      'h2.end_tit'
    ];

    for (const selector of titleSelectors) {
      try {
        title = await page.$eval(selector, el => el.innerText.trim());
        if (title && title.length > 5) break;
      } catch (e) { continue; }
    }

    // 본문 추출
    let content = '';
    const contentSelectors = [
      '#dic_area',
      '#articleBodyContents',
      '.go_trans._article_content',
      '#content',
      '.article_body',
      '.news_end'
    ];

    for (const selector of contentSelectors) {
      try {
        content = await page.$eval(selector, el => {
          const elementsToRemove = el.querySelectorAll(
            'script, style, .ad, .advertisement, .journalist_info, .copyright'
          );
          elementsToRemove.forEach(element => element.remove());
          
          return el.innerText.trim()
            .replace(/\n\s*\n/g, '\n')
            .replace(/\s+/g, ' ');
        });
        
        if (content && content.length > 50) break;
      } catch (e) { continue; }
    }

    // 이미지 URL 추출
    let image_url = null;
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '#img1',
      '.end_photo_org img'
    ];

    for (const selector of imageSelectors) {
      try {
        image_url = await page.$eval(selector, el => {
          const url = selector.includes('meta') ? el.content : el.src;
          return url && url.startsWith('http') ? url : null;
        });
        if (image_url) break;
      } catch (e) { continue; }
    }

    // 발행일 추출
    let published_at = new Date().toISOString();
    const dateSelectors = [
      '.media_end_head_info_datestamp_time',
      '.article_info .t11',
      '.info .date'
    ];

    for (const selector of dateSelectors) {
      try {
        const dateText = await page.$eval(selector, el => el.innerText.trim());
        if (dateText) {
          published_at = parseDate(dateText);
          break;
        }
      } catch (e) { continue; }
    }

    return title && content ? { title, content, image_url, published_at } : null;

  } catch (error) {
    console.log(`  ❌ 추출 실패: ${error.message}`);
    return null;
  }
}

// 크롤링 함수
async function crawlNews() {
  console.log('🕷️  네이버 뉴스 크롤링 시작...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  const newsArray = [];

  for (const [sectionId, categoryInfo] of Object.entries(categories)) {
    if (categoryInfo.section === '102' && categoryInfo.id === 8) continue;
    
    console.log(`\n📰 ${categoryInfo.name} 뉴스 크롤링...`);
    const naverNewsUrl = `https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=${categoryInfo.section}`;

    try {
      await page.goto(naverNewsUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await page.waitForTimeout(3000);

      // 뉴스 링크 추출
      const linkSelectors = [
        'ul.type06_headline li dt a',
        'ul.type06 li dt a', 
        '.cluster_body .cluster_text a',
        '.headline_area a',
        '.cluster_head a'
      ];

      let aTagList = [];
      for (const selector of linkSelectors) {
        try {
          aTagList = await page.$$eval(selector, elements => 
            elements.map(e => e.href)
              .filter(href => href && href.includes('news.naver.com/main/read.naver'))
              .slice(0, 5)
          );
          if (aTagList.length > 0) break;
        } catch (e) { continue; }
      }

      if (aTagList.length === 0) {
        console.log(`  ❌ ${categoryInfo.name}: 링크를 찾을 수 없습니다.`);
        continue;
      }

      // 중복 제거
      aTagList = [...new Set(aTagList)];
      console.log(`  📄 ${aTagList.length}개 뉴스 발견`);

      let successCount = 0;
      for (let i = 0; i < aTagList.length; i++) {
        const link = aTagList[i];
        console.log(`    처리중 (${i+1}/${aTagList.length})`);

        const newsDetails = await extractNewsDetails(page, link);
        if (!newsDetails) continue;

        const { title, content, image_url, published_at } = newsDetails;

        // 환경 뉴스 분류
        let finalTopicId = categoryInfo.id;
        if (categoryInfo.section === '102' && isEnvironmentNews(title, content)) {
          finalTopicId = 8;
        }

        newsArray.push({ 
          topic_id: finalTopicId,
          title: title.substring(0, 200),
          content: content.substring(0, 2000),
          journal: link,
          image_url,
          published_at
        });

        successCount++;
        console.log(`    ✅ ${title.substring(0, 40)}...`);
        await page.waitForTimeout(2000);
      }
      
      console.log(`  📊 ${categoryInfo.name}: ${successCount}개 수집 완료`);
      
    } catch (error) {
      console.log(`  ❌ ${categoryInfo.name} 오류:`, error.message);
    }
  }

  await browser.close();
  return newsArray;
}

// DB 저장 함수
async function saveToDatabase(newsArray) {
  if (newsArray.length === 0) {
    console.log('💾 저장할 뉴스가 없습니다.');
    return;
  }

  console.log(`\n💾 ${newsArray.length}개 뉴스를 데이터베이스에 저장 중...`);

  try {
    // 중복 확인 (제목과 URL 기준)
    const titles = newsArray.map(n => n.title);
    const journals = newsArray.map(n => n.journal);
    
    const { data: existingNews } = await supabase
      .from('news')
      .select('title, journal')
      .or(`title.in.(${titles.map(t => `"${t.replace(/"/g, '\\"')}"`).join(',')}),journal.in.(${journals.map(j => `"${j}"`).join(',')})`);

    const existingTitles = new Set(existingNews?.map(n => n.title) || []);
    const existingJournals = new Set(existingNews?.map(n => n.journal) || []);
    
    const newNews = newsArray.filter(news => 
      !existingTitles.has(news.title) && !existingJournals.has(news.journal)
    );
    
    if (newNews.length === 0) {
      console.log('ℹ️  모든 뉴스가 이미 존재합니다.');
      return { saved: 0, duplicates: newsArray.length };
    }

    console.log(`📝 새로운 뉴스 ${newNews.length}개 발견 (중복 제외: ${newsArray.length - newNews.length}개)`);

    // 배치 처리로 저장
    const batchSize = 5;
    let savedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < newNews.length; i += batchSize) {
      const batch = newNews.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('news')
        .insert(batch);
      
      if (error) {
        console.error(`  ❌ 배치 저장 오류:`, error.message);
        errorCount += batch.length;
      } else {
        savedCount += batch.length;
        console.log(`  ✅ 배치 ${Math.floor(i/batchSize) + 1}: ${batch.length}개 저장`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      saved: savedCount,
      failed: errorCount,
      duplicates: newsArray.length - newNews.length
    };

  } catch (error) {
    console.error('❌ 데이터베이스 저장 오류:', error);
    throw error;
  }
}

// 메인 실행 함수
async function updateNews() {
  const startTime = new Date();
  console.log(`🚀 뉴스 업데이트 시작 - ${startTime.toLocaleString('ko-KR')}`);

  try {
    // 1. 뉴스 크롤링
    const newsArray = await crawlNews();
    
    if (newsArray.length === 0) {
      console.log('❌ 크롤링된 뉴스가 없습니다.');
      return;
    }

    // 2. JSON 파일로 백업 저장
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backupFile = `news_backup_${timestamp}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(newsArray, null, 2), 'utf8');
    console.log(`📦 백업 저장: ${backupFile}`);

    // 3. 데이터베이스 저장
    const result = await saveToDatabase(newsArray);
    
    // 4. 결과 출력
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 뉴스 업데이트 완료!');
    console.log(`⏱️  소요 시간: ${duration}초`);
    console.log(`📊 결과:`);
    console.log(`  • 수집: ${newsArray.length}개`);
    if (result) {
      console.log(`  • 저장: ${result.saved}개`);
      console.log(`  • 실패: ${result.failed}개`);
      console.log(`  • 중복: ${result.duplicates}개`);
    }

    // 5. 카테고리별 통계
    const categoryStats = {};
    newsArray.forEach(news => {
      categoryStats[news.topic_id] = (categoryStats[news.topic_id] || 0) + 1;
    });

    console.log('\n📈 카테고리별 수집 현황:');
    const categoryNames = { 1: '정치', 2: '경제', 3: '사회', 4: '생활/문화', 5: 'IT/과학', 6: '스포츠', 7: '국제', 8: '환경' };
    Object.entries(categoryStats).forEach(([topicId, count]) => {
      console.log(`  • ${categoryNames[topicId]}: ${count}개`);
    });

  } catch (error) {
    console.error('❌ 뉴스 업데이트 실패:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (import.meta.url === `file://${process.argv[1]}`) {
  updateNews();
}

export default updateNews;