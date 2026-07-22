const startBtn    = document.getElementById('start-btn');
const throwBtn    = document.getElementById('throw-btn');
const runawayBtn  = document.getElementById('runaway-btn');
const chargeBtn   = document.getElementById('charge-btn');
const startScreen = document.getElementById('start-screen');
const pokeball    = document.getElementById('pokeball');
const monster     = document.getElementById('monster');
const shinyEffect = document.getElementById('shiny-effect');
const gameContainer = document.getElementById('game-container');
const controlPanel = document.getElementById('control-panel');
const actionBtns  = document.getElementById('action-btns');
const monsterInfo = document.getElementById('monster-info');
const monsterInfoText = document.getElementById('monster-info-text'); // 이름표시패치: monster-info 밖으로 분리됨, hp바와 표시/페이드 상태를 계속 함께 맞춰줘야 함
const monsterNameEl = document.getElementById('monster-name');
const monsterBstEl  = document.getElementById('monster-bst');
const captureMessageEl = document.getElementById('capture-message');
const gameTimerEl = document.getElementById('game-timer');
const cpTotalEl   = document.getElementById('cp-total');

// ===================== 반응형 스케일링 =====================
// #game-container(고정 370x600)를 실제 화면에 맞는 크기로 스케일링.
// 비율 자체는 #game-frame의 CSS aspect-ratio(370:600)가 못박아두고 있어서
// (상티런 #game-wrapper, 헌터 #mh-game-wrapper와 동일한 방식) 화면 회전 등 어떤 크기 변화에도
// 브라우저가 레이아웃 계산과 동시에 정확한 비율을 유지해줌.
// JS는 그 결과로 실제 렌더링된 #game-frame의 너비만 읽어서 370px 기준 배율로 환산할 뿐,
// 뷰포트 크기를 직접 계산하지 않으므로 innerWidth/visualViewport 같은 측정 오차에 좌우되지 않음.
const BASE_WIDTH  = 370;
let currentScale = 1; // getThrowTargetBottom() 등 화면 좌표 기반 계산에서 로컬 좌표로 환산할 때 사용

const gameFrame = document.getElementById('game-frame');

function applyResponsiveScale() {
    if (!gameFrame) return;
    const scale = gameFrame.clientWidth / BASE_WIDTH;
    currentScale = scale;
    gameContainer.style.transform = `scale(${scale})`;
}

// #game-frame의 실제 렌더링 크기가 바뀔 때마다 반응 (창 리사이즈, 화면 회전,
// 페이지 활성화로 display:none → flex 전환되는 순간까지 전부 포함)
let scaleRafId = null;
const resizeObserver = new ResizeObserver(() => {
    if (scaleRafId !== null) cancelAnimationFrame(scaleRafId);
    scaleRafId = requestAnimationFrame(() => {
        applyResponsiveScale();
        scaleRafId = null;
    });
});
if (gameFrame) resizeObserver.observe(gameFrame);

// 최초 로드 시 1회 적용 (이 시점엔 페이지가 display:none이라 0으로 계산될 수 있는데,
// openPokemonCatchPage()에서 페이지를 보여준 직후 다시 한번 명시적으로 호출해 보정함)
applyResponsiveScale();



// 퀴즈 모달 요소
const quizModal    = document.getElementById('quiz-modal');
const quizCloseBtn = document.getElementById('quiz-close-btn');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions  = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');

// 결과 화면 요소
const resultScreen   = document.getElementById('result-screen');
const resultScoreEl  = document.getElementById('result-score');
const resultCorrectEl = document.getElementById('result-correct');
const resultWrongEl  = document.getElementById('result-wrong');
const retryBtn       = document.getElementById('retry-btn');
const capturedListBtn = document.getElementById('captured-list-btn');

// 포획한 포켓몬 목록 모달 요소
const capturedModal    = document.getElementById('captured-modal');
const capturedCloseBtn = document.getElementById('captured-close-btn');
const pauseModal       = document.getElementById('pause-modal');
const capturedListEl   = document.getElementById('captured-list');

// 게임 진입 시 openPokemonCatchPage()에서 채워지는 단어 목록: [{ en: '영어단어', kr: '한글뜻' }, ...]
let wordList = [];
const QUIZ_MIN_WORDS = 4; // 4지선다를 위해 최소 4개 단어 필요

// 포켓볼 / 도망치기 보유 개수 (기본 1개씩 제공, 퀴즈 정답 시 각각 +1)
let pokeballCount = 1;
let runawayCount  = 1;

// 퀴즈 정답/오답 집계 (결과 화면에 표시)
let quizCorrectCount = 0;
let quizWrongCount   = 0;

// 포획한 포켓몬 목록 (포획한 순서대로 저장: { id, name, bst })
let capturedList = [];

// 몬스터볼/도망치다 버튼이 애니메이션 진행 중인지 여부 (진행 중엔 개수와 무관하게 비활성화)
let isAnimating = false;

// 제한시간이 끝났는지 여부 (끝났어도 진행 중인 몬스터볼 애니메이션은 끝까지 보여준 뒤 결과 화면으로 전환)
let gameTimeUp = false;

// 상수
const THROW_DURATION          = 400;  // ms - 던지는 시간 (몬스터볼 패치: 새 throw.gif 8프레임×50ms에 맞춤. style.css의 #pokeball.throwing transition-duration과 반드시 함께 변경)
const BOUNCE_DURATION         = 525;  // ms - 충돌 후 정점까지 걸리는 시간 (기존 750 → 70%)
const OPEN_DELAY              = 210;  // ms - 충돌 후 open.gif 시작까지 딜레이 (기존 300 → 70%)
const CAPTURE_ABSORB_DURATION = 280;  // ms - 포획 흡수(.captured) CSS 트랜지션 시간 (기존 400 → 70%, 도망치다와는 별개)
const MONSTER_SHRINK_DURATION = 400;  // ms - 도망치다/새 몬스터 등장 시 몬스터 페이드 시간 (변경 없음)
const BOUNCE_PEAK_OFFSET      = 125; // px - ball-bounce 키프레임 이동거리 (CSS와 동일값 유지)
const DROP_DURATION           = 280;  // ms - 낙하 transition 시간 (기존 400 → 70%)
const LAND_DURATION           = 280;  // ms - 착지 바운스 animation 시간 (기존 400 → 70%)
const LANDED_WAIT             = 350;  // ms - 착지 후 onLanded 호출까지 대기 (기존 500 → 70%)
const ESCAPE_CALLBACK_WAIT    = 350;  // ms - 탈출 연출 후 콜백까지 대기 (기존 500 → 70%)
const ESCAPE_SPRING_DURATION  = 350;  // ms - 탈출 후 원래 크기로 복귀하는 스프링 트랜지션 (기존 500 → 70%)
const SHAKE_DURATION          = 450;  // ms - catch.gif 1회 재생 시간 (몬스터볼 패치: 새 catch.gif 9프레임×50ms에 맞춤)
const SHAKE_PAUSE             = 350;  // ms - 흔들림 사이 또는 탈출 전 대기 시간 (기존 500 → 70%)
const CAPTURE_CHAR_DELAY      = 42;   // ms - 포획 메시지 한 글자당 타이핑 속도 (기존 60 → 70%)
const CAPTURE_MESSAGE_WAIT    = 1000; // ms - 메시지 완성 후 다음 몬스터로 넘어가기까지 대기 시간

// ===================== 9세대 확장: 카테고리 기반 등장/포획 시스템 =====================
// POKEMON_DATA의 각 항목은 category("normal"/"mega"/"gmax")와 species(폼 그룹핑용 기본 번호)를 가짐.

// 카테고리별 ID 목록으로 분리
const NORMAL_IDS = Object.keys(POKEMON_DATA).filter(id => POKEMON_DATA[id].category === 'normal');
const MEGA_IDS    = Object.keys(POKEMON_DATA).filter(id => POKEMON_DATA[id].category === 'mega');
const GMAX_IDS     = Object.keys(POKEMON_DATA).filter(id => POKEMON_DATA[id].category === 'gmax');

// 일반(normal) 카테고리는 "종(species) 먼저 균등 선택 → 그 종의 폼 중 균등 선택"하는
// 2단계 구조로 그룹화. 로토무(폼 6개)처럼 폼이 많은 종이 그만큼 더 자주 등장하는
// 쏠림을 막기 위함 — 폼 개수와 무관하게 모든 "종"이 동일한 확률로 뽑히게 됨.
const NORMAL_BY_SPECIES = {};
NORMAL_IDS.forEach(id => {
    const sp = POKEMON_DATA[id].species;
    (NORMAL_BY_SPECIES[sp] = NORMAL_BY_SPECIES[sp] || []).push(id);
});
const NORMAL_SPECIES_LIST = Object.keys(NORMAL_BY_SPECIES);

// 몬스터 등장 카테고리 확률 (합 1.0)
const CATEGORY_RATE = { gmax: 0.005, mega: 0.025, normal: 0.97 };

const SHINY_CHANCE         = 0.1;   // 10% 확률로 shiny 등장 (카테고리와 무관하게 독립 적용)
const SHINY_CP_MULTIPLIER  = 1.5;   // shiny 포획 시 점수(CP) 배율. 카테고리 상관없이 통일

// 샤이니 이펙트 패치: GIF 대신 몬스터와 동일한 PNG 필름스트립 + JS 프레임 제어 방식.
// 원본 0.gif(798x771, 31프레임)을 각 프레임 771x771 정사각형으로 중앙 크롭한 뒤 가로로
// 이어붙여 제작함 → 23901x771, 31프레임, 프레임당 정확히 23901/31=771px(정수로 딱 떨어짐)
const SHINY_EFFECT_SRC        = 'images/pokemon/layout/shiny.png';
const SHINY_FRAME_COUNT       = 31;
const SHINY_NATIVE_WIDTH      = 23901;
const SHINY_FRAME_INTERVAL_MS = 30; // 원본 gif의 실제 프레임(1~28번) 재생 속도와 동일하게 맞춤

// 아래 두 경로(몬스터볼 open/catch)는 프리로드와 실제 재생 양쪽에서 항상 같은 문자열을 쓰도록
// 상수로 관리. 쿼리스트링을 붙이지 않아야 브라우저 캐시가 재사용됨 (재생 직전 항상 다른 src가
// 이미 들어있는 흐름이라, 쿼리스트링 없이도 브라우저가 알아서 처음부터 다시 재생해줌)
const POKEBALL_OPEN_SRC  = 'images/pokemon/pokeball/open.gif';
const POKEBALL_CATCH_SRC = 'images/pokemon/pokeball/catch.gif';

const CATCH_PROB_MAX  = 0.9;   // 종족값 최저(normal) 몬스터의 포획 성공률 (지수함수 곡선의 이론적 상한 참고값)
const CATCH_PROB_MIN  = 0.10;  // 종족값 최고(normal) 몬스터의 포획 성공률 (지수함수 곡선의 이론적 하한 참고값)
const CATCH_PROB_RARE = 0.10;  // 메가/거다이맥스 전용 고정 포획 성공률 (normal 최고와 동일)

// 포획률패치: 일반 포켓몬 포획 확률을 선형 보간 대신 지수함수로 변경.
// 세 지점을 정확히 지나도록 피팅한 계수(BST 175→90%, 500→30%, 770→10%):
//   prob(bst) = CATCH_EXP_C + CATCH_EXP_A * exp(-CATCH_EXP_K * bst)
const CATCH_EXP_A = 1.6276185420670406;
const CATCH_EXP_K = 0.003028144951451861;
const CATCH_EXP_C = -0.058095865976901084;

// 현재 라운드 몬스터의 종족값 / 이름 / 번호(id) (포획 확률·실패 모션 결정, 포획 메시지·목록에 사용)
let currentBst = 0;          // 원본 종족값 (포획 확률/실패 모션 계산 전용)
let currentEffectiveBst = 0; // 표시/점수 계산용 값 (shiny면 1.5배)
let currentCategory = 'normal'; // 'normal' / 'mega' / 'gmax'
let currentMonsterName = '';
let currentMonsterId = '';
let currentIsShiny = false;

// ===================== 제한시간 타이머 / 포획 CP 합계 =====================
const TIME_LIMIT_SECONDS = 300; // 게임 제한시간: 5분(300초)

let remainingSeconds  = TIME_LIMIT_SECONDS;
let timerIntervalId   = null;
let totalCapturedCp   = 0; // 지금까지 포획한 몬스터들의 종족값(CP) 합계

// 초 단위 정수를 "mm:ss" 형태로 표시
function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// CP 합계를 k 단위(소수 첫째자리)로 표시 (예: 1234 → "1.2k")
function formatCpTotal(cp) {
    return Math.round(cp).toLocaleString('ko-KR');
}

function updateTimerDisplay() {
    gameTimerEl.textContent = formatTime(Math.max(remainingSeconds, 0));
}

function updateCpTotalDisplay() {
    cpTotalEl.textContent = formatCpTotal(totalCapturedCp);
}

// 게임 시작 시 호출: 타이머/CP 합계 초기화 후 1초마다 카운트다운
function startGameTimer() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    remainingSeconds = TIME_LIMIT_SECONDS;
    updateTimerDisplay();
    resumeGameTimer();
}

// 타이머만 멈춤 (일시정지 화면 / 포획한 포켓몬 화면을 게임 중 열었을 때 사용)
function pauseGameTimer() {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
}

// 멈췄던 타이머를 남은 시간 그대로 이어서 재개
function resumeGameTimer() {
    if (timerIntervalId || gameTimeUp) return; // 이미 돌고 있거나 게임이 끝난 상태면 무시
    timerIntervalId = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay();
        if (remainingSeconds <= 0) {
            clearInterval(timerIntervalId);
            timerIntervalId = null;
            onTimeUp();
        }
    }, 1000);
}

// 제한시간 종료: 몬스터볼을 던지는 중이면 그 애니메이션이 끝날 때까지 기다렸다가 결과 화면으로 전환
// (끝나기 직전에 던진 몬스터볼은 포획 성공/실패와 무관하게 끝까지 보여주고, 포획 성공 시엔 결과에 반영)
function onTimeUp() {
    gameTimeUp = true;
    quizModal.classList.add('hidden'); // 퀴즈는 더 이상 풀 수 없으므로 즉시 닫음

    if (!isAnimating) {
        // 진행 중인 애니메이션이 없으면 바로 결과 화면으로 전환
        finishGameToResult();
    }
    // isAnimating이 true인 경우(몬스터볼 던지는 중 / 도망치는 중)엔 여기서 아무것도 하지 않고,
    // 해당 애니메이션이 자연스럽게 끝나는 지점(runThrow/runRunAway 내부)에서
    // gameTimeUp 플래그를 감지해 자동으로 결과 화면으로 전환됨
}

// 실제로 게임을 종료 상태로 만들고 결과 화면을 표시
function finishGameToResult() {
    isAnimating = true; // 몬스터볼/도망치다/충전하기 버튼 모두 비활성화
    refreshButtons();
    quizModal.classList.add('hidden');

    captureMessageEl.classList.add('hidden');
    captureMessageEl.textContent = '';

    // 포획 성공 처리 도중(onCaptureSuccess) 시간이 끝나 여기로 바로 넘어온 경우,
    // 버튼에 남아있을 수 있는 btn-hidden(투명 처리)을 정리해 다음 게임 시작 시 정상적으로 보이도록 함
    [throwBtn, runawayBtn, chargeBtn].forEach(b => b.classList.remove('btn-hidden'));

    showResultScreen();
}

// 결과 화면 표시: 게임 화면 요소를 숨기고 대기창 스타일의 결과창(점수/정답/오답 + 다시하기/포획목록)을 보여줌
function showResultScreen() {
    resultScoreEl.textContent   = `🏆 점수 : ${formatCpTotal(totalCapturedCp)}점`;
    resultCorrectEl.textContent = `⭕ 정답 : ${quizCorrectCount}개`;
    resultWrongEl.textContent   = `❌ 오답 : ${quizWrongCount}개`;

    // 게임 플레이 요소 숨김
    monster.classList.add('hidden');
    shinyEffect.classList.add('hidden');
    monsterInfo.classList.add('hidden');
    monsterInfoText.classList.add('hidden');
    gameTimerEl.classList.add('hidden');
    cpTotalEl.classList.add('hidden');
    pokeball.classList.add('hidden');
    controlPanel.classList.add('hidden');

    resultScreen.classList.remove('hidden');
}

// 종족값이 높을수록 포획 성공률이 지수적으로 낮아짐 (175→90%, 500→30%, 770→10%).
// 메가/거다이맥스는 항상 고정값(normal 최고와 동일)
function getCatchProbability(bst, category) {
    if (category === 'mega' || category === 'gmax') return CATCH_PROB_RARE;
    return CATCH_EXP_C + CATCH_EXP_A * Math.exp(-CATCH_EXP_K * bst);
}

// 포획 확률 곡선에서 "얼마나 어려운 위치인지"를 0(가장 쉬움)~1(가장 어려움)로 환산.
// 종족값을 직접 쓰지 않고 포획확률 기반으로 계산해서, 실패 유형 비율도 지수함수의
// 굴곡(초반에 빠르게 어려워지는 모양)을 그대로 반영하도록 함
function getFailTypeProgress(bst) {
    const prob = getCatchProbability(bst, 'normal');
    return (CATCH_PROB_MAX - prob) / (CATCH_PROB_MAX - CATCH_PROB_MIN);
}

// 종족값이 높을수록(정확히는 포획확률 기반 진행도가 높을수록) 실패 모션 1(무저항 탈출)이
// 잦고, 3(가장 오래 저항)은 드물어짐. 메가/거다이맥스는 t=1(난이도 최상단) 고정
function pickFailType(bst, category) {
    const t = (category === 'mega' || category === 'gmax')
        ? 1
        : getFailTypeProgress(bst);
    // 해너츠(CP 최저, t=0): 실패1/2/3 = 20/30/50
    // 아르세우스(CP 최고, t=1): 실패1/2/3 = 50/30/20 (같은 세 숫자를 반대로 배정)
    const w1 = 0.2 + 0.3 * t;  // 20% ~ 50% (무저항 탈출, 어려울수록 ↑)
    const w3 = 0.5 - 0.3 * t;  // 50% ~ 20% (오래 저항, 쉬울수록 ↑)
    const w2 = 1 - w1 - w3;    // 항상 30% (양 끝 값이 같아 기울기가 상쇄됨)
    const r = Math.random();
    if (r < w1) return 1;
    if (r < w1 + w2) return 2;
    return 3;
}

// 카테고리별 스프라이트 폴더 (9세대 확장분은 정지 PNG 스프라이트시트 — animateSpriteSheet 참고)
const CATEGORY_FOLDER = {
    normal: { base: 'front',      shiny: 'front_shiny' },
    mega:   { base: 'front_mega', shiny: 'front_mega_shiny' },
    gmax:   { base: 'front_gmax', shiny: 'front_gmax_shiny' },
};
const SPRITE9_ROOT = 'images/pokemon/pokemon';

// 도감/포획 목록에 쓰이는 아이콘 경로 (카테고리별로 icon/icon_mega/icon_gmax + _shiny 폴더로 분기)
const ICON_FOLDER = {
    normal: { base: 'icon',      shiny: 'icon_shiny' },
    mega:   { base: 'icon_mega', shiny: 'icon_mega_shiny' },
    gmax:   { base: 'icon_gmax', shiny: 'icon_gmax_shiny' },
};
function capturedIconSrc(id, category, isShiny) {
    const folders = ICON_FOLDER[category] || ICON_FOLDER.normal;
    const folder = isShiny ? folders.shiny : folders.base;
    return `${SPRITE9_ROOT}/${folder}/${id}.png`;
}

// 몬스터 등장 카테고리(일반 97% / 메가 2.5% / 거다이맥스 0.5%)를 먼저 정하고,
// 그 안에서 개체를 고름. 일반은 "종 먼저 균등 선택 → 폼 균등 선택"(쏠림 방지),
// 메가/거다이맥스는 해당 카테고리 안에서 그냥 균등 선택 (쏠림 영향이 미미해서 단순 처리)
function pickCategory() {
    const r = Math.random();
    if (r < CATEGORY_RATE.gmax) return 'gmax';
    if (r < CATEGORY_RATE.gmax + CATEGORY_RATE.mega) return 'mega';
    return 'normal';
}

function pickRandomMonster() {
    const category = pickCategory();
    let id;
    if (category === 'normal') {
        const species = NORMAL_SPECIES_LIST[Math.floor(Math.random() * NORMAL_SPECIES_LIST.length)];
        const forms = NORMAL_BY_SPECIES[species];
        id = forms[Math.floor(Math.random() * forms.length)];
    } else if (category === 'mega') {
        id = MEGA_IDS[Math.floor(Math.random() * MEGA_IDS.length)];
    } else {
        id = GMAX_IDS[Math.floor(Math.random() * GMAX_IDS.length)];
    }

    const isShiny = Math.random() < SHINY_CHANCE;
    const folders = CATEGORY_FOLDER[category];
    const folder  = isShiny ? folders.shiny : folders.base;
    const info = POKEMON_DATA[id] || { name: '???', bst: 0, category: 'normal' };
    // bst: 포획 확률/실패 모션 계산에 쓰이는 원본 종족값 (shiny 여부와 무관하게 항상 동일)
    // effectiveBst: 표시/점수 계산에 쓰이는 값 (shiny면 1.5배, 카테고리 공통)
    const effectiveBst = isShiny ? info.bst * SHINY_CP_MULTIPLIER : info.bst;
    return {
        id, category,
        src: `${SPRITE9_ROOT}/${folder}/${id}.png`,
        isShiny, name: info.name, bst: info.bst, effectiveBst
    };
}

// 이미지를 미리 요청해서 브라우저 캐시에 올려두고, 실제로 로딩이 끝날 때까지(또는 최대
// PRELOAD_TIMEOUT_MS까지) 기다리는 Promise를 반환함.
// 온라인 배포 환경(GitHub Pages, Firebase Hosting 등)에서 네트워크 왕복 지연 및 이미지 용량에 따라
// 몬스터 이미지가 hp바/텍스트보다 늦게 나타나는 현상을 줄이기 위함.
// 로딩이 실제로 끝나면 그 즉시 resolve되고(대부분의 경우 매우 빠름), 아주 느린 네트워크에서
// 대형 이미지가 걸리는 예외적인 경우에만 최대 PRELOAD_TIMEOUT_MS(1초)에서 끊고 넘어감
// (Promise.race 타임아웃 패턴 — 웹 게임 에셋 로더에서 널리 쓰이는 표준 방식).
const PRELOAD_TIMEOUT_MS = 1000;
function preloadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve(); // 로딩 실패해도 게임 진행 자체는 막지 않음
        img.src = src;
        setTimeout(resolve, PRELOAD_TIMEOUT_MS);
    });
}

// ===================== 9세대 확장: 스프라이트시트 애니메이션 재생 =====================
// 9세대 확장분(images/pokemon/pokemon/)은 "가로로 프레임이 이어붙은 정지 PNG(필름스트립)"라서
// GIF처럼 <img src>만으로는 재생이 안 됨. CSS background-image + background-position을
// steps() 애니메이션으로 이동시켜 재생함 (캔버스를 전혀 안 써서 file://로 직접 열어도 동일하게
// 동작함 — canvas.toDataURL()은 파일 프로토콜에서 "tainted canvas" 보안 오류가 나기 때문에
// 캔버스 기반 방식은 배포 후에도 브라우저/환경에 따라 취약할 수 있어 아예 배제함).
// 판별 기준(Pokemon Essentials front 스프라이트 로직과 동일): 가로가 세로의 2배를 넘으면
// 여러 프레임이 이어붙은 스프라이트시트로 보고, 프레임 수 = round(가로/세로)로 계산.
const SPRITE_FRAME_INTERVAL_MS = 90; // Pokemon Essentials 기본 프레임 딜레이(90ms)와 동일하게 맞춤

let spriteAnimTimerId = null;
function stopSpriteAnimation() {
    if (spriteAnimTimerId !== null) {
        clearInterval(spriteAnimTimerId);
        spriteAnimTimerId = null;
    }
}

// monster는 이제 <div>라서 background-image로 표시함 (index.html/style.css 참고).
// el에 src를 표시함. 9세대 스프라이트시트면 프레임을 하나씩 잘라 background-position을
// 픽셀 단위로 직접 옮기는 JS 타이머로 재생하고, 프레임이 1장뿐이면 정적 배경 이미지로 표시함.
// (처음엔 CSS steps() 애니메이션 + 퍼센트 background-position으로 만들었는데, 실제 브라우저에서
//  프레임 하나가 박스보다 작게 그려져서 여러 마리가 동시에 보이는 버그가 있었음 — 원인을 계속
//  좁혀가기보다, 픽셀 단위로 직접 계산해서 모호함 자체를 없애는 쪽으로 교체함)
let currentSpriteSrc = null; // 비동기 로딩 도중 몬스터가 바뀌었는지 추적용 (style 문자열 비교보다 안전)
let currentMonsterFrameSize = 0;   // 현재 몬스터의 원본 프레임 크기(naturalHeight) — 샤이니 이펙트가 재사용
let currentMonsterDisplaySize = 0; // 현재 몬스터의 실제 표시 크기(SPRITE_SIZE_REF 보정 반영됨) — 샤이니 이펙트가 재사용

// 이 값보다 원본 프레임(정사각형 한 변, px)이 작은 포켓몬은 박스 안에서 그만큼 작게 표시되고,
// 이 값과 같거나 큰 포켓몬은 박스를 꽉 채움 — 종족 간 "몸집 차이"가 화면에 그대로 반영되도록 함.
// (668종 전체 실측 기준으로, 일반 포켓몬 평균이 박스의 약 54%를 채우도록 잡은 값 — 세부 근거는
// 지난 5세대 이미지 크기 작업 때와 동일한 방식으로 산정함)
const SPRITE_REFERENCE_SIZE = 140;

// ============================================================================
// 정지 이미지(코스튬/미등록폼/shadow폼) 크기 보정
// ============================================================================
// 문제: 일부 포켓몬은 원본 캔버스 크기가 형제 폼(같은 species, 기본형)과 안 맞음
// (예: 자시안 기본형 89px vs 코스튬 192px). 파일 자체를 리사이즈하면 화질 손실(이중 리샘플링)이
// 생기므로, 파일은 원본 그대로 두고 "크기 계산에만" 형제 폼(기본형)의 값을 참조해서 바로잡음.
//
// ⚠️ 중요 — 앞으로 이 명단을 수정/추가할 때 반드시 지켜야 할 것 ⚠️
// "정지 이미지인지 여부"는 일반(front)과 이로치(front_shiny)가 서로 다를 수 있음(실제로 9종이
// 그랬음: 전수조사로 확인됨). 그래서 명단을 "일반용"과 "이로치용"으로 반드시 분리해서 관리함.
//   - SPRITE_SIZE_REF_SPECIES_NORMAL: front 폴더가 실제로 "정지 이미지"인 종만 등록
//   - SPRITE_SIZE_REF_SPECIES_SHINY : front_shiny 폴더가 실제로 "정지 이미지"인 종만 등록
// 새 포켓몬을 추가할 때는, front 파일과 front_shiny 파일을 각각 열어서 프레임 수(가로÷세로)를
// 직접 확인하고, "그 폴더가 진짜 정지 이미지일 때만" 해당 명단에 넣을 것. 두 명단에 무조건 같이
// 넣으면 안 됨 — 한쪽만 문제인데 양쪽 다 등록하면, 문제없는 쪽까지 불필요하게 보정 계산이 돌게 됨
// (지금 당장은 계산 결과가 우연히 원래 값과 같아서 티가 안 나더라도, 나중에 이미지 파일이 조금만
// 바뀌면 언제든 엉뚱하게 어긋날 수 있는 잠재적 버그가 됨).
//
// 값은 기본형의 "species ID"이고, 실제 크기(h 또는 shinyH)는 렌더링 시점에 SPRITE_OFFSETS에서
// 가져옴 — 정지 이미지도 "위치는 항상 자기 자신의 값을 쓰고, 크기만 기본형을 참조"하는 원칙을
// 일반 포켓몬과 동일하게(일관되게) 적용하기 위함.
const SPRITE_SIZE_REF_SPECIES_NORMAL = {
    '716': '716',           // 형제 폼과 이미 크기가 같아 값은 안 바뀌지만, 일관성을 위해 포함
    '25-15': '25',
    '25-3_female': '25',
    '70-shadow': '70',       // front만 정지 이미지, front_shiny는 정상 애니메이션 → SHINY 명단엔 없음
    '125-shadow': '125',     // 〃
    '554-1': '554',          // 〃
    '791-1': '791',
    '792-1': '792',
    '802-1': '802',
    '888-2': '888',
    '889-2': '889',
};
const SPRITE_SIZE_REF_SPECIES_SHINY = {
    '716': '716',
    '25-15': '25',
    '25-3_female': '25',
    '25-1': '25',            // front_shiny만 정지 이미지, front는 정상 애니메이션 → NORMAL 명단엔 없음
    '25-2': '25',
    '25-3': '25',
    '25-4': '25',
    '25-5': '25',
    '25-6': '25',
    '791-1': '791',
    '792-1': '792',
    '802-1': '802',
    '888-2': '888',
    '889-2': '889',
};

function displayMonsterSprite(el, src, id, onReady) {
    stopSpriteAnimation();
    currentSpriteSrc = src;

    const sprite = el.querySelector('#monster-sprite') || el;
    sprite.style.backgroundRepeat = 'no-repeat';
    sprite.style.backgroundPosition = '0 0';
    sprite.style.backgroundSize = 'contain';
    sprite.style.backgroundImage = `url("${src}")`;
    sprite.style.width  = '100%';
    sprite.style.height = '100%';
    sprite.style.transform = 'translate(-50%, -50%)'; // 오프셋 정보 없으면 순수 중앙

    const probe = new Image();
    probe.onload = () => {
        if (currentSpriteSrc !== src) return; // 그 사이 다른 몬스터로 바뀌었으면 무시

        const frameSize  = probe.naturalHeight;
        const frameCount = frameSize > 0 ? Math.max(1, Math.round(probe.naturalWidth / frameSize)) : 1;
        // frameCount가 1이어도(정적 이미지, 예: 716번) 아래 크기 계산은 동일하게 적용해야
        // 다른 포켓몬들과 상대적 크기가 맞음 — 프레임 반복 재생만 건너뜀(아래 참고)

        // src 경로에 "_shiny"가 있으면 이로치 버전 — 이 값 하나로 아래 크기/위치 계산을 전부 분기함
        const isShinySrc = src.includes('_shiny');

        // 형제 폼과 원본 캔버스 크기가 안 맞는 정지 이미지 관련 종(SPRITE_SIZE_REF_SPECIES_NORMAL/
        // _SHINY 명단)은, 크기 계산에만 기본형(species)을 참조함(실제 프레임 자르기는 원본
        // frameSize 그대로 적용됨).
        //
        // 단순히 기본형의 그림 높이(h/shinyH)만 가져다 쓰면 안 됨 — 캔버스 안에서 그림이 차지하는
        // "여백 비율" 자체가 기본형과 이 폼이 서로 다르기 때문(예: 자시안 기본형은 캔버스의 85%를
        // 채우는데 코스튬은 76%만 채움). 그래서 반드시 "이 폼 자신의 여백 비율"까지 같이 반영해야
        // 화면에 실제로 보이는 캐릭터 크기가 기본형과 맞음:
        //   기준값 = 기본형 그림높이 × (이 폼의 원본 캔버스 ÷ 이 폼 자신의 그림높이)
        // 일반/이로치 여부에 맞춰 "명단도, 참조하는 h/shinyH도" 각각 다른 것을 씀 — 일반과 이로치는
        // 완전히 독립적인 파일이라, 한쪽만 정지 이미지인 경우가 있기 때문(위 명단 선언부 설명 참고)
        const refSpeciesId = isShinySrc ? SPRITE_SIZE_REF_SPECIES_SHINY[id] : SPRITE_SIZE_REF_SPECIES_NORMAL[id];
        const refOff = refSpeciesId && typeof SPRITE_OFFSETS !== 'undefined' ? SPRITE_OFFSETS[refSpeciesId] : null;
        const ownOffForSize = (typeof SPRITE_OFFSETS !== 'undefined' && SPRITE_OFFSETS[id]) || { h: frameSize, shinyH: frameSize };
        const effectiveFrameSize = refOff
            ? (isShinySrc ? refOff.shinyH * frameSize / ownOffForSize.shinyH : refOff.h * frameSize / ownOffForSize.h)
            : frameSize;

        // 바깥 박스(el)의 실제 렌더링 픽셀 크기를 기준으로 계산(반응형 스케일과 무관하게 항상 정확)
        const boxWidth = el.clientWidth || parseFloat(getComputedStyle(el).width) || 288;

        // 종족 간 상대적 크기가 보존되도록, "박스 너비 = SPRITE_REFERENCE_SIZE px"로 놓고
        // 그 비율만큼만 원본 프레임을 확대. SPRITE_REFERENCE_SIZE보다 큰 극소수 개체(전설급 등)는
        // 박스를 넘지 않도록 상한선(boxWidth)에서 클램프함.
        const scale = boxWidth / SPRITE_REFERENCE_SIZE;
        const displaySize = Math.min(effectiveFrameSize * scale, boxWidth);

        // 샤이니 이펙트가 이 몬스터의 "원본 프레임 크기 대비 실제 표시 크기 비율"을 그대로
        // 재사용할 수 있도록 전역에 저장 (SPRITE_SIZE_REF로 크기가 보정된 종도 정확히 반영됨)
        currentMonsterFrameSize = frameSize;
        currentMonsterDisplaySize = displaySize;

        // 안쪽 레이어(sprite) 자체의 크기를 displaySize로 지정 — "보여주는 창"과 "프레임 한 칸
        // 크기"가 항상 정확히 같아지므로, 여러 프레임이 한 창에 겹쳐 보이는 문제가 생기지 않음.
        // 레이어는 CSS(top/left 50%)로 바깥 박스 정중앙 기준점을 잡고, transform에서 SPRITE_OFFSETS
        // 보정값만큼 픽셀 단위로 미세 이동시킴.
        sprite.style.width  = `${displaySize}px`;
        sprite.style.height = `${displaySize}px`;
        sprite.style.backgroundSize = `${displaySize * frameCount}px ${displaySize}px`;

        // SPRITE_OFFSETS의 종별 x/y 보정값은 "원본 그림(frameSize)의 실제 픽셀" 기준으로 계산된
        // 값이므로, 원본이 화면에 실제로 얼마나 축소되는지(displaySize/frameSize)에 맞춰 적용해야
        // 정확함. SPRITE_SIZE_REF로 표시 크기만 강제로 줄인 경우(원본 픽셀은 그대로 큼) generic한
        // scale(boxWidth/140)을 그대로 쓰면 보정값이 과하게 적용되므로 반드시 이 비율을 곱해야 함.
        // 위치는 항상 "자기 자신"의 값을 쓰고(기본형 참조 아님), 일반/이로치 버전이 그림 구조 자체가
        // 다른 종(39종)이 있어서 일반은 x/y, 이로치는 shinyX/shinyY를 반드시 구분해서 사용함
        const ownOff = (typeof SPRITE_OFFSETS !== 'undefined' && SPRITE_OFFSETS[id]) || { x: 0, y: 0, shinyX: 0, shinyY: 0 };
        const off = { x: isShinySrc ? ownOff.shinyX : ownOff.x, y: isShinySrc ? ownOff.shinyY : ownOff.y };
        const pixelScale = displaySize / frameSize;
        const dx = off.x * pixelScale;
        const dy = off.y * pixelScale;
        sprite.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        let frameIndex = 0;
        const drawFrame = () => {
            sprite.style.backgroundPosition = `-${frameIndex * displaySize}px 0px`;
            frameIndex = (frameIndex + 1) % frameCount;
        };
        drawFrame();
        if (frameCount > 1) {
            spriteAnimTimerId = setInterval(drawFrame, SPRITE_FRAME_INTERVAL_MS);
        }
        if (onReady) onReady(); // 샤이니 이펙트 등, 크기 계산이 끝난 뒤에만 안전하게 실행돼야 하는 후속 작업용
    };
    probe.src = src;
}

// 몬스터 이름 / 종족값 오버레이 갱신
function updateMonsterInfo(picked) {
    currentBst = picked.bst;
    currentEffectiveBst = picked.effectiveBst;
    currentCategory = picked.category;
    currentMonsterName = picked.name;
    currentMonsterId = picked.id;
    currentIsShiny = picked.isShiny;
    monsterNameEl.textContent = `${picked.name}:`;
    monsterBstEl.textContent  = `CP ${formatCpTotal(picked.effectiveBst)}`;
    monsterInfo.classList.remove('hidden');
    monsterInfoText.classList.remove('hidden');
}

// shiny 등장 이펙트 재생 타이머(연속으로 shiny가 나올 때 이전 재생을 안전하게 정리하기 위해 필요)
let shinyAnimTimerId = null;
function stopShinyAnimation() {
    if (shinyAnimTimerId !== null) {
        clearInterval(shinyAnimTimerId);
        shinyAnimTimerId = null;
    }
}

// shiny 등장 이펙트 — 몬스터 스프라이트(displayMonsterSprite)와 동일한 원리로, PNG 필름스트립을
// background-position으로 프레임마다 정확히 이동시키며 재생. 정확히 SHINY_FRAME_COUNT번 이동한 뒤
// 스스로 멈추므로(setInterval을 프레임 수만큼만 실행) GIF의 루프/캐시 관련 문제가 원천적으로 없음
function playShinyEffect() {
    stopShinyAnimation(); // 혹시 이전 재생이 아직 진행 중이면 정리 (연속 shiny 대비)

    // 크기: 몬스터 그림의 "실제 내용물(투명 제외) 세로 길이"(SPRITE_OFFSETS[id].shinyH — 이 함수는
    // 항상 이로치 몬스터에 대해서만 호출되므로 이로치 전용 값을 씀)에, 이 몬스터가 실제로 적용받고
    // 있는 원본→표시 배율(currentMonsterDisplaySize/currentMonsterFrameSize)을 곱해서 계산.
    // SPRITE_SIZE_REF로 크기가 보정된 종(예: 자시안 코스튬)도 이 배율에 이미 보정이 반영되어 있어서
    // 자동으로 정확하게 맞음(단순히 SPRITE_REFERENCE_SIZE만 쓰면 안 맞음).
    //
    // 위치: SPRITE_OFFSETS의 x/y는 적용하지 않음(중요) — 그 값은 "몬스터 그림을 박스 정중앙으로
    // 옮기기 위한" 보정값이라, 몬스터에 적용하고 나면 몬스터의 실제 그림은 이미 항상 박스 정중앙에
    // 옴(오프셋 값과 무관하게 자기 자신을 상쇄함). 그런데 이 값을 샤이니에도 그대로 적용하면
    // "이미 정중앙이어야 할 것"을 몬스터용 보정값만큼 또 밀어버려서 오히려 어긋남 — 그래서 샤이니는
    // 별도 보정 없이 그냥 박스 정중앙(기본 translate(-50%,-50%))에 두는 것이 정확함
    const off = (typeof SPRITE_OFFSETS !== 'undefined' && SPRITE_OFFSETS[currentMonsterId]) || { shinyH: 0 };
    const frameSize = currentMonsterFrameSize || (SHINY_NATIVE_WIDTH / SHINY_FRAME_COUNT);
    const pixelScale = currentMonsterDisplaySize / frameSize;
    const size = (off.shinyH || frameSize) * pixelScale;

    shinyEffect.style.width  = `${size}px`;
    shinyEffect.style.height = `${size}px`;
    shinyEffect.style.backgroundImage = `url("${SHINY_EFFECT_SRC}")`;
    shinyEffect.style.backgroundSize  = `${size * SHINY_FRAME_COUNT}px ${size}px`;
    shinyEffect.style.transform = 'translate(-50%, -50%)';

    let frameIndex = 0;
    const drawFrame = () => {
        shinyEffect.style.backgroundPosition = `-${frameIndex * size}px 0px`;
    };
    drawFrame();
    shinyEffect.classList.remove('hidden');

    shinyAnimTimerId = setInterval(() => {
        frameIndex++;
        if (frameIndex >= SHINY_FRAME_COUNT) {
            stopShinyAnimation();
            shinyEffect.classList.add('hidden');
            return;
        }
        drawFrame();
    }, SHINY_FRAME_INTERVAL_MS);
}


// 포켓볼 상태를 던지기 전 초기 상태로 되돌림 (인라인 스타일/클래스/애니메이션 모두 제거)
function resetPokeball() {
    pokeball.src = 'images/pokemon/pokeball/1.png';
    pokeball.style.transition = 'none';
    pokeball.classList.remove('throwing', 'dropped', 'bouncing', 'landing');
    pokeball.style.bottom = '';
    void pokeball.offsetHeight;
    pokeball.style.transition = '';
}

// 몬스터×N / 도망치다×N 버튼 라벨과 활성/비활성 상태를 현재 보유 개수 및 애니메이션 상태에 맞게 갱신
function refreshButtons() {
    throwBtn.textContent   = `몬스터볼×${pokeballCount}`;
    runawayBtn.textContent = `도망치다×${runawayCount}`;
    throwBtn.disabled   = isAnimating || pokeballCount <= 0;
    runawayBtn.disabled = isAnimating || runawayCount  <= 0;
    chargeBtn.disabled  = isAnimating || wordList.length < QUIZ_MIN_WORDS;
}

// 게임 초기화
// preselected가 주어지면(포획 성공 후 다음 몬스터를 이미 프리로드해둔 경우) 그대로 사용,
// 없으면(최초 게임 시작 시) 새로 랜덤 선택
function initGame(preselected) {
    isAnimating = false;
    refreshButtons();

    // 이번 라운드 몬스터 결정 (시작 시엔 새로 랜덤 선택, 포획 후엔 미리 프리로드해둔 몬스터 재사용)
    const picked = preselected || pickRandomMonster();
    // 이전 라운드에서 남아있을 수 있는 shiny 이펙트 정리 (재생 중이었다면 타이머도 같이 정지)
    stopShinyAnimation();
    shinyEffect.classList.add('hidden');
    // #shiny-effect는 #monster 밖의 독립 요소(베타와 동일 구조)라 부모 페이드인의 영향을 안 받음.
    // 다만 크기(몬스터 비례)를 정확히 맞추려면 #monster-sprite의 크기 계산이 끝난 뒤(onReady)에
    // 재생해야 함 — 동기적으로 바로 부르면 아직 계산 전이라 기본값을 읽게 됨
    displayMonsterSprite(monster, picked.src, picked.id, () => {
        if (picked.isShiny) playShinyEffect();
    });
    updateMonsterInfo(picked);

    // 몬스터 + hp바를 투명한 상태로 초기화한 뒤, 도망치기와 동일한 페이드인 효과로 나타나게 함
    monster.classList.remove('captured', 'hidden');
    monster.style.transition = 'none';
    monster.style.transform  = '';
    monster.style.opacity    = '0';
    monsterInfo.style.transition = 'none';
    monsterInfoText.style.transition = 'none';
    monsterInfo.style.opacity    = '0';
    monsterInfoText.style.opacity    = '0';
    void monster.offsetHeight;
    monster.style.transition = '';
    monster.style.opacity    = '1';
    monsterInfo.style.transition = '';
    monsterInfoText.style.transition = '';
    monsterInfo.style.opacity    = '1';
    monsterInfoText.style.opacity    = '1';

    setTimeout(() => {
        monster.style.opacity = '';
        monsterInfo.style.opacity = '';
        monsterInfoText.style.opacity = '';
    }, MONSTER_SHRINK_DURATION);

    // 포켓볼 상태 초기화
    resetPokeball();
}

// 몬스터 탈출 연출 — 착지한 공의 실제 중심에서 원래 위치로 커지며 나타남
function escapeMonster() {
    const containerRect  = gameContainer.getBoundingClientRect();
    const monsterRect    = monster.getBoundingClientRect();
    const ballRect       = pokeball.getBoundingClientRect();

    const monsterCenterY = (monsterRect.top - containerRect.top) + monsterRect.height / 2;
    const ballCenterY    = (ballRect.top    - containerRect.top) + ballRect.height  / 2;
    // getBoundingClientRect()는 화면 좌표(스케일 적용됨)라서, transform(로컬 좌표)에 쓰려면
    // currentScale로 나눠 환산해야 반응형 스케일링 상태에서도 정확한 위치에서 시작함
    const offsetY = (ballCenterY - monsterCenterY) / currentScale;

    // 공 중심(작고 투명)에서 즉시 시작
    monster.style.transition = 'none';
    monster.style.opacity    = '0';
    monster.style.transform  = `translateX(-50%) translateY(${offsetY}px) scale(0.05)`;
    monster.classList.remove('captured');
    void monster.offsetHeight;

    // 원래 위치로 커지며 나타남 (스프링 커브)
    monster.style.transition = `opacity ${ESCAPE_SPRING_DURATION}ms ease-out, transform ${ESCAPE_SPRING_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
    monster.style.opacity    = '';
    monster.style.transform  = '';
}

// 탈출 연출 — open.gif 시작과 동시에 몬스터 탈출, 500ms 후 콜백
function openAndEscape(callback) {
    pokeball.src = POKEBALL_OPEN_SRC; // 루프 없는 gif, 마지막 프레임에서 자동 정지. 직전엔 항상 다른 src(리셋된 1.png 등)라 캐시 재사용하며 처음부터 재생됨
    escapeMonster();
    setTimeout(() => { if (callback) callback(); }, ESCAPE_CALLBACK_WAIT);
}

// 공통 포획 모션 (던지기 → 착지 완료). 착지 후 0.5초 대기 후 onLanded() 호출
function runCapture(onLanded) {
    isAnimating = true;
    refreshButtons();

    // 1. 던지기
    pokeball.src = 'images/pokemon/pokeball/throw.gif';
    pokeball.style.bottom = getThrowTargetBottom() + 'px';
    pokeball.classList.add('throwing');

    setTimeout(() => {
        // 2. 충돌 & 튕기기
        pokeball.classList.add('bouncing');

        // 올라가는 도중 열리기 (루프 없는 gif라 마지막 프레임에서 자동 정지)
        setTimeout(() => {
            pokeball.src = POKEBALL_OPEN_SRC;
        }, OPEN_DELAY);

        // 정점에서 몬스터 흡수 시작
        setTimeout(() => {
            monster.classList.add('captured');

            // 몬스터 흡수 완료 후 낙하
            setTimeout(() => {
                // 정점 위치(transform offset)를 실제 bottom 값으로 전환해 끊김 없이 낙하
                const peakBottom = parseFloat(pokeball.style.bottom) + BOUNCE_PEAK_OFFSET;
                pokeball.style.transition = 'none';
                pokeball.classList.remove('bouncing');
                pokeball.style.bottom = peakBottom + 'px';
                void pokeball.offsetHeight;
                pokeball.style.transition = '';
                pokeball.src = 'images/pokemon/pokeball/1.png';
                pokeball.classList.add('dropped');

                // 착지
                setTimeout(() => {
                    pokeball.classList.add('landing');

                    setTimeout(() => {
                        pokeball.classList.remove('landing');
                        setTimeout(onLanded, LANDED_WAIT); // 착지 후 대기
                    }, LAND_DURATION);

                }, DROP_DURATION);

            }, CAPTURE_ABSORB_DURATION);

        }, BOUNCE_DURATION);

    }, THROW_DURATION);
}

// 흔들기 N회 후 콜백 (각 흔들림 사이 SHAKE_PAUSE 대기)
function shakeN(count, onDone) {
    if (count === 0) { onDone(); return; }
    pokeball.src = POKEBALL_CATCH_SRC; // 직전엔 항상 1.png로 리셋되어 있어 캐시 재사용하며 처음부터 재생됨
    setTimeout(() => {
        pokeball.src = 'images/pokemon/pokeball/1.png';
        if (count > 1) {
            setTimeout(() => shakeN(count - 1, onDone), SHAKE_PAUSE);
        } else {
            onDone();
        }
    }, SHAKE_DURATION);
}

// 텍스트를 한 글자씩 타이핑해서 표시 (완료되면 onDone 호출)
function typeMessage(el, text, charDelay, onDone) {
    el.textContent = '';
    el.classList.remove('hidden');
    let i = 0;
    (function step() {
        if (i < text.length) {
            el.textContent += text[i];
            i++;
            setTimeout(step, charDelay);
        } else if (onDone) {
            onDone();
        }
    })();
}

// 포획 성공 처리 — 메시지를 한 글자씩 보여준 뒤 2초 대기, 몬스터 교체 및 버튼 재표시
function onCaptureSuccess() {
    [throwBtn, runawayBtn, chargeBtn].forEach(b => b.classList.add('btn-hidden'));

    totalCapturedCp += currentEffectiveBst;
    updateCpTotalDisplay();

    // 포획한 순서대로 목록에 기록 (포획한 포켓몬 모달에 사용, CP는 shiny 2배가 반영된 값)
    capturedList.push({ id: currentMonsterId, name: currentMonsterName, bst: currentEffectiveBst, isShiny: currentIsShiny, category: currentCategory });

    // 아이콘프리로드패치: 도감 목록을 열 때 여러 아이콘이 한꺼번에 몰려서(브라우저 동시 요청 제한
    // 약 6개) 대기 줄이 생기는 것을 막기 위해, 포획하는 순간마다 하나씩 분산해서 미리 받아둠
    preloadImage(capturedIconSrc(currentMonsterId, currentCategory, currentIsShiny));

    // 다음 몬스터를 미리 뽑아서 포획 메시지가 보이는 동안(타이핑 + 대기) 이미지를 미리 로드해둠
    // → initGame이 실제로 화면에 표시할 때는 이미 로딩이 끝나 있어 hp바/텍스트와 동시에 나타남.
    // 이 경로는 타이핑+대기 시간이 원래도 넉넉해서(1.6~1.8초) preloadPromise가 대부분 그 안에 끝나지만,
    // 아주 느린 네트워크 등 예외 상황을 위해 initGame 호출 직전에 한 번 더 확실히 기다림.
    const nextMonster = pickRandomMonster();
    const preloadPromise = preloadImage(nextMonster.src);

    const message = `신난다!\n${currentMonsterName}을(를) 잡았다`;
    typeMessage(captureMessageEl, message, CAPTURE_CHAR_DELAY, () => {
        setTimeout(() => {
            captureMessageEl.classList.add('hidden');
            captureMessageEl.textContent = '';

            if (gameTimeUp) {
                // 시간이 끝나기 직전에 던진 몬스터볼이었음 — 포획 성공은 이미 위에서 CP/목록에 반영되었으니
                // 새 몬스터로 넘어가지 않고 바로 결과 화면으로 전환
                finishGameToResult();
                return;
            }

            preloadPromise.then(() => {
                initGame(nextMonster); // 프리로드해둔 몬스터로 교체 (액션창은 계속 유지되어 있었음, initGame이 라벨/버튼상태도 갱신)
                [throwBtn, runawayBtn, chargeBtn].forEach(b => b.classList.remove('btn-hidden'));
            });
        }, CAPTURE_MESSAGE_WAIT);
    });
}

// 실패 시 버튼만 다시 활성화 (몬스터는 바뀌지 않고 계속 도전 가능)
function reenableButtons() {
    isAnimating = false;
    refreshButtons();
}

// 몬스터볼 던지기: 종족값 기반 확률로 성공/실패 결정
// - 성공: 흔들림 3회 후 포획 메시지를 타이핑으로 표시, 2초 뒤 새 몬스터로 교체
// - 실패: 종족값이 높을수록 실패모션 1(무저항)이 잦고 3(장시간 저항)은 드묾, 탈출 후 같은 몬스터로 재도전 가능
function runThrow() {
    if (pokeballCount <= 0 || isAnimating) return;
    pokeballCount--;
    refreshButtons();

    runCapture(() => {
        const success = Math.random() < getCatchProbability(currentBst, currentCategory);

        if (success) {
            shakeN(3, onCaptureSuccess);
            return;
        }

        const failType = pickFailType(currentBst, currentCategory); // 1, 2, 3
        const shakeCount = failType - 1;            // 1→0회, 2→1회, 3→2회
        shakeN(shakeCount, () => {
            setTimeout(() => openAndEscape(() => {
                if (gameTimeUp) {
                    // 시간이 끝나기 직전에 던진 몬스터볼이 실패로 끝난 경우 — 탈출 연출까지 다 보여준 뒤 결과 화면으로 전환
                    finishGameToResult();
                    return;
                }
                resetPokeball();   // 다시 던지기 전 상태로 복귀
                reenableButtons();
            }), SHAKE_PAUSE);
        });
    });
}

// 몬스터 정중앙 타겟 bottom 값 계산
// getBoundingClientRect()는 화면에 실제로 그려지는(스케일 적용된) 좌표를 반환하지만,
// style.bottom은 스케일 적용 전(로컬) 좌표계로 해석되므로 currentScale로 나눠 환산해야
// 반응형 스케일링이 걸린 상태에서도 몬스터볼이 정확한 위치로 날아감
function getThrowTargetBottom() {
    const containerRect  = gameContainer.getBoundingClientRect();
    const monsterRect    = monster.getBoundingClientRect();
    const monsterCenterY = (monsterRect.top - containerRect.top) + monsterRect.height / 2;
    const screenSpaceBottom = containerRect.height - monsterCenterY;
    return screenSpaceBottom / currentScale - pokeball.offsetHeight / 2;
}

// 도망가기: 현재 몬스터가 사라졌다가 다른 몬스터로 바뀌어 다시 나타남
function runRunAway() {
    if (runawayCount <= 0 || isAnimating) return;
    runawayCount--;
    isAnimating = true;
    refreshButtons();

    // 다음 몬스터를 미리 뽑아서 페이드아웃 구간(약 400ms) 동안 이미지 로딩을 시작해둠.
    // 실제로 다 받아질 때까지(또는 최대 PRELOAD_TIMEOUT_MS까지) 기다렸다가 교체하므로,
    // 이미지 용량이 커도 화면이 끊기거나 깨진 채로 나타나지 않음.
    const picked = pickRandomMonster();
    const preloadPromise = preloadImage(picked.src);

    // 1. 페이드아웃 (CSS #monster / #monster-info 모두 동일한 opacity transition 사용)
    monster.style.opacity = '0';
    monsterInfo.style.opacity = '0';
    monsterInfoText.style.opacity = '0';

    const fadeOutPromise = new Promise(resolve => setTimeout(resolve, MONSTER_SHRINK_DURATION));

    // 페이드아웃 연출이 끝나는 것과 이미지 로딩이 끝나는 것, 둘 다 완료된 뒤에 교체
    // (로딩이 페이드아웃보다 빨리 끝나면 지금과 동일하게 400ms 뒤 바로 교체됨)
    Promise.all([fadeOutPromise, preloadPromise]).then(() => {
        // 2. 안 보이는 상태에서 다른 몬스터로 교체 (이미 로딩이 끝난 상태라 지연 없이 표시됨)
        // 이전 shiny 이펙트 정리 (재생 중이었다면 타이머도 같이 정지)
        stopShinyAnimation();
        shinyEffect.classList.add('hidden');
        // 샤이니 패치: 크기 계산 완료(onReady) 이후에 재생 (#shiny-effect는 독립 요소라 지연 없이 즉시 재생)
        displayMonsterSprite(monster, picked.src, picked.id, () => {
            if (picked.isShiny) playShinyEffect();
        });
        updateMonsterInfo(picked);


        // 3. 페이드인 (몬스터 + hp바 동시에)
        monster.style.opacity = '1';
        monsterInfo.style.opacity = '1';
        monsterInfoText.style.opacity = '1';

        setTimeout(() => {
            monster.style.opacity = '';
            monsterInfo.style.opacity = '';
            monsterInfoText.style.opacity = '';

            if (gameTimeUp) {
                // 도망치는 도중 시간이 끝난 경우 — 연출까지 다 보여준 뒤 결과 화면으로 전환
                finishGameToResult();
                return;
            }

            isAnimating = false;
            refreshButtons();
        }, MONSTER_SHRINK_DURATION);

    });
}

// ===================== 학습 데이터 연결 =====================
// 자체 엑셀 업로드 대신, 아바타 월드의 학습 데이터 선택 화면에서 고른
// currentSelectedData / localLearningData를 openPokemonCatchPage()에서 그대로 가져와 씀
// (상티런 openSangtiRunGamePage(), 몬스터헌터 openMonsterHunterPage()와 동일한 패턴)

// 로비 "혼자하기 게임 선택" 화면에서 호출되는 진입점
function openPokemonCatchPage() {
    if (!currentSelectedData || !localLearningData[currentSelectedData]) {
        alert("학습 내용을 먼저 선택해 주세요! ✏️");
        showPage('student-select-data-page');
        return;
    }

    const selectedSet = localLearningData[currentSelectedData];
    if (!selectedSet.words || selectedSet.words.length < QUIZ_MIN_WORDS) {
        alert(`선택한 단어장에 단어가 ${QUIZ_MIN_WORDS}개 이상 있어야 플레이할 수 있어요.`);
        return;
    }

    // 아바타 월드 학습 데이터({eng, kor})를 포켓몬 캐치 형식({en, kr})으로 변환
    wordList = selectedSet.words.map(w => ({ en: String(w.eng), kr: String(w.kor) }));

    // 시작 화면부터 보여주기 위해 결과/게임 요소를 초기 상태로 되돌림
    startScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');
    startBtn.disabled = false;

    // 이전 플레이에서 결과 화면(showResultScreen)이 숨겨뒀던 pokeball/action-btns 복원
    // (재입장 시 startGame() 호출 전까지도 대기화면 배경에 정상적으로 보여야 함)
    pokeball.classList.remove('hidden');
    controlPanel.classList.remove('hidden');

    // 이전 플레이를 그만하기/시간종료로 끝낸 경우 finishGameToResult()가 걸어둔
    // isAnimating=true + 버튼 disabled 상태가 재입장 시에도 풀리지 않고 남아있어
    // 액션박스 글자가 흐리게(opacity 0.6 + 회색) 보이는 문제를 방지
    isAnimating = false;
    [throwBtn, runawayBtn, chargeBtn].forEach(b => b.disabled = false);
    refreshButtons();

    document.querySelector('.container').classList.add('game-mode');
    showPage('pokemon-catch-page');
    applyResponsiveScale();

    // 샤이니 이펙트/포켓볼 열림·흔들림 gif는 몬스터와 달리 항상 고정된 파일 하나씩뿐이라,
    // 게임 진입 시점에 미리 받아두면 실제 재생 시 로딩 지연 없이 바로 나타남 (결과를 기다릴 필요는 없음)
    preloadImage(SHINY_EFFECT_SRC);
    preloadImage(POKEBALL_OPEN_SRC);
    preloadImage(POKEBALL_CATCH_SRC);
}

// "이전으로" 버튼: 로비의 게임 선택 화면으로 복귀
function exitPokemonCatchPage() {
    clearInterval(timerIntervalId);
    document.querySelector('.container').classList.remove('game-mode');
    showPage('student-solo-game-page');
}

// ===================== 4지선다 퀴즈 =====================

let currentQuiz = null; // { en, correctKr, options }
let quizAnswered = true; // 현재 문제가 이미 풀렸는지 여부 (닫기 후 재입장 시 새 문제를 낼지 판단)

// shuffleArray는 app.js(전역)에 정의된 것을 그대로 공유해서 사용

// 단어 목록에서 무작위 문제(정답 1개 + 오답 3개) 출제
function pickQuizQuestion() {
    const correctIndex = Math.floor(Math.random() * wordList.length);
    const correct = wordList[correctIndex];

    const wrongPool = wordList.filter((_, i) => i !== correctIndex);
    const wrongs = shuffleArray(wrongPool).slice(0, 3).map(w => w.kr);

    currentQuiz = {
        en: correct.en,
        correctKr: correct.kr,
        options: shuffleArray([correct.kr, ...wrongs])
    };
    quizAnswered = false;
    renderQuiz();
}

// 보기 버튼 텍스트가 2줄(버튼 높이) 안에 다 들어가도록, 넘칠 경우 폰트 크기를 점점 줄여서 맞춤
function fitOptionButtonText(btn) {
    const MAX_FONT_SIZE = 14;
    const MIN_FONT_SIZE = 9;
    const LINE_HEIGHT_RATIO = 1.3;

    let fontSize = MAX_FONT_SIZE;
    btn.style.fontSize   = fontSize + 'px';
    btn.style.lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO) + 'px';

    while (btn.scrollHeight > btn.clientHeight + 1 && fontSize > MIN_FONT_SIZE) {
        fontSize -= 1;
        btn.style.fontSize   = fontSize + 'px';
        btn.style.lineHeight = Math.round(fontSize * LINE_HEIGHT_RATIO) + 'px';
    }
}

// 현재 문제를 퀴즈 모달에 렌더링
function renderQuiz() {
    quizFeedback.textContent = '';
    quizQuestion.textContent = currentQuiz.en;
    quizOptions.innerHTML = '';

    currentQuiz.options.forEach(optionText => {
        const optBtn = document.createElement('button');
        optBtn.className = 'quiz-option-btn';
        optBtn.textContent = optionText;
        optBtn.addEventListener('click', () => handleQuizAnswer(optionText, optBtn));
        quizOptions.appendChild(optBtn);
        fitOptionButtonText(optBtn);
    });
}

// 보기 선택 처리: 정답이면 포켓볼/도망치기 개수 +1 후 다음 문제, 오답이면 정답 표시 후 다음 문제
function handleQuizAnswer(selectedText, selectedBtn) {
    const optionBtns = Array.from(quizOptions.querySelectorAll('button'));
    optionBtns.forEach(b => (b.disabled = true));
    quizAnswered = true;

    const isCorrect = selectedText === currentQuiz.correctKr;

    if (isCorrect) {
        quizCorrectCount++;
        selectedBtn.classList.add('correct');
        quizFeedback.textContent = '정답! 몬스터볼×1, 도망치다×1 획득!';

        pokeballCount++;
        runawayCount++;
        refreshButtons();

        setTimeout(() => {
            if (!quizModal.classList.contains('hidden')) pickQuizQuestion();
        }, 500);
    } else {
        quizWrongCount++;
        selectedBtn.classList.add('wrong');
        optionBtns.forEach(b => {
            if (b.textContent === currentQuiz.correctKr) b.classList.add('correct');
        });
        quizFeedback.textContent = '오답!';

        setTimeout(() => {
            if (!quizModal.classList.contains('hidden')) pickQuizQuestion();
        }, 1300);
    }
}

chargeBtn.addEventListener('click', () => {
    if (wordList.length < QUIZ_MIN_WORDS) return;
    quizModal.classList.remove('hidden');
    // 이전에 닫기(×)로 나가서 아직 못 푼 문제가 있으면 새 문제 대신 그 문제를 이어서 보여줌
    if (currentQuiz && !quizAnswered) {
        renderQuiz();
    } else {
        pickQuizQuestion();
    }
});

quizCloseBtn.addEventListener('click', () => {
    quizModal.classList.add('hidden');
});

// 게임(재)시작 공통 로직 — 최초 시작(시작하기)과 다시하기 모두에서 사용
function startGame() {
    if (wordList.length < QUIZ_MIN_WORDS) return;

    pokeballCount = 1;
    runawayCount  = 1;
    quizCorrectCount = 0;
    quizWrongCount   = 0;
    capturedList     = [];
    gameTimeUp       = false;
    capturedModalOpenedDuringGame = false;
    pauseModal.classList.add('hidden');
    capturedModal.classList.add('hidden');

    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    // 결과 화면 표시 중 숨겨뒀던 게임 요소 복원 (다시하기 시 필요, 최초 시작 시엔 이미 보이는 상태라 영향 없음)
    pokeball.classList.remove('hidden');
    controlPanel.classList.remove('hidden');

    // 시간 종료 직전 포획 성공(onCaptureSuccess)이 btn-hidden을 지우지 못하고 끝난 경우를 대비한 안전장치
    [throwBtn, runawayBtn, chargeBtn].forEach(b => b.classList.remove('btn-hidden'));

    initGame();

    totalCapturedCp = 0;
    updateCpTotalDisplay();
    gameTimerEl.classList.remove('hidden');
    cpTotalEl.classList.remove('hidden');
    startGameTimer();
}

// 포획한 포켓몬 목록을 포획한 순서대로 아이콘 + 이름 + CP로 렌더링
function renderCapturedList() {
    capturedListEl.innerHTML = '';

    if (capturedList.length === 0) {
        const empty = document.createElement('div');
        empty.id = 'captured-empty';
        empty.textContent = '아직 포획한 포켓몬이 없습니다';
        capturedListEl.appendChild(empty);
        return;
    }

    // 같은 포켓몬(id)끼리 묶되, 일반 개체와 shiny는 항상 별도 그룹으로 분리
    const groups = new Map(); // key: "id_isShiny" -> { id, name, bst, isShiny, category, count }
    capturedList.forEach(mon => {
        const key = `${mon.id}_${mon.isShiny}`;
        if (!groups.has(key)) {
            groups.set(key, { id: mon.id, name: mon.name, bst: mon.bst, isShiny: mon.isShiny, category: mon.category, count: 0 });
        }
        groups.get(key).count++;
    });

    // CP 높은 순으로 정렬해서 표시
    const sortedGroups = Array.from(groups.values()).sort((a, b) => b.bst - a.bst);

    sortedGroups.forEach(group => {
        const row = document.createElement('div');
        row.className = 'captured-row';

        const icon = document.createElement('div');
        icon.className = 'captured-icon';
        // 9세대 확장분 아이콘은 가로 2프레임(128x64, 각 64x64)짜리 스프라이트시트라서
        // <img>로는 통째로 눌려 보임 — background-image로 첫 프레임(왼쪽 절반)만 잘라서 표시
        icon.style.backgroundImage = `url(${capturedIconSrc(group.id, group.category, group.isShiny)})`;
        icon.style.backgroundSize = '200% 100%';
        icon.style.backgroundPosition = '0 0';
        icon.style.backgroundRepeat = 'no-repeat';
        icon.title = group.name;

        const name = document.createElement('span');
        name.className = 'captured-name';
        const baseName = group.isShiny ? `${group.name}✨` : group.name;
        name.textContent = group.count > 1 ? `${baseName} ×${group.count}` : baseName;

        const cp = document.createElement('span');
        cp.className = 'captured-cp';
        cp.textContent = `CP ${formatCpTotal(group.bst)}`;

        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(cp);
        capturedListEl.appendChild(row);
    });
}

// 이벤트 연결
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

capturedListBtn.addEventListener('click', () => {
    renderCapturedList();
    capturedModal.classList.remove('hidden');
});

// 게임 중 점수(#cp-total)를 눌러 포획한 포켓몬 창을 열었을 때만 true.
// 결과 화면의 "포획한 포켓몬" 버튼으로 열었을 땐 타이머가 이미 멈춰있으므로 관여하지 않음.
let capturedModalOpenedDuringGame = false;

capturedCloseBtn.addEventListener('click', () => {
    capturedModal.classList.add('hidden');
    if (capturedModalOpenedDuringGame) {
        capturedModalOpenedDuringGame = false;
        resumeGameTimer();
    }
});

// ===================== 게임 중 타이머 클릭 → 일시정지 화면 =====================
// 대기 화면(시작/결과 화면)과 같은 스타일의 오버레이를 띄우고, 그동안 타이머를 멈춤
gameTimerEl.addEventListener('click', () => {
    if (!quizModal.classList.contains('hidden') || !capturedModal.classList.contains('hidden')) return;
    pauseGameTimer();
    pauseModal.classList.remove('hidden');
});

function resumeFromPause() {
    pauseModal.classList.add('hidden');
    resumeGameTimer();
}

function quitFromPause() {
    pauseModal.classList.add('hidden');
    onTimeUp(); // 제한시간이 끝났을 때와 동일한 방식으로 결과 화면으로 전환
}

// ===================== 게임 중 점수 클릭 → 포획한 포켓몬 화면 =====================
cpTotalEl.addEventListener('click', () => {
    if (!quizModal.classList.contains('hidden') || !pauseModal.classList.contains('hidden')) return;
    pauseGameTimer();
    capturedModalOpenedDuringGame = true;
    renderCapturedList();
    capturedModal.classList.remove('hidden');
});

throwBtn.addEventListener('click', runThrow);
runawayBtn.addEventListener('click', runRunAway);
