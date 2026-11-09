(function () {
  'use strict';

  /* ================= أدوات ================= */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ESC[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseYmd(s) { var p = String(s).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function validYmd(s) { return /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(parseYmd(s).getTime()); }
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function weekStart(d) { return addDays(d, -d.getDay()); } /* الأسبوع يبدأ الأحد */
  function dayDiff(a, b) { return Math.round((Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 86400000); }
  function fmt(d, o) { try { return new Intl.DateTimeFormat('ar-OM-u-nu-latn', o).format(d); } catch (e) { return ymd(d); } }
  function hijri(d) { try { return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(d); } catch (e) { return ''; } }
  function dayNumber() { var t = today(); return Math.floor(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) / 86400000); }
  function relDay(n) {
    if (n === 0) return 'اليوم';
    if (n === 1) return 'غدا';
    if (n === 2) return 'بعد يومين';
    if (n > 2 && n <= 10) return 'بعد ' + n + ' أيام';
    if (n > 10) return 'بعد ' + n + ' يوما';
    return 'انتهى';
  }

  var C = window.MADAR_CONTENT;
  var OUT = (window.MADAR_OUTLINES && window.MADAR_OUTLINES.courses) || [];

  var ICON = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    schedule: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    tasks: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"/>',
    focus: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>',
    notes: '<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h6"/>',
    reflect: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    breaks: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h2a2 2 0 0 1 0 5h-2M8 3v3M12 3v3"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    back: '<path d="M9 6l6 6-6 6"/>'
  };
  function icon(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[n] + '</svg>'; }

  var ROUTES = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'schedule', label: 'الجدول' },
    { id: 'tasks', label: 'المهام' },
    { id: 'focus', label: 'التركيز' },
    { id: 'notes', label: 'الملاحظات' },
    { id: 'reflect', label: 'تأمل' },
    { id: 'breaks', label: 'استراحة' }
  ];
  var TYPES = { exam: 'اختبار', quiz: 'اختبار قصير', assignment: 'واجب', project: 'مشروع', lecture: 'محاضرة', other: 'موعد' };
  var NOTE_COLORS = ['', '#0e7a80', '#c08427', '#c2473d', '#2f8f5b', '#6168bd'];

  /* ================= البيانات والحفظ ================= */
  var KEYS = ['tasks', 'notes', 'events', 'prefs', 'stats', 'journal'];
  var DEFAULTS = {
    tasks: { items: [] },
    notes: { items: [] },
    events: { items: [] },
    prefs: { focus: 25, short: 5, long: 15, semesterStart: '', doneEvents: [] },
    stats: { days: {} },
    journal: { days: {} }
  };
  var S = {};
  function normalize(k, v) {
    var d = clone(DEFAULTS[k]);
    if (!v || typeof v !== 'object') return d;
    Object.keys(v).forEach(function (f) { d[f] = v[f]; });
    if ('items' in DEFAULTS[k] && !Array.isArray(d.items)) d.items = [];
    if ('days' in DEFAULTS[k] && (!d.days || typeof d.days !== 'object')) d.days = {};
    if (k === 'prefs') {
      if (!Array.isArray(d.doneEvents)) d.doneEvents = [];
      ['focus', 'short', 'long'].forEach(function (f) { d[f] = clampMin(d[f], DEFAULTS.prefs[f]); });
    }
    return d;
  }
  function clampMin(v, def) { v = Math.round(Number(v)); return (v >= 1 && v <= 180) ? v : def; }
  function localGet(k) { try { return JSON.parse(localStorage.getItem('madar:' + k)); } catch (e) { return null; } }
  function localSet(k) { try { localStorage.setItem('madar:' + k, JSON.stringify(S[k])); } catch (e) { /* التخزين المحلي غير متاح */ } }
  KEYS.forEach(function (k) { S[k] = normalize(k, localGet(k)); });

  var db = null, userId = null, remoteOK = false;
  var pending = {}, timers = {}, inflight = {}, lastRemote = {};
  var syncState = 'loading';

  function ref(k) { return db.doc('data/users/' + userId + '/' + k); }
  function setSync(st) {
    syncState = st;
    var text = {
      loading: 'جار الاتصال بحسابك…',
      synced: 'محفوظ في حسابك، ويظهر على كل أجهزتك',
      saving: 'جار الحفظ…',
      local: 'محفوظ على هذا الجهاز فقط'
    }[st];
    var side = $('#syncSide'), dot = $('#syncDot');
    if (side) { side.setAttribute('data-sync', st); side.innerHTML = '<i></i><span>' + text + '</span>'; }
    if (dot) { dot.setAttribute('data-sync', st); dot.title = text; }
  }
  function busy() { return KEYS.some(function (k) { return pending[k] || inflight[k]; }); }
  function save(k) {
    localSet(k);
    if (!remoteOK) return;
    pending[k] = true;
    clearTimeout(timers[k]);
    timers[k] = setTimeout(function () { flush(k); }, 900);
    setSync('saving');
  }
  function remoteFail(e) {
    var code = e && e.code;
    if (code === 'quota_exceeded') { toast('امتلأت مساحة الحفظ. احذف بعض الملاحظات القديمة.'); return; }
    remoteOK = false;
    setSync('local');
  }
  function flush(k) {
    if (!remoteOK || inflight[k]) return;
    pending[k] = false;
    var body = clone(S[k]);
    var json = JSON.stringify(body);
    inflight[k] = ref(k).set(body).catch(function (e) {
      if (e && e.code === 'unavailable') {
        return new Promise(function (r) { setTimeout(r, 1200 + Math.random() * 800); }).then(function () { return ref(k).set(body); });
      }
      throw e;
    }).then(function () { lastRemote[k] = json; }, remoteFail).then(function () {
      inflight[k] = null;
      if (pending[k] && remoteOK) flush(k);
      else if (remoteOK && !busy()) setSync('synced');
    });
  }
  function withTimeout(p, ms) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej({ code: 'timeout' }); }, ms);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function hasData(k) { return JSON.stringify(S[k]) !== JSON.stringify(DEFAULTS[k]); }
  function pull(first) {
    return withTimeout(Promise.all(KEYS.map(function (k) { return ref(k).get(); })), 10000).then(function (snaps) {
      var changed = false;
      remoteOK = true;
      KEYS.forEach(function (k, i) {
        if (pending[k] || inflight[k]) return;
        var s = snaps[i];
        if (s && s.exists) {
          var v = normalize(k, clone(s.data()));
          var json = JSON.stringify(v);
          lastRemote[k] = json;
          if (json !== JSON.stringify(S[k])) { S[k] = v; localSet(k); changed = true; }
        } else if (first && hasData(k)) {
          pending[k] = true; flush(k);
        }
      });
      if (!busy()) setSync('synced');
      return changed;
    });
  }
  function typing() {
    var a = document.activeElement;
    return !!a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  }
  function initRemote() {
    if (!window.claude || typeof window.claude.use !== 'function') { setSync('local'); return; }
    Promise.all([window.claude.use('db'), window.claude.use('user')]).then(function (r) {
      if (!r[0] || !r[1]) throw { code: 'absent' };
      db = r[0];
      return r[1].id();
    }).then(function (id) {
      if (!id) throw { code: 'absent' };
      userId = id;
      return pull(true);
    }).then(function (changed) {
      if (changed && !typing()) render();
    }).catch(function () { remoteOK = false; setSync('local'); });
  }
  var lastPull = Date.now();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') { KEYS.forEach(function (k) { if (pending[k]) { clearTimeout(timers[k]); flush(k); } }); return; }
    tick();
    if (!db || !userId || !remoteOK || busy() || Date.now() - lastPull < 30000) return;
    lastPull = Date.now();
    pull(false).then(function (changed) { if (changed && !typing()) render(); }).catch(function () { /* تبقى النسخة الحالية */ });
  });

  /* ================= حالة الواجهة ================= */
  var ui = {
    schedMode: 'weeks', schedCourse: 'all', showPast: false, gradedOnly: false,
    taskScope: 'daily',
    noteId: null, noteQuery: '', noteEditing: false,
    actCat: 'all', act: null,
    off: { v: 0, h: 0, w: 0 }
  };

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }
  function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').hidden = false; var b = $('#modalBox button, #modalBox a'); if (b) b.focus(); }
  function closeModal() { $('#modal').hidden = true; $('#modalBox').innerHTML = ''; }

  /* ================= المحتوى اليومي ================= */
  function daily(list, salt, off) {
    var n = list.length;
    return list[(((dayNumber() + salt + (off || 0)) % n) + n) % n];
  }
  function verseToday() { return daily(C.verses, 0, ui.off.v); }
  function hadithToday() { return daily(C.hadiths, 3, ui.off.h); }
  function wisdomToday() { return daily(C.wisdoms, 5, ui.off.w); }

  /* ================= المهام ================= */
  function periodKey(scope, d) {
    d = d || today();
    if (scope === 'daily') return ymd(d);
    if (scope === 'weekly') return ymd(weekStart(d));
    return d.getFullYear() + '-' + pad(d.getMonth() + 1);
  }
  function tasksFor(scope) {
    var key = periodKey(scope);
    return S.tasks.items.filter(function (t) {
      if (t.scope !== scope) return false;
      if (t.period === key) return true;
      return !t.done && t.period < key; /* غير المنجز يُرحّل إلى الفترة الحالية */
    });
  }
  function addTask(title, scope) {
    title = String(title || '').trim();
    if (!title) return false;
    S.tasks.items.push({ id: uid(), title: title.slice(0, 200), scope: scope, period: periodKey(scope), done: false });
    /* تنظيف المهام المنجزة القديمة جدا حتى لا يكبر الملف */
    var cutoff = ymd(addDays(today(), -120));
    S.tasks.items = S.tasks.items.filter(function (t) { return !(t.done && t.period < cutoff.slice(0, t.period.length)); });
    save('tasks');
    return true;
  }
  function taskRow(t, key) {
    var late = !t.done && t.period < key;
    return '<li class="task' + (t.done ? ' done' : '') + '">' +
      '<label><input type="checkbox" data-act="toggle-task" data-id="' + esc(t.id) + '"' + (t.done ? ' checked' : '') + '>' +
      '<span class="t">' + esc(t.title) + '</span></label>' +
      (late ? '<span class="pill">مرحّلة</span>' : '') +
      '<button class="icon-btn" data-act="del-task" data-id="' + esc(t.id) + '" aria-label="حذف المهمة">' + icon('trash') + '</button></li>';
  }
  function taskList(scope, emptyText) {
    var list = tasksFor(scope), key = periodKey(scope);
    if (!list.length) return '<div class="empty"><strong>لا مهام بعد</strong><span>' + emptyText + '</span></div>';
    list.sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
    return '<ul class="tasks">' + list.map(function (t) { return taskRow(t, key); }).join('') + '</ul>';
  }
  function progress(scope) {
    var list = tasksFor(scope), done = list.filter(function (t) { return t.done; }).length;
    return { done: done, total: list.length, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }

  /* ================= المواعيد ================= */
  function semStart() { return validYmd(S.prefs.semesterStart) ? weekStart(parseYmd(S.prefs.semesterStart)) : null; }
  function allEvents() {
    var list = [], sem = semStart();
    OUT.forEach(function (c) {
      (c.events || []).forEach(function (e, i) {
        var o = { id: 'o:' + c.code + ':' + i, course: c.code, title: e.title, type: TYPES[e.type] ? e.type : 'other', note: e.note || '', manual: false, weekly: false, date: '', end: '' };
        if (e.week >= 1) {
          o.weekly = true; o.week = e.week; o.weekEnd = e.weekEnd > e.week ? e.weekEnd : e.week;
          if (sem) { o.date = ymd(addDays(sem, (o.week - 1) * 7)); o.end = ymd(addDays(sem, (o.weekEnd - 1) * 7 + 6)); }
        } else if (validYmd(e.date)) { o.date = o.end = e.date; } else return;
        list.push(o);
      });
    });
    S.events.items.forEach(function (e) {
      if (!validYmd(e.date)) return;
      list.push({ id: e.id, course: e.course || '', title: e.title, type: TYPES[e.type] ? e.type : 'other', date: e.date, end: e.date, note: '', manual: true, weekly: false });
    });
    list.forEach(function (e, i) { e._k = (e.date || ('W' + pad(e.week))) + (e.weekly ? 'a' : 'b') + pad(e.week || 0); e._i = i; });
    list.sort(function (a, b) { return a._k < b._k ? -1 : a._k > b._k ? 1 : a._i - b._i; });
    return list;
  }
  function needSem(evs) { return !semStart() && evs.some(function (e) { return e.weekly; }); }
  function weeksAway(n) {
    var w = Math.ceil(n / 7);
    if (w <= 1) return 'الأسبوع القادم';
    if (w === 2) return 'بعد أسبوعين';
    return 'بعد ' + w + (w <= 10 ? ' أسابيع' : ' أسبوعا');
  }
  function courseNames(evs) {
    var seen = {}, out = [];
    evs.forEach(function (e) { if (e.course && !seen[e.course]) { seen[e.course] = 1; out.push(e.course); } });
    return out;
  }
  function eventRow(e) {
    var t = today(), dated = !!e.date, d = dated ? parseYmd(e.date) : null;
    var startN = dated ? dayDiff(d, t) : 0, endN = dated ? dayDiff(parseYmd(e.end), t) : 0;
    var past = dated && endN < 0;
    var done = S.prefs.doneEvents.indexOf(e.id) !== -1;
    var graded = e.type !== 'lecture' && e.type !== 'other';
    var when = '';
    if (dated && !past) {
      var txt = e.weekly ? (startN <= 0 ? (e.weekEnd > e.week ? 'جار الآن' : 'هذا الأسبوع') : weeksAway(startN)) : relDay(startN);
      var soon = graded && !done && (e.weekly ? startN <= 7 : startN <= 3);
      when = '<span class="when' + (soon ? ' soon' : '') + '">' + txt + '</span>';
    }
    var range = e.weekly && e.weekEnd > e.week;
    var cell = e.weekly
      ? '<span>الأسبوع</span><b' + (range ? ' style="font-size:1.02rem"' : '') + ' dir="ltr">' + e.week + (range ? '–' + e.weekEnd : '') + '</b>'
      : '<b>' + d.getDate() + '</b><span>' + esc(fmt(d, { weekday: 'short' })) + '</span>';
    return '<div class="ev ' + e.type + (past ? ' past' : '') + (done ? ' done' : '') + '">' +
      '<div class="ev-date">' + cell + '</div>' +
      '<div><div class="ev-title" dir="auto">' + esc(e.title) + '</div>' +
      '<div class="ev-meta"><span class="pill ' + e.type + '">' + TYPES[e.type] + '</span>' +
      (e.course ? '<span>' + esc(e.course) + '</span>' : '') + (e.note ? '<span>' + esc(e.note) + '</span>' : '') + '</div></div>' +
      '<div class="ev-side">' + when +
      '<input type="checkbox" data-act="toggle-event" data-id="' + esc(e.id) + '"' + (done ? ' checked' : '') + ' aria-label="تم">' +
      (e.manual ? '<button class="icon-btn" data-act="del-event" data-id="' + esc(e.id) + '" aria-label="حذف الموعد">' + icon('trash') + '</button>' : '') +
      '</div></div>';
  }

  /* ================= مؤقت بومودورو ================= */
  var MODES = { focus: 'تركيز', short: 'استراحة قصيرة', long: 'استراحة طويلة' };
  var T = { mode: 'focus', running: false, endAt: 0, left: 0, round: 0, task: '' };
  T.left = S.prefs.focus * 60000;
  var audio = null;
  function modeMs(m) { return S.prefs[m] * 60000; }
  function leftMs() { return T.running ? Math.max(0, T.endAt - Date.now()) : T.left; }
  function clock(ms) { var s = Math.ceil(ms / 1000); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
  function beep() {
    if (!audio) return;
    try {
      [0, 0.35, 0.7].forEach(function (at, i) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.type = 'sine'; o.frequency.value = i === 2 ? 880 : 660;
        g.gain.setValueAtTime(0.0001, audio.currentTime + at);
        g.gain.exponentialRampToValueAtTime(0.25, audio.currentTime + at + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + at + 0.3);
        o.connect(g); g.connect(audio.destination);
        o.start(audio.currentTime + at); o.stop(audio.currentTime + at + 0.32);
      });
    } catch (e) { /* الصوت غير متاح */ }
  }
  function startTimer() {
    try {
      if (!audio) { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); }
      if (audio && audio.state === 'suspended') audio.resume();
    } catch (e) { audio = null; }
    if (T.left <= 0) T.left = modeMs(T.mode);
    T.endAt = Date.now() + T.left;
    T.running = true;
    paintTimer();
  }
  function pauseTimer() { T.left = leftMs(); T.running = false; paintTimer(); }
  function setMode(m) { T.mode = m; T.running = false; T.left = modeMs(m); paintTimer(); }
  function finishTimer() {
    T.running = false;
    beep();
    if (T.mode === 'focus') {
      var k = ymd(today());
      S.stats.days[k] = (S.stats.days[k] || 0) + 1;
      var keys = Object.keys(S.stats.days).sort();
      while (keys.length > 120) delete S.stats.days[keys.shift()];
      save('stats');
      T.round += 1;
      var next = T.round % 4 === 0 ? 'long' : 'short';
      T.mode = next; T.left = modeMs(next);
      var a = pickActivity('all');
      openModal('<span class="kicker">انتهت جلسة التركيز</span><h2>أحسنت. خذ ' + S.prefs[next] + ' دقائق استراحة</h2>' +
        '<p class="muted">اقتراح لهذه الاستراحة:</p><p class="act-title">' + esc(a.t) + '</p><p>' + esc(a.d) + '</p>' +
        '<div class="row"><button class="btn pri" data-act="modal-break">ابدأ الاستراحة</button>' +
        '<a class="btn" href="#breaks" data-act="close-modal">أنشطة أخرى</a>' +
        '<button class="btn ghost" data-act="close-modal">إغلاق</button></div>');
    } else {
      T.mode = 'focus'; T.left = modeMs('focus');
      openModal('<span class="kicker">انتهت الاستراحة</span><h2>جاهز لجلسة جديدة؟</h2>' +
        '<div class="row"><button class="btn pri" data-act="modal-focus">ابدأ التركيز</button>' +
        '<button class="btn ghost" data-act="close-modal">ليس الآن</button></div>');
    }
    if (route() === 'focus' || route() === 'home') render(); else paintTimer();
  }
  var CIRC = 2 * Math.PI * 148;
  function paintTimer() {
    var ms = leftMs(), total = modeMs(T.mode), frac = total ? Math.min(1, Math.max(0, 1 - ms / total)) : 0;
    var mini = $('#miniTimer');
    if (mini) {
      var show = T.running || (ms < total && ms > 0);
      mini.hidden = !show || route() === 'focus';
      mini.className = 'mini-timer num' + (T.mode === 'focus' ? '' : ' brk');
      mini.textContent = MODES[T.mode] + '  ' + clock(ms);
    }
    var time = $('#dialTime');
    if (!time) return;
    time.textContent = clock(ms);
    $('#dialLabel').textContent = MODES[T.mode] + (T.running ? '' : (ms < total ? ' · متوقف' : ''));
    $('#dialProg').style.strokeDashoffset = String(CIRC * (1 - frac));
    var ang = frac * 2 * Math.PI, orb = $('#dialOrb');
    orb.setAttribute('cx', String(160 + 148 * Math.cos(ang)));
    orb.setAttribute('cy', String(160 + 148 * Math.sin(ang)));
    $('#dial').className = 'dial' + (T.mode === 'focus' ? '' : ' brk');
    var b = $('#timerToggle');
    if (b) b.textContent = T.running ? 'إيقاف مؤقت' : (ms < total ? 'متابعة' : 'ابدأ');
    $$('[data-act="set-mode"]').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-mode') === T.mode); });
  }
  function tick() {
    if (!T.running) return;
    if (Date.now() >= T.endAt) finishTimer(); else paintTimer();
  }
  setInterval(tick, 250);

  /* ================= الاستراحة ================= */
  function pickActivity(cat, avoid) {
    var list = C.activities.filter(function (a) { return cat === 'all' || a.c === cat; });
    if (list.length > 1 && avoid) list = list.filter(function (a) { return a !== avoid; });
    return list[Math.floor(Math.random() * list.length)];
  }
  var breath = { on: false, timer: null, step: 0 };
  var BREATH = [['شهيق', true], ['احبس', true], ['زفير', false], ['احبس', false]];
  function breathStep() {
    var ball = $('#breathBall'), word = $('#breathWord');
    if (!ball || !breath.on) { stopBreath(); return; }
    if (breath.step >= 16) { stopBreath(); word.textContent = 'انتهى التمرين. كيف تشعر الآن؟'; return; }
    var p = BREATH[breath.step % 4];
    word.textContent = p[0];
    ball.classList.toggle('big', p[1]);
    breath.step += 1;
    breath.timer = setTimeout(breathStep, 4000);
  }
  function stopBreath() {
    breath.on = false; clearTimeout(breath.timer);
    var ball = $('#breathBall'), btn = $('#breathBtn');
    if (ball) ball.classList.remove('big');
    if (btn) btn.textContent = 'ابدأ التمرين';
  }
  var MEM_SYMBOLS = ['☾', '✦', '❖', '✿', '☀', '♠', '♦', '♥'];
  var mem = null;
  function newMem() {
    var deck = MEM_SYMBOLS.concat(MEM_SYMBOLS).map(function (s) { return { s: s, up: false, ok: false }; });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = deck[i]; deck[i] = deck[j]; deck[j] = x; }
    mem = { deck: deck, open: [], moves: 0, lock: false };
  }
  function memHtml() {
    if (!mem) newMem();
    var left = mem.deck.filter(function (c) { return !c.ok; }).length;
    return '<div class="mem">' + mem.deck.map(function (c, i) {
      return '<button data-act="mem" data-i="' + i + '" class="' + (c.ok ? 'ok' : c.up ? 'up' : '') + '" aria-label="' + (c.up || c.ok ? c.s : 'بطاقة مقلوبة') + '">' + (c.up || c.ok ? c.s : '') + '</button>';
    }).join('') + '</div>' +
      '<p class="small muted" style="text-align:center">' + (left ? 'المحاولات: <span class="num">' + mem.moves + '</span>' : 'أنهيت اللعبة في <span class="num">' + mem.moves + '</span> محاولة') + '</p>';
  }
  function memClick(i) {
    var c = mem.deck[i];
    if (mem.lock || c.up || c.ok) return;
    c.up = true; mem.open.push(i);
    if (mem.open.length === 2) {
      mem.moves += 1;
      var a = mem.deck[mem.open[0]], b = mem.deck[mem.open[1]];
      if (a.s === b.s) { a.ok = b.ok = true; mem.open = []; }
      else {
        mem.lock = true;
        setTimeout(function () { a.up = b.up = false; mem.open = []; mem.lock = false; var g = $('#memWrap'); if (g) g.innerHTML = memHtml(); }, 800);
      }
    }
    $('#memWrap').innerHTML = memHtml();
  }

  /* ================= الصفحات ================= */
  function route() {
    var h = (location.hash || '').replace('#', '');
    return ROUTES.some(function (r) { return r.id === h; }) ? h : 'home';
  }
  function head(title, sub, extra) {
    return '<div class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (extra || '') + '</div>';
  }

  var PAGES = {};

  PAGES.home = function () {
    var h = new Date().getHours();
    var greet = h < 12 ? 'صباح الخير' : h < 17 ? 'طاب نهارك' : 'مساء الخير';
    var v = verseToday(), hd = hadithToday(), w = wisdomToday();
    var p = progress('daily');
    var sessions = S.stats.days[ymd(today())] || 0;
    var tk = ymd(today());
    var evAll = allEvents(), askSem = needSem(evAll);
    var upcoming = evAll.filter(function (e) { return e.date && e.end >= tk && e.type !== 'lecture' && S.prefs.doneEvents.indexOf(e.id) === -1; }).slice(0, 4);
    if (!ui.act) ui.act = pickActivity('all');
    return '<div class="page">' +
      head(greet, 'هذا يومك. ابدأ بآية، ثم بمهمة واحدة.') +
      '<section class="hero"><div class="eyebrow"><span>آية اليوم</span><span>' + esc(hijri(new Date())) + '</span></div>' +
      '<p class="verse">﴿ ' + esc(v.t) + ' ﴾</p><span class="src">' + esc(v.s) + '</span>' +
      '<a href="#reflect">تأمل فيها واكتب خاطرتك</a></section>' +
      '<div class="grid g2">' +
      '<section class="card"><span class="kicker">حديث اليوم</span><p class="quote">«' + esc(hd.t) + '»</p><span class="quote-src">' + esc(hd.s) + '</span></section>' +
      '<section class="card"><span class="kicker">حكمة اليوم</span><p class="quote">' + esc(w.t) + '</p><span class="quote-src">' + esc(w.s) + '</span></section>' +
      '</div>' +
      '<div class="grid g2">' +
      '<section class="card"><div class="card-head"><h2>مهام اليوم</h2><a href="#tasks">كل المهام</a></div>' +
      (p.total ? '<div class="bar" aria-hidden="true"><span style="width:' + p.pct + '%"></span></div><span class="small muted">أنجزت <span class="num">' + p.done + '</span> من <span class="num">' + p.total + '</span></span>' : '') +
      taskList('daily', 'أضف أول مهمة لهذا اليوم من الحقل في الأسفل.') +
      '<form class="row" data-form="task" data-scope="daily"><input class="field" id="homeTask" name="title" maxlength="200" placeholder="مهمة جديدة لليوم" aria-label="مهمة جديدة لليوم"><button class="btn pri">إضافة</button></form></section>' +
      '<section class="card"><div class="card-head"><h2>المواعيد القادمة</h2><a href="#schedule">الجدول كاملا</a></div>' +
      (upcoming.length ? '<div class="group">' + upcoming.map(eventRow).join('') + '</div>'
        : askSem ? '<div class="empty"><strong>حدد بداية الفصل</strong><span>مواعيد موادك جاهزة بأرقام الأسابيع. أدخل تاريخ أول يوم في الفصل لتظهر هنا بتواريخها.</span><a class="btn pri sm" href="#schedule">افتح الجدول</a></div>'
        : '<div class="empty"><strong>لا مواعيد قادمة</strong><span>لا اختبارات ولا واجبات قادمة مسجلة.</span></div>') +
      '</section></div>' +
      '<div class="grid g2">' +
      '<section class="card"><div class="card-head"><h2>التركيز</h2><span class="small muted">جلسات اليوم: <span class="num">' + sessions + '</span></span></div>' +
      '<p class="muted">جلسة ' + S.prefs.focus + ' دقيقة ثم استراحة ' + S.prefs.short + ' دقائق.</p>' +
      '<div class="row"><a class="btn pri" href="#focus">افتح المؤقت</a></div></section>' +
      '<section class="card"><div class="card-head"><h2>نشاط لوقت الفراغ</h2><a href="#breaks">كل الأنشطة</a></div>' +
      '<p class="act-title">' + esc(ui.act.t) + '</p><p class="muted">' + esc(ui.act.d) + ' · ' + ui.act.m + ' د</p>' +
      '<div class="row"><button class="btn" data-act="new-act">اقتراح آخر</button></div></section>' +
      '</div></div>';
  };

  PAGES.schedule = function () {
    var evs = allEvents(), names = courseNames(evs), t = today(), sem = semStart(), ask = needSem(evs);
    if (ui.schedCourse !== 'all' && names.indexOf(ui.schedCourse) === -1) ui.schedCourse = 'all';
    var cutoff = ui.schedMode === 'weeks' ? ymd(weekStart(t)) : ymd(new Date(t.getFullYear(), t.getMonth(), 1));
    function inFilter(e) {
      if (ui.schedCourse !== 'all' && e.course !== ui.schedCourse) return false;
      return !(ui.gradedOnly && (e.type === 'lecture' || e.type === 'other'));
    }
    var shown = evs.filter(function (e) { return inFilter(e) && (!e.date || ui.showPast || e.end >= cutoff); });
    var hiddenPast = evs.filter(function (e) { return inFilter(e) && e.date && e.end < cutoff; }).length;
    var groups = [], map = {};
    shown.forEach(function (e) {
      var key, label, cur = false;
      if (!e.date) {
        key = 'W' + pad(e.week); label = 'الأسبوع ' + e.week;
      } else if (ui.schedMode === 'weeks') {
        var d = parseYmd(e.date), ws = weekStart(d), we = addDays(ws, 6);
        if (e.date < cutoff && !ui.showPast) { ws = weekStart(t); we = addDays(ws, 6); }
        key = ymd(ws);
        label = fmt(ws, { day: 'numeric', month: 'long' }) + ' – ' + fmt(we, { day: 'numeric', month: 'long' });
        if (sem) { var wn = Math.floor(dayDiff(ws, sem) / 7) + 1; if (wn >= 1) label = 'الأسبوع ' + wn + ' · ' + label; }
        cur = key === ymd(weekStart(t));
      } else {
        var dm = parseYmd(e.date < cutoff && !ui.showPast ? cutoff : e.date);
        key = ymd(dm).slice(0, 7);
        label = fmt(dm, { month: 'long', year: 'numeric' });
        cur = key === ymd(t).slice(0, 7);
      }
      if (!map[key]) { map[key] = { key: key, label: label, cur: cur, list: [] }; groups.push(map[key]); }
      map[key].list.push(e);
    });
    groups.sort(function (x, y) { return x.key < y.key ? -1 : x.key > y.key ? 1 : 0; });
    var body;
    if (!evs.length) {
      body = '<div class="empty"><strong>الجدول فارغ الآن</strong><span>أضف موعدا من النموذج في الأسفل.</span></div>';
    } else if (!groups.length) {
      body = '<div class="empty"><strong>لا مواعيد هنا</strong><span>لا مواعيد قادمة بهذه التصفية.</span></div>';
    } else {
      body = groups.map(function (g) {
        var n = g.list.length;
        return '<section class="group"><div class="group-head' + (g.cur ? ' cur' : '') + '"><h2>' + esc(g.label) + '</h2>' +
          (g.cur ? '<span class="pill now">' + (ui.schedMode === 'weeks' ? 'هذا الأسبوع' : 'هذا الشهر') + '</span>' : '') +
          '<span class="small muted num">' + (n === 1 ? 'موعد واحد' : n === 2 ? 'موعدان' : n <= 10 ? n + ' مواعيد' : n + ' موعدا') + '</span></div>' +
          g.list.map(eventRow).join('') + '</section>';
      }).join('');
    }
    var opts = Object.keys(TYPES).map(function (k) { return '<option value="' + k + '">' + TYPES[k] + '</option>'; }).join('');
    var semInput = '<input class="field" id="semStart" type="date" value="' + esc(S.prefs.semesterStart || '') + '" aria-label="تاريخ بداية الفصل" style="max-width:220px">';
    return '<div class="page">' +
      head('الجدول', 'مواعيد موادك مرتبة حسب الأسابيع أو الشهور.',
        '<div class="seg" role="group" aria-label="طريقة العرض"><button data-act="sched-mode" data-mode="weeks" class="' + (ui.schedMode === 'weeks' ? 'on' : '') + '">أسابيع</button><button data-act="sched-mode" data-mode="months" class="' + (ui.schedMode === 'months' ? 'on' : '') + '">شهور</button></div>') +
      (ask ? '<section class="card notice"><h2>متى بدأ الفصل الدراسي؟</h2><p class="muted">ملفات الأوتلاين تذكر أرقام الأسابيع فقط. اختر تاريخ أول يوم دراسي في الفصل ليحسب الموقع تاريخ كل أسبوع ويرتب المواعيد حسب الشهور.</p><div class="row">' + semInput + '</div></section>' : '') +
      '<div class="chips"><button class="chip' + (ui.schedCourse === 'all' ? ' on' : '') + '" data-act="sched-course" data-course="all">كل المواد</button>' +
      names.map(function (n) { return '<button class="chip' + (ui.schedCourse === n ? ' on' : '') + '" data-act="sched-course" data-course="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') +
      '<button class="chip' + (ui.gradedOnly ? ' on' : '') + '" data-act="graded-only" aria-pressed="' + (ui.gradedOnly ? 'true' : 'false') + '">الاختبارات والواجبات فقط</button></div>' +
      body +
      (hiddenPast || ui.showPast ? '<div><button class="btn sm ghost" data-act="toggle-past">' + (ui.showPast ? 'إخفاء المواعيد السابقة' : 'إظهار المواعيد السابقة (' + hiddenPast + ')') + '</button></div>' : '') +
      '<section class="card"><h2>إضافة موعد</h2>' +
      '<form class="row" data-form="event">' +
      '<input class="field" id="evTitle" name="title" maxlength="120" placeholder="العنوان، مثل: اختبار منتصف الفصل" aria-label="عنوان الموعد" required>' +
      '<input class="field" id="evCourse" name="course" maxlength="60" placeholder="المادة" aria-label="المادة" list="courseList">' +
      '<datalist id="courseList">' + names.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<select class="field" id="evType" name="type" aria-label="نوع الموعد">' + opts + '</select>' +
      '<input class="field" id="evDate" name="date" type="date" aria-label="التاريخ" required>' +
      '<button class="btn pri">إضافة</button></form></section>' +
      (ask ? '' : '<section class="card"><h2>بداية الفصل الدراسي</h2><p class="muted small">تاريخ أول يوم دراسي في الفصل. منه يحسب الموقع تاريخ كل أسبوع في الأوتلاين.</p><div class="row">' + semInput + '</div></section>') +
      '</div>';
  };

  PAGES.tasks = function () {
    var sc = ui.taskScope, p = progress(sc), t = today();
    var names = { daily: 'اليومية', weekly: 'الأسبوعية', monthly: 'الشهرية' };
    var period = sc === 'daily' ? fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })
      : sc === 'weekly' ? fmt(weekStart(t), { day: 'numeric', month: 'long' }) + ' – ' + fmt(addDays(weekStart(t), 6), { day: 'numeric', month: 'long' })
        : fmt(t, { month: 'long', year: 'numeric' });
    var ph = { daily: 'مهمة لهذا اليوم', weekly: 'مهمة لهذا الأسبوع', monthly: 'هدف لهذا الشهر' }[sc];
    return '<div class="page">' +
      head('المهام', 'قسّم عملك إلى يومي وأسبوعي وشهري. ما لم يُنجز ينتقل تلقائيا إلى الفترة التالية.',
        '<div class="seg" role="group" aria-label="نوع المهام">' + ['daily', 'weekly', 'monthly'].map(function (k) {
          var c = tasksFor(k).filter(function (x) { return !x.done; }).length;
          return '<button data-act="task-scope" data-scope="' + k + '" class="' + (sc === k ? 'on' : '') + '">' + names[k] + (c ? ' <span class="num">(' + c + ')</span>' : '') + '</button>';
        }).join('') + '</div>') +
      '<section class="card"><div class="card-head"><h2>' + esc(period) + '</h2><span class="small muted">أنجزت <span class="num">' + p.done + '</span> من <span class="num">' + p.total + '</span></span></div>' +
      '<div class="bar" aria-hidden="true"><span style="width:' + p.pct + '%"></span></div>' +
      '<form class="row" data-form="task" data-scope="' + sc + '"><input class="field" id="taskNew" name="title" maxlength="200" placeholder="' + ph + '" aria-label="' + ph + '"><button class="btn pri">إضافة</button></form>' +
      taskList(sc, 'اكتب المهمة في الحقل أعلاه واضغط إضافة.') +
      '</section></div>';
  };

  PAGES.focus = function () {
    var t = today(), bars = [], max = 1, i;
    for (i = 6; i >= 0; i--) { var d = addDays(t, -i), n = S.stats.days[ymd(d)] || 0; if (n > max) max = n; bars.push({ d: d, n: n, today: i === 0 }); }
    var sessions = S.stats.days[ymd(t)] || 0, inCycle = T.round % 4, dots = '';
    for (i = 0; i < 4; i++) dots += '<i class="' + (i < inCycle ? 'on' : '') + '"></i>';
    var open = S.tasks.items.filter(function (x) { return !x.done; });
    return '<div class="page">' +
      head('التركيز', 'تقنية بومودورو: جلسة تركيز ثم استراحة قصيرة، وبعد أربع جلسات استراحة طويلة.') +
      '<div class="focus-wrap">' +
      '<section class="card dial-card">' +
      '<div class="seg" role="group" aria-label="نوع الجلسة">' + Object.keys(MODES).map(function (m) { return '<button data-act="set-mode" data-mode="' + m + '">' + MODES[m] + '</button>'; }).join('') + '</div>' +
      '<div class="dial" id="dial"><svg viewBox="0 0 320 320" aria-hidden="true"><circle class="track" cx="160" cy="160" r="148"></circle>' +
      '<circle class="prog" id="dialProg" cx="160" cy="160" r="148" stroke-dasharray="' + CIRC + '" stroke-dashoffset="' + CIRC + '"></circle>' +
      '<circle class="orb" id="dialOrb" cx="308" cy="160" r="9"></circle></svg>' +
      '<div class="dial-in"><span class="dial-time" id="dialTime" role="timer">25:00</span><span class="dial-label" id="dialLabel"></span></div></div>' +
      '<div class="dots" title="موقعك في دورة الجلسات الأربع">' + dots + '</div>' +
      '<div class="row" style="justify-content:center"><button class="btn pri" id="timerToggle" data-act="timer-toggle" style="min-width:140px">ابدأ</button><button class="btn" data-act="timer-reset">إعادة</button></div>' +
      '<div class="row" style="width:100%"><select class="field" id="focusTask" aria-label="المهمة التي تعمل عليها"><option value="">على ماذا تعمل الآن؟ (اختياري)</option>' +
      open.map(function (x) { return '<option value="' + esc(x.id) + '"' + (T.task === x.id ? ' selected' : '') + '>' + esc(x.title) + '</option>'; }).join('') + '</select></div>' +
      '</section>' +
      '<div class="grid">' +
      '<section class="card"><div class="card-head"><h2>آخر سبعة أيام</h2><span class="small muted">اليوم: <span class="num">' + sessions + '</span> جلسة</span></div>' +
      '<div class="week-bars">' + bars.map(function (b) {
        return '<div class="col' + (b.today ? ' today' : '') + '"><span class="v">' + b.n + '</span><div class="b" style="height:' + Math.round(b.n / max * 100) + '%"></div><span>' + esc(fmt(b.d, { weekday: 'short' })) + '</span></div>';
      }).join('') + '</div></section>' +
      '<section class="card"><h2>مدة الجلسات بالدقائق</h2><div class="dur">' +
      '<label for="durFocus">تركيز<input class="field num" id="durFocus" data-dur="focus" type="number" min="1" max="180" value="' + S.prefs.focus + '"></label>' +
      '<label for="durShort">استراحة قصيرة<input class="field num" id="durShort" data-dur="short" type="number" min="1" max="180" value="' + S.prefs.short + '"></label>' +
      '<label for="durLong">استراحة طويلة<input class="field num" id="durLong" data-dur="long" type="number" min="1" max="180" value="' + S.prefs.long + '"></label>' +
      '</div><p class="small muted">ينبهك الموقع بصوت عند انتهاء الجلسة ما دامت الصفحة مفتوحة.</p></section>' +
      '</div></div></div>';
  };

  function noteById(id) { return S.notes.items.filter(function (n) { return n.id === id; })[0] || null; }
  function noteListHtml() {
    var q = ui.noteQuery.trim().toLowerCase();
    var list = S.notes.items.slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
    if (q) list = list.filter(function (n) { return (n.title + ' ' + n.body).toLowerCase().indexOf(q) !== -1; });
    if (!list.length) return '<div class="empty"><strong>' + (q ? 'لا نتائج' : 'لا ملاحظات بعد') + '</strong><span>' + (q ? 'جرّب كلمة أخرى.' : 'اضغط «ملاحظة جديدة» لتبدأ.') + '</span></div>';
    return list.map(function (n) {
      return '<button class="note-item' + (n.id === ui.noteId ? ' on' : '') + '" data-act="open-note" data-id="' + esc(n.id) + '"' + (n.color ? ' style="--c:' + esc(n.color) + '"' : '') + '>' +
        '<b>' + esc(n.title || 'بلا عنوان') + '</b><span>' + esc((n.body || '').replace(/\s+/g, ' ').slice(0, 60) || 'فارغة') + '</span>' +
        '<span class="num">' + esc(fmt(new Date(n.updated || Date.now()), { day: 'numeric', month: 'short' })) + '</span></button>';
    }).join('');
  }
  function noteEditorHtml() {
    var n = noteById(ui.noteId);
    if (!n) return '<div class="empty"><strong>اختر ملاحظة</strong><span>أو أنشئ ملاحظة جديدة لتكتب فيها.</span></div>';
    return '<div class="card-head"><button class="btn sm back-notes" data-act="notes-back">' + icon('back') + ' القائمة</button>' +
      '<div class="swatches" role="group" aria-label="لون الملاحظة">' + NOTE_COLORS.map(function (c) {
        return '<button data-act="note-color" data-color="' + c + '" class="' + ((n.color || '') === c ? 'on' : '') + '" style="--c:' + (c || 'var(--surface-2)') + '" aria-label="' + (c ? 'لون' : 'بلا لون') + '"></button>';
      }).join('') + '</div>' +
      '<button class="icon-btn" data-act="del-note" aria-label="حذف الملاحظة">' + icon('trash') + '</button></div>' +
      '<input class="note-title" id="noteTitle" maxlength="120" placeholder="العنوان" aria-label="عنوان الملاحظة" value="' + esc(n.title) + '">' +
      '<textarea class="note-body" id="noteBody" maxlength="20000" placeholder="اكتب ملاحظتك هنا…" aria-label="نص الملاحظة">' + esc(n.body) + '</textarea>';
  }
  PAGES.notes = function () {
    if (ui.noteId && !noteById(ui.noteId)) ui.noteId = null;
    if (!ui.noteId && S.notes.items.length) ui.noteId = S.notes.items.slice().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); })[0].id;
    return '<div class="page">' +
      head('الملاحظات', 'دوّن ما تحتاجه من المحاضرات والأفكار. تُحفظ تلقائيا وأنت تكتب.',
        '<button class="btn pri" data-act="new-note">ملاحظة جديدة</button>') +
      '<div class="notes' + (ui.noteEditing ? ' editing' : '') + '" id="notesWrap">' +
      '<div class="notes-side grid" style="gap:10px"><input class="field" id="noteSearch" type="search" placeholder="ابحث في الملاحظات" aria-label="ابحث في الملاحظات" value="' + esc(ui.noteQuery) + '">' +
      '<div class="note-list" id="noteList">' + noteListHtml() + '</div></div>' +
      '<section class="card notes-editor" id="noteEditor">' + noteEditorHtml() + '</section>' +
      '</div></div>';
  };

  PAGES.reflect = function () {
    var v = verseToday(), hd = hadithToday(), w = wisdomToday(), k = ymd(today());
    var past = Object.keys(S.journal.days).filter(function (d) { return d !== k && S.journal.days[d]; }).sort().reverse().slice(0, 7);
    return '<div class="page">' +
      head('تأمل', 'آية وحديث وحكمة تتغير تلقائيا مع بداية كل يوم. اقرأ بهدوء، ثم اكتب ما خطر لك.') +
      '<section class="hero"><div class="eyebrow"><span>آية اليوم</span><span>' + esc(hijri(new Date())) + '</span></div>' +
      '<p class="verse">﴿ ' + esc(v.t) + ' ﴾</p><span class="src">' + esc(v.s) + '</span>' +
      '</section>' +
      '<div class="grid g2">' +
      '<section class="card"><span class="kicker">حديث شريف</span><p class="quote">«' + esc(hd.t) + '»</p><span class="quote-src">' + esc(hd.s) + '</span></section>' +
      '<section class="card"><span class="kicker">حكمة</span><p class="quote">' + esc(w.t) + '</p><span class="quote-src">' + esc(w.s) + '</span></section>' +
      '</div>' +
      '<section class="card"><h2>خاطرة اليوم</h2><p class="muted small">ماذا تعني لك هذه الآية اليوم؟ وكيف تعمل بها قبل أن ينتهي النهار؟</p>' +
      '<textarea class="field" id="journal" rows="5" maxlength="4000" placeholder="اكتب خاطرتك…" aria-label="خاطرة اليوم">' + esc(S.journal.days[k] || '') + '</textarea></section>' +
      (past.length ? '<section class="card"><h2>خواطر سابقة</h2>' + past.map(function (d) {
        return '<details class="story"><summary>' + esc(fmt(parseYmd(d), { weekday: 'long', day: 'numeric', month: 'long' })) + '</summary><p style="white-space:pre-wrap">' + esc(S.journal.days[d]) + '</p></details>';
      }).join('') + '</section>' : '') +
      '<p class="small muted">نصوص الآيات مكتوبة بلا تشكيل. للتلاوة ارجع إلى المصحف.</p>' +
      '</div>';
  };

  PAGES.breaks = function () {
    if (!ui.act || (ui.actCat !== 'all' && ui.act.c !== ui.actCat)) ui.act = pickActivity(ui.actCat);
    var a = ui.act;
    return '<div class="page">' +
      head('استراحة', 'أنشطة قصيرة تخفف ضغط الاختبارات. اختر واحدا وعد بعدها إلى مذاكرتك.') +
      '<section class="card"><div class="chips">' + C.categories.map(function (c) {
        return '<button class="chip' + (ui.actCat === c.id ? ' on' : '') + '" data-act="act-cat" data-cat="' + c.id + '">' + c.label + '</button>';
      }).join('') + '</div>' +
      '<span class="kicker">اقتراح · <span class="num">' + a.m + '</span> د</span><p class="act-title">' + esc(a.t) + '</p><p class="muted">' + esc(a.d) + '</p>' +
      '<div class="row"><button class="btn pri" data-act="new-act">اقتراح آخر</button>' +
      (a.anchor ? '<button class="btn" data-act="scroll-to" data-target="' + a.anchor + '">انتقل إليه</button>' : '') + '</div></section>' +
      '<div class="grid g2">' +
      '<section class="card" id="breath"><h2>تمرين التنفس</h2><p class="muted small">أربع دورات، كل مرحلة أربع ثوان. يهدئ التوتر قبل الاختبار.</p>' +
      '<div class="breath"><div class="breath-stage"><div class="breath-ball" id="breathBall"></div></div><div class="breath-word" id="breathWord" aria-live="polite"></div>' +
      '<button class="btn pri" id="breathBtn" data-act="breath">ابدأ التمرين</button></div></section>' +
      '<section class="card" id="game"><div class="card-head"><h2>لعبة الذاكرة</h2><button class="btn sm" data-act="mem-new">لعبة جديدة</button></div>' +
      '<div id="memWrap">' + memHtml() + '</div></section>' +
      '</div>' +
      '<section class="card" id="stories"><h2>قصص قصيرة</h2>' + C.stories.map(function (s) {
        return '<details class="story"><summary>' + esc(s.title) + '<span><span class="num">' + s.mins + '</span> د قراءة</span></summary>' + s.body.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</details>';
      }).join('') + '</section>' +
      '</div>';
  };

  /* ================= العرض ================= */
  function renderNav() {
    var r = route();
    var html = ROUTES.map(function (x) {
      return '<a class="nav-link' + (x.id === r ? ' on' : '') + '" href="#' + x.id + '"' + (x.id === r ? ' aria-current="page"' : '') + '>' + icon(x.id) + '<span>' + x.label + '</span></a>';
    }).join('');
    $('#sideNav').innerHTML = html;
    $('#tabbar').innerHTML = html;
  }
  function render() {
    var r = route();
    stopBreath();
    renderNav();
    $('#topDate').textContent = fmt(new Date(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#view').innerHTML = PAGES[r]();
    paintTimer();
  }
  function rerenderKeepScroll() { var v = $('#view'), s = v.scrollTop; render(); v.scrollTop = s; }

  /* ================= الأحداث ================= */
  document.addEventListener('click', function (ev) {
    if (ev.target.id === 'modal') { closeModal(); return; }
    var el = ev.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    switch (act) {
      case 'toggle-task':
        S.tasks.items.forEach(function (t) { if (t.id === id) { t.done = el.checked; } });
        save('tasks'); rerenderKeepScroll(); break;
      case 'del-task':
        S.tasks.items = S.tasks.items.filter(function (t) { return t.id !== id; });
        save('tasks'); rerenderKeepScroll(); break;
      case 'task-scope': ui.taskScope = el.getAttribute('data-scope'); render(); break;
      case 'toggle-event':
        var i = S.prefs.doneEvents.indexOf(id);
        if (el.checked && i === -1) S.prefs.doneEvents.push(id);
        if (!el.checked && i !== -1) S.prefs.doneEvents.splice(i, 1);
        save('prefs'); rerenderKeepScroll(); break;
      case 'del-event':
        S.events.items = S.events.items.filter(function (e) { return e.id !== id; });
        save('events'); rerenderKeepScroll(); break;
      case 'sched-mode': ui.schedMode = el.getAttribute('data-mode'); rerenderKeepScroll(); break;
      case 'sched-course': ui.schedCourse = el.getAttribute('data-course'); rerenderKeepScroll(); break;
      case 'graded-only': ui.gradedOnly = !ui.gradedOnly; rerenderKeepScroll(); break;
      case 'toggle-past': ui.showPast = !ui.showPast; render(); break;
      case 'timer-toggle': if (T.running) pauseTimer(); else startTimer(); break;
      case 'timer-reset': setMode(T.mode); break;
      case 'set-mode': setMode(el.getAttribute('data-mode')); break;
      case 'modal-break': closeModal(); startTimer(); break;
      case 'modal-focus': closeModal(); startTimer(); break;
      case 'close-modal': closeModal(); break;
      case 'new-act': ui.act = pickActivity(route() === 'breaks' ? ui.actCat : 'all', ui.act); rerenderKeepScroll(); break;
      case 'act-cat': ui.actCat = el.getAttribute('data-cat'); ui.act = pickActivity(ui.actCat); rerenderKeepScroll(); break;
      case 'scroll-to':
        var target = document.getElementById(el.getAttribute('data-target'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'breath':
        if (breath.on) { stopBreath(); $('#breathWord').textContent = ''; }
        else { breath.on = true; breath.step = 0; el.textContent = 'إيقاف'; breathStep(); }
        break;
      case 'mem': memClick(+el.getAttribute('data-i')); break;
      case 'mem-new': newMem(); $('#memWrap').innerHTML = memHtml(); break;
      case 'more': ui.off[el.getAttribute('data-k')] += 1; rerenderKeepScroll(); break;
      case 'new-note':
        var n = { id: uid(), title: '', body: '', color: '', updated: Date.now() };
        if (S.notes.items.length >= 300) { toast('وصلت إلى الحد الأقصى من الملاحظات. احذف بعضها أولا.'); break; }
        S.notes.items.push(n); ui.noteId = n.id; ui.noteEditing = true; ui.noteQuery = '';
        save('notes'); render();
        var ti = $('#noteTitle'); if (ti) ti.focus();
        break;
      case 'open-note': ui.noteId = id; ui.noteEditing = true; render(); break;
      case 'notes-back': ui.noteEditing = false; render(); break;
      case 'note-color':
        var nc = noteById(ui.noteId);
        if (nc) { nc.color = el.getAttribute('data-color'); save('notes'); render(); }
        break;
      case 'del-note':
        var nd = noteById(ui.noteId);
        if (!nd) break;
        openModal('<h2>حذف الملاحظة؟</h2><p class="muted">ستُحذف «' + esc(nd.title || 'بلا عنوان') + '» نهائيا.</p>' +
          '<div class="row"><button class="btn pri" data-act="confirm-del-note">حذف</button><button class="btn ghost" data-act="close-modal">تراجع</button></div>');
        break;
      case 'confirm-del-note':
        S.notes.items = S.notes.items.filter(function (x) { return x.id !== ui.noteId; });
        ui.noteId = null; ui.noteEditing = false; save('notes'); closeModal(); render(); break;
    }
  });

  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('form[data-form]');
    if (!f) return;
    ev.preventDefault();
    var kind = f.getAttribute('data-form');
    if (kind === 'task') {
      var inp = f.querySelector('input[name="title"]'), inputId = inp.id;
      if (!addTask(inp.value, f.getAttribute('data-scope'))) { toast('اكتب المهمة أولا.'); inp.focus(); return; }
      rerenderKeepScroll();
      var again = document.getElementById(inputId); if (again) again.focus();
    } else if (kind === 'event') {
      var title = f.elements.title.value.trim(), date = f.elements.date.value;
      if (!title) { toast('اكتب عنوان الموعد.'); return; }
      if (!validYmd(date)) { toast('اختر تاريخ الموعد.'); return; }
      if (S.events.items.length >= 500) { toast('وصلت إلى الحد الأقصى من المواعيد.'); return; }
      S.events.items.push({ id: uid(), title: title.slice(0, 120), course: f.elements.course.value.trim().slice(0, 60), type: f.elements.type.value, date: date });
      save('events');
      if (date < ymd(weekStart(today()))) ui.showPast = true;
      rerenderKeepScroll();
      toast('أضيف الموعد إلى الجدول.');
    }
  });

  document.addEventListener('input', function (ev) {
    var el = ev.target;
    if (el.id === 'noteTitle' || el.id === 'noteBody') {
      var n = noteById(ui.noteId);
      if (!n) return;
      if (el.id === 'noteTitle') n.title = el.value; else n.body = el.value;
      n.updated = Date.now();
      save('notes');
      var list = $('#noteList'); if (list) list.innerHTML = noteListHtml();
    } else if (el.id === 'noteSearch') {
      ui.noteQuery = el.value;
      $('#noteList').innerHTML = noteListHtml();
    } else if (el.id === 'journal') {
      var k = ymd(today());
      if (el.value.trim()) S.journal.days[k] = el.value; else delete S.journal.days[k];
      var keys = Object.keys(S.journal.days).sort();
      while (keys.length > 90) delete S.journal.days[keys.shift()];
      save('journal');
    }
  });

  document.addEventListener('change', function (ev) {
    var el = ev.target;
    if (el.hasAttribute('data-dur')) {
      var f = el.getAttribute('data-dur');
      S.prefs[f] = clampMin(el.value, DEFAULTS.prefs[f]);
      el.value = S.prefs[f];
      save('prefs');
      if (!T.running && T.mode === f) { T.left = modeMs(f); }
      paintTimer();
    } else if (el.id === 'semStart') {
      S.prefs.semesterStart = validYmd(el.value) ? el.value : '';
      save('prefs'); rerenderKeepScroll();
    } else if (el.id === 'focusTask') {
      T.task = el.value;
    }
  });

  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  window.addEventListener('hashchange', function () { ui.noteEditing = false; render(); $('#view').scrollTop = 0; });

  /* يتجدد محتوى اليوم إذا بقيت الصفحة مفتوحة بعد منتصف الليل */
  var shownDay = dayNumber();
  setInterval(function () {
    if (dayNumber() !== shownDay) { shownDay = dayNumber(); ui.off = { v: 0, h: 0, w: 0 }; if (!typing()) render(); }
  }, 60000);

  setSync('loading');
  render();
  initRemote();
})();
