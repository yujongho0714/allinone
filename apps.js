/* 정도 올인원 — 앱 목록
 * 여기만 고치면 홈 화면이 바뀌어요.
 *  url    : 웹 앱 주소 (PC는 새 탭, 폰 앱은 크롬 탭으로 열림)
 *  pkg    : 폰에 설치된 안드로이드 앱 (폰 앱에서만 열림, 없으면 install 주소로 받기)
 *  soon   : 아직 만드는 중 (누르면 '곧 만들어요')
 *  icon   : 아래 ICONS 이름 · bg: 아이콘 바탕색 · desc: 한 줄 설명
 */
window.JD_SECTIONS = [
  { id: 'ops', title: '도장 운영', desc: '출결 · 수련생 · 연락' },
  { id: 'money', title: '수련비', desc: '원비 · 미납 · 결석 차감' },
  { id: 'exam', title: '심사 · 띠', desc: '승급 · 국기원 · 명예의 전당' },
  { id: 'edu', title: '수련 · 교육', desc: '계획표 · 인성 · 줄넘기' },
  { id: 'video', title: '영상 코칭', desc: '동작 분석 · 비교 · 촬영' },
  { id: 'game', title: '게임', desc: '아이들과 함께' },
];

const GH = 'https://yujongho0714.github.io/';
window.JD_APPS = [
  // 도장 운영
  { sec: 'ops', name: '출석체크', icon: 'att', bg: '#2563eb', url: GH + 'check/', pkg: 'com.jungdo.attend', install: 'https://github.com/yujongho0714/check/releases/latest', desc: 'PC 관리 · 키오스크 · 문자 폰' },
  { sec: 'ops', name: '단체문자', icon: 'sms', bg: '#16a34a', url: GH + 'check/#chat', desc: '단체방처럼 보고 한 분께 답장' },
  { sec: 'ops', name: '수련생 현황', icon: 'ppl', bg: '#0891b2', url: GH + 'check/#stats', desc: '학년별 · 형제 · 부모님 연락처' },
  { sec: 'ops', name: '전화 대상', icon: 'phone', bg: '#b91c1c', url: GH + 'check/#call', desc: '연락 없이 2일 이상 결석' },
  { sec: 'ops', name: '차량 스케줄', icon: 'bus', bg: '#ca8a04', url: GH + 'check/#bus', desc: '노선도 · 실시간 위치 · 탑승 명단' },
  { sec: 'ops', name: '운행 화면', icon: 'pin', bg: '#15803d', url: GH + 'check/#drive', desc: '기사님·선생님 폰 GPS 운행' },
  { sec: 'ops', name: '도보 픽업', icon: 'walk', bg: '#65a30d', url: GH + 'exit/', desc: '요일별 하원 · 도보 픽업 체크' },
  // 수련비
  { sec: 'money', name: '정도2관 수련비', icon: 'won', bg: '#d97706', url: GH + 'check/#fee', desc: '월별 원비 · 결석 차감 · 엑셀' },
  { sec: 'money', name: '미납 정리', icon: 'unpaid', bg: '#dc2626', url: GH + 'check/#unpaid', desc: '몇 개월 미납 · 안내 문자' },
  // 심사 · 띠
  { sec: 'exam', name: '승급심사', icon: 'exam', bg: '#7c3aed', url: GH + 'Simsa/', desc: '일반 · 국기원 심사 · 명예의 전당' },
  { sec: 'exam', name: '심사 발표', icon: 'medal', bg: '#6d28d9', url: GH + 'simsa222/', desc: '승급심사 결과 발표' },
  { sec: 'exam', name: '띠 체크', icon: 'belt', bg: '#1f2937', url: GH + 'Simsa/#belt', desc: '지급 여부 · 현재 띠 · 엑셀' },
  { sec: 'exam', name: '심사 영상 촬영', icon: 'cam', bg: '#be185d', pkg: 'kr.jungdo.video', install: 'https://github.com/yujongho0714/movie/releases/latest', desc: '찍고 이름으로 저장 · 카톡 전송' },
  // 수련 · 교육
  { sec: 'edu', name: '월간 수련계획표', icon: 'cal', bg: '#0d9488', url: GH + 'plan/', desc: '달력 만들기 · 인쇄' },
  { sec: 'edu', name: '라이프 스킬', icon: 'heart', bg: '#e11d48', url: GH + 'check/#life', desc: '월간 인성 미션지 · 완료 체크 · 심사 점수' },
  { sec: 'edu', name: '인성교육 영상', icon: 'book', bg: '#9333ea', url: GH + 'check/#edu', desc: '월·주차별 인성 영상 · 이번 주 바로 틀기' },
  { sec: 'edu', name: '줄넘기', icon: 'rope', bg: '#2563eb', url: GH + 'jumprope/', desc: '줄넘기 시합 · 급수' },
  // 영상 코칭
  { sec: 'video', name: '코치 영상분석', icon: 'coach', bg: '#0f766e', url: GH + 'coach/', desc: '각도기 · 관절 · 그림' },
  { sec: 'video', name: '영상 월드컵', icon: 'cup', bg: '#b45309', url: GH + 'rival/', desc: '내 영상끼리 비교 코칭' },
  // 게임
  { sec: 'game', name: '제미타', icon: 'target', bg: '#dc2626', url: GH + 'attack/', desc: '발차기 센서 게임' },
  { sec: 'game', name: '포켓몬', icon: 'ball', bg: '#ea580c', url: GH + 'attack/poke/', desc: '포켓몬 어드벤처' },
  { sec: 'game', name: '끝말잇기', icon: 'word', bg: '#4f46e5', url: GH + 'index3/', desc: 'RPG 끝말잇기' },
  { sec: 'game', name: '교육게임', icon: 'edu', bg: '#059669', url: GH + 'allinone/games/', desc: '나이별 게임 오락실 · 끝말잇기 · 타일 마스터' },
];

window.JD_ICONS = {
  att: 'M4 5h16v14H4z M8 12l3 3 5-6',
  sms: 'M4 5h12v8H8l-4 3z M10 15h6l4 3v-8h-2',
  ppl: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 19c0-3 3-5 6-5s6 2 6 5 M16 5a3 3 0 0 1 0 6 M18 14c2 .5 3 2.5 3 5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  pin: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  bus: 'M5 4h14v11H5z M5 10h14 M7 15v3 M17 15v3 M8 13h1 M15 13h1',
  walk: 'M10 4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M11 8l-2 5 3 2v5 M11 8l4 3 3-1 M9 13l-3 6',
  won: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8 8l1.5 8 2.5-6 2.5 6L16 8 M7 12h10',
  unpaid: 'M5 4h14v16H5z M9 8h6 M9 12h6 M12 16h.01',
  exam: 'M8 3h8v3H8z M6 5h12v15H6z M9 12l2 2 4-4',
  medal: 'M8 3l2 6 M16 3l-2 6 M12 9a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 12v4',
  belt: 'M3 10h18v4H3z M10 8h4v8h-4z M11 16l-2 5 M13 16l2 5',
  cam: 'M4 7h4l2-2h4l2 2h4v12H4z M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v14',
  rope: 'M7 4v6 M17 4v6 M7 10c0 8 10 8 10 0',
  coach: 'M4 5h16v12H4z M10 9l5 2-5 2z M8 21h8',
  cup: 'M8 4h8v5a4 4 0 0 1-8 0z M8 6H5a3 3 0 0 0 3 4 M16 6h3a3 3 0 0 1-3 4 M12 13v4 M9 20h6',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 11a1 1 0 1 0 0 2',
  ball: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h6 M15 12h6 M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  word: 'M4 6h7v5H4z M13 13h7v5h-7z M11 8h4v5',
  edu: 'M5 5h6v6H5z M13 5h6v6h-6z M5 13h6v6H5z M16 13v6 M13 16h6',
};
