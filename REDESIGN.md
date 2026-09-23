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

## 2026-09-23 — 친절한 안내 톤과 밝은 영상

메인·브랜드 소개·메타 설명·영상 상태 문구를 친절하고 명확한 안내 중심으로 정리했습니다. 코코나라 카드에는 운영자가 제공했던 `couple-coast-1280.webp`를 사용해 남녀가 각각 스쿠터 한 대씩 타는 구성을 적용했습니다. 장면과 전경 도로에 CSS 애니메이션을 사용하며 기존 멈춤·화면 밖 정지·움직임 줄이기 설정을 유지합니다. 새로 생성한 이미지 시안은 투명 배경 품질이 맞지 않아 배포에 사용하지 않았습니다.

메인 YouTube 영상은 유지하면서 전체를 덮던 어두운 효과를 제거하고 하단에만 약한 그라데이션을 남겼습니다. 밝기·채도를 조정하고 텍스트 그림자로 가독성을 확보했습니다. 원본 영상 파일을 편집하거나 재업로드하지 않았습니다.
