/* 정도 출결 명단 공용 연결 (jd-roster.js)
   - 출결 앱(Firestore students)의 원생 명단을 다른 앱이 그대로 따라가게 해요.
   - 퇴관(status LEFT)한 원생은 퇴관한 달까지만 보이고, 다음 달부터 빠져요 (out:true).
   - 띠 · 줄넘기 급을 고치면 출결 앱에 바로 저장돼서 모든 앱이 같이 바뀌어요.
   - 로그인은 같은 주소(yujongho0714.github.io)의 앱끼리 한 번만 하면 돼요 (승급심사 앱과 같이 씀).
   - 인터넷이 안 되면 마지막으로 받은 명단(이 기기 저장)을 써요.
   연결 코드 · 비밀번호는 이 파일에 없어요. */
(function(){
  if (window.JDR) return;
  var SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  var CACHE = 'jdr_cache_v1', CFG = 'jdr_cfg';
  var lsGet = function(k){ try { return localStorage.getItem(k) || ''; } catch(e){ return ''; } };
  var lsSet = function(k, v){ try { localStorage.setItem(k, v); } catch(e){} };
  var subs = [], list = null, state = 'off', who = '', fs = null, db = null, auth = null, au = null, unsub = null, starting = null;

  function ym(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function labelOf(age){ if (age <= 0) return ''; if (age <= 7) return '유치부'; if (age < 14) return (age - 7) + '학년'; return '중학생'; }
  function gradeOf(s){
    var a = (s.age > 0 && s.ageYear > 0) ? s.age + (new Date().getFullYear() - s.ageYear) : 0;
    var g = a > 0 ? labelOf(a) : String(s.grade || '').trim();
    if (/^중|^고|중고등/.test(g)) g = '중학생';
    if (g === '6~7세' || g === '7세' || g === '6세') g = '유치부';
    return g;
  }
  function normBelt(raw){
    var s = String(raw || '').trim().replace(/\s+/g, ' '); if (!s) return '';
    var m = s.match(/^(\d+)\s*품\s*(\d+)?\s*급?$/); if (m){ var p = +m[1]; return p + '품 ' + (m[2] ? +m[2] : p * 12) + '급'; }
    return s;
  }
  function cfgOf(){
    var tries = [CFG, 'tkd_attend_cfg_v1', 'jdpc_cfg'];
    for (var i = 0; i < tries.length; i++){ try { var c = JSON.parse(lsGet(tries[i]) || 'null'); if (c && c.apiKey && c.projectId) return c; } catch(e){} }
    return null;
  }
  function parseCode(code){
    code = String(code || '').trim(); if (code.indexOf('JD1-') !== 0) return null;
    try { var p = atob(code.slice(4).replace(/-/g, '+').replace(/_/g, '/')).split('|');
      return p[0] && p[1] ? { projectId: p[0], apiKey: p[1], storageBucket: p[2], authDomain: p[0] + '.firebaseapp.com' } : null; } catch(e){ return null; }
  }
  function emit(){
    var info = { state: state, who: who, month: ym(), count: list ? list.filter(function(s){ return !s.out; }).length : 0 };
    subs.forEach(function(f){ try { f(list || [], info); } catch(e){ console.warn('[JDR]', e); } });
    document.querySelectorAll('[data-jdr-chip]').forEach(paintChip);
  }
  function setState(s){ state = s; emit(); }

  function fromDocs(docs){
    var mk = ym(), L = [];
    docs.forEach(function(d){
      var x = d.data ? d.data() : d; var id = d.id; var nm = String(x.name || '').trim();
      if (!nm || x.demo) return;
      // 관장 · 사범 · 코치는 수련생이 아니에요 (모든 앱 명단에서 빠짐)
      if (x.staff === true || nm === '유종호' || /^(관장|부관장|사범|코치)$/.test(String(x.grade || '').trim())) return;
      var left = x.status === 'LEFT', lm = String(x.leftMonth || '');
      L.push({ id: id, name: nm, grade: gradeOf(x), belt: normBelt(x.belt), jump: String(x.jumpGrade || '').trim(),
        status: left ? 'LEFT' : 'ACTIVE', leftMonth: lm, out: left && (!lm || lm < mk),
        phones: Array.isArray(x.phones) ? x.phones.map(function(p){ return String(p || '').replace(/\D/g, ''); }).filter(Boolean) : [] });
    });
    L.sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });
    return L;
  }

  function loadCache(){
    try { var c = JSON.parse(lsGet(CACHE) || 'null'); if (c && Array.isArray(c.l)){
      // 캐시도 달이 바뀌면 퇴관 기준을 다시 계산
      var mk = ym(); c.l.forEach(function(s){ s.out = s.status === 'LEFT' && (!s.leftMonth || s.leftMonth < mk); });
      list = c.l; who = c.w || ''; return true; } } catch(e){}
    return false;
  }

  async function sdk(cfg){
    var mods = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    var app = mods[0].getApps().find(function(a){ return a.name === 'attend'; }) || mods[0].initializeApp(cfg, 'attend');
    au = mods[1]; fs = mods[2];
    auth = au.getAuth(app); db = fs.getFirestore(app);
  }
  function listen(){
    if (unsub) return;
    unsub = fs.onSnapshot(fs.collection(db, 'students'), function(snap){
      list = fromDocs(snap.docs); lsSet(CACHE, JSON.stringify({ t: Date.now(), w: who, l: list })); setState('live');
    }, function(e){ unsub = null; setState(list ? 'cache' : 'error'); console.warn('[JDR] 명단 읽기 실패', e && e.code); });
  }

  async function start(){
    if (starting) return starting;
    starting = (async function(){
      if (loadCache()) setState('cache');
      var cfg = cfgOf(); if (!cfg){ setState(list ? 'cache' : 'off'); return false; }
      try { await sdk(cfg); } catch(e){ setState(list ? 'cache' : 'error'); return false; }
      return await new Promise(function(res){
        var first = true;
        au.onAuthStateChanged(auth, function(u){
          who = u ? (u.email || '') : '';
          if (u){ listen(); if (state !== 'live') setState(list ? 'cache' : 'connecting'); }
          else { if (unsub){ unsub(); unsub = null; } setState(list ? 'cache' : 'login'); }
          if (first){ first = false; res(!!u); }
        });
      });
    })();
    return starting;
  }

  async function signIn(code, email, pw){
    var cfg = parseCode(code) || cfgOf();
    if (!cfg) throw new Error('연결 코드를 확인해 주세요 (JD1- 로 시작)');
    if (parseCode(code)) lsSet(CFG, JSON.stringify(cfg));
    if (!auth){ starting = null; await sdk(cfg); start(); }
    await au.signInWithEmailAndPassword(auth, email, pw);
  }

  async function write(id, data){
    if (!db || !auth || !auth.currentUser) throw new Error('출결 앱 연결이 필요해요');
    await fs.setDoc(fs.doc(db, 'students', id), data, { merge: true });
  }

  /* ---------- 상태 표시 칩 + 로그인 창 ---------- */
  function chipText(){
    var n = list ? list.filter(function(s){ return !s.out; }).length : 0;
    if (state === 'live') return '출결 명단 연동 · ' + n + '명';
    if (state === 'cache') return '출결 명단 (저장본) · ' + n + '명';
    if (state === 'connecting') return '출결 명단 연결 중…';
    if (state === 'login') return '출결 명단 · 로그인 필요';
    if (state === 'error') return '출결 명단 · 연결 실패';
    return '출결 명단 연결하기';
  }
  function paintChip(el){
    var ok = state === 'live';
    el.textContent = chipText();
    el.style.cssText = 'display:inline-flex;align-items:center;gap:6px;border:0;border-radius:999px;padding:6px 12px;font:700 12px/1.2 system-ui,sans-serif;cursor:pointer;' +
      (ok ? 'background:#e7f6ec;color:#17643a;' : state === 'cache' ? 'background:#fff4dc;color:#8a5a00;' : 'background:#eef1f6;color:#33405a;') + (el.dataset.jdrChipStyle || '');
  }
  function chip(target, extraStyle){
    var el = document.createElement('button'); el.type = 'button'; el.setAttribute('data-jdr-chip', '1');
    if (extraStyle) el.dataset.jdrChipStyle = extraStyle;
    el.onclick = function(e){ e.preventDefault(); e.stopPropagation(); sheet(); };
    paintChip(el);
    if (target) target.appendChild(el);
    return el;
  }
  function sheet(){
    if (document.getElementById('jdr-sheet')) return;
    var hasCfg = !!cfgOf(), live = state === 'live';
    var o = document.createElement('div'); o.id = 'jdr-sheet';
    o.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(10,14,24,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    var inp = 'width:100%;box-sizing:border-box;margin:4px 0 10px;padding:11px 12px;border:1px solid #cfd6e2;border-radius:10px;font-size:15px;color:#111;background:#fff';
    o.innerHTML = '<div style="background:#fff;color:#111;border-radius:16px;max-width:380px;width:100%;padding:20px 18px;box-shadow:0 20px 60px rgba(0,0,0,.35)">' +
      '<div style="font-weight:800;font-size:17px;margin-bottom:4px">출결 앱 명단 연결</div>' +
      '<div style="font-size:13px;color:#5a6478;margin-bottom:12px;line-height:1.5">출결 앱의 원생 명단을 그대로 따라가요. 퇴관한 원생은 다음 달부터 빠지고, 띠 · 줄넘기 급은 어디서 고쳐도 같이 바뀌어요.' +
      (live ? '<br><b style="color:#17643a">지금 연결돼 있어요 (' + (who || '') + ')</b>' : '') + '</div>' +
      (live ? '' :
        (hasCfg ? '' : '<label style="font-size:12px;font-weight:700;color:#33405a">연결 코드</label><input id="jdr-code" placeholder="JD1-…" style="' + inp + '">') +
        '<label style="font-size:12px;font-weight:700;color:#33405a">도장 계정 이메일</label><input id="jdr-em" type="email" autocomplete="username" style="' + inp + '">' +
        '<label style="font-size:12px;font-weight:700;color:#33405a">비밀번호</label><input id="jdr-pw" type="password" autocomplete="current-password" style="' + inp + '">') +
      '<div id="jdr-msg" style="min-height:18px;font-size:13px;color:#b42318;margin-bottom:8px"></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end">' +
      (live ? '<button id="jdr-out" style="border:1px solid #cfd6e2;background:#fff;color:#33405a;border-radius:10px;padding:10px 14px;font-weight:700">로그아웃</button>' : '') +
      '<button id="jdr-x" style="border:1px solid #cfd6e2;background:#fff;color:#33405a;border-radius:10px;padding:10px 14px;font-weight:700">닫기</button>' +
      (live ? '' : '<button id="jdr-go" style="border:0;background:#1f4fd8;color:#fff;border-radius:10px;padding:10px 16px;font-weight:800">연결</button>') +
      '</div></div>';
    document.body.appendChild(o);
    var q = function(id){ return o.querySelector('#' + id); };
    q('jdr-x').onclick = function(){ o.remove(); };
    o.onclick = function(e){ if (e.target === o) o.remove(); };
    if (q('jdr-out')) q('jdr-out').onclick = async function(){ try { await au.signOut(auth); } catch(e){} o.remove(); };
    if (q('jdr-go')) q('jdr-go').onclick = async function(){
      var msg = q('jdr-msg'); msg.style.color = '#33405a'; msg.textContent = '연결 중…';
      try { await signIn(q('jdr-code') ? q('jdr-code').value : '', q('jdr-em').value.trim(), q('jdr-pw').value); msg.textContent = '연결됐어요'; setTimeout(function(){ o.remove(); }, 500); }
      catch(e){ msg.style.color = '#b42318'; var c = (e && e.code) || ''; msg.textContent = /invalid|wrong|not-found/.test(c) ? '이메일 또는 비밀번호가 달라요' : (e.message || c); }
    };
  }

  window.JDR = {
    start: start,
    on: function(f){ subs.push(f); if (list) try { f(list, { state: state, who: who, month: ym(), count: list.filter(function(s){ return !s.out; }).length }); } catch(e){} start(); return function(){ subs = subs.filter(function(x){ return x !== f; }); }; },
    get list(){ return list || []; }, get state(){ return state; },
    active: function(){ return (list || []).filter(function(s){ return !s.out; }); },
    byName: function(n){ n = String(n || '').trim(); return (list || []).filter(function(s){ return s.name === n; }); },
    setBelt: function(id, belt){ return write(id, { belt: normBelt(belt), beltManual: true, beltAt: Date.now() }); },
    setJump: function(id, g){ return write(id, { jumpGrade: String(g || '').trim(), jumpAt: Date.now() }); },
    chip: chip, login: sheet, ym: ym, gradeOf: gradeOf, normBelt: normBelt
  };
})();
