# 우도 시그니처 — udosignature

공개 주소: https://udosignature.com/
저장소: https://github.com/mementoaicompany-lab/udosignature
로컬 폴더: /Users/kimjiwon/Documents/Codex/2026-09-20/seo-udosignature-1-https-mementoaicompany-lab/outputs/udosignature
배포: GitHub Pages, main 브랜치 /docs 폴더. docs/CNAME은 이 브랜드 도메인만 가리킵니다.

## 업데이트

1. src/의 정적 콘텐츠, assets/, site.config.json을 수정합니다.
2. `python3 build.py`로 docs/를 다시 만듭니다.
3. `python3 scripts/check.py`를 실행합니다. 배시간 모듈이 있으면 `node scripts/check-ferry.cjs`도 실행합니다.
4. 소스와 docs/를 함께 main에 커밋·푸시하면 GitHub Pages가 갱신됩니다. 검증 workflow는 읽기 권한만 사용합니다.

## 브랜드별 분리

- 우도 시그니처: udosignature 저장소 → https://udosignature.com/
- 우도여행: udosignature-udo 저장소 → https://udo.udosignature.com/
- 코코나라: udosignature-coconara 저장소 → https://coconara.udosignature.com/
- 달콤아재: udosignature-dalkom-aje 저장소 → https://dalkom-aje.udosignature.com/
- 우도씨앗: udosignature-udopeanut 저장소 → https://udopeanut.udosignature.com/ (오픈 준비중, 공개·검색 허용)
- 우도 키에키: udosignature-udocafe 저장소 → https://udocafe.udosignature.com/ (오픈 준비중, 공개·검색 허용)
- 기존 예약 고객 안내: coconara 저장소 → https://guide.udosignature.com/ (변경하지 않음)
- 기존 Sites 안내: https://coconara-udo-guide.mementoaicompany.chatgpt.site/ (변경하지 않음)

이 프로젝트는 각자의 Git 이력과 원격 저장소를 사용합니다. 다른 브랜드 변경이 자동으로 배포되지 않습니다.
기존 안내 소스 참고 위치: /Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/work/coconara-reset/
기존 Sites 프로젝트: /Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/work/coconara/site/

## SEO와 데이터

페이지별 정적 HTML, title·description·H1·canonical·구조화 데이터·sitemap·robots를 빌드합니다.
사진과 문구는 운영자 제공 기존 자료 및 확인된 매장 정보를 사용합니다. 판매량·검색순위·독점·후기 점수는 새로 주장하지 않습니다.
광범위한 여행 검색은 우도여행, 렌탈 검색은 코코나라, 디저트 검색은 달콤아재로 분리합니다.
이전 상세 경로는 canonical과 즉시 이동 HTML로 새 위치를 안내합니다. GitHub Pages 정적 호스팅이므로 이 이동은 HTTP 301이 아닙니다.
기존 Firebase 관리자 설정·인증정보를 사용하지 않습니다. 배시간은 기존 공개 안내를 GET으로 읽기만 합니다.
분석 이벤트는 브랜드 이름으로 구분되며 현재 외부 분석 서비스·쿠키·방문 카운터를 연결하지 않았습니다.
기존 고객 안내를 열면 해당 안내의 기존 방문 집계가 적용됩니다(운영자 승인).
새 서브도메인은 네이버 서치어드바이저에 별도로 소유확인·사이트맵 제출해야 합니다.


## 2026-09-23 검색 최적화

- `site.config.json`의 공개 소유확인 태그는 네이버·Google 검색 관리에 사용합니다. 비밀번호나 API 인증정보가 아닙니다.
- `seo.content.json`에서 관리하는 Q&A는 정적 HTML과 구조화 데이터에 함께 반영합니다. 준비중 브랜드에는 실제 운영 매장·판매 상품 정보를 만들지 않습니다.
- `python3 build.py` → `python3 scripts/check.py`로 검수합니다. `docs/`는 생성물이며 원본 콘텐츠를 수정한 뒤 다시 빌드해야 합니다.
- 배포 후 `python3 scripts/indexnow.py --submit`으로 이 프로젝트의 검색 허용 URL만 네이버에 알릴 수 있습니다. 공개 페이지가 로컬 빌드와 동일한지 먼저 검사하며 수집·상위노출을 보장하지 않습니다.
- Google Search Console은 각 사이트의 sitemap.xml을 제출합니다. 일반 웹페이지에 Google Indexing API를 사용하지 않습니다.
- 키워드 조사 기준표는 `SEO-KEYWORDS.md`입니다. 같은 의도의 예약·대여·가격·렌트 페이지를 복제하지 않습니다.

## 배시간 홈페이지 통합 입력

기존 브랜드 허브는 `/brands/`, 브랜드 이야기는 `/brands/story/`에 보존합니다.
완성형 정적 배시간 사이트는 `scripts/import-ferry-site.py`로 가져옵니다. 이 스크립트는
GitHub에 쓰거나 배포하지 않습니다. 파일 복사와 manifest 갱신만 수행합니다.

```sh
python3 scripts/import-ferry-site.py /absolute/path/to/udo-ferry/dist
python3 build.py
python3 scripts/check.py
python3 scripts/check-raw-import.py
python3 scripts/check-runtime-policy.py
node scripts/check-admin-write.mjs
node scripts/check-motion.cjs
```

- HTML 원본: `ferry-source/html/`, 공개 CSS·JS·data·사진: `ferry-source/public/`.
- `pages.json`의 `rawFile`은 완성형 HTML을 가리킵니다. 빌드는 본문과 구조화 데이터를 보존하고
  head의 robots 및 기존 Google/Naver 소유확인 meta만 주입합니다.
- 새 사이트의 `/styles.css`, `/main.js`, `/data/...` 경로는 그대로 유지됩니다.
- 기존 `assets/`와 이름이 같은 새 파일은 내용이 동일할 때만 허용합니다. 내용이 다르면
  import가 실패하므로 새 파일의 이름/참조를 바꾸어 기존 브랜드 화면을 보존합니다.
- CNAME, `.nojekyll`, robots.txt, sitemap.xml, IndexNow 소유확인 파일은 기존 빌더가 관리합니다.
  가져온 dist의 이 파일들로 기존 도메인이나 색인 정책을 덮어쓰지 않습니다.
- `/admin/` HTML은 `noindex,nofollow`이며 사이트맵에서 제외됩니다. 관리자 코드 예외는
  이 문서에서만 사용하는 `/admin.js`와 `/admin-core.mjs` 두 모듈로 한정합니다.
  일반 공개 페이지에서 직접 또는 모듈 import를 거쳐 이 코드를 불러오면 검증이 실패합니다.
- 관리자 SDK의 참조는 기존 Firebase 프로젝트의 `ferryStatus`와 서버시각·접속상태 `.info`
  읽기 두 곳에 한정합니다. 유일한 데이터 쓰기는 관리자 UID, 연결, 서버시각, 스키마를
  검증한 뒤 서버 응답을 기다리는 `ref.set(payload)`입니다. 브라우저 영구 저장이나 별도
  HTTP 쓰기는 허용하지 않습니다. 이 회귀검사는 서버 Firebase 보안 규칙을 대체하지 않습니다.
- 관리자 문서는 JSON-LD를 생략할 수 있지만 title·description·canonical·H1·로컬 참조와
  소유확인 태그 검사는 유지됩니다. 공개 HTML은 기존 SEO 검사를 모두 적용합니다.
- 같은 dist를 다시 가져오면 이전에 가져온 입력과 경로를 갱신합니다. 현재 dist에서 빠진
  이전 imported 경로는 제거하고, 그 경로가 원래 기존 페이지였다면 원래 manifest를 복원합니다.
- HTML 원본 바이트가 동일한 재가져오기는 기존 updatedAt을 보존하여 사이트맵 lastmod를
  불필요하게 갱신하지 않습니다.
- 소스(`ferry-source/`, pages.json, 빌더)와 생성물(`docs/`)을 함께 커밋해야 합니다.
  docs만 직접 수정하면 다음 빌드가 그 수정을 덮어씁니다.
