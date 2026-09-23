# 이미지 생성 프롬프트 (GPT Image 2.5용)

랜딩페이지 흐름을 보고, 사진이 있으면 이해가 빨라지는 자리만 골랐습니다. 아이콘은 이미지 생성 대신 **Google Material Symbols**(Rounded, 굵기 300)를 페이지에 직접 넣었습니다(아래 [아이콘 목록](#아이콘-목록-google-material-symbols) 참고).

## 진행 상황

- 적용 완료 (2026-09-23): 우선순위 1 입점처 6장, 우선순위 2 마케팅 4장 (모두 10장)
- 남은 것 (선택): 우선순위 3 경험 4단계, 우선순위 4 `cost-shelf` · `og-image` · `hero-v2`

## 사용 방법

1. 각 프롬프트 뒤에 **공통 스타일**을 그대로 붙여서 요청합니다.
2. 생성한 이미지는 WebP로 저장해 `dist/assets/` 아래에 표의 **파일명**으로 넣어 주세요. 넣어 주시면 페이지에 연결하겠습니다.
3. 권장 크기는 화면에 표시되는 크기의 약 2배(레티나 대응)입니다.

### 공통 스타일 (모든 프롬프트 끝에 붙이기)

```
Style: clean premium K-beauty editorial photography, soft diffused daylight, warm white and pale butter-yellow palette (#F1EB9D, #F8F5D2, #FFFFFF) with soft warm grey accents, frosted glass and matte cream packaging, generous negative space, shallow depth of field, calm and minimal like an Apple product page. No text, no letters, no logos, no brand names, no watermarks. Packaging must be blank and unbranded. People, if any, are shown from behind, cropped, or out of focus so no face is identifiable.
```

### 주의할 점

- **실제 매장처럼 보이게 쓰지 않습니다.** 생성 이미지는 "분위기 예시"입니다. "HKMF 홍대 면세 콤플렉스", "이랜드 NC" 같은 실제 매장 이름 옆에 생성 이미지를 두면 실제 현장 사진으로 오해할 수 있습니다. 실제 매장 사진이 생기면 그 사진으로 바꾸는 것을 권장합니다(소개서 10쪽도 같은 방침).
- **포장에 글자·로고가 없어야 합니다.** 특정 브랜드 제품처럼 보이면 안 되기 때문입니다. 글자가 생기면 다시 생성해 주세요.

---

## 우선순위 1 — 입점처 카드 (`#channels`, 6장)

지금은 심볼 무늬만 있어 채널 차이가 글로만 전달됩니다. 카드 윗부분에 사진을 두면 스크롤하면서 채널이 한눈에 구분됩니다.

- 비율 4:3, 권장 크기 1536×1152

| 파일명 | 카드 | 프롬프트 |
|---|---|---|
| `ch-dutyfree.webp` | 면세점 | A bright duty-free beauty zone in a modern Seoul shopping complex, an elegant low island display of blank skincare bottles and cream jars under soft spotlights, a traveler's hand holding a small paper shopping bag in the foreground, out-of-focus travelers with carry-on luggage in the background. |
| `ch-department.webp` | 백화점 · 편집숍 | A curated beauty select shop inside a department store, light wood and frosted glass shelving, products arranged by texture and color in neat rows, one hero shelf gently lit, calm boutique atmosphere, wide interior view. |
| `ch-pharmacy.webp` | 약국 · K-약국 | A clean modern Korean pharmacy with a dedicated beauty and wellness wall, white shelves with blank skincare tubes, supplement bottles and small device boxes, a pharmacist's consultation counter softly blurred in the background, trustworthy and bright. |
| `ch-roadshop.webp` | 로드샵 · 관광 상권 | A lively but tidy K-beauty road shop storefront on a Seoul street at golden hour, large glass window with products on display, blurred tourists walking past with shopping bags, warm light reflecting on the glass. |
| `ch-popup.webp` | 팝업 · 체험 공간 | A minimal pop-up experience space in Seongsu, a large pale-yellow sculptural counter with testers, a mirror and a handheld beauty device on display, concrete floor, soft light, a visitor's hand trying a cream texture. |
| `ch-global.webp` | 해외 유통 · 온라인 | An overhead flat-lay of shipping boxes in cream and pale yellow, blank skincare products wrapped in tissue, a passport and a smartphone showing a blank shopping screen, suggesting export and online orders, neat and airy composition. |

## 우선순위 2 — 마케팅 벤토 (`#marketing`, 4장)

타일 배경의 오른쪽 아래에 사진이 옅게 비치는 구성을 제안합니다. 글자가 올라가므로 한쪽 여백이 넓어야 합니다.

| 파일명 | 타일 | 비율 · 크기 | 프롬프트 |
|---|---|---|---|
| `mk-tourist.webp` | 관광객을 매대 앞까지 | 4:5 · 1200×1500 | Seen from behind, two travelers with a rolling suitcase and paper shopping bags looking at a K-beauty shop window on a bright Seoul street, one holding a smartphone showing a blank map, lots of clean sky and wall space on the left for text. |
| `mk-live.webp` | 라이브 커머스 | 1:1 · 1200×1200 | A smartphone on a small tripod recording a skincare bottle and a cream jar on a pale yellow table, a ring light glowing softly, a presenter's hands demonstrating the texture, backstage feel of a live shopping broadcast, empty space in the upper half. |
| `mk-interview.webp` | 진열 후 인터뷰 · SNS 바이럴 | 1:1 · 1200×1200 | A content creator's hand holding a smartphone vertically, filming a neatly displayed product shelf in a store, the phone screen showing the same shelf, a small lapel microphone on the table, candid behind-the-scenes mood. |
| `mk-mainzone.webp` | 메인 존 노출 기회 | 1:1 · 1200×1200 | A single circular display island at the center of a bright beauty store entrance, blank products arranged on tiered pale-yellow plinths, a soft overhead spotlight making it the focal point, shoppers blurred around it. |

## 우선순위 3 — 경험 4단계 (`#experience`, 4장, 선택)

지금 카드도 깔끔하므로 선택 사항입니다. 넣는다면 카드 오른쪽에 작게 배치합니다.

- 비율 1:1, 권장 크기 800×800

| 파일명 | 단계 | 프롬프트 |
|---|---|---|
| `ex-discover.webp` | 발견 | A shopper's hand reaching toward a softly lit shelf and picking up a blank frosted glass bottle, close-up, the rest of the shelf blurred. |
| `ex-experience.webp` | 체험 | Macro close-up of fingertips spreading a swatch of cream and a drop of serum on the back of a hand, a small handheld beauty device resting beside it. |
| `ex-understand.webp` | 이해 | A store staff member's hands pointing at a blank product card next to a skincare bottle on a counter, gently explaining, a customer's hand in the frame. |
| `ex-purchase.webp` | 구매 | A cream paper shopping bag with tissue paper being handed over a light wood counter, a blank product box inside, warm and satisfying moment. |

## 우선순위 4 — 기타

| 파일명 | 위치 | 비율 · 크기 | 프롬프트 |
|---|---|---|---|
| `cost-shelf.webp` | 마케팅비 섹션의 심볼 모양 이미지 (지금은 히어로 이미지를 재사용) | 1:1 · 1200×1200 | Rows of blank skincare products neatly lined up on a pale yellow shelf, one product slightly pulled forward and lit, symbolizing a product finally reaching the shelf, soft shadows. |
| `og-image.webp` | 카카오톡·SNS 링크 공유 미리보기 (1200×630) | 1.91:1 · 1200×630 | A wide minimal still life of frosted glass skincare bottles and a cream jar on stacked pale-yellow plinths, large empty area on the left half for a logo and headline to be added later, butter-yellow background. |
| `hero-v2.webp` | 히어로 이미지 교체 후보 (선택, 지금 이미지도 충분히 좋음) | 3:2 · 1536×1024 | Frosted glass serum bottles, a cream jar and a small beauty device arranged on sculpted pale-yellow stone plinths, a soft curved shadow crossing the scene like a ribbon, bright airy studio. |

> `og-image.webp`는 로고와 문구를 이미지 생성으로 넣지 말고, 생성한 배경 위에 실제 로고 파일을 얹어 만드는 것이 좋습니다. 생성 모델이 글자를 틀리게 그릴 수 있기 때문입니다.

---

## 아이콘 목록 (Google Material Symbols)

- 서체: Material Symbols **Rounded**, 굵기 300 (npm `@material-symbols/svg-300`, Apache 2.0 라이선스)
- 방식: 아이콘 폰트를 불러오지 않고, SVG 경로를 `index.html`에 직접 넣었습니다. 각 아이콘의 `data-icon` 속성에 이름이 적혀 있어, 바꿀 때는 [Google Fonts 아이콘 페이지](https://fonts.google.com/icons)에서 같은 이름을 찾으면 됩니다.

| 위치 | 아이콘 이름 |
|---|---|
| 3가지 핵심 가치 | `trending_up` 판매 기회 · `share` 바이럴 · `public` 해외 |
| 네 가지 과제 | `payments` 광고비 · `rule` 입점 기준 · `groups` 영업 조직 · `storefront` 오프라인 접점 |
| 입점처 카드 | `local_mall` 면세점 · `apartment` 백화점·편집숍 · `local_pharmacy` 약국 · `storefront` 로드샵 · `celebration` 팝업 · `language` 해외·온라인 |
| 마케팅 타일 | `travel_explore` 관광객 · `diversity_3` 인플루언서 · `live_tv` 라이브 커머스 · `forum` 인터뷰·SNS · `star` 메인 존 |
| 관광객 4단계 | `mobile` 방한 전 · `location_on` 방한 중 · `shopping_bag` 매장 내 · `autorenew` 귀국 후 |
| 경험 4단계 | `search` 발견 · `touch_app` 체험 · `lightbulb` 이해 · `shopping_bag` 구매 |
| 상담 | `mail` 메일 · `chat` 카카오톡 · `content_copy` 주소 복사 |
