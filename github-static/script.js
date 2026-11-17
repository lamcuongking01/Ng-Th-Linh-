(function () {
  'use strict';

  var TEACHER_NAME = 'Ngô Thị Linh';
  var BOUQUET_SRC = './images/bouquet.jpg';
  var SUNLIT_SRC = './images/sunlit-roses.jpg';
  var PETALS_SRC = './images/silk-petals.jpg';

  // Inline SVG floral fallbacks if the optional ./images/ folder isn't uploaded
  var FALLBACK_BOUQUET_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480">' +
        '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff1f5"/><stop offset="100%" stop-color="#fbcfe8"/></linearGradient></defs>' +
        '<rect width="400" height="480" fill="url(#bg)"/>' +
        '<path d="M110 250 L200 430 L290 250 Z" fill="#fda4af" opacity="0.85"/>' +
        '<path d="M135 250 L200 415 L265 250 Z" fill="#ffe4e6"/>' +
        '<circle cx="150" cy="195" r="52" fill="#f43f5e"/><circle cx="150" cy="195" r="34" fill="#fb7185"/><circle cx="150" cy="195" r="18" fill="#fecdd3"/>' +
        '<circle cx="248" cy="190" r="50" fill="#e11d48"/><circle cx="248" cy="190" r="32" fill="#fb7185"/><circle cx="248" cy="190" r="16" fill="#ffe4e6"/>' +
        '<circle cx="200" cy="140" r="58" fill="#be185d"/><circle cx="200" cy="140" r="38" fill="#f43f5e"/><circle cx="200" cy="140" r="20" fill="#fda4af"/>' +
        '<circle cx="200" cy="230" r="44" fill="#fb7185"/><circle cx="200" cy="230" r="25" fill="#fecdd3"/>' +
        '<rect x="175" y="315" width="50" height="16" rx="8" fill="#be123c"/>' +
      '</svg>'
    );

  var FALLBACK_SUNLIT_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">' +
        '<defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ffe4ec"/><stop offset="100%" stop-color="#f9a8d4"/></linearGradient></defs>' +
        '<rect width="480" height="360" fill="url(#sg)"/>' +
        '<circle cx="370" cy="78" r="48" fill="#fef08a" opacity="0.7"/>' +
        '<rect x="95" y="210" width="290" height="90" rx="14" fill="#fff1f5" stroke="#fda4af" stroke-width="4"/>' +
        '<circle cx="180" cy="168" r="46" fill="#e11d48"/><circle cx="180" cy="168" r="28" fill="#fb7185"/>' +
        '<circle cx="268" cy="154" r="54" fill="#f43f5e"/><circle cx="268" cy="154" r="32" fill="#fecdd3"/>' +
        '<circle cx="322" cy="186" r="38" fill="#be185d"/><circle cx="322" cy="186" r="20" fill="#fda4af"/>' +
      '</svg>'
    );

  var FALLBACK_PETALS_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">' +
        '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fff1f5"/><stop offset="100%" stop-color="#fbcfe8"/></linearGradient></defs>' +
        '<rect width="480" height="360" fill="url(#pg)"/>' +
        '<ellipse cx="140" cy="145" rx="46" ry="26" transform="rotate(-24 140 145)" fill="#fb7185" opacity="0.85"/>' +
        '<ellipse cx="255" cy="190" rx="52" ry="30" transform="rotate(18 255 190)" fill="#f43f5e" opacity="0.85"/>' +
        '<ellipse cx="340" cy="128" rx="42" ry="24" transform="rotate(-12 340 128)" fill="#fda4af"/>' +
        '<ellipse cx="195" cy="255" rx="48" ry="24" transform="rotate(10 195 255)" fill="#e11d48" opacity="0.78"/>' +
        '<circle cx="240" cy="180" r="22" fill="#ffe4e6"/>' +
      '</svg>'
    );

  var STUDENTS = [
    'Nguyễn Thị Lan Anh', 'Lưu Ngọc Bảo', 'Vi Thị Ngọc Bích', 'Dương Chí Bình', 'Mông Thị Châu',
    'Diệp Bách Cường', 'Lâm Chí Cường', 'Long Mạnh Cường', 'Nông Viết Đăng', 'Vi Thị Đào',
    'Giáp Minh Hằng', 'Nguyễn Văn Hảo', 'Trần Nguyễn Gia Hiếu', 'Lương Thị Mai Hoa', 'Sái Đức Khiêm',
    'Hoàng Đăng Khôi', 'Lý Diệu Linh', 'Vi Thùy Linh', 'Hoàng Văn Lộc', 'Lịch Thị Hoa Ly',
    'Ngô Thị Lưu Ly', 'Hoàng Văn Mạnh', 'Hoàng Anh Minh', 'Hoàng Trung Nghĩa', 'Dương Ảnh Nhi',
    'Nông Văn Phúc', 'Trần Thế Tâm', 'Vi Đức Tân', 'Nguyễn Anh Thái', 'Nguyễn Viết Thành',
    'Triêu Hữu Thành', 'Nguyễn Trường Thịnh', 'Lưu Thị Mai Thủy', 'Hoàng Duy Toàn', 'Phan Hoàng Bích Trâm',
    'Giáp Thị Huyền Trân', 'Nguyễn Quỳnh Trang', 'Nguyễn Hữu Trọng', 'Trần Anh Tuấn', 'Vắn Xuân Tùng',
    'Nịnh Duy Tuyên', 'Nịnh Thị Thu Uyên', 'Bàng Thị Kiều Vi', 'Nguyễn Tuấn Việt', 'Phạm Trọng Vương'
  ];

  var LETTER_PARAGRAPHS = [
    'Có những người đến trong cuộc đời ta như một ngọn gió dịu dàng nhưng lại thắp sáng cả một bầu trời tuổi trẻ. Với chúng em, cô Ngô Thị Linh chính là người lái đò tận tụy, người đã kiên nhẫn dìu dắt từng bước đi, lắng nghe từng nỗi lo âu và gieo vào lòng 45 đứa học trò biết bao ước mơ đẹp.',
    'Mỗi trang giáo án cô soạn, mỗi lời nhắc nhở ân cần trên bục giảng, hay ánh mắt ấm áp của cô những ngày chúng em mệt mỏi đều trở thành hành trang quý giá theo chúng em suốt chặng đường trưởng thành.',
    'Nhân dịp 20/11, tập thể 45 học sinh xin gửi đến cô tất cả lòng biết ơn sâu sắc nhất. Chúc cô luôn mạnh khỏe, trẻ trung, giữ mãi nụ cười rạng rỡ và ngọn lửa yêu nghề cháy bỏng trong tim.'
  ];

  var WISH_CARDS = [
    {
      chapter: 'Lời chúc 01 · Tri ân người gieo mầm',
      title: 'Ngọn đèn soi sáng những ước mơ xanh',
      message: 'Chúc cô Ngô Thị Linh một ngày 20/11 ngập tràn hoa thơm, nụ cười và hạnh phúc. Cảm ơn cô vì đã biến mỗi tiết học thành một hành trình dịu dàng, nơi chúng em không chỉ học kiến thức mà còn học cách sống tử tế và biết yêu thương.',
      signature: 'Gửi cô từ trái tim 45 học trò',
      img: SUNLIT_SRC,
      fallback: FALLBACK_SUNLIT_SVG
    },
    {
      chapter: 'Lời chúc 02 · Sức khỏe và bình an',
      title: 'Mong cô mãi rạng rỡ như đóa hồng mai',
      message: 'Nghề giáo là nghề cao quý nhất nhưng cũng nhiều vất vả nhất. Chúng em kính chúc cô Ngô Thị Linh luôn dồi dào sức khỏe, tâm hồn luôn an yên, mỗi sớm mai thức dậy đều đón nhận thật nhiều niềm vui từ gia đình và từ những thế hệ học trò thân yêu.',
      signature: 'Kính chúc cô luôn bình an và hạnh phúc',
      img: PETALS_SRC,
      fallback: FALLBACK_PETALS_SVG
    },
    {
      chapter: 'Lời chúc 03 · Kỷ niệm mái trường',
      title: 'Thanh xuân đẹp nhất là được làm học trò của cô',
      message: 'Thời gian rồi sẽ trôi qua, chúng em rồi sẽ lớn khôn và bước ra những chân trời mới, nhưng bóng dáng cô Ngô Thị Linh dịu hiền bên bục giảng vẫn sẽ mãi là miền ký ức ấm áp nhất.',
      signature: 'Mãi khắc ghi công ơn dạy dỗ của cô',
      img: BOUQUET_SRC,
      fallback: FALLBACK_BOUQUET_SVG
    },
    {
      chapter: 'Lời chúc 04 · Ngọn lửa đam mê',
      title: 'Vững tay chèo đưa bao thế hệ cập bến tương lai',
      message: 'Chúc cô Ngô Thị Linh luôn giữ trọn nhiệt huyết với sự nghiệp trồng người, gặt hái thật nhiều thành công trong công tác giảng dạy và luôn được bao bọc bởi sự kính trọng, yêu mến của đồng nghiệp cùng biết bao lứa học sinh.',
      signature: 'Chúc mừng ngày Nhà giáo Việt Nam 20/11',
      img: SUNLIT_SRC,
      fallback: FALLBACK_SUNLIT_SVG
    }
  ];

  var GALLERY_PHOTOS = [
    {
      title: 'Khoảnh khắc rạng rỡ bên cô',
      subtitle: 'Kỷ niệm 01 · Dấu ấn yêu thương',
      src: 'https://cdn.phototourl.com/anon/2026-11-17-349919fb-94b9-4afc-b2b1-9dc9829fc3ca.jpg',
      fallback: FALLBACK_BOUQUET_SVG,
      wish: 'Chúc cô Ngô Thị Linh luôn rạng rỡ, giữ mãi nụ cười tươi tắn như nắng sớm và luôn là điểm tựa dịu dàng trong tim mỗi chúng em.'
    },
    {
      title: 'Nụ cười ấm áp ngày hội trường',
      subtitle: 'Kỷ niệm 02 · Thanh xuân rực rỡ',
      src: 'https://cdn.phototourl.com/anon/2026-11-16-54ba6964-186c-40cf-a557-d4d427814c9f.jpg',
      fallback: FALLBACK_PETALS_SVG,
      wish: 'Cảm ơn cô đã kiên nhẫn lắng nghe, đồng hành cùng 45 cá tính khác nhau để dệt nên một tập thể gắn kết và đầy ắp tiếng cười.'
    },
    {
      title: 'Sắc hồng phấn dâng tặng cô',
      subtitle: 'Kỷ niệm 03 · Tri ân 20/11',
      src: BOUQUET_SRC,
      fallback: FALLBACK_BOUQUET_SVG,
      wish: 'Mỗi cánh hoa hồng phấn là một lời cảm ơn chân thành gửi đến cô. Chúc cô một mùa Hiến chương thật ấm áp, trọn vẹn niềm vui và bình an.'
    },
    {
      title: 'Trang vở và hương hoa sớm mai',
      subtitle: 'Kỷ niệm 04 · Hành trang trưởng thành',
      src: SUNLIT_SRC,
      fallback: FALLBACK_SUNLIT_SVG,
      wish: 'Dù mai này mỗi người đi một ngả, những bài học từ cô Ngô Thị Linh sẽ mãi là ánh sáng nâng bước chúng em trên mọi nẻo đường.'
    }
  ];

  var TRACKS = [
    {
      label: 'Bài 1',
      title: 'Bụi Phấn · Khúc Tri Ân',
      src: './bai1.mp3',
      duration: 48,
      notes: [261.63, 329.63, 392.0, 440.0, 392.0, 349.23, 329.63, 293.66],
      lyrics: [
        [0, 'Khi thầy viết bảng, bụi phấn rơi rơi...'],
        [6, 'Có hạt bụi nào rơi trên bục giảng...'],
        [12, 'Có hạt bụi nào vương trên tóc cô...'],
        [18, 'Em yêu phút giây này, cô em tóc như bạc thêm...'],
        [24, 'Bạc thêm vì bụi phấn, để cho em bài học hay...'],
        [30, 'Mai sau lớn nên người, làm sao có thể nào quên...'],
        [36, 'Ngày xưa cô dạy dỗ, khi em tuổi còn thơ...'],
        [42, 'Kính dâng cô Ngô Thị Linh ngàn lời tri ân 20/11.']
      ]
    },
    {
      label: 'Bài 2',
      title: 'Người Thầy · Mái Trường Mến Yêu',
      src: './bai2.mp3',
      duration: 48,
      notes: [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63],
      lyrics: [
        [0, 'Người cô vẫn lặng lẽ đi về sớm trưa...'],
        [6, 'Từng ngày giọt mồ hôi rơi nhòe trang giấy...'],
        [12, 'Để em đến bên bờ ước mơ...'],
        [18, 'Dẫu năm tháng vô tình trôi mãi mãi...'],
        [24, 'Có hay bao mùa lá rơi, cô vẫn đứng nơi đây...'],
        [30, 'Chờ đàn em nhỏ bước qua dòng sông tri thức...'],
        [36, 'Dòng sông xanh tuổi thơ, sáng mãi trong tim chúng em...'],
        [42, '45 học trò thương chúc cô Ngô Thị Linh luôn bình an.']
      ]
    }
  ];

  var state = {
    stage: 'intro',
    wishIdx: 0,
    galleryIdx: 0,
    galleryView: 'swipe',
    creditsPaused: false,
    waitTimer: null,
    audioCtx: null,
    trackIdx: 0,
    isPlaying: false,
    useFallbackSynth: false,
    synthTimer: null,
    lyricTimer: null,
    lyricClock: 0,
    userToggledAudio: false,
    customUrls: {}
  };

  var shell = document.getElementById('app-shell');
  var stageRoot = document.getElementById('stage-root');
  var petalsLayer = document.getElementById('petals-layer');
  var fireworksCanvas = document.getElementById('fireworks-canvas');
  var topActionBtn = document.getElementById('top-action-btn');

  // --- Sound Effects ---
  function getAudioCtx() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!state.audioCtx || state.audioCtx.state === 'closed') {
      state.audioCtx = new Ctx();
    }
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume().catch(function () {});
    }
    return state.audioCtx;
  }

  function playChime(freqs, gap, peak) {
    try {
      var ctx = getAudioCtx();
      if (!ctx) return;
      var base = ctx.currentTime;
      freqs.forEach(function (f, i) {
        var t = base + i * gap;
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.7);
      });
    } catch (_) {}
  }

  // --- Vinyl Music Player ---
  var audioEl = document.getElementById('bg-audio');
  var vinylDisc = document.getElementById('vinyl-disc');
  var vinylArm = document.getElementById('vinyl-arm');
  var lyricTextEl = document.getElementById('lyric-text');
  var trackTitleEl = document.getElementById('track-title');
  var playBtn = document.getElementById('play-toggle-btn');
  var vinylPlayerEl = document.getElementById('vinyl-player');
  var trackBtns = document.querySelectorAll('.btn-track');
  var fileInput = document.getElementById('mp3-file-input');

  function stopSynth() {
    if (state.synthTimer) {
      clearInterval(state.synthTimer);
      state.synthTimer = null;
    }
  }

  function startSynth() {
    stopSynth();
    var ctx = getAudioCtx();
    if (!ctx) return;
    var notes = TRACKS[state.trackIdx].notes;
    var step = 0;
    function note() {
      if (!ctx || ctx.state === 'closed') return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(notes[step % notes.length], now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.055, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.35);
      step += 1;
    }
    note();
    state.synthTimer = setInterval(note, 900);
  }

  function updateLyricsUI() {
    var tr = TRACKS[state.trackIdx];
    var t = state.lyricClock % tr.duration;
    var line = tr.lyrics[0][1];
    for (var i = 0; i < tr.lyrics.length; i++) {
      if (tr.lyrics[i][0] <= t) line = tr.lyrics[i][1];
    }
    lyricTextEl.textContent = line;
  }

  function syncPlayerUI() {
    var tr = TRACKS[state.trackIdx];
    trackTitleEl.textContent = tr.title;
    vinylPlayerEl.setAttribute('data-playing', state.isPlaying ? 'true' : 'false');
    vinylDisc.classList.toggle('playing', state.isPlaying);
    vinylArm.classList.toggle('playing', state.isPlaying);
    playBtn.textContent = state.isPlaying ? '❚❚ Dừng' : '▶ Nghe nhạc';
    trackBtns.forEach(function (b, idx) {
      b.classList.toggle('active', idx === state.trackIdx);
    });
    updateLyricsUI();
  }

  function startMusic() {
    var tr = TRACKS[state.trackIdx];
    audioEl.src = state.customUrls[state.trackIdx] || tr.src;
    state.isPlaying = true;
    state.useFallbackSynth = false;
    stopSynth();
    var p = audioEl.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        state.useFallbackSynth = true;
        startSynth();
      });
    }
    if (!state.lyricTimer) {
      state.lyricTimer = setInterval(function () {
        if (!state.isPlaying) return;
        if (!state.useFallbackSynth && !audioEl.paused && !isNaN(audioEl.currentTime)) {
          state.lyricClock = audioEl.currentTime;
        } else {
          state.lyricClock = (state.lyricClock + 0.25) % TRACKS[state.trackIdx].duration;
        }
        updateLyricsUI();
      }, 250);
    }
    syncPlayerUI();
  }

  function pauseMusic() {
    state.isPlaying = false;
    audioEl.pause();
    stopSynth();
    syncPlayerUI();
  }

  audioEl.addEventListener('error', function () {
    if (state.isPlaying) {
      state.useFallbackSynth = true;
      startSynth();
    }
  });

  playBtn.addEventListener('click', function () {
    state.userToggledAudio = true;
    if (state.isPlaying) pauseMusic();
    else startMusic();
  });

  trackBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = Number(btn.getAttribute('data-track'));
      if (idx === state.trackIdx) return;
      state.trackIdx = idx;
      state.lyricClock = 0;
      stopSynth();
      if (state.isPlaying) startMusic();
      else syncPlayerUI();
    });
  });

  document.getElementById('upload-mp3-btn').addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (state.customUrls[state.trackIdx]) URL.revokeObjectURL(state.customUrls[state.trackIdx]);
    state.customUrls[state.trackIdx] = URL.createObjectURL(file);
    state.lyricClock = 0;
    startMusic();
  });

  // --- Petals ---
  (function initPetals() {
    var specs = [8, 18, 29, 41, 53, 66, 78, 90];
    specs.forEach(function (leftPct, i) {
      var el = document.createElement('span');
      el.className = 'petal';
      var size = 12 + (i % 4) * 2;
      el.style.left = leftPct + '%';
      el.style.width = size + 'px';
      el.style.height = Math.round(size * 0.72) + 'px';
      el.style.animationDuration = 10.5 + (i % 4) * 1.1 + 's';
      el.style.animationDelay = (i * 0.9) % 4 + 's';
      petalsLayer.appendChild(el);
    });
  })();

  // --- Pure 3D Perspective Particle Heart Renderer ---
  var heartCanvas = document.getElementById('heart-canvas');
  var hCtx = heartCanvas.getContext('2d');
  var HEART_PALETTE = ['#be185d', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#f59e0b'];
  var heartBuckets = HEART_PALETTE.map(function () { return []; });
  var heartModeStart = performance.now();
  var heartLastMode = 'ambient';

  (function buildHeartParticles() {
    var seed = 20112026;
    function rand() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (var i = 0; i < 950; i++) {
      var u = rand() * Math.PI * 2;
      var sinU = Math.sin(u);
      var cosU = Math.cos(u);
      var shell = 0.25 + 0.75 * Math.pow(rand(), 0.45);
      var r = Math.cbrt(Math.max(0.08, shell));
      var hx = 16 * Math.pow(sinU, 3) * r * 0.145;
      var hy = (13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u) + 1.5) * r * 0.145;
      var thick = Math.max(0.18, Math.abs(sinU)) * (0.65 + 0.35 * shell);
      var hz = (rand() * 2 - 1) * 6.5 * thick * r * 0.145;

      var theta = rand() * Math.PI * 2;
      var phi = Math.acos(2 * rand() - 1);
      var rad = 3.2 + rand() * 5.0;
      var colorIdx = Math.floor(rand() * HEART_PALETTE.length);
      heartBuckets[colorIdx].push({
        hx: hx, hy: hy, hz: hz,
        sx: rad * Math.sin(phi) * Math.cos(theta),
        sy: rad * Math.cos(phi) * 0.85,
        sz: rad * Math.sin(phi) * Math.sin(theta),
        size: 1.5 + rand() * 1.9,
        phase: rand() * Math.PI * 2
      });
    }
  })();

  function easeInOutCubic(t) {
    t = Math.max(0, Math.min(1, t));
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function heartbeatScale(t, intensity) {
    var c = ((t % 1.15) + 1.15) % 1.15;
    var lub = Math.exp(-Math.pow((c - 0.16) / 0.065, 2)) * 0.11;
    var dub = Math.exp(-Math.pow((c - 0.36) / 0.08, 2)) * 0.065;
    return 1 + (lub + dub) * intensity;
  }

  function resizeCanvases() {
    heartCanvas.width = window.innerWidth;
    heartCanvas.height = window.innerHeight;
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvases);
  resizeCanvases();

  function renderHeart(now) {
    var mode = state.stage === 'finale' ? 'finale' : 'ambient';
    if (mode !== heartLastMode) {
      heartLastMode = mode;
      heartModeStart = now;
    }
    var totalSec = now * 0.001;
    var localSec = Math.max(0, (now - heartModeStart) * 0.001);

    var converge = 0;
    var emerge = 1;
    var beat = 1;
    if (mode === 'ambient') {
      var cyc = localSec % 18;
      if (cyc < 10) {
        converge = easeInOutCubic(cyc / 10);
        emerge = 0.45 + 0.55 * converge;
        beat = heartbeatScale(totalSec, 0.25 + 0.75 * converge);
      } else if (cyc < 14) {
        converge = 1;
        emerge = 1;
        beat = heartbeatScale(totalSec, 1);
      } else {
        var dis = easeInOutCubic((cyc - 14) / 4);
        converge = 1 - dis;
        emerge = 1 - 0.45 * dis;
        beat = heartbeatScale(totalSec, 1 - dis);
      }
    } else {
      if (localSec < 6) {
        emerge = 1 - Math.pow(1 - localSec / 6, 3);
        converge = easeInOutCubic(localSec / 6) * 0.08;
      } else if (localSec < 21) {
        emerge = 1;
        var p = (localSec - 6) / 15;
        converge = 0.08 + 0.92 * easeInOutCubic(p);
        beat = heartbeatScale(totalSec, 0.25 + 0.75 * p);
      } else {
        emerge = 1;
        converge = 1;
        beat = heartbeatScale(totalSec, 1);
      }
    }

    var w = heartCanvas.width;
    var h = heartCanvas.height;
    hCtx.clearRect(0, 0, w, h);

    var rotY = Math.sin(totalSec * 0.38) * 0.34;
    var cosY = Math.cos(rotY);
    var sinY = Math.sin(rotY);
    var scaleFactor = (mode === 'finale' ? 1.48 : 0.9) * Math.min(w, h) * 0.092;
    var cx = w * 0.5;
    var cy = mode === 'finale' ? h * 0.52 : h * 0.56;
    var radMul = mode === 'finale' ? 1.2 : 1.0;

    hCtx.globalAlpha = emerge * (0.45 + 0.5 * converge);
    for (var b = 0; b < HEART_PALETTE.length; b++) {
      var bucket = heartBuckets[b];
      hCtx.fillStyle = HEART_PALETTE[b];
      hCtx.beginPath();
      for (var i = 0; i < bucket.length; i++) {
        var pt = bucket[i];
        var swirl = (1 - converge) * (0.65 * Math.sin(totalSec * 0.45 + pt.phase) + pt.phase * 0.25);
        var sc = Math.cos(swirl);
        var ss = Math.sin(swirl);
        var rsx = pt.sx * sc - pt.sz * ss;
        var rsy = pt.sy + Math.sin(totalSec * 0.9 + pt.phase) * 0.26 * (1 - converge);
        var rsz = pt.sx * ss + pt.sz * sc;

        var x = rsx + (pt.hx * beat - rsx) * converge;
        var y = rsy + (pt.hy * beat - rsy) * converge;
        var z = rsz + (pt.hz * beat - rsz) * converge;

        var rx = x * cosY - z * sinY;
        var rz = x * sinY + z * cosY;
        var fov = 9.5;
        var persp = fov / Math.max(2, fov - rz);

        var px = cx + rx * scaleFactor * persp;
        var py = cy - y * scaleFactor * persp;
        var rad = pt.size * persp * radMul;
        hCtx.moveTo(px + rad, py);
        hCtx.arc(px, py, rad, 0, Math.PI * 2);
      }
      hCtx.fill();
    }
    setTimeout(function () {
      requestAnimationFrame(renderHeart);
    }, 16);
  }
  requestAnimationFrame(renderHeart);

  // --- Fireworks ---
  var fwCtx = fireworksCanvas.getContext('2d');
  var fwColors = ['#fb7185', '#f43f5e', '#fbcfe8', '#fda4af', '#fde047', '#f9a8d4', '#ffffff'];
  var fwParticles = [];
  var fwRockets = [];
  var fwLastLaunch = 0;

  function spawnFireworkBurst(cx, cy, color) {
    for (var i = 0; i < 32; i++) {
      var a = (Math.PI * 2 * i) / 32 + (Math.random() - 0.5) * 0.16;
      var sp = 1.8 + Math.random() * 4.5;
      fwParticles.push({
        x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        alpha: 1, decay: 0.011 + Math.random() * 0.01, size: 2.2 + Math.random() * 2.2, color: color
      });
    }
  }

  var fwRafId = null;
  function renderFireworks(now) {
    if (state.stage !== 'finale') {
      fwRafId = null;
      return;
    }
    var w = fireworksCanvas.width;
    var h = fireworksCanvas.height;
    fwCtx.clearRect(0, 0, w, h);

    if (now - fwLastLaunch > 600) {
      fwLastLaunch = now;
      fwRockets.push({
        x: w * (0.12 + Math.random() * 0.76),
        y: h * 0.94,
        vy: -(7.2 + Math.random() * 3.2),
        targetY: h * (0.12 + Math.random() * 0.35),
        color: fwColors[Math.floor(Math.random() * fwColors.length)]
      });
    }

    for (var i = fwRockets.length - 1; i >= 0; i--) {
      var r = fwRockets[i];
      r.y += r.vy;
      r.vy *= 0.985;
      fwCtx.globalAlpha = 0.96;
      fwCtx.fillStyle = r.color;
      fwCtx.beginPath();
      fwCtx.arc(r.x, r.y, 3, 0, Math.PI * 2);
      fwCtx.fill();
      if (r.y <= r.targetY || r.vy > -1.2) {
        spawnFireworkBurst(r.x, r.y, r.color);
        fwRockets.splice(i, 1);
      }
    }

    for (var j = fwParticles.length - 1; j >= 0; j--) {
      var p = fwParticles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.042;
      p.vx *= 0.985;
      p.alpha -= p.decay;
      if (p.alpha <= 0.02) {
        fwParticles.splice(j, 1);
        continue;
      }
      fwCtx.globalAlpha = p.alpha;
      fwCtx.fillStyle = p.color;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size * 1.25, 0, Math.PI * 2);
      fwCtx.fill();
    }
    setTimeout(function () {
      if (state.stage === 'finale') {
        fwRafId = requestAnimationFrame(renderFireworks);
      } else {
        fwRafId = null;
      }
    }, 16);
  }

  // --- Stage Rendering ---
  function clearWaitTimer() {
    if (state.waitTimer) {
      clearInterval(state.waitTimer);
      state.waitTimer = null;
    }
  }

  function setStage(nextStage) {
    clearWaitTimer();
    if (nextStage === 'letter') {
      playChime([523.25, 659.25, 783.99, 1046.5], 0.08, 0.045);
      if (!state.isPlaying && !state.userToggledAudio) startMusic();
    } else if (nextStage === 'finale') {
      playChime([523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5], 0.075, 0.05);
      fwParticles.length = 0;
      spawnFireworkBurst(window.innerWidth * 0.22, window.innerHeight * 0.25, '#fb7185');
      spawnFireworkBurst(window.innerWidth * 0.78, window.innerHeight * 0.22, '#fde047');
      spawnFireworkBurst(window.innerWidth * 0.5, window.innerHeight * 0.18, '#fbcfe8');
      if (!fwRafId) fwRafId = requestAnimationFrame(renderFireworks);
    } else {
      playChime([587.33, 739.99, 880.0], 0.07, 0.035);
    }
    state.stage = nextStage;
    renderStage();
  }

  function renderStage() {
    var isFinale = state.stage === 'finale';
    document.body.dataset.stage = state.stage;
    shell.classList.toggle('finale-mode', isFinale);
    petalsLayer.classList.toggle(
      'hidden',
      !(state.stage === 'bouquet' || state.stage === 'wishes' || state.stage === 'gallery' || isFinale)
    );
    fireworksCanvas.classList.toggle('hidden', !isFinale);
    topActionBtn.textContent = isFinale ? 'Về trang đầu' : 'Trang kết';

    document.querySelectorAll('.nav-link').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === state.stage);
    });

    if (state.stage === 'intro') renderIntro();
    else if (state.stage === 'letter') renderLetter();
    else if (state.stage === 'bouquet') renderBouquet();
    else if (state.stage === 'wishes') renderWishes();
    else if (state.stage === 'gallery') renderGallery();
    else if (state.stage === 'finale') renderFinale();
  }

  function renderIntro() {
    stageRoot.innerHTML =
      '<section class="intro-wrap">' +
        '<div>' +
          '<p class="kicker">Ngày Nhà Giáo Việt Nam 20 · 11</p>' +
          '<h1 class="hero-title">Gửi trọn yêu thương đến Cô ' + TEACHER_NAME + '</h1>' +
          '<p class="hero-sub">Những hạt ánh sáng đang kết thành nhịp đập trái tim từ tấm lòng của 45 học trò. Mời cô chạm vào nút bên dưới để mở lá thư tri ân.</p>' +
        '</div>' +
        '<div class="heart-spacer" aria-hidden="true"></div>' +
        '<div class="open-btn-wrap">' +
          '<span class="open-btn-halo" aria-hidden="true"></span>' +
          '<button type="button" id="open-letter-btn" class="btn-primary">✉ Mở lá thư gửi cô ♥</button>' +
        '</div>' +
      '</section>';
    document.getElementById('open-letter-btn').addEventListener('click', function () {
      setStage('letter');
    });
  }

  function renderLetter() {
    var paras = LETTER_PARAGRAPHS.map(function (p) {
      return '<p>' + p + '</p>';
    }).join('');
    stageRoot.innerHTML =
      '<article class="card card-narrow">' +
        '<div class="card-head">' +
          '<span class="meta-label">Ngày Nhà giáo Việt Nam 20 tháng 11</span>' +
          '<span class="meta-label">Trang 1 · Lá thư tri ân</span>' +
        '</div>' +
        '<h2 class="card-title">Kính gửi cô ' + TEACHER_NAME + ' thân mến,</h2>' +
        '<div class="letter-body">' + paras + '</div>' +
        '<p class="letter-sign">— Trọn vẹn yêu thương từ tập thể 45 học sinh của cô —</p>' +
        '<div id="letter-footer" class="wait-footer"></div>' +
      '</article>';

    var left = 5;
    var footer = document.getElementById('letter-footer');
    function drawFooter() {
      if (left <= 0) {
        footer.innerHTML = '<button type="button" id="letter-next-btn" class="btn-primary">Tiếp tục →</button>';
        document.getElementById('letter-next-btn').addEventListener('click', function () {
          setStage('bouquet');
        });
      } else {
        var pct = ((5 - left) / 5) * 100;
        footer.innerHTML =
          '<p class="wait-text">Nút “Tiếp tục” sẽ hiện sau ' + left + ' giây...</p>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      }
    }
    drawFooter();
    state.waitTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) clearWaitTimer();
      drawFooter();
    }, 1000);
  }

  function renderBouquet() {
    stageRoot.innerHTML =
      '<div class="card">' +
        '<div class="split-grid">' +
          '<div class="media-box">' +
            '<img id="bouquet-img" src="' + BOUQUET_SRC + '" alt="Bó hoa hồng phấn dâng tặng cô Ngô Thị Linh" referrerpolicy="no-referrer" />' +
          '</div>' +
          '<div class="split-content">' +
            '<div>' +
              '<span class="meta-label">Trang 2 · Bó hoa tươi thắm nhất</span>' +
              '<h2 class="card-title">Đóa hoa hồng phấn kính dâng Cô ' + TEACHER_NAME + '</h2>' +
              '<p>Mỗi đóa hồng phấn và cánh mẫu đơn trong bó hoa này tượng trưng cho lòng biết ơn dịu dàng và sự kính trọng sâu sắc của 45 học sinh gửi đến cô trong ngày vui 20/11.</p>' +
              '<p>Chúc cô luôn tỏa hương sắc, giữ mãi nét dịu hiền và niềm vui trên từng trang giáo án.</p>' +
            '</div>' +
            '<div id="bouquet-footer" class="wait-footer" style="align-items:flex-start;"></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var img = document.getElementById('bouquet-img');
    img.addEventListener('error', function () {
      img.src = FALLBACK_BOUQUET_SVG;
    });

    var left = 3;
    var footer = document.getElementById('bouquet-footer');
    function drawFooter() {
      if (left <= 0) {
        footer.innerHTML = '<button type="button" id="bouquet-next-btn" class="btn-primary">Tiếp theo →</button>';
        document.getElementById('bouquet-next-btn').addEventListener('click', function () {
          setStage('wishes');
        });
      } else {
        var pct = ((3 - left) / 3) * 100;
        footer.innerHTML =
          '<p class="wait-text">“Tiếp theo” sẽ xuất hiện sau ' + left + ' giây...</p>' +
          '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>';
      }
    }
    drawFooter();
    state.waitTimer = setInterval(function () {
      left -= 1;
      if (left <= 0) clearWaitTimer();
      drawFooter();
    }, 1000);
  }

  function renderWishes() {
    var w = WISH_CARDS[state.wishIdx];
    var tabs = WISH_CARDS.map(function (_, i) {
      return (
        '<button type="button" class="tab-btn ' + (i === state.wishIdx ? 'active' : '') + '" data-wish="' + i + '">Lời chúc ' + (i + 1) + '</button>'
      );
    }).join('');

    stageRoot.innerHTML =
      '<div class="card">' +
        '<div class="card-head">' +
          '<div><span class="meta-label">Trang 3 · Tuyển tập lời chúc 20/11</span><h2 class="card-title">Những lời chúc dịu dàng gửi cô ' + TEACHER_NAME + '</h2></div>' +
          '<div class="tab-group">' + tabs + '</div>' +
        '</div>' +
        '<div class="split-grid" style="margin-top:1.3rem;">' +
          '<div class="media-box"><img id="wish-img" src="' + w.img + '" alt="' + w.title + '" referrerpolicy="no-referrer" /></div>' +
          '<div class="split-content">' +
            '<div>' +
              '<span class="meta-label">' + w.chapter + '</span>' +
              '<h3 class="card-title" style="font-size:1.5rem;">' + w.title + '</h3>' +
              '<p>“' + w.message + '”</p>' +
              '<p style="font-style:italic;font-weight:600;color:#be123c;">— ' + w.signature + '</p>' +
            '</div>' +
            '<div class="gallery-footer">' +
              '<button type="button" id="wish-next-tab" class="btn-secondary">Xem lời chúc khác</button>' +
              '<button type="button" id="to-gallery-btn" class="btn-primary">Trưng ảnh kỷ niệm →</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var wImg = document.getElementById('wish-img');
    wImg.addEventListener('error', function () {
      wImg.onerror = null;
      wImg.src = w.fallback || FALLBACK_BOUQUET_SVG;
    });
    document.querySelectorAll('[data-wish]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.wishIdx = Number(b.getAttribute('data-wish'));
        renderWishes();
      });
    });
    document.getElementById('wish-next-tab').addEventListener('click', function () {
      state.wishIdx = (state.wishIdx + 1) % WISH_CARDS.length;
      renderWishes();
    });
    document.getElementById('to-gallery-btn').addEventListener('click', function () {
      setStage('gallery');
    });
  }

  function renderGallery() {
    var p = GALLERY_PHOTOS[state.galleryIdx];
    var thumbs = GALLERY_PHOTOS.map(function (item, idx) {
      return (
        '<button type="button" class="thumb-btn ' + (idx === state.galleryIdx ? 'active' : '') + '" data-gidx="' + idx + '">' +
          '<img src="' + item.src + '" alt="' + item.title + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + item.fallback + '\'" />' +
        '</button>'
      );
    }).join('');

    var bodyHtml =
      state.galleryView === 'swipe'
        ? '<div class="swipe-frame" id="swipe-frame">' +
            '<div class="swipe-img-wrap">' +
              '<img id="gallery-main-img" src="' + p.src + '" alt="' + p.title + '" referrerpolicy="no-referrer" />' +
              '<button type="button" id="prev-photo" class="arrow-btn prev" aria-label="Ảnh trước">‹</button>' +
              '<button type="button" id="next-photo" class="arrow-btn next" aria-label="Ảnh tiếp theo">›</button>' +
            '</div>' +
            '<div class="photo-caption">' +
              '<span class="meta-label">' + p.subtitle + ' · ' + (state.galleryIdx + 1) + '/' + GALLERY_PHOTOS.length + '</span>' +
              '<h3>' + p.title + '</h3>' +
              '<p class="wish">' + p.wish + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="thumb-strip">' + thumbs + '</div>'
        : '<div class="gallery-grid">' +
            GALLERY_PHOTOS.map(function (item) {
              return (
                '<article class="gallery-grid-item">' +
                  '<img src="' + item.src + '" alt="' + item.title + '" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src=\'' + item.fallback + '\'" />' +
                  '<div class="photo-caption">' +
                    '<span class="meta-label">' + item.subtitle + '</span>' +
                    '<h3>' + item.title + '</h3>' +
                    '<p class="wish">' + item.wish + '</p>' +
                  '</div>' +
                '</article>'
              );
            }).join('') +
          '</div>';

    stageRoot.innerHTML =
      '<div class="card gallery-stage-card">' +
        '<div class="card-head">' +
          '<div><span class="meta-label">Trang 4 · Phòng trưng bày kỷ niệm</span><h2 class="card-title">Mỗi bức ảnh là một lời chúc gửi cô</h2></div>' +
          '<div class="tab-group">' +
            '<button type="button" class="tab-btn ' + (state.galleryView === 'swipe' ? 'active' : '') + '" id="mode-swipe">Vuốt từng ảnh</button>' +
            '<button type="button" class="tab-btn ' + (state.galleryView === 'grid' ? 'active' : '') + '" id="mode-grid">Xem tất cả</button>' +
          '</div>' +
        '</div>' +
        bodyHtml +
        '<div class="gallery-footer">' +
          '<span style="font-size:0.78rem;color:#9f1239;">Vuốt trái hoặc phải để xem hết các bức ảnh kỷ niệm cùng lời chúc bên dưới.</span>' +
          '<button type="button" id="finish-btn" class="btn-primary">✨ Kết thúc</button>' +
        '</div>' +
      '</div>';

    document.getElementById('mode-swipe').addEventListener('click', function () {
      state.galleryView = 'swipe';
      renderGallery();
    });
    document.getElementById('mode-grid').addEventListener('click', function () {
      state.galleryView = 'grid';
      renderGallery();
    });
    document.getElementById('finish-btn').addEventListener('click', function () {
      setStage('finale');
    });

    if (state.galleryView === 'swipe') {
      var mImg = document.getElementById('gallery-main-img');
      mImg.addEventListener('error', function () {
        mImg.src = p.fallback;
      });
      document.getElementById('prev-photo').addEventListener('click', function () {
        state.galleryIdx = (state.galleryIdx - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
        renderGallery();
      });
      document.getElementById('next-photo').addEventListener('click', function () {
        state.galleryIdx = (state.galleryIdx + 1) % GALLERY_PHOTOS.length;
        renderGallery();
      });
      document.querySelectorAll('[data-gidx]').forEach(function (b) {
        b.addEventListener('click', function () {
          state.galleryIdx = Number(b.getAttribute('data-gidx'));
          renderGallery();
        });
      });
      var startX = null;
      var sf = document.getElementById('swipe-frame');
      sf.addEventListener('pointerdown', function (e) { startX = e.clientX; });
      sf.addEventListener('pointerup', function (e) {
        if (startX === null) return;
        var dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 45) {
          state.galleryIdx = dx < 0
            ? (state.galleryIdx + 1) % GALLERY_PHOTOS.length
            : (state.galleryIdx - 1 + GALLERY_PHOTOS.length) % GALLERY_PHOTOS.length;
          renderGallery();
        }
      });
    }
  }

  function renderColumnHtml(items, paused) {
    var doubled = items.concat(items);
    return (
      '<div class="marquee-box">' +
        '<div class="marquee-fade-top"></div>' +
        '<div class="marquee-fade-bottom"></div>' +
        '<ul class="credits-list ' + (paused ? 'paused' : '') + '">' +
          doubled.map(function (st) {
            return (
              '<li class="credit-item">' +
                '<span class="credit-num">' + String(st.num).padStart(2, '0') + '</span>' +
                '<span class="credit-name">' + st.name + '</span>' +
              '</li>'
            );
          }).join('') +
        '</ul>' +
      '</div>'
    );
  }

  function renderFinale() {
    var allEntries = STUDENTS.map(function (name, i) {
      return { num: i + 1, name: name };
    });
    var leftList = allEntries.slice(0, 23);
    var rightList = allEntries.slice(23);

    stageRoot.innerHTML =
      '<div class="finale-wrap">' +
        '<div class="finale-wish-banner">' +
          '<span class="meta-label" style="color:#fda4af;">Tri Ân Ngày Nhà Giáo Việt Nam 20 · 11</span>' +
          '<p>Chúc mừng ngày Nhà giáo Việt Nam 20/11! Kính chúc cô Ngô Thị Linh mãi mãi hạnh phúc, khỏe mạnh và tỏa sáng cùng tình yêu thương của 45 học trò.</p>' +
        '</div>' +
        '<div class="finale-main-grid">' +
          '<div class="finale-col-left">' + renderColumnHtml(leftList, state.creditsPaused) + '</div>' +
          '<div class="finale-col-center">' +
            '<div class="teacher-spotlight">' +
              '<div class="floral-row">' +
                '<div class="flower-medallion"><img src="' + BOUQUET_SRC + '" alt="Hoa hồng phấn" onerror="this.onerror=null;this.src=\'' + FALLBACK_BOUQUET_SVG + '\'" /></div>' +
                '<span style="font-size:1.45rem;" aria-hidden="true">🌸</span>' +
                '<div class="flower-medallion"><img src="' + PETALS_SRC + '" alt="Hoa mẫu đơn" onerror="this.onerror=null;this.src=\'' + FALLBACK_PETALS_SVG + '\'" /></div>' +
              '</div>' +
              '<span class="meta-label" style="color:#fecdd3;">Trái tim 45 học trò hướng về cô</span>' +
              '<h2 class="teacher-name">' + TEACHER_NAME + '</h2>' +
              '<p style="margin:0.5rem 0 0;font-size:0.8rem;color:#ffe4e6;">Hạt ánh sáng lan tỏa 6 giây · Kết thành trái tim lớn sau 15 giây</p>' +
            '</div>' +
          '</div>' +
          '<div class="finale-col-right">' + renderColumnHtml(rightList, state.creditsPaused) + '</div>' +
        '</div>' +
        '<div class="finale-actions">' +
          '<button type="button" id="toggle-scroll-btn" class="btn-dark-pill">' + (state.creditsPaused ? '▶ Tiếp tục trôi tên' : '❚❚ Tạm dừng trôi tên') + '</button>' +
          '<button type="button" id="restart-btn" class="btn-primary" style="padding:0.6rem 1.35rem;font-size:0.82rem;">↺ Xem lại từ đầu</button>' +
        '</div>' +
      '</div>';

    document.getElementById('toggle-scroll-btn').addEventListener('click', function () {
      state.creditsPaused = !state.creditsPaused;
      renderFinale();
    });
    document.getElementById('restart-btn').addEventListener('click', function () {
      setStage('intro');
    });
  }

  // --- Top bar wiring ---
  document.getElementById('brand-btn').addEventListener('click', function () {
    setStage('intro');
  });
  document.querySelectorAll('.nav-link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setStage(btn.getAttribute('data-nav'));
    });
  });
  topActionBtn.addEventListener('click', function () {
    setStage(state.stage === 'finale' ? 'intro' : 'finale');
  });

  syncPlayerUI();
  renderStage();
})();
