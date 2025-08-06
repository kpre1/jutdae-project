const puppeteer = require('puppeteer');

const naverNewsUrl = 'https://news.naver.com/section/100';

// 뉴스 내용을 저장하기 위한 배열
const newsArray = [];

// a태그 요소
const aTagElement = 'body > div > div#ct_wrap > div.ct_scroll_wrapper > div#newsct > div > div > ul > li > div > div > div.sa_text > a';


(async () => {
  const brower = await puppeteer.launch({ headless: true });
  const page = await brower.newPage();

  // 1. 섹션 페이지로 이동
  await page.goto(naverNewsUrl, { waitUntil: 'networkidle2' });
  await page.screenshot({
    fullPage: true,
    path: 'page-test.jpeg',
  });

  // 2. 헤드라인 별 링크 저장
  const aTagList = await page.$$eval(
    aTagElement,
    ele => ele.map(e => e.href),
  );
  console.log(aTagList);

   // 3. 뉴스별 제목, 내용 저장
  for (const link of aTagList) {
    await page.goto(link, { waitUntil: 'networkidle2' });
    const title = await page.$eval(
      '#title_area > span',
      el => el.innerText,
    );
    const content = await page.$eval(
      '#dic_area',
      el => el.innerText,
    );
    newsArray.push({ title, content, link });
  }
  console.log(newsArray);
  

  
})();