/**
 * 입점 제안서 질문 목록 중계 (beautyora.kr/api/form)
 *
 * 브라우저가 구글 Apps Script에 직접 물으면 매번 2~4초가 걸립니다
 * (잠든 스크립트 깨우기 + 다른 주소로 한 번 더 넘어가기).
 * 이 함수가 대신 받아 오고, 결과는 Netlify CDN에 저장해 두어
 * 방문자에게는 저장본을 바로 내줍니다.
 *
 * - 저장본은 2분 동안 새것으로 보고, 그 뒤에는 저장본을 먼저 내주면서
 *   뒤에서 구글에 새로 물어 갱신합니다(stale-while-revalidate).
 *   그래서 구글 폼을 고치면 대개 몇 분 안에 입력폼에 반영됩니다.
 * - 실패한 응답은 저장하지 않습니다. 브라우저는 실패 시 Apps Script로 직접 물어봅니다.
 * - 응답 제출(POST)은 이 함수를 거치지 않고 Apps Script로 바로 갑니다.
 */
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbzGE1ucvLJqnbDdF9Erb9lB6ivBOpKaD3gNMQ0uuMVoEbhl6MPnSS9EsY3PfkGnJK7v/exec';

export default async () => {
  try {
    const res = await fetch(ENDPOINT, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    const data = JSON.parse(text);
    if (!data || !data.ok || !Array.isArray(data.sections)) throw new Error('bad-data');
    return new Response(text, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        // 브라우저는 매번 CDN에 확인하고, CDN(모든 지역 공용 저장소)은 2분간 저장 + 뒤에서 갱신
        'cache-control': 'public, max-age=0, must-revalidate',
        'netlify-cdn-cache-control': 'public, durable, max-age=120, stale-while-revalidate=604800'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: 'proxy', message: String(err && err.message || err) }), {
      status: 502,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  }
};

export const config = { path: '/api/form' };
