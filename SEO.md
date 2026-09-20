# 코코나라 네이버 모바일 SEO 운영

## 검색 의도별 대표 페이지

| 검색어 묶음 | 대표 URL | 역할 |
|---|---|---|
| 코코나라·우도 전기차/스쿠터 비교 | `/` | 브랜드와 차종·가격 비교, 예약 |
| 우도 / 제주도 우도 / 우도 여행 | `/udo/` | 첫 방문 준비·배편·이동수단·일정 |
| 우도 가볼만한곳 | `/udo-course/` | 장소 7곳·지도·추천 동선 |
| 우도 전기차 + 예약/대여/가격/렌트 | `/udo-electric-car/` | 파미·오픈카·요금·할인 조건·예약 절차 |
| 우도 스쿠터 / 전기스쿠터 + 예약/대여/가격/렌트 | `/udo-scooter/` | 코코·요금·면허·1인승 조건 |
| 우도 바이크 / 오토바이 + 예약/대여/가격/렌트 | `/udo-scooter/` | 실제 제공하는 코코 전기스쿠터와 차종 선택 설명 |
| 우도 배시간·반납 | `/udo-ferry/` | 월별 기준과 당일 확인 |
| 코코나라 예약 고객 혜택 | `/partners/` | 제휴 혜택·쿠폰 |

`content/keyword-map.csv`에 29개 검색어와 도착 URL을 기록했습니다. 이는 검색량 조사표나 순위 예측표가 아닙니다. 같은 의도의 동의어는 한 페이지로 모으고, 키워드별 복제 페이지나 숨긴 텍스트를 사용하지 않습니다. `guide/`와 `404.html`은 noindex·사이트맵 제외입니다.

## 수정 위치

- 제목·설명·검색 의도·실제 수정일: `seo.pages.json`
- 가격·할인·이용시간: `site.config.json.pricing`; 메타 설명에 들어간 요금도 함께 확인
- 예약/톡톡 링크·사업자 정보·네이버 메타 소유확인: `site.config.json`
- 본문: `src/`; 장소 설명: `content/map.json`
- 생성 결과: `docs/`; 직접 수정하지 않고 `python3 build.py`로 갱신

중요 정보는 정적 HTML에 제공합니다. 모바일과 PC는 같은 URL·본문을 사용합니다. 영상·그림 안의 글자에만 의존하지 않습니다. 정상가만 Service/Offer에 포함하고 조건부 할인의 재고를 InStock으로 만들지 않습니다. FAQ는 방문자에게 답을 주는 본문이며 검색에서 FAQ 모양이 표시된다고 약속하지 않습니다.

## 검수와 수집 알림

1. `python3 build.py`
2. `python3 scripts/check.py` 및 `node scripts/check-ferry.cjs`
3. 모바일 320/390px 및 PC 확인, 가격·링크·예약 절차 확인
4. udosignature의 GitHub Pages main/docs 배포
5. 공개된 결과 확인 후 `python3 scripts/indexnow.py --submit`

네이버 IndexNow는 수정된 URL을 네이버에 알려줍니다. 요청 성공은 색인·노출·순위 확정을 뜻하지 않습니다. 스크립트는 키와 페이지가 정상 배포되었는지 확인하고 이 프로젝트 경로만 전송합니다. 운영자 계정 소유확인과는 별개입니다.

사이트맵: https://udosignature.com/sitemap.xml

## 서치어드바이저에서 남은 일

전용 주소는 `https://udosignature.com/`입니다. HTTPS 연결 완료 후 서치어드바이저에서 호스트를 등록하고 소유확인 → 사이트맵 제출 → 주요 URL 수집요청 → 수집·색인·노출 보고서 확인 순서로 진행합니다. 등록용 메타태그를 받으면 site.config.json.naverVerification에 저장하고 빌드합니다. GitHub Pages 호스팅은 유지합니다. 도메인 연결과 네이버 소유확인의 완료 상태는 별개로 기록하세요.

## 운영자가 채울 정보

대표자·사업자등록번호·전체 주소·일반 문의번호·통신판매업 신고번호/해당 여부·운영시간. 파미 체중·신장 제한의 적용 범위. 카페 할인 2,000원/20% 중 현재 조건. 실제 차량 사양·추가 비용·외국 면허 인정 서류.

## 운영 방법

먼저 차량 예약·가격처럼 구체적인 의도의 유입과 예약 버튼 클릭을 살펴보세요. ‘우도’ 같은 넓은 검색은 여행 정보 콘텐츠를 함께 관리합니다. 주 1회 변경된 운항·요금·혜택·링크를 확인하고, 수집·색인·노출·클릭·예약 클릭을 구분해 기록합니다. 같은 URL 수집을 매일 반복 요청할 필요는 없습니다. 새로운 정보가 있을 때 기존 페이지를 갱신하고 새 주제에만 별도 페이지를 만듭니다.

스마트플레이스의 업체 정보와 새 홈페이지 정보도 일치시켜야 합니다. 기존 고객 안내 URL을 임의로 덮어쓰지 말고 신규 고객용 홈페이지와 예약 고객 안내의 용도를 구분하세요. 블로그 글은 실제 고객 질문·운영 경험·촬영 자료로 작성하고 관련 상세 페이지를 자연스럽게 연결합니다. 후기나 외부 링크를 구매하거나 과장 문구를 넣지 않습니다.

파워링크는 유료 광고이며 자연검색과 별도입니다. 광고주는 사업자 정보·비즈채널·문구·예산을 확정해야 합니다. 이 작업에서 과금·광고 집행은 하지 않습니다. 분석은 현재 메모리 이벤트만 있고 외부 수집 서버는 없습니다. 예약 버튼 클릭은 결제 완료가 아닙니다.

## 공식 근거

- [콘텐츠 작성 권장 사항](https://searchadvisor.naver.com/guide/content-basic): 사용자 질문에 답하는 고유 콘텐츠, 제목의 키워드 반복 방지
- [모바일 사용성](https://searchadvisor.naver.com/guide/markup-mobile): 반응형·동일 URL
- [등록 및 소유확인](https://searchadvisor.naver.com/guide/faq-start-register): 자동 수집과 소유확인 보고서의 차이
- [사이트맵](https://searchadvisor.naver.com/guide/request-feed)
- [수집요청](https://searchadvisor.naver.com/guide/request-crawl): 수집은 1일에서 몇 주 소요 가능, 성공해도 노출 보장 없음
- [IndexNow 키](https://searchadvisor.naver.com/guide/indexnow-api-key) · [갱신 알림 API](https://searchadvisor.naver.com/guide/indexnow-request)
