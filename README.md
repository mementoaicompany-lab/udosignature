# udosignature — 코코나라 신규 SEO 홈페이지

브랜드·운영업체는 **코코나라**입니다. `udosignature`는 프로젝트와 저장소 이름이며 별도 렌탈업체가 아닙니다. 운영자가 2026-09-20 구매한 `udosignature.com`을 코코나라 신규 홈페이지의 전용 주소로 사용합니다.

## 독립된 위치와 배포 대상

| 구분 | 로컬 위치 | 원격·배포 대상 |
|---|---|---|
| 새 프로젝트 | `/Users/kimjiwon/Documents/Codex/2026-09-20/seo-udosignature-1-https-mementoaicompany-lab/outputs/udosignature` | `https://github.com/mementoaicompany-lab/udosignature` → `https://udosignature.com/` |
| 기존 소스(읽기 참고만) | `/Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/work/coconara-reset/` | 기존 `mementoaicompany-lab/coconara` 저장소 |
| 기존 빌드(읽기 참고만) | `/Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/outputs/coconara-reset/` | `https://mementoaicompany-lab.github.io/coconara/` |
| 기존 Sites 프로젝트(읽기 참고만) | `/Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/work/coconara/site/` | `https://coconara-udo-guide.mementoaicompany.chatgpt.site/` |
| 기존 완료 기록(읽기 참고만) | `/Users/kimjiwon/Documents/Codex/2026-09-07/new-chat/work/coconara-v27/` | 신규 배포에 사용하지 않음 |

새 폴더에서 새 Git 이력을 만들었습니다. 기존 `.git`, `.openai/hosting.json`, CNAME, 배포 자격증명, Firebase SDK·인증정보는 복사하지 않았습니다. 새 SEO 페이지에서는 기존 공개 운항 안내의 `ferryStatus.json`을 읽기 전용으로 참조합니다. `/customer-guide/`는 별도로 원본 안내 화면을 삽입하며, 소유자가 허용한 기존 방문 집계 예외는 아래에 기록했습니다. 새 사이트 배포 설정은 **udosignature → Settings → Pages → main /docs**입니다. 기존 저장소·Sites 배포는 이 설정과 연결되지 않습니다. 새 전용 도메인은 이 저장소에만 연결합니다.

`github.com/mementoaicompany-lab/udosignature`는 코드 저장소, `https://udosignature.com/`은 공개 홈페이지입니다. 이전 공개 주소 `https://mementoaicompany-lab.github.io/udosignature/`는 GitHub Pages의 전용 도메인 리디렉션 대상입니다. 도메인은 카페24에서 관리하고, 홈페이지 호스팅·배포는 GitHub Pages를 유지합니다. 도메인 만료일은 구매 화면 기준 2027-09-20입니다.

## 수정과 빌드

외부 패키지 없이 Python 3 표준 라이브러리만 사용합니다.

```sh
python3 build.py
python3 scripts/check.py
node scripts/check-ferry.cjs
```

- `site.config.json`: baseUrl, 예약·문의·고객 안내 링크, 사업자 정보, 검색 소유확인, 분석 설정의 단일 관리 지점.
- `seo.pages.json`: 페이지별 검색 제목·설명·의도·실제 수정일.
- `SEO.md`: SEO 수정 위치, 키워드별 도착 URL, 등록 전 체크 항목.
- `src/`: 각 페이지의 독립 콘텐츠.
- `assets/`: 파스텔 핑크 스타일, 주행 애니메이션, 이벤트·운항·지도 스크립트, 캐릭터 일러스트·여행 사진·쿠폰.
- `docs/`: GitHub Pages에 공개되는 정적 결과물. 생성 파일도 함께 커밋합니다.
- `/guide/`: 면허·안전·반납·취소 안내와 기존 다국어 고객 안내 연결. 중복 고객 안내의 검색 노출을 줄이도록 `noindex, follow`, 사이트맵 제외.
- `/partners/`: 협력업체 3곳의 혜택과 쿠폰. `/udo-ferry/`: 배편·반납 시간표와 날짜를 검증하는 당일 상태 안내.
- `content/map.json`, `map_builder.py`: 제공받은 OSM 지형·도로·장소 자료를 정적 지도와 읽을 수 있는 장소 설명으로 생성.
- `404.html`: 사용자용 오류 안내와 정상 사이트 복귀 링크. `noindex, follow`.

수정 후 빌드·검수하고 **이 프로젝트 폴더에서만** 커밋·푸시합니다. 배포 전 `git remote -v`가 `mementoaicompany-lab/udosignature.git`인지 확인하세요. 다른 저장소 URL을 추가하지 마세요. `scripts/publish.sh`는 원격·baseUrl이 정확히 일치할 때만 현재 커밋을 푸시합니다. 최초 게시는 로그인된 GitHub 웹 UI의 소스 압축 업로드와 저장소 내부 일회성 초기화 workflow로 진행합니다. CLI 인증은 저장하지 않았습니다. 이후 로컬 push에는 별도의 GitHub 인증이 필요합니다.

도메인 변경 시 `site.config.json`의 `baseUrl`을 변경하고 빌드하면 링크·canonical·OG·사이트맵이 함께 갱신됩니다. 단, 배포 대상과 DNS/CNAME 변경은 별도 작업이며 `customDomain`에서 `docs/CNAME`을 새로 생성합니다. 이전 사이트의 CNAME을 복사하지 않았습니다.

## SEO와 콘텐츠

검색 대상 한국어 정적 HTML 7페이지(전체 HTML 10개)는 각각 고유 title, description, H1, canonical, Open Graph/X 메타, 내부 링크를 갖습니다. `Organization`, `WebSite`, `WebPage`, 상세 페이지 `BreadcrumbList` JSON-LD를 사용합니다. 확인되지 않은 가격·후기·평점·순위·인증·영업시간·상세 주소를 구조화 데이터에 넣지 않았습니다. Organization에 확인된 사업장 주소·대표 문의 번호·사업자등록번호를 반영했습니다. 종료시간은 월별 마지막 배에 따라 달라지므로 고정된 매일 18시 마감으로 구조화하지 않습니다.

한국어 SEO 우선으로 신규 콘텐츠는 한국어입니다. 언어 버튼은 기존 6개 언어 고객 안내의 연결 페이지로 이동합니다. 신규 페이지의 번역을 제공한다고 표시하거나 잘못된 hreflang을 만들지 않습니다. 추후 실제 번역 페이지를 추가할 때 언어별 URL과 자기참조·상호참조 hreflang을 함께 생성하세요.

### 전용 도메인의 검색 등록

`https://udosignature.com/robots.txt`는 도메인 루트에서 제공되며 `https://udosignature.com/sitemap.xml`을 안내합니다. canonical·OG·구조화 데이터·내부 링크와 IndexNow의 기준 주소도 전용 도메인으로 통일합니다.

서치어드바이저에는 `https://udosignature.com`을 등록하고 `site.config.json.naverVerification`에 발급된 메타 소유확인 값을 넣어 배포한 뒤 소유확인과 사이트맵 제출을 진행합니다. 도메인 연결 자체가 네이버 소유확인 완료를 뜻하지 않습니다.

### 도메인 연결 설정

GitHub Pages의 Custom domain은 `udosignature.com`, 배포 소스는 `main /docs`입니다. GitHub Pages에서 안내하는 루트 A 레코드는 `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`을 사용합니다. `www`는 `mementoaicompany-lab.github.io` CNAME으로 연결하고, GitHub Pages에서 기본 주소로 리디렉션합니다. 2026-09-20 카페24 호스팅센터 DNS는 루트 A 추가를 1개로 제한하므로 실제 루트 A는 185.199.111.153 하나로 연결했습니다. 카페24 쇼핑몰의 기존 A 주소 3개는 제거했습니다. www CNAME은 mementoaicompany-lab.github.io로 저장했습니다. `guide.udosignature.com`의 사용하지 않는 카페24 쇼핑몰 연결은 해제했습니다. 기존 고객 안내 링크는 `https://mementoaicompany-lab.github.io/coconara/`를 유지합니다.

GitHub 계정의 도메인 소유확인은 DNS TXT로 완료했습니다. _github-pages-challenge-mementoaicompany-lab TXT 레코드를 유지하세요. 네이버 소유확인 메타태그는 site.config.json에 별도로 저장합니다.

HTTPS 인증서 발급 이후 GitHub Pages의 Enforce HTTPS를 활성화합니다. [GitHub 도메인 설정 안내](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

## 분석과 전환의 분리

`assets/site.js`는 `udosignature:conversion` CustomEvent와 `window.udosignatureEvents`(최대 100개, 메모리만)를 제공합니다. 이벤트: booking_click, vehicle_detail_click, map_click, guide_click, inquiry_click, language_guide_click, content_click. 각 이벤트에 site, page, vehicle, placement를 기록합니다.

새 사이트 자체에는 외부 분석 서비스를 연결하지 않았습니다. 자체 전환 이벤트는 네트워크 전송, 쿠키, localStorage, 사용자 식별값, 기존 방문자 카운터 쓰기가 없습니다. 단, `/customer-guide/`에 삽입한 원본 화면은 소유자의 별도 승인에 따라 기존 카운터를 사용합니다. 배시간 페이지와 메인만 기존 공개 운항 기록을 GET으로 읽으며, Firebase SDK·관리자 인증·쓰기 기능은 없습니다. URL 쿼리·전화번호 등 개인정보도 이벤트에 포함하지 않습니다. 분석 도입 시 udosignature 전용 속성·이벤트를 연결하세요. **스마트스토어 이동 클릭은 예약 결제 완료가 아닙니다.** 외부 구매완료 전환 추적은 별도 연동 가능 여부 확인이 필요합니다.

## 확인 자료와 입력할 정보

2026-09-20 확인: 기존 GitHub 실시간 HTML은 제공한 2026-09-13 완료본과 바이트 단위 일치. 기존 원격 저장소 최종 push는 2026-09-12 17:56:30 UTC. 기존 Sites URL은 자동 HTTP 요청에서 401이어서 이번 검사로 정상 공개 접근을 확정하지 못했습니다. 새 고객 안내 링크는 실제 HTTP 200이 확인된 기존 GitHub 주소를 사용합니다.

예약 상품 URL은 기존 공개 HTML에 있는 `https://smartstore.naver.com/udorent/products/5482331427`입니다. 네이버 톡톡도 기존 링크입니다. 지도는 ‘우도 코코나라’ 네이버 지도 검색 링크이며 특정 미확인 장소 ID를 만들지 않았습니다.

소유자가 확인할 항목:

- 아래 사업자 정보는 2026-09-20 운영자와 첨부 증명서로 확인해 반영했습니다. 변경 시 `site.config.json.business`를 수정하세요.
- 파미의 85kg·180cm 기준 간 적용 관계와 운전자/동승자 적용 범위.
- 현재 차량의 정확한 외형·사양. 현재 이미지는 실물 증빙이 아닌 캐릭터 일러스트입니다.
- 현재 재고·추가 비용·예약 상품의 세부 조건, 외국 면허 인정 서류. 요금과 할인 원칙은 2026-09-20 운영자 확인 내용을 반영했습니다.
- 공식 블로그·유튜브 채널 URL. 기존 영상 임베드를 공식 채널로 추정하지 않음.

사이트 footer에 김경택(공동사업자 김지원), 사업자등록번호 101-34-52349, 제주특별자치도 제주시 우도면 우목길 105, 대표 문의 0507-1373-2359·추가 연락처 010-4428-2349, 통신판매업 신고번호 제2020-제주우도-0011호를 반영했습니다. 매장 운영은 09:00~18:00·연중무휴이며 종료시간은 월별 마지막 배에 따라 변동합니다. 차량 반납은 마지막 배 1시간 전까지로 구분합니다. 증명서 원본 이미지와 생년월일은 저장소·공개 홈페이지에 게시하지 않았습니다.

## 사진 출처

차량 3종은 사용자 제공 `코코나라 홈페이지/index/`의 `coco-scooter.webp`, `fami-cabin.webp`, `open-canopy.webp` 캐릭터 일러스트입니다. 메인은 `깃허브 업로드 v27/coco-couple-coast.png`를 640/1280px WebP로 변환했습니다. 실제 인물 차량 사진은 현재 source와 배포 결과에서 제거했습니다. 일러스트와 실제 차량의 차이를 본문·alt에 명시하며 신형 오픈카의 실제 색상은 핑크로 안내합니다. 원본 참고 폴더는 수정하지 않았습니다.

하우목동항 주변: 제주영상문화산업진흥원, [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Udo,_Jeju_Province,_South_Korea_01.jpg), [공공누리 제1유형](https://www.kogl.or.kr/info/licenseType1.do). 하고수동·비양도: 제주관광공사, [Visitjeju.net](https://www.visitjeju.net/photojeju), 이전 photo-credits.json의 사용제한 없음·출처표기 조건 확인. 크기 조정·WebP 압축. 공개 페이지에도 출처를 표기했습니다.

## 2026-09-20 파스텔 핑크 전면 개선

카테고리는 홈·스쿠터·전기차·협력업체·우도 여행·배시간·이용안내입니다. 제공받은 캐릭터·바다·도로 이미지를 CSS로 반복 움직여 GIF 같은 주행 장면을 만들었습니다. 화면 밖에서는 멈추고, 방문자가 멈춤·재생할 수 있습니다. 기기의 움직임 줄이기 설정도 반영합니다. GIF 파일 다운로드가 필요 없는 WebP 기반 장면입니다.

사용자가 제공한 [마케팅 자료](https://app.notion.com/p/2c0171d001ec81bd982bc4998465ed4a)에서 정가 운영, 아침·저녁 세척·점검, 당일 반납 마감까지 이용, 방송 소개, 협력업체 혜택을 반영했습니다. 순위·사고율·독점성 수치는 독립적인 근거가 없어 넣지 않았습니다. 훈데르트윈즈 카페는 자료의 ‘2,000원’과 기존 홈페이지의 ‘20%’가 달라 확정 수치를 게시하지 않습니다. 운영자가 현재 조건을 확인해야 합니다.

기존 홈페이지의 사용자용 배편·안전·취소 안내와 쿠폰을 새 디자인으로 정리했습니다. 운영자 기능과 방문 카운터는 가져오지 않았고 기존 사이트는 수정하지 않았습니다. 새 사이트를 통해 달콤아재·파크·카페 혜택, 7개 지도 장소, 차량 비교를 계속 탐색할 수 있습니다.

### 운항 정보 읽기와 데이터 신선도

`site.config.json.ferrySource`는 기존 사이트에서도 공개된 단일 운항 기록입니다. `assets/ferry.js`는 GET / credentials omit / cache no-store만 사용합니다. 보이는 동안 60초 간격으로 읽고 120초가 지난 결과는 사용하지 않습니다. 한국시간 날짜·당일 시작 시각·갱신시각·상태·단축 막배를 검증합니다. 날짜가 다르거나 형식이 틀리거나 통신에 실패하면 ‘당일 운항 확인 필요’와 **월별 기준**을 표시합니다. 결항일에는 출항 카운트다운이 없고, 당일 막배가 지나면 운항 종료로 표시합니다. 마지막 배 1시간 전을 반납 기준으로 안내합니다. 항구의 실시간 승선 시스템이 아니므로 출항을 보장하지 않습니다.

구현 당시 공개 기록은 2026-09-09 자료여서 오늘의 확정 운항으로 표시하지 않았습니다. 기존 운영자가 기존 관리 화면에서 올바른 당일 운항 기록을 갱신하면 새 사이트에도 읽기 방식으로 반영됩니다. 새 관리자 화면은 만들지 않았습니다. 자동 검사 `scripts/check-ferry.cjs`가 날짜 경계·결항·단축·오래된 정보·입력 오류를 검증합니다.

지도는 사용자 제공 2026-09-08 OSM 자료입니다. 위치 버튼은 누를 때만 기기 권한을 요청하고, 좌표를 지도에 표시할 뿐 저장·전송하지 않습니다. 실시간 내비게이션이 아닙니다. 새로 추가한 풍경·협력업체 이미지와 쿠폰은 사용자 제공 기존 사이트 자산이며 원본은 변경하지 않았습니다.

## 2026-09-20 네이버 모바일 검색 콘텐츠 보완

디자인을 유지하면서 `/udo/`에 제주도 우도 여행 준비 안내를 추가하고 `/udo-course/`는 우도 가볼만한곳·지도·코스 검색을 담당하게 했습니다. 차량 페이지에는 정상가·조기예약 조건·이용시간·예약 절차를 넣었습니다. 바이크·오토바이 검색은 실제 제공하는 코코 전기스쿠터와 다른 차량의 차이를 설명하는 섹션으로 대응합니다. 같은 내용으로 예약/대여/렌트별 복제 페이지를 만들지 않습니다. 키워드 29개의 대표 URL은 `content/keyword-map.csv`에 있습니다.

`site.config.json.pricing`에 운영자 확인 가격을 보관합니다. 코코 정상가 30,000원, 파미·오픈카 정상가 각 40,000원, 파미 한정 수량 조기예약 할인 30,000원입니다. 이용시간은 이용 당일 마지막 배 출항 1시간 전까지입니다. 숫자·조건을 바꾸면 가격 본문과 정상가 Service/Offer 마크업이 재생성됩니다. 검색 설명에 넣은 요금도 `seo.pages.json`에서 함께 수정해 주세요. 할인 재고·조기예약 일수·보험 포함 범위는 임의로 만들지 않았습니다.

### 네이버에 페이지 갱신 알리기

`site.config.json.indexNowKey`는 이 프로젝트 경로의 공개 파일 소유 증명용입니다. GitHub·Firebase 계정 비밀번호나 관리자 인증키가 아닙니다. 빌드가 `docs/<key>.txt`를 생성합니다. 네이버 공식 IndexNow는 하위경로에 증명 파일을 두고 keyLocation을 지정할 수 있습니다. `https://udosignature.com/`의 indexable URL 7개만 알립니다. 기존 `/coconara/`는 대상이 아닙니다.

```sh
# 전송 없이 알림 대상 확인
python3 scripts/indexnow.py
# 배포가 완료된 후 실행. 공개 HTML과 로컬 빌드가 같을 때만 전송합니다.
python3 scripts/indexnow.py --submit
```

200은 URL 알림 성공, 202는 수신 후 키 확인 대기입니다. 모두 검색 색인 완료나 순위 보장이 아닙니다. 수정이 없는데 매일 재전송하지 마세요. 서치어드바이저의 계정 소유확인·사이트맵 제출과는 별개입니다.

이전 GitHub 프로젝트 경로는 서치어드바이저에서 호스트 단위 등록 제한이 있었습니다. 전용 도메인 연결 후에는 `https://udosignature.com`으로 소유확인을 진행합니다. 기존 GitHub 호스트 루트나 다른 저장소는 수정하지 않습니다.

근거: [네이버 IndexNow 키](https://searchadvisor.naver.com/guide/indexnow-api-key), [페이지 갱신 알림](https://searchadvisor.naver.com/guide/indexnow-request), [모바일 사용성](https://searchadvisor.naver.com/guide/markup-mobile).


## 예약 고객 안내 카테고리 — 2026-09-20

`https://udosignature.com/customer-guide/`에서 기존 `https://mementoaicompany-lab.github.io/coconara/` 화면을 iframe으로 표시합니다. 새 사이트 메뉴·상단 고객 안내·footer·다국어 연결은 이 경로를 사용합니다. 주소창은 udosignature.com을 유지하며 원본 화면의 파일·배포·관리 기능은 기존 저장소에 남습니다. 원본을 업데이트하면 삽입 화면도 해당 원본을 불러옵니다. 외부 연결을 새 창으로 열면 해당 서비스 주소로 이동합니다.

소유자는 2026-09-20 **‘기존 화면을 그대로 삽입하고 기존 방문 집계 허용’**을 명시했습니다. 이전의 카운터 분리 원칙에서 이 삽입 화면만 예외입니다. 삽입 화면은 원본의 방문 카운터·Firebase 동작을 사용하므로 완전히 독립된 방문 집계가 아닙니다. 새 SEO 페이지의 자체 이벤트는 계속 udosignature에만 기록하고, Firebase SDK·인증정보·관리자 소스를 신규 프로젝트로 복사하지 않습니다. 기존 저장소나 배포 설정은 수정하지 않습니다.

고객 안내 연결 페이지는 `noindex, follow`이며 사이트맵에서 제외합니다. 원본 전체 HTML을 복제하거나 고객 안내 내용을 중복 검색 페이지로 만들지 않습니다. 브라우저의 삽입 제한이나 지도 기능 문제에 대비해 원본 새 창 열기 링크를 제공합니다. 이 작업은 원본의 도메인을 변경하거나 원본을 이전한 것이 아닙니다.
