// scripts/convertJsonToDb.js
// JSON 파일의 뉴스 데이터를 Supabase에 저장

import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
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
  console.error(' Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ 설정됨' : '❌ 없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 카테고리 매핑 (기존 데이터와 일치하도록)
const categoryMapping = {
  '100': 1, // 정치
  '101': 2, // 경제
  '102': 3, // 사회
  '103': 4, // 생활/문화
  '104': 7, // 국제
  '105': 5, // IT/과학
  '107': 6, // 스포츠
  '108': 8, // 환경
};

// JSON 데이터 변환 함수
function transformNewsData(jsonData) {
  return jsonData.map(item => {
    // category_id를 topic_id로 변환
    const topicId = categoryMapping[item.category_id] || 3; // 기본값: 사회

    return {
      topic_id: topicId,
      title: item.title ? item.title.substring(0, 200) : '제목 없음', // 길이 제한
      content: item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 2000) : '', // HTML 태그 제거 및 길이 제한
      journal: item.link || '', // link를 journal로 매핑
      image_url: item.image_url || null,
      published_at: new Date().toISOString() // 현재 시간 또는 파싱된 날짜
    };
  });
}

// 중복 체크 함수
async function checkDuplicates(newsArray) {
  const titles = newsArray.map(news => news.title);
  
  const { data: existingNews, error } = await supabase
    .from('news')
    .select('title')
    .in('title', titles);

  if (error) {
    console.error(' 중복 체크 오류:', error);
    return [];
  }

  const existingTitles = new Set(existingNews?.map(news => news.title) || []);
  return newsArray.filter(news => !existingTitles.has(news.title));
}

// 배치 삽입 함수
async function insertNewsBatch(newsArray, batchSize = 10) {
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < newsArray.length; i += batchSize) {
    const batch = newsArray.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('news')
        .insert(batch);

      if (error) {
        console.error(` 배치 ${Math.floor(i/batchSize) + 1} 삽입 오류:`, error);
        totalErrors += batch.length;
      } else {
        totalInserted += batch.length;
        console.log(` 배치 ${Math.floor(i/batchSize) + 1}: ${batch.length}개 삽입 완료`);
      }

      // API 제한을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error(` 배치 ${Math.floor(i/batchSize) + 1} 처리 중 오류:`, err);
      totalErrors += batch.length;
    }
  }

  return { totalInserted, totalErrors };
}

// 메인 함수
async function convertJsonToDb() {
  try {
    console.log(' JSON 데이터를 데이터베이스로 변환 시작...\n');

    // JSON 파일 경로 찾기
    const possibleFiles = [
      'news_data.json',
      'scripts/news_data.json',
      '../news_data.json'
    ];

    let jsonData = null;
    let usedFile = null;

    for (const filePath of possibleFiles) {
      try {
        const fullPath = path.resolve(__dirname, filePath);
        if (fs.existsSync(fullPath)) {
          const fileContent = fs.readFileSync(fullPath, 'utf8');
          jsonData = JSON.parse(fileContent);
          usedFile = filePath;
          console.log(` JSON 파일 발견: ${filePath}`);
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!jsonData) {
      console.error(' news_data.json 파일을 찾을 수 없습니다.');
      console.log('다음 위치들을 확인했습니다:');
      possibleFiles.forEach(file => console.log(`  - ${file}`));
      process.exit(1);
    }

    console.log(` 총 ${jsonData.length}개의 뉴스 데이터 발견`);

    // 데이터 변환
    console.log(' 데이터 변환 중...');
    const transformedData = transformNewsData(jsonData);
    
    // 카테고리별 통계
    const categoryStats = {};
    transformedData.forEach(item => {
      categoryStats[item.topic_id] = (categoryStats[item.topic_id] || 0) + 1;
    });

    console.log('\n 카테고리별 분포:');
    const categoryNames = { 1: '정치', 2: '경제', 3: '사회', 4: '생활/문화', 5: 'IT/과학', 6: '스포츠', 7: '국제', 8: '환경' };
    Object.entries(categoryStats).forEach(([topicId, count]) => {
      console.log(`  ${categoryNames[topicId] || '기타'}: ${count}개`);
    });

    // 중복 체크
    console.log('\n 중복 뉴스 확인 중...');
    const uniqueNews = await checkDuplicates(transformedData);
    
    if (uniqueNews.length === 0) {
      console.log(' 모든 뉴스가 이미 데이터베이스에 존재합니다.');
      return;
    }

    console.log(` 새로운 뉴스 ${uniqueNews.length}개 발견 (중복 제외: ${transformedData.length - uniqueNews.length}개)`);

    // 데이터베이스 삽입
    console.log('\n 데이터베이스 삽입 중...');
    const { totalInserted, totalErrors } = await insertNewsBatch(uniqueNews);

    // 결과 출력
    console.log('\n 변환 완료!');
    console.log(` 성공: ${totalInserted}개`);
    console.log(` 실패: ${totalErrors}개`);
    console.log(` 원본 파일: ${usedFile}`);

    if (totalInserted > 0) {
      console.log('\n 이제 웹사이트에서 뉴스를 확인할 수 있습니다!');
    }

  } catch (error) {
    console.error(' 변환 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 실행
convertJsonToDb();