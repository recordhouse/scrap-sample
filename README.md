이번에는 Puppeteer를 활용하여 웹 크롤러를 만들어 보겠다. 클라이언트는 React, 서버는 Express를 사용하고 로컬에서 작업이 끝나면 Heroku에 배포까지 해보자. 결과물과 소스는 아래에서 확인할 수 있다.

* 결과물: [https://recordboy-scrap-sample.herokuapp.com](https://recordboy-scrap-sample.herokuapp.com/)
* 소스: [https://github.com/recordboy/scrap-sample](https://github.com/recordboy/scrap-sample)

> 결과물은 헤로쿠에 배포되었기 때문에 처음 페이지가 열릴때 로딩시간이 10초에서 30초정도 걸릴수 있다.

# Puppeteer
Puppeteer는 Google Chrome 개발팀에서 직접 개발한 Chrome(혹은 Chromium) 렌더링 엔진을 이용하는 node.js 라이브러리이다. Puppeteer는 headless 모드를 지원하며, 이는 브라우저를 띄우지 않고 렌더링 작업을 가상으로 진행하고 실제 브라우저와 동일하게 동작한다. Puppeteer는 다양한 기능을 가지고 있으며 아래와 같은 기능들이 있다.

* 웹페이지의 스크린샷과 PDF를 생성한다.
* SPA(단일 페이지)를 크롤링하고 미리 렌더링된 콘텐츠(예: SSR)를 생성한다.
* 폼 입력, UI 테스트, 키보드 입력 등을 자동화 할 수 있다.
* 최신 자바스크립트 및 브라우저 기능을 이용해 최신버전의 크롬에서 직접 테스트할 수 있다.
* 사이트의 Timeline Trace를 기록하여 성능이나 문제를 진단할 수 있다.
* 크롬 확장 프로그램을 테스트 할 수 있다.

# 프로젝트 초기화
이 부분은 [[Express] Express + React 연동 및 Heroku에 배포하기](https://recordboy.github.io/2020/11/05/express-react-heroku-init/) 포스팅과 비슷한 부분이 많기 때문에 각 단계의 추가 설명 없이 진행하도록 하겠다.

## 디렉토리 생성 및 필요 모듈 설치

디렉토리를 생성하고 이그노 파일을 생성한 뒤 npm 초기화 및 필요한 모듈을 설치한다.

```
$ mkdir my-app
$ cd my-app 
$ echo node_modules > .gitignore
$ npm init -y
$ npm install express nodemon concurrently
```

이제 서버로 사용할 `index.js` 파일을 생성하고 아래 내용을 입력한다.

```javascript
// express 모듈 불러오기
const express = require("express");

// express 객체 생성
const app = express();

// 기본 포트를 app 객체에 설정
const port = process.env.PORT || 5000;
app.listen(port);

// 미들웨어 함수를 특정 경로에 등록
app.use("/api/data", function (req, res) {
  res.json({ greeting: "Hello World" });
});

console.log(`server running at http ${port}`);
```

`package.json` 파일을 열고 `scripts` 항목에 `"start": "nodemon index.js"`를 추가한다.

```json
"scripts": {
  "start": "nodemon index.js"
}
```

## 리액트 초기화
이제 클라이언트로 사용할 리액트를 생성하며, 이름은 `client`로 한다.

```
$ create-react-app client --use-npm --template typescript
```

## 프록시 설정
설치가 완료되면 `client` 디렉토리로 이동해서에 아래 모듈을 설치한다.

```
$ cd client
$ npm install http-proxy-middleware
```

설치한 뒤 `/client/src/` 디렉토리로 가서 `setupProxy.js` 파일을 생성하고 아래 코드를 입력해준다.

```javascript
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    createProxyMiddleware("/api/data", {
      target: "http://localhost:5000",
      changeOrigin: true,
    })
  );
};
```

## 서버(express), 클라이언트(react) 동시 시작 설정
루트로 가서 `package.json`의 `scripts`항목을 아래처럼 수정해준다.

```json
"scripts": {
  "start": "nodemon index.js",
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "npm start",
  "dev:client": "cd client && npm start"
}
```

이제 아래 명령어로 서버와 클라이언트를 동시에 시작할 수 있다.

```
$ npm run dev
```

이제 작업하기 위한 전반적인 준비가 끝났다. 우선 클라이언트 영역부터 작업해보자.

# 클라이언트에서 요청 작업
## 검색 폼 및 리스트 추가

`/client/src/` 디렉토리에 `components` 폴더를 생성하고 `SearchForm.tsx`, `SearchList.tsx` 파일을 생성하고 각각 아래처럼 입력해 준다.

**SearchForm.tsx**
```javascript
import React from "react";

const SearchForm = () => {
  return (
    <div className="form">
      <input type="text" className="form-text" />
      <button
        type="button"
        className="form-btn"
        onClick={() => {
          fetch("api/data")
            .then((res) => {
              return res.json();
            })
            .then((data) => {
              console.log(data);
            });
        }}
      >
        search
      </button>
    </div>
  );
};

export default SearchForm;
```

**SearchList.tsx**
```javascript
import React from "react";

const SearchList = () => {
  return (
    <div className="card-list"></div>
  );
};

export default SearchList;
```

`App.tsx`은 아래처럼 변경해준다.

```javascript
import React from "react";
import SearchForm from "./components/SearchForm";
import SearchList from "./components/SearchList";

function App() {
  return (
    <div className="App">
      <SearchForm />
      <SearchList />
    </div>
  );
}

export default App;
```

`search` 버튼을 클릭하면 `fetch` 함수로 서버(`http://localhost:5000/api/data`)에 요청을 하게 되고 응답값으로 콘솔창에 `{ greeting: "Hello World" }`가 출력되는 것을 확인할 수 있다.

## fetch 함수를 App 컴포넌트로 이동
이제 검색키워드를 서버에 보내기 위헤 `SearchForm`, `App` 컴포넌트를 아래처럼 수정해 준다.

**SearchForm.tsx**
```javascript
import React, { useState } from "react";

const SearchForm = (props: { getData: any }) => {
  const { getData } = props;
  const [keyword, setKeyword] = useState("");
  return (
    <div className="form">
      <input
        type="text"
        className="form-text"
        onChange={(e: any) => {
          setKeyword(e.target.value);
        }}
        onKeyPress={(e: any) => {
          if (e.charCode === 13) {
            if (keyword) {
              getData(keyword);
            }
          }
        }}
      />
      <button
        type="button"
        className="form-btn"
        onClick={() => {
          if (keyword) {
            getData(keyword);
          }
        }}
      >
        search
      </button>
    </div>
  );
};

export default SearchForm;
```

**App.tsx**
```javascript
import React from "react";
import SearchForm from "./components/SearchForm";
import SearchList from "./components/SearchList";

function App() {
  const getData = (keyword: string) => {
    console.log("검색 키워드: " + keyword);
    fetch(`api/data?keyword=${keyword}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        console.log(data);
      });
  };
  return (
    <div className="App">
      <SearchForm getData={getData} />
      <SearchList />
    </div>
  );
}

export default App;
```

`SearchForm`에 있던 `fetch`함수를 상위 `App`컴포넌트의 `getData` 함수에 넣어놨다. 이 함수를 `SearchForm`에 전달하였고, 검색버튼을 클릭하면 `getData`가 실행되며, `input` 태그의 검색 키워드가 쿼리스트링에 할당되어 서버에 전달되게 된다. 검색폼에서 엔터를 눌러도 요청할 수 있도록 `onKeyPress` 이벤트도 추가해 주자. 이제 응답값을 받기 위해 서버 작업을 해보자. 

# 서버에서 요청 받기
이제 루트로 가서 `index.js`를 아래처럼 수정해 준다.

```javascript
// express 모듈 불러오기
const express = require("express");

// express 객체 생성
const app = express();

// 기본 포트를 app 객체에 설정
const port = process.env.PORT || 5000;
app.listen(port);

// 미들웨어 함수를 특정 경로에 등록
app.use("/api/data", function (req, res) {
  console.log("검색 키워드: " + req.query.keyword);
  res.json({ greeting: "Hello World" });
});

console.log(`server running at http ${port}`);
```

요청을 하면 서버 터미널에 검색 키워드가 출력될 것이다. 위 코드를 보면 미들웨어 함수에서 요청값(`req.query.keyword`)을 받기 때문이다.

# Puppeteer 설치
이제 브라우저로 검색하기 위해 루트 디렉토리에 Puppeteer를 설치해주자.

```
$ npm install puppeteer
```

> * Puppeteer는 기본적으로 Chrome 혹은 Chromium 런더링 엔진을 사용하기 때문에 기본적으로  Chromium 브라우저를 내장하고 있다.
> * 따로 Chromium 브라우저를 다운받지 않으려면 `$ npm install puppeteer-core` 명령어를 사용하면 되며, Puppeteer는 로컬에 있는 Chrome 혹은 Chromium을 사용하게 될 것이다.

# 검색해보기
Puppeteer를 설치했으면 이제 브라우저를 실행해 검색을 해보자. `index.js`를 아래처럼 수정해준다.
```javascript
// express 모듈 불러오기
const express = require("express");

// express 객체 생성
const app = express();

// 기본 포트를 app 객체에 설정
const port = process.env.PORT || 5000;
app.listen(port);

// 미들웨어 함수를 특정 경로에 등록
app.use("/api/data", function (req, res) {
  console.log("검색 키워드: " + req.query.keyword);
  openBrowser(req.query.keyword);
});

console.log(`server running at http ${port}`);

// puppeteer 모듈 불러오기
const puppeteer = require("puppeteer");

/**
 * 브라우저 오픈 함수
 * @param {string} keyword 검색 키워드
 */
async function openBrowser(keyword) {

  // 브라우저 실행 및 옵션, 현재 옵션은 headless 모드 사용 여부
  const browser = await puppeteer.launch({ headless: false });

  // 브라우저 열기
  const page = await browser.newPage();

  // 포탈로 이동
  await page.goto("https://www.google.com/");

  // 키워드 입력
  await page.type("input[class='gLFyf gsfi']", keyword);
  
  // 키워드 검색
  await page.type("input[class='gLFyf gsfi']", String.fromCharCode(13));
}
```

`puppeteer` 모듈을 불러온 뒤 `openBrowser` 함수를 추가하였으며, 포탈 이동 및 응답값을 받기 위해 `async` 함수로 감싸주었다. 브라우저 실행 옵션에서 `headless` 모드를 `true`로 설정하면 브라우저가 화면에 노출이 되지 않고 백그라운드에서 작동된다. 지금은 브라우저 작동 순서를 보기 위해 임시로 `false`로 설정해 준다. 위처럼 수정해 준 뒤 클라이언트 화면으로 가서 검색해 보면 아래 순서대로 작동된다.

1. Chromium 브라우저가 실행되고
2. Google 사이트로 이동한 뒤
3. Google 검색창에 검색 키워드를 넣고
4. 엔터를 눌러 검색을 시작한다.

# 검색 내용 크롤링하기
이제 검색결과를 크롤링을 해보자.

## 크롤링할 내용 형태

```json
{
  title: "제목",
  link: "링크",
  text: "내용",
  kategorie: "카테고리"
}
```

크롤링으로 가져올 정보는 위 형태로 가져올 것이며, `index.js`를 아래처럼 코드를 수정한다.

```javascript
// express 모듈 불러오기
const express = require("express");

// express 객체 생성
const app = express();

// 기본 포트를 app 객체에 설정
const port = process.env.PORT || 5000;
app.listen(port);

// 미들웨어 함수를 특정 경로에 등록
app.use("/api/data", async function (req, res) {
  console.log("검색 키워드: " + req.query.keyword);
  const resultList = await openBrowser(req.query.keyword);
  console.log(resultList);
  res.json(resultList);
});

console.log(`server running at http ${port}`);

// puppeteer 모듈 불러오기
const puppeteer = require("puppeteer");

/**
 * 브라우저 오픈 함수
 * @param {string} keyword 검색 키워드
 * @return {array} 검색 결과
 */
async function openBrowser(keyword) {
  // 브라우저 실행 및 옵션, 현재 옵션은 headless 모드 사용 여부
  const browser = await puppeteer.launch({ headless: true });

  // 브라우저 열기
  const page = await browser.newPage();

  // 포탈로 이동
  await page.goto("https://www.google.com/");

  // 키워드 입력
  await page.type("input[class='gLFyf gsfi']", keyword);

  // 키워드 검색
  await page.type("input[class='gLFyf gsfi']", String.fromCharCode(13));

  // 예외 처리
  try {
    // 해당 콘텐츠가 로드될 때까지 대기
    await page.waitForSelector("#rso div.g", { timeout: 10000 });
  } catch (error) {
    // 해당 태그가 없을 시 검색결과 없음 반환
    console.log("에러 발생: " + error);
    return [
      {
        title: "검색결과 없음",
        link: "",
        text: "",
        kategorie: "",
      },
    ];
  }

  // 호출된 브라우저 영역
  const searchData = await page.evaluate(() => {
    // 검색된 돔 요소를 배열에 담음
    const contentsList = Array.from(document.querySelectorAll("#rso div.g"));
    let contentsObjList = [];

    // 검색결과 크롤링
    contentsList.forEach((item) => {
      if (item.className === "g") {
        const title = item.querySelector("h3");
        const link = item.querySelector(".yuRUbf");
        const text = item.querySelector(".aCOpRe");
        const kategorie = item.querySelector(".iUh30 ");

        if (title && link && text && kategorie) {
          contentsObjList.push({
            title: title.textContent, // 타이틀
            link: link.children[0].href, // 링크
            text: text.textContent, // 내용
            kategorie: kategorie.textContent, // 카테고리
          });
        }
      }
    });

    // 호출된 브라우저 영역 콘솔창에서 확인할 수 있음
    console.log(contentsList); // 검색한 엘리먼트 리스트
    console.log(contentsObjList); // 검색한 콘텐츠 오브젝트 리스트

    return contentsObjList;
  });

  // 브라우저 닫기
  browser.close();

  // 검색결과 반환
  return searchData;
}
```

## 요소 대기
`headless` 모드는 이제 `true`로 설정해준다. 브라우저가 크롤링하는 모습을 직접 확인하고 싶으면 `false`로 그냥 두면 된다. 이제 순서대로 코드를 살펴보자. `page.waitForSelector` 메서드를 추가했으며, 인자로 쿼리 셀렉터와 옵션이 들어간다. 이 메서드는 셀렉터 요소가 로드될 때 까지 대기하며, `timeout`로 대기 시간을 설정할 수 있다. 대기시간이 끝나도 해당 요소를 로드하지 못하면 에러를 뱉어내며, 이 경우 `title`에 검색결과가 없다는 값을 리턴해 준다.

## 브라우저 영역
`page.evaluate` 메서드는 Puppeteer로 호출한 브라우저에서 실행되는 함수로써 여기다가 크롤링 코드를 작성하면 된다. 구글 검색결과의 각 엘리먼트 셀렉터는 `#rso div.g`이며, 해당 요소들을 `Array.from` 메서드를 통해 배열로 담았다. 필요한 정보만 가져오기 위해 `forEach`을 돌려 오브젝트에 내용을 담고 리턴해 준 다음 브라우저는 종료가 된다.

## 검색결과를 응답해주기
이제 이 응답값을 미들웨어 함수에서 받아서 클라이언트의 응답값으로 보내줘야한다. 위 코드의 미들웨어 함수를 보면 콜백함수를 `async`로 감싸고 결과값을 `await` 키워드로 받아 응답값으로 보내주고 있다. 클라이언트의 콘솔창을 보면 크롤링한 리스트를 출력하는걸 확인할 수 있다.

# 연속 검색
지금까지 구현된건 첫 페이지만 크롤링한 것이며, 다음 페이지를 추가로 크롤링을 하려면 아래 순서가 필요하다.

1. 검색결과 맨아래 다음버튼이 있는지 찾기
2. 다음 버튼 있는 경우 다음 페이지로 이동
3. 다음 페이지 내용이 불러올때까지 대기
4. 다음 페이지 크롤링

아래처럼 코드를 수정한다.

```javascript
// express 모듈 불러오기
const express = require("express");

// express 객체 생성
const app = express();

// 기본 포트를 app 객체에 설정
const port = process.env.PORT || 5000;
app.listen(port);

// 미들웨어 함수를 특정 경로에 등록
app.use("/api/data", async function (req, res) {
  console.log("검색 키워드: " + req.query.keyword);
  const resultList = await openBrowser(req.query.keyword);
  console.log(resultList);
  res.json(resultList);
});

console.log(`server running at http ${port}`);

// puppeteer 모듈 불러오기
const puppeteer = require("puppeteer");

/**
 * 브라우저 오픈 함수
 * @param {string} keyword 검색 키워드
 * @return {array} 검색 결과
 */
async function openBrowser(keyword) {
  // 모든 검색결과
  let searchAllData = [];

  // 브라우저 실행 및 옵션, 현재 옵션은 headless 모드 사용 여부
  const browser = await puppeteer.launch({ headless: true });

  // 브라우저 열기
  const page = await browser.newPage();

  // 포탈로 이동
  await page.goto("https://www.google.com/");

  // 키워드 입력
  await page.type("input[class='gLFyf gsfi']", keyword);

  // 키워드 검색
  await page.type("input[class='gLFyf gsfi']", String.fromCharCode(13));

  // 검색하고 싶은 페이지 수 만큼 반복
  for (let i = 0; i < 10; i++) {
    // 처음 검색
    if (i === 0) {
      // 예외 처리
      try {
        // 해당 콘텐츠가 로드될 때까지 대기
        await page.waitForSelector("#rso div.g", { timeout: 10000 });

        // 크롤링해서 검색 결과들을 담음
        searchAllData.push(...(await crawlingData()));
      } catch (error) {
        // 해당 태그가 없을 시 검색결과 없음 반환
        console.log("에러 발생: " + error);
        return [
          {
            title: "검색결과 없음",
            link: "",
            text: "",
            kategorie: "",
          },
        ];
      }

    // 처음 이후 검색
    } else {
      // 예외 처리
      try {
        // 다음 버튼이 로드될때까지 대기
        await page.waitForSelector("#pnnext", { timeout: 10000 });

        // 브라우저를 호출해 다음 버튼을 클릭
        await page.evaluate(() => {
          const nextBtn = document.querySelector("#pnnext");
          if (nextBtn) {
            nextBtn.click();
          }
        });

        // 크롤링해서 검색 결과들을 담음
        searchAllData.push(...(await crawlingData()));

        // 다음 버튼이 더이상 없는 경우 지금까지 크롤링한 모든 검색결과 반환
      } catch (error) {
        return searchAllData;
      }
    }
  }

  /**
   * 크롤링 함수
   * @return {array} 검색 결과
   */
  async function crawlingData() {
    // 해당 콘텐츠가 로드될 때까지 대기
    await page.waitForSelector("#rso div.g", { timeout: 10000 });

    // 호출된 브라우저 영역
    const searchData = await page.evaluate(() => {
      // 검색된 돔 요소를 배열에 담음
      const contentsList = Array.from(document.querySelectorAll("#rso div.g"));
      let contentsObjList = [];

      // 검색결과 크롤링
      contentsList.forEach((item) => {
        if (item.className === "g") {
          const title = item.querySelector("h3");
          const link = item.querySelector(".yuRUbf");
          const text = item.querySelector(".aCOpRe");
          const kategorie = item.querySelector(".iUh30 ");

          if (title && link && text && kategorie) {
            contentsObjList.push({
              title: title.textContent, // 타이틀
              link: link.children[0].href, // 링크
              text: text.textContent, // 내용
              kategorie: kategorie.textContent, // 카테고리
            });
          }
        }
      });

      // 호출된 브라우저 영역 콘솔창에서 확인할 수 있음
      console.log(contentsList); // 검색한 엘리먼트 리스트
      console.log(contentsObjList); // 검색한 콘텐츠 오브젝트 리스트

      return contentsObjList;
    });

    // 검색결과 반환
    return searchData;
  }

  // 브라우저 닫기
  browser.close();

  // 모든 검색결과 반환
  return searchAllData;
}
```

이제 추가된 코드들을 살펴보자.

## 모든 검색결과를 담을 배열 설정
31라인을 보면 `searchAllData` 배열을 추가하였으며, 이 배열안에 각 페이지마다 크롤링한 데이터가 들어간다.

## 브라우저 호출하는 영역을 함수로 묶음
각 페이지마다 크롤링을 반복해줘야되기 때문에 101번째 라인을 보면 `crawlingData` 함수로 따로 묶어줬다. 그리고 리턴값은 `searchData`로 해주며, 기존 코드의 예외 처리(`try`)안에 있던 `page.waitForSelector` 메서드만 함수 상단에 추가해 준다. 대략적인 형태는 아래와 같다.

```javascript
/**
 * 크롤링 함수
 * @return {array} 검색 결과
 */
async function crawlingData() {

  // 해당 콘텐츠가 로드될 때까지 대기
  await page.waitForSelector("#rso div.g", { timeout: 10000 });

  // 호출된 브라우저 영역
  const searchData = await page.evaluate(() => {

    // ... 기존 크롤링 코드

    return contentsObjList;
  }

  // 검색결과 반환
  return searchData;
}
```

## 처음 검색 후 다음 페이지로 이동하여 검색
코드 49번 라인을 보면 반복문이 실행되며, 검색하고 싶은 페이지만큼 반복되도록 되어있다. 위 코드는 10번만 반복하게 했으며, 반복 횟수를 늘리면 더 많은 페이지를 크롤링할 수 있다. 각 예외 처리는 2개 분기로 되어있으며, 이유는 계속 페이지마다 검색을 하는 경우 결과가 여러가지 있기 때문이다.

### 검색 결과의 경우들
1. 처음 검색에 아무 검색결과가 없는 경우
2. 처음 검색과는 있는데 다음 버튼이 없어서 검색결과가 첫 페이지만 있는 경우
3. 다음 페이지가 존재해 계속 검색을 진행하다 마지막 페이지에 도달해서 다음 버튼이 없는 경우

처음 검색은 51라인부터 시작되며 검색결과가 없다면 59라인에서 에러를 캐치하며 클라이언트에 `검색결과 없음`을 리턴해 준다. 검색 결과가 있으면 두번째 반복이 73라인에서 실행되며, 다음 버튼이 있는 경우 83라인 함수에서 다음버튼을 클릭하고 `crawlingData` 함수가 실행되어 크롤링을 계속 반복하게 된다. 크롤링 결과값은 `searchAllData` 배열에 전개연산자를 활용하여 차곡차곡 쌓이도록 해준다. 이렇게 계속 다음 페이지로 이동하고 더이상 다음버튼이 없으면 91라인에서 에러를 캐치하여 지금까지 모은 `searchAllData`를 리턴하게 된다. `headless` 모드를 `false`로 설정하면 브라우저가 각 페이지를 돌면서 크롤링을 하는 모습을 직접 볼 수 있다.

## 결과 확인
서버 터미널이나 클라이언트 콘솔창을 확인하면 각 페이지마다 크롤링한 데이터를 정상적으로 응답해주는것을 확인할 수 있다. 지금까지 클라이언트, 서버 셋팅 및 연속 크롤링하는 것까지 알아봤으며 이제 이 응답값을 클라이언트에 뿌려주는 작업을 해보자.

# 클라이언트에서 받은 데이터 출력하기
## 출력될 컴포넌트 추가
데이터가 들어갈 영역을 만들어주자. 우선 `/client/src/components` 디렉토리에 `SearchItem.tsx` 파일을 생성하고 아래 코드를 입력해준다.

```javascript
import React from "react";

const SearchItem = (props: { item: any }) => {
  const { item } = props;
  return (
    <div className="card">
      <div className="top">
        <div className="kategorie">{item.kategorie}</div>
        <div className="title">{item.title}</div>
      </div>
      <div className="bottom">
        <div className="text">{item.text}</div>
        <a href={item.link} className="link" target="_blank" rel="noreferrer">
          더보기
        </a>
      </div>
    </div>
  );
};

export default SearchItem;
```

## 컴포넌트에 데이터 전달하기
`SearchList.tsx` 파일과 `App.tsx` 파일도 각각 아래처럼 수정해준다.

**SearchList.tsx**
```javascript
import React from "react";
import SearchItem from "./SearchItem";

const SearchList = (props: { searchData: [] }) => {
  const { searchData } = props;

  return (
    <div className="card-list">
      {searchData.map((item: any, idx: number): JSX.Element => {
        return <SearchItem key={idx} item={item} />;
      })}
    </div>
  );
};

export default SearchList;
```

**App.tsx**
```javascript
import React, { useState } from "react";
import SearchForm from "./components/SearchForm";
import SearchList from "./components/SearchList";
import "./App.css";

function App() {
  const [searchData, setSearchData] = useState<any>([]);
  const getData = (keyword: string) => {
    console.log("검색 키워드: " + keyword);
    fetch(`api/data?keyword=${keyword}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setSearchData(data);
        console.log(data);
      });
  };
  return (
    <div className="App">
      <SearchForm getData={getData} />
      <SearchList searchData={searchData} />
    </div>
  );
}

export default App;
```


과정을 살펴보자, 서버에서 응답값이 오면 `App.tsx`의 15번째 라인에서 받고 이것을 `SearchList` 컴포넌트에 전달해 준다. `SearchList.tsx`를 보면 이 응답값을 `props`로 전달받았으며, 이 값은 배열이기 때문에 `Array.map` 메서드를 사용하여 `SearchItem` 컴포넌트를 리턴하고 있다. 이렇게 리턴받은 `SearchItem` 컴포넌트는 `SearchItem.tsx` 파일의 코드처럼, 카테고리, 제목, 본문내용, 링크를 출력하고 있는걸 확인할 수 있다.

## 스타일 꾸며주기
CSS 적용이 안되었기 때문에 실제 화면은 이상하게 보일것이다. `App.css` 파일에 간단히 스타일을 추가해 주자.

```css
.App {
  margin: 0 auto;
  max-width: 500px;
  padding: 10px;
}
.App .form {
  position: relative;
  margin-bottom: 10px;
}
.App .form-text {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  box-sizing: border-box;
  padding: 0 65px 0 5px;
  width: 100%;
  height: 35px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  outline: none;
}
.App .form-btn {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  border-radius: 0 5px 5px 0;
  width: 60px;
  height: 35px;
  background-color: #13424b;
  color: #fff;
}
.App .card-list {
  column-count: 2;
  column-gap: 10px;
  margin-top: 10px;
  padding: 0;
}
.App .card {
  display: inline-block;
  position: relative;
  margin: 0 0 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  word-break: break-all;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
.App .card .top {
  border-radius: 5px 5px 0 0;
  padding: 10px;
  background-color: #13424b;
  color: #fff;
}
.App .card .top .kategorie {
  font-size: 11px;
}
.App .card .top .title {
  margin-top: 5px;
  font-weight: bold;
}
.App .card .bottom {
  padding: 10px;
  font-size: 13px;
}
.App .card .bottom .link {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 5px;
  border-radius: 3px;
  text-decoration: none;
  background-color: #e5e5e5;
  color: #000;
}
```

# 추가 화면 및 비활성 처리
마무리 단계이며, 아래 단계가 남았다.

1. 검색하는 동안 출력될 화면 추가
2. 검색하는 동안 폼 비활성(disable) 처리
3. 검색결과 없는 경우 추가

`SearchLoading.tsx` 파일을 생성하고 아래처럼 입력해 준다. 이 컴포넌트가 검색하는 동안 보여지는 부분이다.

```javascript
import React from "react";

const SearchLoading = (props: { isOnLoading: boolean }) => {
  const { isOnLoading } = props;
  return (
    <div className={isOnLoading ? "loading on" : "loading"}>loading..</div>
  );
};

export default SearchLoading;
```

그리고 `SearchForm.tsx`, `SearchList.tsx`, `App.tsx`, `App.css` 파일들을 아래처럼 코드를 수정한다.

**SearchForm.tsx**
```javascript
import React, { useState } from "react";

const SearchForm = (props: { getData: any; isOnLoading: boolean }) => {
  const { getData, isOnLoading } = props;
  const [keyword, setKeyword] = useState("");
  return (
    <div className={isOnLoading ? "form disable" : "form"}>
      <input
        type="text"
        className="form-text"
        disabled={isOnLoading ? true : false}
        onChange={(e: any) => {
          setKeyword(e.target.value);
        }}
        onKeyPress={(e: any) => {
          if (e.charCode === 13) {
            if (keyword) {
              getData(keyword);
            }
          }
        }}
      />
      <button
        type="button"
        className="form-btn"
        disabled={isOnLoading ? true : false}
        onClick={() => {
          if (keyword) {
            getData(keyword);
          }
        }}
      >
        search
      </button>
    </div>
  );
};

export default SearchForm;
```

**SearchList.tsx**
```javascript
import React from "react";
import SearchItem from "./SearchItem";

const SearchList = (props: { searchData: []; isOnLoading: boolean }) => {
  const { searchData, isOnLoading } = props;
  return (
    <div className={isOnLoading ? "card-list disable" : "card-list"}>
      {searchData.map(
        (item: any, idx: number): JSX.Element => {
          if (item.kategorie && item.kategorie && item.text) {
            return <SearchItem key={idx} item={item} />;
          } else {
            return (
              <div key={idx} className="none">
                검색결과 없음
              </div>
            );
          }
        }
      )}
    </div>
  );
};
export default SearchList;
```

**App.tsx**
```javascript
import React, { useState } from "react";
import SearchForm from "./components/SearchForm";
import SearchLoading from "./components/SearchLoading";
import SearchList from "./components/SearchList";
import "./App.css";

function App() {
  const [searchData, setSearchData] = useState<any>([]);
  const [isOnLoading, setIsOnLoading] = useState(false);
  const getData = (keyword: string) => {
    setIsOnLoading(true);
    console.log("검색 키워드: " + keyword);
    fetch(`api/data?keyword=${keyword}`)
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setSearchData(data);
        setIsOnLoading(false);
        console.log(data);
      });
  };
  return (
    <div className="App">
      <SearchForm getData={getData} isOnLoading={isOnLoading} />
      <SearchLoading isOnLoading={isOnLoading} />
      <SearchList searchData={searchData} isOnLoading={isOnLoading} />
    </div>
  );
}

export default App;
```

**App.css**
```css
.App {
  margin: 0 auto;
  max-width: 500px;
  padding: 10px;
}
.App .form {
  position: relative;
  margin-bottom: 10px;
}
.App .form-text {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  box-sizing: border-box;
  padding: 0 65px 0 5px;
  width: 100%;
  height: 35px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
  outline: none;
}
.App .form-btn {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  border-radius: 0 5px 5px 0;
  width: 60px;
  height: 35px;
  background-color: #13424b;
  color: #fff;
}
.App .form.disable .form-btn {
  background-color: #b3b3b3;
}
.App .card-list {
  column-count: 2;
  column-gap: 10px;
  margin-top: 10px;
  padding: 0;
}
.App .card {
  display: inline-block;
  position: relative;
  margin: 0 0 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  word-break: break-all;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}
.App .card .top {
  border-radius: 5px 5px 0 0;
  padding: 10px;
  background-color: #13424b;
  color: #fff;
}
.App .card-list.disable .top {
  background-color: #b3b3b3;
}
.App .card .top .kategorie {
  font-size: 11px;
}
.App .card .top .title {
  margin-top: 5px;
  font-weight: bold;
}
.App .card .bottom {
  padding: 10px;
  font-size: 13px;
}
.App .card .bottom .link {
  display: inline-block;
  margin-top: 10px;
  padding: 3px 5px;
  border-radius: 3px;
  text-decoration: none;
  background-color: #e5e5e5;
  color: #000;
}
.App .card-list.disable .link {
  color: #fff;
}
.App .card-list .none {
  font-size: 13px;
}
.App .loading {
  overflow: hidden;
  text-align: center;
  height: 0;
  line-height: 18px;
  font-size: 0;
  transition: 0.3s;
}
.App .loading.on {
  font-size: 13px;
  height: 20px;
}
```

## 검색 시작 및 끝을 나타내는 값
### 컴포넌트에 검색중 여부 전달
코드를 하나씩 살펴보자. `App.tsx` 파일의 9번째 라인을 보면 `isOnLoading`값이 있는데 요청을 보내면 12번째 라인에서 `true`로 변경, 검색중을 나타내고, 응답을 받으면 20번째 라인에서 `false`로 변경되며 검색이 끝났다는 것을 의미한다. 이 값을 `SearchForm`, `SearchLoading`, `SearchList` 컴포넌트에 전달해 주었다.

### 컴포넌트에서 검색중 여부 처리
`SearchLoading.tsx` 파일 6번째 라인을 보면 `isOnLoading`가 `true`일 경우 `on` 클래스를 추가해 준다. 평상시에 이 엘리먼트는 보이지 않다가 `on` 클래스가 추가되면 보여지도록 `App.css`에 설정되어있다.

다른 컴포넌트도 마찬가지로 `SearchForm.tsx`에서 11번째 라인을 보면 `isOnLoading`이 `true`면 폼들은 `disabled` 처리가 되며, 7번째 라인에서 `disable` 클래스를 주고있다. `SearchList.tsx` 컴포넌트도 검색중이면 `disable` 클래스를 주고있으며, 이 클래스로 검색중에 스타일을 변경하도록 `App.css`에 설정되어있다.

## 검색결과 없는 경우
`SearchList.tsx`파일의 10번째 라인을 보면 전달받은 데이터 값이 모두 있을경우 데이터를 노출하고 없는 경우는 검색결과가 없다는 내용을 출력하고 있다.

# 배포하기
이제 로컬에서 작업한 결과물을 헤로쿠에 배포를 해보자.


## 깃 초기화
헤로쿠는 깃을 통해 업로드하기 때문에 루트 경로에서 아래 명령어로 깃을 초기화 해준다.

```
$ git init
```

## 빌드 설정
### 정적 파일 생성
`client` 디렉토리에서 아래 명령어를 입력해 배포용 정적 파일을 생성한다.

```
$ npm run build
```

### 정적 파일 경로 설정
다음에 `index.js` 파일 최하단에 아래 코드를 추가해준다.

```javascript
// ... 기존 코드

// path 모듈 불러오기
const path = require('path');

// 리액트 정적 파일 제공
app.use(express.static(path.join(__dirname, 'client/build')));

// 라우트 설정
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});
```

### 헤로쿠 빌드 명령어 설정
루트경로의 `package.json` 파일로 가서 `heroku-postbuild`를 아래처럼 추가해준다.

```json
"scripts": {
  "start": "nodemon index.js",
  "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
  "dev:server": "npm start",
  "dev:client": "cd client && npm start",
  "heroku-postbuild": "cd client && npm install && npm run build"
}
```

## 헤로쿠 연동하기
헤로쿠에 대한 간략한 설명은 [이 포스팅]https://recordboy.github.io/2020/11/05/express-react-heroku-init/)을 참고하면 된다. 기존에 회원이 아니면 [헤로쿠 홈페이지](https://heroku.com)에서 회원가입을 하고 [이곳에서](https://devcenter.heroku.com/articles/heroku-cli) 헤로쿠 CLI를 설치하면 된다.

### 로그인 및 프로젝트 생성
아래 명령어를 입력하고 아무키나 입력하면 로그인 하라는 브라우저가 뜨고 로그인을 해주자.

```
$ heroku login
```

아래 명령어로 헤로쿠에 프로젝트를 생성하며 프로젝트 이름은 다른 프로젝트와 중복되지 않게 정한다. `git remote -v` 명령어로 저장소가 제대로 연결되었는지 확인한다.

```
$ heroku create 프로젝트이름
$ git remote -v
```

> 헤로쿠 프로젝트 주소와 로컬에서 바라보는 주소가 다를경우 `$ git remote set-url heroku 프로젝트주소` 명령어를 사용하여 동일하게 맞춰주면 된다.

### 빌드팩 추가
한가지 또 추가해줘야 하는 것이 있는데 Puppeteer를 헤로쿠에서 사용하려면 프로젝트에 빌드팩을 추가해줘야 한다. 아래 명령어를 입력해주자.

```
$ heroku buildpacks:clear
$ heroku buildpacks:add --index 1 https://github.com/jontewks/puppeteer-heroku-buildpack
$ heroku buildpacks:add --index 1 heroku/nodejs
```

그리고 `index.js` 파일로 가서 34번째 라인의 브라우저 실행 옵션에 `args`값을 아래처럼 추가해 준다.
```javascript
// 브라우저 실행 및 옵션, 현재 옵션은 headless 모드 사용 여부
const browser = await puppeteer.launch({ 
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--window-size=1600,2000",
  ]
});
```

## 업로드
이제 배포를 위한 모든 준비가 끝났다. 깃 명령어를 입력하여 푸쉬해주자.

```
$ git add .
$ git commit -m '커밋 메세지'
$ git push heroku master
```

이제 배포된 페이지를 확인해 보자. url은 `https://프로젝트이름.herokuapp.com/`로 가면 확인할 수 있다. 정상적으로 배포된 페이지를 화인할 수 있다.

지금까지 만들어본건 검색하는 기능만 있는 아주 기본적인 형태이지만 잘만 활용하면 요청, 응답값으로 여러가지 형태로 발전시킬 수 있다. 예를들어 검색 포탈명을 요청해 여러 포탈의 검색결과를 한번에 찾아보거나 각 다음 페이지를 넘기는 `index`값을 응답을 받아 검색 로딩시간을 알아보는 등 여러가지 활용이 가능하다.

마지막으로 주의할 점이 있는데, 헤로쿠 서버의 무료 용량은 500MB로 제한된다. Puppeteer는 자체적으로 Chromium을 내장하고 있는데 이것이 꽤 용량이 나간다.(대략 300MB 조금 넘게) 그래서 프로젝트를 크게 불려 배포를 하면 가끔 용량이 부족하다고 에러가 나오는 경우가 있다. 또 한가지는 Puppeteer를 많이 사용하다보면 구글에서 봇으로 판단하여 '로봇이 아닙니다' 체크를 해야하는 경우도 있었다. 아무튼 Puppeteer는 크롤링 말고 여러가지 강력한 기능이 있기 때문에 잘 활용하면 좋은 도구가 될 수 있을 것이다.

# References
> [Puppeteer](https://pptr.dev/)  
> [Puppeteer unable to run on heroku](https://stackoverflow.com/questions/52225461/puppeteer-unable-to-run-on-heroku)
