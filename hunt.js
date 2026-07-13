// ==========================================
// ⚔️ 몬스터 헌터 — 아바타 월드 통합 모듈
// (hunt.js 전체를 mh_ 네임스페이스로 격리)
// ==========================================

// ── DOM 레퍼런스 (게임 진입 시 초기화) ──────────────
let mhGameWrapper    = null;
let mhGameCanvas     = null;
let mhStartScreen    = null;
let mhGameoverScreen = null;
let mhPlayerImg      = null;
let mhPlayerEffect   = null;
let mhScoreDisplay   = null;
let mhFinalScore     = null;
let mhUltimateBtn    = null;
let mhQuizPanel      = null;
let mhQuizWord       = null;
let mhQuizChoices    = null;
let mhQuizBtns       = null;
let mhUltimateIconColor = null;

// ── 학습 데이터 ────────────────────────────────────
let mhWordList     = [];
let mhQuizQueue    = [];
let mhCurrentQuiz  = null;
let mhQuizAnswered = false;

// ── 게임 상태 ──────────────────────────────────────
const MH_GAME_BASE_WIDTH = 800;
let mhScore          = 0;
let mhCorrectCount   = 0;
let mhWrongCount     = 0;
let mhMonsters       = [];
let mhProjectiles    = [];
let mhIsAttacking    = false;
let mhIsGameStarted  = false;
let mhIsGameOver     = false;
let mhSpawnInterval  = 1000;
let mhSpawnTimer     = null;
let mhMoveTimer      = null;
let mhCollisionTimer = null;
let mhSkillTimer     = null; // 스킬 발사체 지연 setTimeout 취소용
let mhAttackTimer    = null; // 스킬/궁극기 isAttacking 복귀 타이머
let mhUltTimer1      = null; // 궁극기 발사체 타이머
let mhUltTimer2      = null; // 궁극기 isAttacking 복귀 타이머
let mhLoopId         = 0;    // rAF 루프 세대 번호 — 재시작 시 증가해 이전 루프 자동 종료
let mhResizeObserver = null;

// ── 궁극기 ────────────────────────────────────────
const MH_ULTIMATE_MAX  = 10;
let mhUltimateCharge   = 0;
let mhIsUltimateReady  = false;

// ── 물리 상수 ─────────────────────────────────────
const MH_GRAVITY    = 0.5;
const MH_JUMP_FORCE = -8;
const MH_GROUND_Y   = 0;
const MH_MAX_MONSTERS   = 5;
const MH_PLAYER_LEFT    = 50;
const MH_PLAYER_WIDTH   = 47;
const MH_MONSTER_HIT_W  = 40;

const MH_MONSTER_TYPES = [
    { walk: 'images/hunt/huntmonster1.gif',  idle: 'images/hunt/huntmonster2.gif',  hit: 'images/hunt/huntmonster3.png',  die: 'images/hunt/huntmonster4.gif' },
    { walk: 'images/hunt/huntmonster5.gif',  idle: 'images/hunt/huntmonster6.gif',  hit: 'images/hunt/huntmonster7.png',  die: 'images/hunt/huntmonster8.gif' },
    { walk: 'images/hunt/huntmonster9.gif',  idle: 'images/hunt/huntmonster10.gif', hit: 'images/hunt/huntmonster11.png', die: 'images/hunt/huntmonster12.gif' },
];

// =====================================================
//  진입 / 퇴장
// =====================================================
function openMonsterHunterPage() {
    if (!currentSelectedData || !localLearningData[currentSelectedData]) {
        alert("학습 내용을 먼저 선택해 주세요! ✏️");
        showPage('student-select-data-page');
        return;
    }
    const selectedSet = localLearningData[currentSelectedData];
    if (!selectedSet.words || selectedSet.words.length === 0) {
        alert("선택한 단어장에 단어가 존재하지 않습니다.");
        return;
    }

    // 아바타 월드 학습 데이터를 hunt.js 형식({ en, ko })으로 변환
    mhWordList = selectedSet.words.map(w => ({ en: String(w.eng), ko: String(w.kor) }));

    document.querySelector('.container').classList.add('game-mode');
    showPage('monsterhunter-page');  // 먼저 페이지를 보여야 DOM 크기가 잡힘

    mhInitDom();       // DOM 레퍼런스 수집 + 이벤트 등록
    mhResetUI();       // 오버레이·점수 초기화
    mhStartResizeObserver();  // ResizeObserver 시작

    // ResizeObserver 첫 콜백이 오기 전에도 올바른 scale 적용
    setTimeout(() => mhUpdateScale(), 0);
}

function exitMonsterHunterPage() {
    mhForceStop();
    mhStopResizeObserver();
    document.querySelector('.container').classList.remove('game-mode');
    showPage('student-solo-game-page');
}

// =====================================================
//  DOM 레퍼런스 수집 (페이지 진입 시 1회)
// =====================================================
function mhInitDom() {
    mhGameWrapper    = document.getElementById('mh-game-wrapper');
    mhGameCanvas     = document.getElementById('mh-game-canvas');
    mhStartScreen    = document.getElementById('mh-start-screen');
    mhGameoverScreen = document.getElementById('mh-gameover-screen');
    mhPlayerImg      = document.getElementById('mh-player-img');
    mhPlayerEffect   = document.getElementById('mh-player-effect');
    mhScoreDisplay   = document.getElementById('mh-score-display');
    mhFinalScore     = document.getElementById('mh-final-score');
    mhUltimateBtn    = document.getElementById('mh-ultimate-btn');
    mhQuizPanel      = document.getElementById('mh-quiz-panel');
    mhQuizWord       = document.getElementById('mh-quiz-word');
    mhQuizChoices    = document.getElementById('mh-quiz-choices');
    mhQuizBtns       = document.querySelectorAll('.mh-quiz-btn');
    mhUltimateIconColor = document.getElementById('mh-ultimate-icon-color');

    // 퀴즈 버튼 이벤트 (중복 방지: 기존 리스너 제거 후 재등록)
    mhQuizBtns.forEach((btn, i) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    mhQuizBtns = document.querySelectorAll('.mh-quiz-btn');
    mhQuizBtns.forEach((btn, i) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); mhHandleQuizAnswer(i); });
        btn.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    });

    // 궁극기 버튼 — cloneNode로 기존 리스너 완전 제거 후 재등록 (버그4 수정)
    const oldUltBtn = mhUltimateBtn;
    const newUltBtn = oldUltBtn.cloneNode(true);
    oldUltBtn.parentNode.replaceChild(newUltBtn, oldUltBtn);
    mhUltimateBtn = newUltBtn;
    mhUltimateIconColor = document.getElementById('mh-ultimate-icon-color'); // cloneNode 후 재참조
    mhUltimateBtn.addEventListener('click', (e) => { e.stopPropagation(); mhUseUltimate(); });
    mhUltimateBtn.addEventListener('touchend', (e) => { e.stopPropagation(); mhUseUltimate(); }, { passive: true });

    // 게임 래퍼 — cloneNode로 기존 리스너 완전 제거 후 재등록 (버그4 수정)
    const oldWrapper = mhGameWrapper;
    const newWrapper = oldWrapper.cloneNode(false); // 자식은 유지해야 하므로 얕은 복사 불가 → 이벤트만 제거
    // cloneNode(false)는 자식을 잃으므로 대신 AbortController 패턴 사용
    if (mhGameWrapper._mhAbort) mhGameWrapper._mhAbort.abort();
    const mhAbort = new AbortController();
    mhGameWrapper._mhAbort = mhAbort;
    const sig = mhAbort.signal;
    mhGameWrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.mh-overlay-box')) return;
        if (e.target.closest('#mh-quiz-panel')) return;
        if (e.target.closest('#mh-ultimate-btn-wrap')) return;
        if (!mhIsGameStarted || mhIsGameOver) return; // 버그6 수정: 게임 미시작 상태에서 스킬 발동 차단
        if (mhWordList.length < 4) mhUseSkill();
    }, { signal: sig });
    mhGameWrapper.addEventListener('touchstart', (e) => {
        if (e.target.closest('.mh-overlay-box')) return;
        if (e.target.closest('#mh-quiz-panel')) return;
        if (e.target.closest('#mh-ultimate-btn-wrap')) return;
        e.preventDefault();
        if (!mhIsGameStarted || mhIsGameOver) return; // 버그6 수정
        if (mhWordList.length < 4) mhUseSkill();
    }, { passive: false, signal: sig });
}

// =====================================================
//  스케일링 (상티런과 동일 패턴 + 퀴즈 패널 비례 조정)
// =====================================================
function mhUpdateScale() {
    if (!mhGameWrapper || !mhGameCanvas) return;
    const w = mhGameWrapper.clientWidth;
    const s = w / MH_GAME_BASE_WIDTH;
    mhGameCanvas.style.setProperty('--mh-scale', s);

    // 퀴즈 패널
    if (mhQuizPanel) {
        mhQuizPanel.style.top          = (50 * s) + 'px';
        mhQuizPanel.style.width        = (340 * s) + 'px';
        mhQuizPanel.style.padding      = (8 * s) + 'px ' + (16 * s) + 'px';
        mhQuizPanel.style.borderRadius = (14 * s) + 'px';
        if (mhQuizWord) mhQuizWord.style.fontSize = (24 * s) + 'px';
    }
    // 보기 버튼 줄
    if (mhQuizChoices) {
        mhQuizChoices.style.bottom = (5 * s) + 'px';
        mhQuizChoices.style.left   = (8 * s) + 'px';
        mhQuizChoices.style.width  = (724 * s) + 'px';
        mhQuizChoices.style.gap    = (8 * s) + 'px';
        if (mhQuizBtns) {
            mhQuizBtns.forEach(btn => {
                btn.style.fontSize     = (14 * s) + 'px';
                btn.style.padding      = (8 * s) + 'px ' + (4 * s) + 'px';
                btn.style.height       = (52 * s) + 'px';
                btn.style.borderRadius = (10 * s) + 'px';
            });
        }
    }
    // 궁극기 버튼
    const ultimateBtnWrap = document.getElementById('mh-ultimate-btn-wrap');
    if (ultimateBtnWrap && mhUltimateBtn) {
        ultimateBtnWrap.style.bottom       = (5 * s) + 'px';
        ultimateBtnWrap.style.right        = (8 * s) + 'px';
        ultimateBtnWrap.style.width        = (52 * s) + 'px';
        mhUltimateBtn.style.borderRadius   = (10 * s) + 'px';
        mhUltimateBtn.style.padding        = '0';
        const iconWrap = document.getElementById('mh-ultimate-icon-wrap');
        if (iconWrap) {
            const iconSize = (52 * s) + 'px';
            iconWrap.style.width  = iconSize;
            iconWrap.style.height = iconSize;
        }
    }
}

function mhStartResizeObserver() {
    if (!mhGameWrapper || typeof ResizeObserver === 'undefined') return;
    mhStopResizeObserver();
    mhResizeObserver = new ResizeObserver(() => mhUpdateScale());
    mhResizeObserver.observe(mhGameWrapper);
}

function mhStopResizeObserver() {
    if (mhResizeObserver) { mhResizeObserver.disconnect(); mhResizeObserver = null; }
}

window.addEventListener('resize', () => {
    if (document.getElementById('monsterhunter-page') &&
        document.getElementById('monsterhunter-page').classList.contains('active')) {
        mhUpdateScale();
    }
});

// =====================================================
//  UI 초기화 / 강제 정지
// =====================================================
function mhResetUI() {
    if (!mhStartScreen) return;
    mhStartScreen.classList.add('show');
    mhGameoverScreen.classList.remove('show');
    if (mhQuizPanel)   mhQuizPanel.style.display   = 'none';
    if (mhQuizChoices) mhQuizChoices.style.display  = 'none';
    mhScoreDisplay.textContent = '0';
    mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhResetUltimateGauge();
}

function mhForceStop() {
    mhLoopId++;                          // 이전 rAF 루프 세대 무효화
    clearTimeout(mhSpawnTimer);
    clearTimeout(mhCollisionTimer);
    clearTimeout(mhSkillTimer);
    clearTimeout(mhAttackTimer);
    clearTimeout(mhUltTimer1);
    clearTimeout(mhUltTimer2);
    cancelAnimationFrame(mhMoveTimer);
    mhMonsters.forEach(m => {
        clearTimeout(m.jumpTimer);
        clearTimeout(m.stopTimer);
        clearTimeout(m.dieTimer);
        mhStopSpriteSheet(m.effect);
        if (m.element) m.element.remove();
        if (m.effect)  m.effect.remove();
    });
    mhMonsters = [];
    mhProjectiles.forEach(p => { mhStopSpriteSheet(p.img); if (p.element) p.element.remove(); });
    mhProjectiles = [];
    mhIsAttacking   = false;
    mhIsGameStarted = false;
    mhIsGameOver    = false;
    mhSpawnInterval = 1000;
}

// =====================================================
//  퀴즈 로직 (hunt.js 원본과 동일, mh_ 접두사)
// =====================================================
function mhBuildQuizQueue() {
    mhQuizQueue = shuffleArray([...Array(mhWordList.length).keys()]);
}

function mhNextQuiz() {
    if (mhWordList.length < 4) return;
    if (mhQuizQueue.length === 0) mhBuildQuizQueue();

    const idx     = mhQuizQueue.pop();
    const correct = mhWordList[idx];
    const pool    = mhWordList.filter((_, i) => i !== idx);
    const distractors = shuffleArray(pool).slice(0, 3).map(w => w.ko);
    const choices     = shuffleArray([correct.ko, ...distractors]);
    const answerIdx   = choices.indexOf(correct.ko);

    mhCurrentQuiz  = { en: correct.en, ko: correct.ko, choices, answerIdx };
    mhQuizAnswered = false;

    mhQuizWord.textContent = correct.en;
    mhQuizBtns.forEach((btn, i) => {
        btn.textContent = choices[i];
        btn.className   = 'mh-quiz-btn';
        btn.disabled    = false;
    });

    // 버튼 폰트 크기 자동 조절 (hunt.js nextQuiz 원본 로직)
    const s             = mhGameWrapper.getBoundingClientRect().width / MH_GAME_BASE_WIDTH;
    const baseFontSize  = 14 * s;
    const minFontSize   = baseFontSize * 0.55;
    const estimatedWidth = (760 * s - 8 * s * 3) / 4 - 8 * s * 2;
    const tempCanvas = document.createElement('canvas');
    const ctx        = tempCanvas.getContext('2d');
    mhQuizBtns.forEach(btn => {
        let fontSize = baseFontSize;
        ctx.font = `${fontSize}px Jua, sans-serif`;
        while (ctx.measureText(btn.textContent).width > estimatedWidth && fontSize > minFontSize) {
            fontSize -= 0.5;
            ctx.font = `${fontSize}px Jua, sans-serif`;
        }
        btn.style.fontSize = fontSize + 'px';
    });
}

function mhHandleQuizAnswer(selectedIdx) {
    if (mhQuizAnswered || !mhCurrentQuiz || !mhIsGameStarted || mhIsGameOver) return;
    mhQuizAnswered = true;
    mhQuizBtns.forEach(btn => btn.disabled = true);

    if (selectedIdx === mhCurrentQuiz.answerIdx) {
        mhCorrectCount++;
        mhQuizBtns[selectedIdx].classList.add('correct');
        mhUseSkill();
        setTimeout(() => mhNextQuiz(), 300);
    } else {
        mhWrongCount++;
        mhQuizBtns[selectedIdx].classList.add('wrong');
        mhQuizBtns[mhCurrentQuiz.answerIdx].classList.add('correct');
        setTimeout(() => mhNextQuiz(), 600);
    }
}

// =====================================================
//  게임 시작 / 재시작
// =====================================================
function startMonsterHunterGame() {
    // mhInitDom()은 openMonsterHunterPage() 진입 시 1회만 호출 — 여기서 재호출하면 이벤트 리스너 중복 등록됨
    if (!mhGameWrapper) mhInitDom(); // 혹시 직접 호출된 경우만 보호
    mhForceStop();

    // GIF 사전 로드 — 캐시에 올려둬서 이펙트 첫 번째부터 즉시 재생
    [
        'images/hunt/huntskill1.gif', 'images/hunt/huntskill2.png', 'images/hunt/huntskill3.png',
        'images/hunt/huntskill4.gif', 'images/hunt/huntskill5.png', 'images/hunt/huntskill6.png',
        'images/hunt/huntcharacter2.gif',
        'images/hunt/huntmonster1.gif',  'images/hunt/huntmonster2.gif',  'images/hunt/huntmonster3.png',
        'images/hunt/huntmonster4.gif',  'images/hunt/huntmonster5.gif',  'images/hunt/huntmonster6.gif',
        'images/hunt/huntmonster7.png',  'images/hunt/huntmonster8.gif',  'images/hunt/huntmonster9.gif',
        'images/hunt/huntmonster10.gif', 'images/hunt/huntmonster11.png', 'images/hunt/huntmonster12.gif'
    ].forEach(src => { new Image().src = src; });

    mhScore         = 0;
    mhCorrectCount  = 0;
    mhWrongCount    = 0;
    mhIsAttacking   = false;
    mhIsGameOver    = false;
    mhIsGameStarted = true;
    mhSpawnInterval = 1000;
    mhScoreDisplay.textContent = '0';
    mhResetUltimateGauge();

    mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';

    mhStartScreen.classList.remove('show');
    mhGameoverScreen.classList.remove('show');

    if (mhWordList.length >= 4) {
        mhBuildQuizQueue();
        mhQuizPanel.style.display   = 'block';
        mhQuizChoices.style.display = 'flex';
        mhNextQuiz();
    }

    mhSpawnTimer    = setTimeout(mhSpawnMonster, mhSpawnInterval);
    mhMoveMonsters();
    mhCollisionTimer = setTimeout(mhCheckCollision, 500);
}

function resetMonsterHunterGame() {
    mhForceStop();

    mhScore         = 0;
    mhCorrectCount  = 0;
    mhWrongCount    = 0;
    mhIsAttacking   = false;
    mhIsGameOver    = false;
    mhIsGameStarted = true;
    mhSpawnInterval = 1000;
    mhScoreDisplay.textContent = '0';
    mhResetUltimateGauge();

    mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhGameoverScreen.classList.remove('show');

    if (mhWordList.length >= 4) {
        mhBuildQuizQueue();
        mhQuizPanel.style.display   = 'block';
        mhQuizChoices.style.display = 'flex';
        mhNextQuiz();
    }

    mhSpawnTimer     = setTimeout(mhSpawnMonster, mhSpawnInterval);
    mhMoveMonsters();
    mhCollisionTimer = setTimeout(mhCheckCollision, 500);
}

// =====================================================
//  점수
// =====================================================
function mhUpdateScore(delta) {
    mhScore += delta;
    if (mhScoreDisplay) mhScoreDisplay.textContent = mhScore;
}

// =====================================================
//  궁극기 게이지
// =====================================================
function mhUpdateUltimateGauge() {
    const pct     = (mhUltimateCharge / MH_ULTIMATE_MAX) * 100;
    const topClip = 100 - pct;
    if (mhUltimateIconColor) {
        mhUltimateIconColor.style.clipPath = `inset(${topClip}% 0% 0% 0%)`;
    }
    if (mhUltimateCharge >= MH_ULTIMATE_MAX && !mhIsUltimateReady) {
        mhIsUltimateReady = true;
        mhUltimateBtn.disabled = false;
        mhUltimateBtn.classList.add('ready');
    }
}

function mhChargeUltimate() {
    if (mhIsUltimateReady) return;
    mhUltimateCharge = Math.min(mhUltimateCharge + 1, MH_ULTIMATE_MAX);
    mhUpdateUltimateGauge();
}

function mhResetUltimateGauge() {
    mhUltimateCharge  = 0;
    mhIsUltimateReady = false;
    if (mhUltimateBtn) {
        mhUltimateBtn.disabled = true;
        mhUltimateBtn.classList.remove('ready');
    }
    if (mhUltimateIconColor) {
        mhUltimateIconColor.style.clipPath = 'inset(100% 0% 0% 0%)';
    }
}

// =====================================================
//  몬스터 스폰
// =====================================================
function mhRefreshGif(el, filename) {
    if (el) el.src = filename + '?t=' + Date.now();
}

// =====================================================
//  스프라이트 시트 애니메이션 (huntskill2/3/5/6.png)
//  - huntskill5는 좌우반전(scaleX(-1))으로 사용
// =====================================================
const MH_SPRITE_SHEETS = {
    // 총 2프레임, 176×32 (88×32 프레임, 2열×1행, 빈칸 없음)
    skill2: { src: 'images/hunt/huntskill2.png', frameCount: 2, cols: 2, rows: 1, frameW: 88,  frameH: 32,  mirrored: true },
    // 총 5프레임, 492×272 (164×136 프레임, 3열×2행, 마지막 1칸은 빈칸)
    skill3: { src: 'images/hunt/huntskill3.png', frameCount: 5, cols: 3, rows: 2, frameW: 164, frameH: 136, mirrored: false },
    // 총 3프레임, 512×224 (256×112 프레임, 2열×2행, 마지막 1칸은 빈칸)
    skill5: { src: 'images/hunt/huntskill5.png', frameCount: 3,  cols: 2, rows: 2, frameW: 256, frameH: 112, mirrored: true },
    // 총 6프레임, 756×448 (252×224 프레임, 3열×2행, 빈칸 없음)
    skill6: { src: 'images/hunt/huntskill6.png', frameCount: 6,  cols: 3, rows: 2, frameW: 252, frameH: 224, mirrored: false },
};

/**
 * 스프라이트 시트를 img 엘리먼트에 프레임 단위로 재생
 * (object-fit:none + object-position 트릭으로 시트에서 한 프레임만 잘라서 표시)
 * ⚠️ mirrored 시트는 위치 이동/스케일(translate, scale 등)을 이 img가 아니라
 *    "바깥 wrapper"에 걸어야 함. 좌우반전(scaleX(-1))은 이 img 자신의 중앙을
 *    기준으로만 적용되므로, 위치용 transform과 섞이면 반전 기준점이 어긋나서
 *    이펙트가 엉뚱한 곳(화면 밖)으로 튕겨나갈 수 있음.
 *    (mirrored가 아닌 시트는 반전 자체가 없으므로 opts.transform으로 위치를
 *    직접 지정해도 안전함 — 예: skill6의 'translate(-50%, 50%)' 센터링)
 * @param {HTMLImageElement} el  - 표시할 img 엘리먼트 (position은 static 그대로 둘 것)
 * @param {object} sheet         - MH_SPRITE_SHEETS 항목
 * @param {object} opts
 *   fps       {number}  초당 프레임 수 (기본 12)
 *   loop      {boolean} 반복 재생 여부 (기본 false)
 *   transform {string}  위치용 transform (mirrored:false인 시트에서만 적용됨)
 *   onDone    {function} 반복하지 않을 때 마지막 프레임 이후 호출
 */
function mhPlaySpriteSheet(el, sheet, opts = {}) {
    if (!el || !sheet) return;
    const fps    = opts.fps || 12;
    const loop   = !!opts.loop;
    const onDone = opts.onDone;

    mhStopSpriteSheet(el); // 같은 엘리먼트 재사용 시 기존 타이머 정리

    el.src = sheet.src;
    el.style.display     = 'block';
    el.style.width       = sheet.frameW + 'px';
    el.style.height       = sheet.frameH + 'px';
    el.style.objectFit    = 'none';
    // 반전은 항상 이 엘리먼트 자신의 중앙(기본 transform-origin: 50% 50%)을 기준으로 적용
    // mirrored가 아닌 시트는 위치용 transform을 그대로 써도 안전함
    el.style.transform     = sheet.mirrored ? 'scaleX(-1)' : (opts.transform || '');

    const setFrame = (i) => {
        const col = i % sheet.cols;
        const row = Math.floor(i / sheet.cols);
        el.style.objectPosition = `-${col * sheet.frameW}px -${row * sheet.frameH}px`;
    };

    let frame = 0;
    setFrame(0);

    el._mhSpriteTimer = setInterval(() => {
        frame++;
        if (frame >= sheet.frameCount) {
            if (loop) {
                frame = 0;
                setFrame(0);
            } else {
                clearInterval(el._mhSpriteTimer);
                el._mhSpriteTimer = null;
                if (onDone) onDone();
            }
            return;
        }
        setFrame(frame);
    }, 1000 / fps);
}

function mhStopSpriteSheet(el) {
    if (el && el._mhSpriteTimer) {
        clearInterval(el._mhSpriteTimer);
        el._mhSpriteTimer = null;
    }
}

function mhSpawnMonster() {
    if (!mhIsGameStarted || mhIsGameOver) return;

    const alive = mhMonsters.filter(m => !m.isDead).length;
    if (alive < MH_MAX_MONSTERS) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mh-character-wrapper';

        const rightmostPos = mhMonsters
            .filter(m => !m.isDead)
            .reduce((max, m) => Math.max(max, m.pos), -Infinity);
        const spawnX = rightmostPos === -Infinity
            ? 800
            : Math.max(800, rightmostPos + 60 + Math.random() * 60);

        wrapper.style.left    = spawnX + 'px';
        wrapper.style.bottom  = '143px';
        wrapper.style.opacity = '0';

        const typeIdx = Math.floor(Math.random() * MH_MONSTER_TYPES.length);
        const mType   = MH_MONSTER_TYPES[typeIdx];

        const mImg = document.createElement('img');
        mhRefreshGif(mImg, mType.walk);

        const mEffect = document.createElement('img');
        mEffect.style.display  = 'none';
        mEffect.style.position = 'absolute';
        mEffect.style.zIndex   = '15';

        wrapper.appendChild(mImg);
        mhGameCanvas.appendChild(wrapper);
        mhGameCanvas.appendChild(mEffect);

        const jumpDelay  = 1000 + Math.random() * 3000;
        const stopTarget = Math.random() < 0.75 ? Math.random() * 800 : -9999;

        mhMonsters.push({
            element: wrapper, img: mImg, effect: mEffect, type: mType,
            pos: spawnX, hp: 2, isDead: false, isHit: false, knockback: 0,
            velY: 0, offsetY: 0, isJumping: false,
            jumpTimer: null, stopTarget, isStopped: false, stopTimer: null, dieTimer: null
        });

        setTimeout(() => { wrapper.style.opacity = '1'; }, 50);

        const m = mhMonsters[mhMonsters.length - 1];
        mhScheduleJump(m, jumpDelay);
    }

    mhSpawnInterval = Math.max(400, mhSpawnInterval * 0.95);
    mhSpawnTimer    = setTimeout(mhSpawnMonster, mhSpawnInterval);
}

function mhScheduleJump(monster, delay) {
    monster.jumpTimer = setTimeout(() => {
        if (!monster.isDead && !monster.isHit && !monster.isStopped && mhIsGameStarted && !mhIsGameOver) {
            mhDoJump(monster);
        }
    }, delay);
}

function mhDoJump(monster) {
    if (monster.isJumping || monster.isDead) return;
    monster.isJumping = true;
    monster.velY = MH_JUMP_FORCE;
}

// =====================================================
//  발사체 이동
// =====================================================
function mhMoveProjectiles() {
    for (let i = mhProjectiles.length - 1; i >= 0; i--) {
        const p = mhProjectiles[i];
        p.x += p.speed;
        p.element.style.left = p.x + 'px';

        if (p.target) {
            if (p.target.isDead) {
                const alreadyTargeted = new Set(
                    mhProjectiles.filter((_, j) => j !== i).map(q => q.target).filter(Boolean)
                );
                p.target = mhMonsters
                    .filter(m => !m.isDead && m.pos >= p.x - 50 && !alreadyTargeted.has(m))
                    .sort((a, b) => a.pos - b.pos)[0] || null;
                continue;
            }
            const targetHitX = p.target.pos + 55;
            if (p.x >= targetHitX) {
                const hit = p.target;
                mhStopSpriteSheet(p.img);
                p.element.remove();
                mhProjectiles.splice(i, 1);
                if (!hit.isDead) mhApplyHit(hit);
            }
        } else {
            if (p.x > 850) { mhStopSpriteSheet(p.img); p.element.remove(); mhProjectiles.splice(i, 1); }
        }
    }
}

function mhMoveMonsters() {
    const myLoopId = mhLoopId; // 이 루프가 속한 세대 기억
    function loop() {
        if (myLoopId !== mhLoopId || !mhIsGameStarted) return; // 세대가 바뀌면 즉시 종료
        for (let i = mhMonsters.length - 1; i >= 0; i--) {
            const m = mhMonsters[i];

            if (!m.isDead && !m.isHit) {
                if (!m.isStopped && !m.isJumping && m.pos <= m.stopTarget) {
                    m.isStopped = true;
                    mhRefreshGif(m.img, m.type.idle);
                    const stopDuration = 1000 + Math.random() * 500;
                    m.stopTimer = setTimeout(() => {
                        if (!m.isDead && !m.isHit) {
                            m.isStopped = false;
                            m.stopTarget = Math.random() < 0.75
                                ? m.pos - (80 + Math.random() * 200)
                                : -9999;
                            mhRefreshGif(m.img, m.type.walk);
                        }
                    }, stopDuration);
                }
                if (!m.isStopped) {
                    m.pos -= 1;
                    m.element.style.left = m.pos + 'px';
                }
            } else if (!m.isDead && m.isHit && m.knockback > 0) {
                const step = Math.min(m.knockback, 4);
                m.pos += step;
                m.knockback -= step;
                m.element.style.left = m.pos + 'px';
            }

            if (!m.isDead && m.isJumping) {
                m.velY    += MH_GRAVITY;
                m.offsetY -= m.velY;
                if (m.offsetY <= MH_GROUND_Y) {
                    m.offsetY  = 0; m.velY = 0; m.isJumping = false;
                    mhScheduleJump(m, 1500 + Math.random() * 3000);
                }
                m.element.style.bottom = (143 + m.offsetY) + 'px';
            }

            if (m.pos < -150) {
                clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer); clearTimeout(m.dieTimer);
                m.element.remove(); m.effect.remove();
                mhMonsters.splice(i, 1);
            }
        }

        mhMoveProjectiles();
        mhMoveTimer = requestAnimationFrame(loop);
    }
    loop();
}

// =====================================================
//  충돌 감지
// =====================================================
function mhCheckCollision() {
    clearTimeout(mhCollisionTimer);
    if (!mhIsGameStarted || mhIsGameOver) return;

    for (const m of mhMonsters) {
        if (m.isDead || m.isHit) continue;
        const playerLeft  = MH_PLAYER_LEFT + (150 - MH_PLAYER_WIDTH) / 2;
        const playerRight = playerLeft + MH_PLAYER_WIDTH;
        const mCenter = m.pos + 75;
        const mLeft   = mCenter - MH_MONSTER_HIT_W / 2;
        const mRight  = mCenter + MH_MONSTER_HIT_W / 2;
        if (mLeft < playerRight && mRight > playerLeft) {
            mhTriggerGameOver();
            return;
        }
    }
    mhCollisionTimer = setTimeout(mhCheckCollision, 50);
}

// =====================================================
//  게임오버
// =====================================================
function mhTriggerGameOver() {
    mhIsGameOver    = true;
    mhIsGameStarted = false;
    cancelAnimationFrame(mhMoveTimer);
    clearTimeout(mhSpawnTimer);
    clearTimeout(mhCollisionTimer);
    mhMonsters.forEach(m => {
        clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer); clearTimeout(m.dieTimer);
    });

    if (mhQuizPanel)   mhQuizPanel.style.display   = 'none';
    if (mhQuizChoices) mhQuizChoices.style.display  = 'none';
    mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhResetUltimateGauge();

    mhFinalScore.innerHTML = `🏆 점수 : ${mhScore} 점<br>⭕ 정답 : ${mhCorrectCount} 개<br>❌ 오답 : ${mhWrongCount} 개`;
    mhGameoverScreen.classList.add('show');
}

// =====================================================
//  스킬 — 일반 공격
// =====================================================
function mhUseSkill() {
    if (!mhIsGameStarted || mhIsAttacking || mhIsGameOver) return;
    mhIsAttacking = true;

    mhRefreshGif(mhPlayerImg, 'images/hunt/huntcharacter2.gif');
    mhRefreshGif(mhPlayerEffect, 'images/hunt/huntskill1.gif');
    mhPlayerEffect.style.display = 'block';

    mhAttackTimer = setTimeout(() => {
        mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
        mhPlayerEffect.style.display = 'none';
        mhIsAttacking = false;
    }, 500);

    mhSkillTimer = setTimeout(() => {
        if (!mhIsGameStarted || mhIsGameOver) return; // 게임 종료 후 발사체 생성 차단
        const alreadyTargeted = new Set(mhProjectiles.map(p => p.target).filter(Boolean));
        let validTargets = mhMonsters
            .filter(m => !m.isDead && m.pos <= 800 && m.pos >= -50 && !alreadyTargeted.has(m));
        validTargets.sort((a, b) => a.pos - b.pos);
        const hitTargets = validTargets.slice(0, 3);
        if (hitTargets.length > 0) {
            hitTargets.forEach(m => mhSpawnProjectile(m));
        } else {
            mhSpawnProjectile(null);
        }
    }, 200);
}

function mhSpawnProjectile(targetMonster) {
    const projWrap = document.createElement('div');
    projWrap.className = 'mh-projectile'; // .mh-projectile 클래스의 translateY(50%)는 wrapper가 그대로 담당
    const startX = 190, startY = 168;
    projWrap.style.left   = startX + 'px';
    projWrap.style.bottom = startY + 'px';
    const projImg = document.createElement('img');
    projWrap.appendChild(projImg);
    mhGameCanvas.appendChild(projWrap);
    // 반전(scaleX(-1))은 내부 img가 자기 중심 기준으로 담당 — wrapper의 위치와 서로 간섭하지 않음
    mhPlaySpriteSheet(projImg, MH_SPRITE_SHEETS.skill2, { fps: 12, loop: true });
    mhProjectiles.push({ element: projWrap, img: projImg, x: startX, y: startY, target: targetMonster, speed: 18 });
}

function mhApplyHit(m) {
    const hitX = m.pos + 55;
    m.effect.style.left      = hitX + 'px';
    m.effect.style.bottom    = '168px';
    m.effect.style.display   = 'block';
    mhPlaySpriteSheet(m.effect, MH_SPRITE_SHEETS.skill3, {
        fps: 12,
        loop: false,
        transform: 'translate(-50%, 50%)'
    });
    setTimeout(() => { mhStopSpriteSheet(m.effect); m.effect.style.display = 'none'; }, 500);

    m.hp--;
    if (m.hp > 0) {
        m.isHit = true; m.isStopped = false;
        clearTimeout(m.stopTimer);
        m.knockback = 19;
        mhRefreshGif(m.img, m.type.hit);
        setTimeout(() => {
            if (!m.isDead) { m.isHit = false; mhRefreshGif(m.img, m.type.walk); }
        }, 500);
    } else {
        m.isDead = true;
        clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer);
        mhRefreshGif(m.img, m.type.die);
        mhUpdateScore(1);
        mhChargeUltimate();
        setTimeout(() => { m.element.style.opacity = '0'; }, 50);
        m.dieTimer = setTimeout(() => {
            m.element.remove(); m.effect.remove();
            const idx = mhMonsters.indexOf(m);
            if (idx > -1) mhMonsters.splice(idx, 1);
        }, 550);
    }
}

// =====================================================
//  궁극기 — 관통 발사체
// =====================================================
function mhUseUltimate() {
    if (!mhIsGameStarted || mhIsGameOver || !mhIsUltimateReady || mhIsAttacking) return;
    mhIsAttacking = true;
    mhResetUltimateGauge();

    const ultScale  = (186 * 1.8) / 400;
    const ultEffect = document.createElement('img');
    ultEffect.id    = 'mh-ultimate-effect';
    mhRefreshGif(ultEffect, 'images/hunt/huntskill4.gif');
    ultEffect.style.cssText = `position:absolute; bottom:137px; left:50px; z-index:50;
        transform:translate(-77px,127px) scale(${ultScale}); transform-origin:left bottom;`;
    mhGameCanvas.appendChild(ultEffect);

    mhRefreshGif(mhPlayerImg, 'images/hunt/huntcharacter2.gif');
    mhPlayerEffect.style.display = 'none';

    mhUltTimer1 = setTimeout(() => { mhSpawnUltimateProjectile(); }, 550);

    mhUltTimer2 = setTimeout(() => {
        mhPlayerImg.src = 'images/hunt/huntcharacter1.gif';
        if (ultEffect.parentNode) ultEffect.remove();
        mhIsAttacking = false;
    }, 980);
}

function mhSpawnUltimateProjectile() {
    const projWrap = document.createElement('div');
    projWrap.className = 'mh-projectile'; // .mh-projectile 클래스의 translateY(50%)는 wrapper에 그대로 적용됨
    projWrap.style.zIndex = '50';
    const startX = 190, startY = 168;
    projWrap.style.left   = startX + 'px';
    projWrap.style.bottom = startY + 'px';
    const projImg = document.createElement('img');
    projWrap.appendChild(projImg);
    mhGameCanvas.appendChild(projWrap);
    mhPlaySpriteSheet(projImg, MH_SPRITE_SHEETS.skill5, { fps: 12, loop: true });

    const hitMonsters = new Set();
    let x = startX;
    const SPEED = 9;

    function moveBullet() {
        if (!mhIsGameStarted && !mhIsGameOver) { mhStopSpriteSheet(projImg); projWrap.remove(); return; }
        x += SPEED;
        projWrap.style.left = x + 'px';
        mhMonsters.forEach(m => {
            if (m.isDead || hitMonsters.has(m)) return;
            const hitX = m.pos + 55;
            if (x >= hitX - 20 && x <= hitX + 60) {
                hitMonsters.add(m);
                mhApplyUltimateKill(m);
            }
        });
        if (x > 860) { mhStopSpriteSheet(projImg); projWrap.remove(); return; }
        requestAnimationFrame(moveBullet);
    }
    requestAnimationFrame(moveBullet);
}

function mhApplyUltimateKill(m) {
    if (m.isDead) return;
    const hitX = m.pos + 55;
    m.effect.style.left      = hitX + 'px';
    m.effect.style.bottom    = '168px';
    m.effect.style.display   = 'block';
    mhPlaySpriteSheet(m.effect, MH_SPRITE_SHEETS.skill6, {
        fps: 12,
        loop: false,
        transform: 'translate(-50%, 50%)'
    });
    setTimeout(() => { mhStopSpriteSheet(m.effect); m.effect.style.display = 'none'; }, 500);

    m.isDead = true;
    clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer);
    mhRefreshGif(m.img, m.type.die);
    mhUpdateScore(1);

    setTimeout(() => { m.element.style.opacity = '0'; }, 50);
    m.dieTimer = setTimeout(() => {
        mhStopSpriteSheet(m.effect);
        m.element.remove(); m.effect.remove();
        const idx = mhMonsters.indexOf(m);
        if (idx > -1) mhMonsters.splice(idx, 1);
    }, 550);
}

// Space 키 — 몬스터 헌터 페이지에서도 스킬 사용
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' &&
        document.getElementById('monsterhunter-page') &&
        document.getElementById('monsterhunter-page').classList.contains('active')) {
        e.preventDefault();
        if (mhWordList.length < 4) mhUseSkill();
    }
});
