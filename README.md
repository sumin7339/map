# 길이음

출발지와 도착지를 검색해 자동차 도로 거리를 확인하고 OpenStreetMap에서 경로를 여는 웹앱입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

개발 서버는 Vite를 사용하고, `/api/geocode` 요청은 Nominatim으로 전달됩니다.

## Vercel 배포

GitHub 저장소를 Vercel에 가져오면 Vite 프로젝트로 자동 감지됩니다. 빌드 명령은 `npm run build`, 출력 디렉터리는 `dist`입니다. API 키, Redis, 환경 변수는 필요하지 않습니다.

## 서비스 정보

- 장소 검색: OpenStreetMap Nominatim (`/api/geocode` Vercel 함수)
- 자동차 도로 경로 및 거리: OSRM 공개 데모 서버
- 지도 링크: OpenStreetMap 경로 안내

Nominatim 공개 서비스 정책을 고려해 장소 검색은 사용자가 검색 버튼을 눌렀을 때만 요청하며, 연속 검색 간격을 둡니다. 검색 결과는 Vercel CDN에서 하루 동안 캐시됩니다. 공개 Nominatim과 OSRM 데모 서버는 사용량 제한 및 서비스 변경의 영향을 받을 수 있으므로, 트래픽이 많거나 서비스 수준 보장이 필요한 배포에는 전용 인스턴스 또는 다른 서비스가 필요합니다.
