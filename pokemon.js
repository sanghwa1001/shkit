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
const BASE_HEIGHT = 600;
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
const THROW_DURATION          = 420;  // ms - 던지는 시간 (기존 600 → 70%)
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
const SHAKE_DURATION          = 490;  // ms - catch.gif 1회 재생 시간 (기존 700 → 70%)
const SHAKE_PAUSE             = 350;  // ms - 흔들림 사이 또는 탈출 전 대기 시간 (기존 500 → 70%)
const CAPTURE_CHAR_DELAY      = 42;   // ms - 포획 메시지 한 글자당 타이핑 속도 (기존 60 → 70%)
const CAPTURE_MESSAGE_WAIT    = 1000; // ms - 메시지 완성 후 다음 몬스터로 넘어가기까지 대기 시간

const MONSTER_MIN = 1;    // animated/0001.gif
const MONSTER_MAX = 386;  // animated/0386.gif

const SHINY_CHANCE         = 0.1;   // 10% 확률로 shiny 등장
const SHINY_CP_MULTIPLIER  = 2;     // shiny 포획 시 점수(CP)에 적용되는 배율 (포획 확률/실패 모션에는 영향 없음)
const SHINY_EFFECT_DURATION = 1500; // ms - animated/shiny/0000.gif 1회 재생 시간(실측 약 1.48초)

// list.xlsx 기반 POKEMON_DATA(pokemon_data.js)에서 종족값 범위 계산
const BST_VALUES = Object.values(POKEMON_DATA).map(p => p.bst);
const BST_MIN = Math.min(...BST_VALUES);
const BST_MAX = Math.max(...BST_VALUES);

const CATCH_PROB_MAX = 0.9;   // 종족값 최저 몬스터의 포획 성공률
const CATCH_PROB_MIN = 0.15;  // 종족값 최고 몬스터의 포획 성공률

// 현재 라운드 몬스터의 종족값 / 이름 / 번호(id) (포획 확률·실패 모션 결정, 포획 메시지·목록에 사용)
let currentBst = 0;          // 원본 종족값 (포획 확률/실패 모션 계산 전용)
let currentEffectiveBst = 0; // 표시/점수 계산용 값 (shiny면 2배)
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
    return cp.toLocaleString('ko-KR');
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
    gameTimerEl.classList.add('hidden');
    cpTotalEl.classList.add('hidden');
    pokeball.classList.add('hidden');
    controlPanel.classList.add('hidden');

    resultScreen.classList.remove('hidden');
}

// 종족값이 높을수록 포획 성공률이 낮아짐 (선형 보간)
function getCatchProbability(bst) {
    const t = (bst - BST_MIN) / (BST_MAX - BST_MIN);
    return CATCH_PROB_MAX - t * (CATCH_PROB_MAX - CATCH_PROB_MIN);
}

// 종족값이 높을수록 실패 모션 1(무저항 탈출)이 잦고, 3(가장 오래 저항)은 드물어짐
function pickFailType(bst) {
    const t = (bst - BST_MIN) / (BST_MAX - BST_MIN);
    const w1 = 0.2 + 0.5 * t;   // 0.2 ~ 0.7
    const w3 = 0.7 - 0.5 * t;   // 0.7 ~ 0.2
    const w2 = 1 - w1 - w3;     // 항상 0.1
    const r = Math.random();
    if (r < w1) return 1;
    if (r < w1 + w2) return 2;
    return 3;
}

// animated/0001.gif ~ animated/0386.gif 중 랜덤 선택 (10% 확률로 shiny 폴더 사용)
function pickRandomMonster() {
    const num = Math.floor(Math.random() * (MONSTER_MAX - MONSTER_MIN + 1)) + MONSTER_MIN;
    const padded = String(num).padStart(4, '0');
    const isShiny = Math.random() < SHINY_CHANCE;
    const folder  = isShiny ? 'images/pokemon/pokemon/animated/shiny' : 'images/pokemon/pokemon/animated';
    const info = POKEMON_DATA[padded] || { name: '???', bst: 0 };
    // bst: 포획 확률/실패 모션 계산에 쓰이는 원본 종족값 (shiny 여부와 무관하게 항상 동일)
    // effectiveBst: 표시/점수 계산에 쓰이는 값 (shiny면 2배)
    const effectiveBst = isShiny ? info.bst * SHINY_CP_MULTIPLIER : info.bst;
    return { id: padded, src: `${folder}/${padded}.gif`, isShiny, name: info.name, bst: info.bst, effectiveBst };
}

// 이미지를 미리 요청해서 브라우저 캐시에 올려둠 (실제 화면 전환/페이드인 전에 미리 호출)
// 온라인 배포 환경(GitHub Pages, Firebase Hosting 등)에서 네트워크 왕복 지연으로 인해
// 몬스터 이미지가 hp바/텍스트보다 늦게 나타나는 현상을 줄이기 위함
function preloadImage(src) {
    const img = new Image();
    img.src = src;
}

// 몬스터 이름 / 종족값 오버레이 갱신
function updateMonsterInfo(picked) {
    currentBst = picked.bst;
    currentEffectiveBst = picked.effectiveBst;
    currentMonsterName = picked.name;
    currentMonsterId = picked.id;
    currentIsShiny = picked.isShiny;
    monsterNameEl.textContent = `${picked.name}:`;
    monsterBstEl.textContent  = `CP ${formatCpTotal(picked.effectiveBst)}`;
    monsterInfo.classList.remove('hidden');
}

// shiny 등장 이펙트 — 몬스터와 겹쳐서 1회만 보이도록 재생 (원본 gif는 무한루프라 타이머로 직접 종료)
function playShinyEffect() {
    shinyEffect.src = 'images/pokemon/pokemon/animated/shiny/0000.gif?play=' + Date.now();
    shinyEffect.classList.remove('hidden');
    setTimeout(() => {
        shinyEffect.classList.add('hidden');
        shinyEffect.src = '';
    }, SHINY_EFFECT_DURATION);
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
    monster.src = picked.src;
    updateMonsterInfo(picked);

    // 이전 라운드에서 남아있을 수 있는 shiny 이펙트 정리 후, shiny면 새로 재생
    shinyEffect.classList.add('hidden');
    shinyEffect.src = '';
    if (picked.isShiny) playShinyEffect();

    // 몬스터 + hp바를 투명한 상태로 초기화한 뒤, 도망치기와 동일한 페이드인 효과로 나타나게 함
    monster.classList.remove('captured', 'hidden');
    monster.style.transition = 'none';
    monster.style.transform  = '';
    monster.style.opacity    = '0';
    monsterInfo.style.transition = 'none';
    monsterInfo.style.opacity    = '0';
    void monster.offsetHeight;
    monster.style.transition = '';
    monster.style.opacity    = '1';
    monsterInfo.style.transition = '';
    monsterInfo.style.opacity    = '1';

    setTimeout(() => {
        monster.style.opacity = '';
        monsterInfo.style.opacity = '';
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
    pokeball.src = 'images/pokemon/pokeball/open.gif?play=' + Date.now(); // 루프 없는 gif, 마지막 프레임에서 자동 정지
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
            pokeball.src = 'images/pokemon/pokeball/open.gif?play=' + Date.now();
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
    pokeball.src = 'images/pokemon/pokeball/catch.gif?play=' + Date.now();
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
    capturedList.push({ id: currentMonsterId, name: currentMonsterName, bst: currentEffectiveBst, isShiny: currentIsShiny });

    // 다음 몬스터를 미리 뽑아서 포획 메시지가 보이는 동안(타이핑 + 대기) 이미지를 미리 로드해둠
    // → initGame이 실제로 화면에 표시할 때는 이미 캐시되어 있어 hp바/텍스트와 동시에 나타남
    const nextMonster = pickRandomMonster();
    preloadImage(nextMonster.src);

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

            initGame(nextMonster); // 프리로드해둔 몬스터로 교체 (액션창은 계속 유지되어 있었음, initGame이 라벨/버튼상태도 갱신)
            [throwBtn, runawayBtn, chargeBtn].forEach(b => b.classList.remove('btn-hidden'));
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
        const success = Math.random() < getCatchProbability(currentBst);

        if (success) {
            shakeN(3, onCaptureSuccess);
            return;
        }

        const failType = pickFailType(currentBst); // 1, 2, 3
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

    // 다음 몬스터를 미리 뽑아서 페이드아웃 구간(약 400ms) 동안 이미지를 미리 로드해둠
    const picked = pickRandomMonster();
    preloadImage(picked.src);

    // 1. 페이드아웃 (CSS #monster / #monster-info 모두 동일한 opacity transition 사용)
    monster.style.opacity = '0';
    monsterInfo.style.opacity = '0';

    setTimeout(() => {
        // 2. 안 보이는 상태에서 다른 몬스터로 교체 (이미지가 이미 로드/로딩 중이므로 지연 최소화)
        monster.src = picked.src;
        updateMonsterInfo(picked);

        // 이전 shiny 이펙트 정리 후, shiny면 페이드인과 동시에 재생
        shinyEffect.classList.add('hidden');
        shinyEffect.src = '';
        if (picked.isShiny) playShinyEffect();

        // 3. 페이드인 (몬스터 + hp바 동시에)
        monster.style.opacity = '1';
        monsterInfo.style.opacity = '1';

        setTimeout(() => {
            monster.style.opacity = '';
            monsterInfo.style.opacity = '';

            if (gameTimeUp) {
                // 도망치는 도중 시간이 끝난 경우 — 연출까지 다 보여준 뒤 결과 화면으로 전환
                finishGameToResult();
                return;
            }

            isAnimating = false;
            refreshButtons();
        }, MONSTER_SHRINK_DURATION);

    }, MONSTER_SHRINK_DURATION);
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
    const groups = new Map(); // key: "id_isShiny" -> { id, name, bst, isShiny, count }
    capturedList.forEach(mon => {
        const key = `${mon.id}_${mon.isShiny}`;
        if (!groups.has(key)) {
            groups.set(key, { id: mon.id, name: mon.name, bst: mon.bst, isShiny: mon.isShiny, count: 0 });
        }
        groups.get(key).count++;
    });

    // CP 높은 순으로 정렬해서 표시
    const sortedGroups = Array.from(groups.values()).sort((a, b) => b.bst - a.bst);

    sortedGroups.forEach(group => {
        const row = document.createElement('div');
        row.className = 'captured-row';

        const icon = document.createElement('img');
        icon.className = 'captured-icon';
        icon.src = `images/pokemon/pokemon/icon/${group.id}.png`;
        icon.alt = group.name;

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
