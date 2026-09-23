# 2026-09-23 redesign
Reference layouts were reviewed visually; implementation uses Udo brand content and independent code.
Preserves existing SEO routes, canonical origin, Naver verification and static HTML.
Reduced-motion support, keyboard access and progressive enhancement are included.
Ferry data (where used) remain read-only and retain freshness checks.
Do not deploy any of these sources to the original coconara customer guide repository.

## 2026-09-23 — 메인 영상과 스토리텔링 개선

메인과 브랜드 이야기 문구를 ‘바람을 따라 출발 → 달콤한 쉼 → 다음 만남’으로 정리했습니다. 다섯 브랜드 카드는 `assets/home-motion.css`의 개별 애니메이션을 사용합니다. 관광 카드는 기존 우도여행의 OSM 해안·여행지 자료를 간략화한 일러스트이며 실시간 길안내가 아닙니다.

메인 영상은 운영자가 지정한 광샤필름 YouTube 영상 `tGDVOPpq6bg`를 공식 개인정보 보호 강화 임베드로 재생합니다. 원본 동영상은 내려받거나 재업로드하지 않았습니다. 음소거·인라인·반복 재생, 직접 멈춤, 화면 밖/다른 탭에서 멈춤을 지원합니다. 자동 재생 차단·연결 오류 때 대체 사진과 재생/원본 링크를 제공합니다. 움직임 줄이기·데이터 절약 모드에서는 사용자 재생 전 YouTube를 불러오지 않습니다. 관련 안내는 개인정보 페이지에 반영했습니다.

검증: `python3 build.py`, `python3 scripts/check.py`, `node --check assets/home-motion.js`, `node scripts/check-motion.cjs`. 모바일·PC 시각 검수를 함께 수행합니다. 코코나라 및 기존 고객 안내 저장소/도메인/DNS는 이 변경에서 수정하지 않습니다.
