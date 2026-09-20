# 코코나라 SEO·광고 운영 메모

## 어디를 수정하나요?

| 작업 | 파일 | 확인 사항 |
|---|---|---|
| 검색 제목·설명 | `seo.pages.json` | 페이지별 `title`, `description`, `searchIntent` |
| 검색에 보이는 본문 | `src/*.html` | 페이지당 H1 하나, 읽을 수 있는 본문과 내부 링크 |
| 실제 콘텐츠 수정일 | `seo.pages.json`의 `updatedAt` | 내용이 바뀐 페이지만 날짜 변경. 자동으로 오늘 날짜를 넣지 않음 |
| 가격·예약·문의 링크와 사업자 정보 | `site.config.json` | 확인된 값만 입력 |
| 캐릭터·여행 사진 | `assets/`와 `build.py` 이미지 함수 | 설명에 일러스트/사진 구분, alt·실제 크기·모바일 파일 확인 |

수정 후 `python3 build.py` → `python3 scripts/check.py` → PC·모바일 확인 → 이 저장소만 배포합니다. 빌드 시 검색 제목·설명이 HTML, OG, JSON-LD에 함께 반영되고 sitemap의 lastmod가 갱신됩니다. `docs/assets`는 매번 새로 생성하므로 제거한 원본 이미지가 배포 결과에 남지 않습니다. **docs에만 직접 넣은 자산은 유지되지 않습니다.**

## 페이지별 검색 의도와 광고 도착 페이지

| 핵심 검색어 | 도착 URL | 고객이 먼저 확인할 내용 |
|---|---|---|
| 우도 전기차·우도 스쿠터 비교 | https://mementoaicompany-lab.github.io/udosignature/ | 1인승/2인승, 조작·신체 기준, 예약 |
| 우도 전기차 | https://mementoaicompany-lab.github.io/udosignature/udo-electric-car/ | 파미·오픈카 비교, 이용조건, 가격 확인 |
| 우도 스쿠터·우도 전기스쿠터 | https://mementoaicompany-lab.github.io/udosignature/udo-scooter/ | 코코 1인승, 면허·연령·체중 기준 |
| 우도 여행코스 | https://mementoaicompany-lab.github.io/udosignature/udo-course/ | 하우목동항 출발 동선과 반납시간 계획 |

`/guide/`는 면허·안전·반납·취소 안내를 제공하고 기존 다국어 고객 안내로도 연결하는 noindex 페이지입니다. 안내 콘텐츠는 사이트맵에서 제외합니다.

| 추가 검색 의도 | 도착 URL | 내용 |
|---|---|---|
| 코코나라 예약 혜택·협력업체 | https://mementoaicompany-lab.github.io/udosignature/partners/ | 달콤아재·파크 할인, 카페 혜택, 쿠폰 사용법 |
| 우도 배시간·하우목동항 | https://mementoaicompany-lab.github.io/udosignature/udo-ferry/ | 월별 막배·반납 기준과 당일 확인 안내 |

## 등록 전에 필요한 항목

- 대표자·사업자등록번호·전체 사업장 주소·일반 문의번호·통신판매업 신고번호/해당 여부·운영시간 확인.
- 파미 신체 기준의 적용 방식, 최신 차량 사양과 이용조건 확인.
- 네이버 서치어드바이저 소유확인. GitHub 프로젝트 경로의 호스트 단위 등록 및 루트 robots 제약은 README 참고. 기존 사이트·호스트 설정 변경은 이번 작업에 포함되지 않습니다.
- 사이트맵: https://mementoaicompany-lab.github.io/udosignature/sitemap.xml
- 광고주 계정에서 비즈채널·소재·연결 URL 심사 후 예산을 정해 집행. 광고 문구에 확인되지 않은 최저가·1위·후기 수·별점·할인을 넣지 않습니다.
- 전용 분석 속성 연결. 현재 이벤트는 브라우저 메모리에만 있고 수집 서버가 없습니다. `booking_click`은 외부 예약 페이지 이동이며 구매완료가 아닙니다.

제목과 설명은 각 페이지의 실제 내용을 간결하게 요약하고, 키워드를 반복 나열하지 않습니다. 인덱싱이나 순위를 보장하는 작업은 아닙니다. 근거: [네이버 SEO 기본 가이드](https://searchadvisor.naver.com/guide/seo-help), [사이트 최적화 안내](https://searchadvisor.naver.com/guide/report-seo).

## 탐색과 전환

모든 카테고리는 실제 정적 HTML URL로 연결됩니다. 각 페이지 하단의 관련 콘텐츠, 지도 장소별 상세 링크, 모바일 고정 예약 버튼으로 다음 행동을 안내합니다. GIF 같은 주행 장면의 설명과 중요한 문구는 이미지 안에만 넣지 않고 HTML 본문에 제공합니다. 이미지 alt, width/height, 지연 로딩, CSS·JS 캐시 버전과 움직임 감소 설정을 적용했습니다.

광고 문구의 방향은 정가 운영·세척과 점검·예약 고객 혜택·1인승/2인승 비교입니다. 카페 할인 수치는 자료가 충돌하므로 현재는 표기하지 않았습니다. 사업자 정보와 현재 혜택 조건을 확정한 다음 광고 소재와 도착 페이지 내용을 맞춰 등록하세요. `content_click`을 추가했으며 기존 코코나라 분석에는 연결하지 않았습니다.
