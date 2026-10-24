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
클릭 이벤트는 브랜드 이름으로 구분합니다. 2026-10-24부터 독립된 브랜드별 Firebase 방문 집계를 사용합니다.
기존 고객 안내를 열면 해당 안내의 기존 방문 집계가 적용됩니다(운영자 승인).
새 서브도메인은 네이버 서치어드바이저에 별도로 소유확인·사이트맵 제출해야 합니다.


## 2026-09-23 검색 최적화

- `site.config.json`의 공개 소유확인 태그는 네이버·Google 검색 관리에 사용합니다. 비밀번호나 API 인증정보가 아닙니다.
- `seo.content.json`에서 관리하는 Q&A는 정적 HTML과 구조화 데이터에 함께 반영합니다. 준비중 브랜드에는 실제 운영 매장·판매 상품 정보를 만들지 않습니다.
- `python3 build.py` → `python3 scripts/check.py`로 검수합니다. `docs/`는 생성물이며 원본 콘텐츠를 수정한 뒤 다시 빌드해야 합니다.
- 배포 후 `python3 scripts/indexnow.py --submit`으로 이 프로젝트의 검색 허용 URL만 네이버에 알릴 수 있습니다. 공개 페이지가 로컬 빌드와 동일한지 먼저 검사하며 수집·상위노출을 보장하지 않습니다.
- Google Search Console은 각 사이트의 sitemap.xml을 제출합니다. 일반 웹페이지에 Google Indexing API를 사용하지 않습니다.
- 키워드 조사 기준표는 `SEO-KEYWORDS.md`입니다. 같은 의도의 예약·대여·가격·렌트 페이지를 복제하지 않습니다.


## 2026-10-24 오늘·누적 방문

- 헤더의 방문 수는 Firebase `brandVisitsV1/signature`만 읽고 씁니다. 기존 `visitors`, `ferryStatus`, 고객 안내 저장소는 변경하지 않습니다.
- 시작일 2026-10-24, 한국시간 자정 기준 브라우저별 하루 1회. 누적은 일별 방문의 합계이며 실제 고유 사람 수나 예약 수가 아닙니다. 이전 수치를 이관·가산하지 않습니다.
- 저장소 차단/DNT/로컬 미리보기/404는 읽기만 합니다. 브라우저 Web Locks와 로컬 저장소로 중복을 줄이며 Firebase ETag 조건부 쓰기로 동시 갱신 충돌을 재시도합니다. 응답 유실은 무조건 재시도하지 않아 이중 집계를 피합니다. 장애 시 일부 방문이 누락될 수 있습니다.
- Firebase에는 날짜와 총계 3개 필드만 보관합니다. 인증정보·개인 식별자·방문 URL을 저장하지 않습니다. 브라우저 저장소 초기화·다른 기기·의도적 호출까지 막는 인증 기반 분석 도구는 아니므로 수치는 참고용입니다.
- `assets/visitor-count.js`, `assets/visitor-count.css`, `visitor_widget.py`가 이 기능의 원본입니다. 수정 후 빌드합니다. 데이터가 없으면 첫 실제 방문부터 집계하고 통신 실패는 ‘—’로 표시합니다.
