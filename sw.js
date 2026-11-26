// 정도 올인원: 설치용 최소 서비스워커 (저장 안 함 · 늘 최신 화면)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
