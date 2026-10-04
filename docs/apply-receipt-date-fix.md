# 접수증 담당자 / 날짜 수정 배포

## 변경 및 검증

접수증은 숫자 질문 ID 순서로 제목 일부가 맞는 첫 질문을 선택해 개인정보 동의 문장을 담당자로 표시했습니다. 이제 단답형의 담당자 이름 질문을 우선하고 개인정보 안내, 동의, 연락처 질문은 제외합니다. 제출 answers는 변경하지 않습니다.

브릿지의 로컬 자정 생성은 Asia/Seoul에서 `2026-10-04`를 `2026-10-03T15:00:00.000Z`로 바꿨습니다. 달력 날짜를 엄격히 검증하고 UTC 자정으로 전달합니다. 존재하지 않는 날짜는 제출 전에 거부합니다.

`node --check dist/apply.js` 및 `node --test tests/*.test.cjs`: 8개 테스트. 접수증 실제 함수 실행, doPost 경계, 윤년/잘못된 날짜, 4개 시간대, 진단 함수의 제출 없음 확인.

중요한 검증 한계: DateItem 모의 객체는 UTC 날짜를 해석합니다. Google 런타임까지 검증한 것은 아닙니다. [Google DateItem 문서](https://developers.google.com/apps-script/reference/forms/date-item#createResponse(Date))는 Date의 시간 필드를 무시한다고 설명하지만 해석 시간대를 명시하지 않습니다. 실제 Google 동작은 아래 제출 없는 진단에서 확인해야 합니다.

## 승인 후 적용 순서

1. 이 PR은 draft이며 아직 merge/운영 배포하지 않습니다. 기존 TEST 응답과 Notion/Drive 자료는 수정하거나 삭제하지 않습니다.
2. **별도 브릿지 프로젝트** `1KOaT-GS3OiAv9rc9ZuffzumEDzsYpLgOLly_QTkr2SvkLJGS__Y7EnJT`에서 기존 소스를 백업합니다. 이 저장소 `google-apps-script/form-bridge.gs`를 편집기 소스에 반영합니다. 운영센터 프로젝트에는 넣지 않습니다.
3. 웹 앱 버전 갱신 전에 편집기에서 `inspectDateResponse()`만 실행합니다. 이 함수는 ItemResponse를 만들 뿐 FormResponse.submit을 호출하지 않습니다. 각 날짜 항목의 candidate가 `2026-10-04`인지 확인합니다(표시 형식은 다를 수 있음). legacy, candidate, scriptTimeZone 결과를 기록합니다. candidate가 다르거나 날짜 항목이 없으면 배포를 중단하고 결과를 검토합니다.
4. 확인 후 **기존 웹 앱 배포를 새 버전으로 편집**하여 같은 `/exec` URL을 유지합니다. 실행 주체/접근 권한은 그대로 유지합니다. 새 배포 URL을 만들거나 운영센터 Apps Script를 변경할 필요가 없습니다. main merge/Netlify 배포만으로 이 브릿지는 갱신되지 않습니다.
5. PR merge 시 연결된 Netlify가 `dist/apply.js`를 배포합니다. 해당 커밋의 배포 성공과 운영 페이지 JS 반영을 확인합니다. 접수증 수정은 정적 배포, 날짜 수정은 브릿지 배포에 각각 의존합니다.
6. 실제 신규 제출 재검증은 부모가 승인/조율할 때만 수행합니다. 이번 작업에서 추가 실등록이나 기존 테스트 데이터 보정은 하지 않았습니다.

롤백: 정적 사이트는 이전 Netlify 배포, 브릿지는 기존 웹 앱의 이전 버전으로 되돌립니다. 이 변경은 저장된 응답을 마이그레이션하지 않습니다.
