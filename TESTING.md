# 검수 기록 — 2026-09-20

## 로컬 정적 검사

`python3 scripts/check.py` 통과: HTML 6개, 로컬 참조 120개, 자산 12종, 검색대상 URL 4개, 오류 0. public 결과물 총 약 668KB. 외부 폰트·JS 프레임워크·분석 SDK 없이 정적 HTML로 핵심 내용을 제공합니다.

각 페이지 고유 title/description/canonical, H1 하나, 이미지 alt와 크기, JSON-LD 구문, 내부 앵커와 /udosignature/ 경로를 검사했습니다. guide·404 noindex 및 사이트맵 제외. source에서 기존 Firebase·관리자 UI가 유입되지 않았습니다. JS 구문 검사 통과.

## 브라우저 검사

Codex 브라우저에서 320/390/768/1440px × 홈·전기차·스쿠터·여행·guide = 20조합 검사: 가로 넘침 없음, H1 하나, 로드 실패 이미지 없음, 수집된 warning/error 0. 홈 PC와 모바일, 차량 카드, 전기차 상세 화면을 시각적으로 검수했습니다. 모바일 메뉴 열기와 전기차 이동, 상세 페이지 새로고침 정상.

최초 이미지의 원본이 작아 차량 사진에는 선명도 한계가 있습니다. 현재 실물 고화질 사진으로 교체하면 개선됩니다. 실제 기기 센서, 전화를 거는 동작, 결제·예약 완료는 실행하지 않습니다. 실제 사용자 데이터에 의한 LCP/CLS/INP 평가는 운영 후 별도 확인이 필요합니다.

## 외부와 운영 확인의 범위

예약·톡톡 URL은 기존 실시간 홈페이지와 일치. 기존 GitHub 홈페이지는 HTTP 200이며 제공된 완료본과 동일. 기존 Sites URL은 자동 접근 401로 공개 상태 확인 보류. 새 홈페이지에서 기존 Firebase에 연결하거나 쓰지 않음. 네이버 상품의 재고·현재 가격 및 결제 완료 여부는 보장하지 않음.

## 네이버 등록과 광고 집행 전에

1. `site.config.json`의 사업자 정보를 채우고 다시 빌드·배포.
2. 네이버 서치어드바이저 소유확인 후 새 사이트맵과 핵심 URL 제출. GitHub 호스트 단위 등록·루트 robots 제약은 README 확인.
3. 전기차 광고그룹의 연결 URL은 `/udosignature/udo-electric-car/`, 스쿠터 광고그룹은 `/udosignature/udo-scooter/`로 지정.
4. 비즈채널, 업종 요건·서류, 소재, 예산·입찰가를 광고주 계정에서 확인하고 심사 신청. 이번 작업에서 광고 생성·과금은 하지 않음.
5. 전용 분석 속성 연결. 예약 링크 클릭과 결제 완료를 구분.

공식 참고: [네이버 파워링크 등록](https://ads.naver.com/help/faq/1480), [사업자정보와 설정 가이드](https://ads.naver.com/sub/insight/adtips/157), [robots](https://searchadvisor.naver.com/guide/seo-basic-robots).
