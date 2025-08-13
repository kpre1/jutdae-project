import puppeteer from 'puppeteer';
import OpenAI from 'openai';
import fs from 'fs';

const openAi = new OpenAI({
  apiKey: '096680030c944e31a39f13112ff7739c',
});

// 카테고리별 URL과 이름 매핑
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

  // 각 카테고리별로 뉴스 크롤링
  for (const [categoryId, categoryName] of Object.entries(categories)) {
    console.log(`\n=== ${categoryName} 뉴스 크롤링 시작 ===`);
    
    const naverNewsUrl = `https://news.naver.com/section/${categoryId}`;
    
    try {
      // 1. 해당 카테고리 페이지로 이동
      await page.goto(naverNewsUrl, { waitUntil: 'networkidle2' });
      
      // 2. 헤드라인 링크 수집
      const aTagList = await page.$$eval(
        aTagElement,
        ele => ele.map(e => e.href)
      );
      
      console.log(`${categoryName}: ${aTagList.length}개 뉴스 발견`);
      
      // 3. 각 뉴스 상세 정보 수집 (최대 3개만)
      for (let i = 0; i < Math.min(aTagList.length, 3); i++) {
        const link = aTagList[i];
        
        try {
          await page.goto(link, { waitUntil: 'networkidle2' });
          
          const title = await page.$eval(
            '#title_area > span',
            el => el.innerText
          );
          
          const content = await page.$eval(
            '#dic_area',
            el => el.innerText
          );
          
          // 카테고리 정보와 함께 저장
          newsArray.push({ 
            category_id: categoryId,
            category_name: categoryName,
            title, 
            content, 
            link 
          });
          
          console.log(`✓ ${categoryName} - ${title.substring(0, 30)}...`);
          
        } catch (error) {
          console.log(`개별 뉴스 크롤링 실패: ${link}`);
        }
        
        // 요청 간격 조절 (너무 빠르면 차단될 수 있음)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(` ${categoryName} 카테고리 크롤링 실패:`, error.message);
    }
  }
  
  await browser.close();
  
  console.log(`\n총 ${newsArray.length}개 뉴스 수집 완료`);
  console.log(newsArray);
  
  // 4. ChatGPT로 요약
  if (newsArray.length > 0) {
    try {
      const response = await openAi.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '카테고리별 뉴스 데이터를 받았습니다. category_name, title, content, link가 포함된 객체들의 배열입니다.' },
          { role: 'system', content: '각 뉴스를 카테고리별로 정리하여 markdown 형식으로 요약해주세요.' },
          { role: 'system', content: '형식: ## 카테고리명\n### 뉴스제목\n- 요약내용\n- [원문링크](링크)\n- 키워드: 태그1, 태그2\n' },
          { role: 'user', content: JSON.stringify(newsArray) }
        ],
        temperature: 0.4,
      });
      
      // 5. 파일 저장
      const summary = response.choices[0].message.content;
      fs.writeFileSync('category_news_summary.md', summary, 'utf8');
      console.log('\n📄 요약 파일 생성 완료: category_news_summary.md');
      
    } catch (error) {
      console.log(' OpenAI API 오류:', error.message);
      
      // API 실패해도 원본 데이터는 저장
      fs.writeFileSync('news_data.json', JSON.stringify(newsArray, null, 2), 'utf8');
      console.log(' 원본 데이터 저장 완료: news_data.json');
    }
  }
})();