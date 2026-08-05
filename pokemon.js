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
const monsterOwnedBadgeEl = document.getElementById('monster-owned-badge');
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
const dexBtnResult    = document.getElementById('dex-btn-result');

// 포획한 포켓몬 목록 모달 요소
const capturedModal    = document.getElementById('captured-modal');
const capturedCloseBtn = document.getElementById('captured-close-btn');
const pauseModal       = document.getElementById('pause-modal');
const capturedListEl   = document.getElementById('captured-list');

// 포켓몬 도감 모달 요소
const dexBtn            = document.getElementById('dex-btn');
const dexModal          = document.getElementById('dex-modal');
const dexBackBtn        = document.getElementById('dex-back-btn');
const dexSettingsBtn    = document.getElementById('dex-settings-btn');
const dexCloseBtn       = document.getElementById('dex-close-btn');
const dexSearchInputEl  = document.getElementById('dex-search-input');
const dexOwnedOnlyCheckbox = document.getElementById('dex-owned-only-checkbox');
const dexCountBarEl     = document.getElementById('dex-count-bar');
const dexListEl         = document.getElementById('dex-list');

// 도감 설정 화면(⚙ 버튼으로 진입) 요소 — 설정 목록 화면 + 도감 초기화/치트 코드 전용 페이지
// (토글 패널이 아니라 완전히 별도 화면으로 전환됨)
const dexSettingsEl        = document.getElementById('dex-settings');
const dexResetBtn          = document.getElementById('dex-reset-btn');
const dexResetPageEl       = document.getElementById('dex-reset-page');
const dexResetInputEl      = document.getElementById('dex-reset-input');
const dexResetApplyBtn     = document.getElementById('dex-reset-apply-btn');
const dexResetFeedbackEl   = document.getElementById('dex-reset-feedback');
const dexCaughtCountEl  = document.getElementById('dex-caught-count');
const dexTotalCountEl   = document.getElementById('dex-total-count');
const dexCheatBtn         = document.getElementById('dex-cheat-btn');
const dexCheatPageEl       = document.getElementById('dex-cheat-page');
const dexCheatInputEl      = document.getElementById('dex-cheat-input');
const dexCheatApplyBtn     = document.getElementById('dex-cheat-apply-btn');
const dexCheatFeedbackEl   = document.getElementById('dex-cheat-feedback');

// 포켓몬 정보 화면(도감 목록 → 항목 클릭 시 전환되는 화면. 포획 여부와 무관하게 열림) 요소
const dexInfoEl         = document.getElementById('dex-info');
const dexInfoSpriteBox  = document.getElementById('dex-info-sprite-box');
const dexInfoSpriteEl   = document.getElementById('dex-info-sprite');
const dexInfoNumEl      = document.getElementById('dex-info-num');
const dexInfoNameEl     = document.getElementById('dex-info-name');
const dexInfoFormGridEl = document.getElementById('dex-info-form-grid');

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

// 종(species) 번호 오름차순으로 정렬된 도감 순서. 메가/거다이맥스는 실제 도감처럼
// 별도 항목으로 세지 않고, 포획 시 해당 species(기본형)을 도감에 등록하는 방식으로 흡수됨.
const DEX_SPECIES_ORDER = NORMAL_SPECIES_LIST.slice().sort((a, b) => Number(a) - Number(b));

// 각 species의 "대표 개체" id — 도감 목록에 보여줄 이름/아이콘 기준(항상 기본형).
// 폼 그룹 안에 species와 정확히 같은 id가 있으면(대부분의 경우) 그걸 쓰고,
// 없는 극소수 케이스만 그룹의 첫 폼으로 대체함.
function dexRepresentativeId(species) {
    const forms = NORMAL_BY_SPECIES[species] || [];
    return forms.includes(species) ? species : forms[0];
}

// ===================== 포켓몬 도감 (전국도감 형식, 브라우저 + Firebase에 계속 누적 저장) =====================
// localStorage는 "즉시 반응하는 로컬 캐시" 역할이고, Firebase(pokedex/{학생ID})가 실제
// 영속 저장소 역할을 함 — 브라우저 캐시 삭제나 기기 변경으로 로컬 기록이 사라져도 다음 로그인 시
// 서버 값으로 복구됨. 그 밖의 도감 로직(registerDexCatch, renderDexList 등)은 여전히
// "id 목록을 담은 Set"이라는 동일한 인터페이스만 바라보고 있어서 아래 클라우드 동기화 계층을
// 추가해도 손댈 필요가 없음. 클라우드 동기화 함수들(dexCloudRef/loadDexFromCloud)은 이 블록
// 아래, registerDexCatch 앞에 있음.
const DEX_STORAGE_KEY       = 'pokemonCatchGame_ownedDex_v1';       // 포획한 species id 목록
// species 단위(대략적인 "이 종을 잡아본 적 있는가")와는 별개로, 정보 화면의 폼 그리드에서
// "정확히 이 폼(리전/성별/코스튬/그림자/메가/거다이맥스 등 POKEMON_DATA의 개별 id)을 잡아본 적
// 있는가"를 구분해서 보여주기 위한 별도 목록. species 목록보다 훨씬 세밀한 단위임에 주의.
const DEX_FORMS_STORAGE_KEY = 'pokemonCatchGame_ownedDexForms_v1';  // 포획한 적 있는 개별 폼(POKEMON_DATA id) 목록
// 폼 그리드의 "폼별 이로치 칸"(예: "알로라 색이 다른") 전용 — 정확히 그 폼을 이로치로 잡아본
// 적이 있는지를 폼 단위로 기록함. 폼 그리드는 이 목록만으로 색/실루엣을 구분해서 보여줌
const DEX_SHINY_FORMS_STORAGE_KEY = 'pokemonCatchGame_ownedDexShinyForms_v1';

// 도감 로컬 저장 키를 현재 로그인 계정으로 네임스페이스 — 같은 브라우저를 여러 계정이 돌아가며
// 쓰더라도(학생 기기 공유, 교사가 여러 학생 계정을 순회) 서로의 로컬 캐시가 섞이지 않게 함
function dexNamespacedKey(baseKey) {
    return currentUser ? (baseKey + '::' + currentUser) : baseKey;
}

function loadIdSet(storageKey) {
    try {
        const raw = localStorage.getItem(dexNamespacedKey(storageKey));
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
        return new Set(); // 저장된 값이 손상되었거나 localStorage를 못 쓰는 환경이어도 게임 진행에는 지장 없게 함
    }
}

function saveIdSet(storageKey, idSet) {
    try {
        localStorage.setItem(dexNamespacedKey(storageKey), JSON.stringify(Array.from(idSet)));
    } catch (e) {
        // 저장 실패(프라이빗 브라우징 등)해도 이번 플레이 중 도감 표시 자체는 계속 정상 동작함
    }
}

function loadOwnedDex()          { return loadIdSet(DEX_STORAGE_KEY); }
function saveOwnedDex(ownedSet)  { saveIdSet(DEX_STORAGE_KEY, ownedSet); }
function loadOwnedDexForms()         { return loadIdSet(DEX_FORMS_STORAGE_KEY); }
function saveOwnedDexForms(ownedSet) { saveIdSet(DEX_FORMS_STORAGE_KEY, ownedSet); }
function loadOwnedDexShinyForms()         { return loadIdSet(DEX_SHINY_FORMS_STORAGE_KEY); }
function saveOwnedDexShinyForms(ownedSet) { saveIdSet(DEX_SHINY_FORMS_STORAGE_KEY, ownedSet); }

let ownedDexSpecies      = loadOwnedDex();      // 지금까지(여러 판 누적) 한 번이라도 포획한 species id의 Set
let ownedDexForms        = loadOwnedDexForms(); // 지금까지 포획한 적 있는 "정확한 폼"(POKEMON_DATA id)의 Set
let ownedDexShinyForms   = loadOwnedDexShinyForms(); // 지금까지 이로치로 포획한 적 있는 "정확한 폼"(POKEMON_DATA id)의 Set

// ===================== 도감 치트 코드 = 리워드 플래그 (설정 화면에서 입력) =====================
// 실제 포획 데이터(ownedDex*)는 절대 건드리지 않고, 화면 표시 로직에서만 우회하는 방식으로
// 구현함 — 그래야 "도감 초기화"를 누르면 치트 흔적 없이 완전히 원래 상태로 돌아갈 수 있음.
//   DexAll    : 모든 종/폼이 "언락"(이름 공개) 상태가 되지만, 실제로 잡지 않은 건 흑백(grayed)으로 표시
//   CaughtAll : 모든 종/폼이 실제로 잡은 것처럼 컬러(owned)로 표시
// 선생님이 일부 학생 기기에 직접 입력해주는 리워드 용도라, 아래 registerDexCatch와 마찬가지로
// Firebase에도 함께 저장해서 캐시 삭제/기기 변경에도 유지되게 함(applyDexCheatCode 참고).
const DEX_CHEAT_ALL_KEY        = 'pokemonCatchGame_cheatDexAll_v1';
const DEX_CHEAT_CAUGHT_ALL_KEY = 'pokemonCatchGame_cheatCaughtAll_v1';

function loadBoolFlag(key) {
    try { return localStorage.getItem(dexNamespacedKey(key)) === '1'; } catch (e) { return false; }
}
function saveBoolFlag(key, value) {
    try { localStorage.setItem(dexNamespacedKey(key), value ? '1' : '0'); } catch (e) { /* 무시 */ }
}

let dexCheatDexAll    = loadBoolFlag(DEX_CHEAT_ALL_KEY);
let dexCheatCaughtAll = loadBoolFlag(DEX_CHEAT_CAUGHT_ALL_KEY);

// 지금 ownedDex*/dexCheat* 변수에 로드되어 있는 게 누구의 데이터인지 추적 — 스크립트 로드 시점엔
// 아직 로그인 전이라 currentUser가 null인 상태 그대로 기록해둠(reloadDexForCurrentUserIfNeeded 참고)
let dexLoadedForUser = currentUser;

// currentUser가 마지막으로 도감을 불러온 사용자와 달라졌으면(로그인/계정 전환) 이전 사용자의
// 메모리 상태를 버리고 새 사용자 몫으로 다시 로드함. 이 앱은 로그인해도 페이지가 새로고침되지
// 않는 SPA라, 위 ownedDex*/dexCheat* 변수를 그냥 두면 계정이 바뀌어도 이전 계정 값이 메모리에
// 그대로 남아 다음 계정의 Firebase 데이터와 섞여버림 — 그걸 막기 위한 재로드 훅.
// localStorage 읽기라 비용이 거의 없고, 게임 진입(openPokemonCatchPage → loadDexFromCloud)
// 시점에만 호출되므로 잦은 호출 부담도 없음.
function reloadDexForCurrentUserIfNeeded() {
    if (dexLoadedForUser === currentUser) return;
    dexLoadedForUser = currentUser;
    ownedDexSpecies    = loadOwnedDex();
    ownedDexForms      = loadOwnedDexForms();
    ownedDexShinyForms = loadOwnedDexShinyForms();
    dexCheatDexAll     = loadBoolFlag(DEX_CHEAT_ALL_KEY);
    dexCheatCaughtAll  = loadBoolFlag(DEX_CHEAT_CAUGHT_ALL_KEY);
}

// ===================== 도감 클라우드(Firebase) 동기화 =====================
// 저장 위치는 studentAccounts와 완전히 분리된 최상위 경로 'pokedex/{학생ID}'.
// studentAccounts는 로그인 여부와 무관하게 전체 학생 데이터를 실시간으로 통째로 구독하는
// 리스너(app.js의 db.ref('studentAccounts').on('value', ...))에 물려 있어서, 도감처럼 학생당
// 최대 수천 개 항목이 될 수 있는 데이터를 거기 얹으면 그 리스너 전체가 무거워짐 — 그래서
// 별도 경로로 둠. 구조: pokedex/{학생ID}/species, .../forms, .../formsShiny
// (전부 {id: true} 형태의 맵), .../cheatDexAll, .../cheatCaughtAll(불리언).
//
// 상시 실시간 리스너(.on) 대신 게임 진입 시 1회 읽기(.once)만 쓴다 — 이 앱은 학생 한 명이
// 기기 한 대로 순차적으로(교시별로) 접속하는 게 일반적이라 실시간 다기기 동기화까지는 필요
// 없다고 판단했고, 나중에 필요해지면 이 구조 그대로 .once를 .on으로 바꾸는 정도로 확장 가능함.
//
// 쓰기는 항상 "항목 단위"로만 한다(전체 맵을 통째로 덮어쓰지 않음) — 그래야 다른 기기가 방금
// 추가했을 수 있는 항목을 실수로 덮어쓰는 일이 없음. 포획 기록은 늘어나기만 하는(줄어들지 않는)
// 데이터라 이렇게만 해도 병합 충돌이 생기지 않음.
function dexCloudRef() {
    if (typeof db === 'undefined' || !currentUser) return null; // 로그인 전이거나 Firebase 초기화 전이면 사용 안 함
    return db.ref('pokedex/' + currentUser);
}

let dexCloudLoading = false; // 중복 요청 방지용

// 게임 진입 시(openPokemonCatchPage) 1회 호출. 가장 먼저 계정이 바뀌었으면 로컬 상태를 그
// 계정 몫으로 다시 로드하고(reloadDexForCurrentUserIfNeeded), 그 다음 서버 값을 읽어 캐치
// 기록(species/forms/formsShiny)은 로컬 Set과 합집합 병합 후 서버에 없는 항목만 골라 다시
// 서버로 올려보낸다(최초 마이그레이션 겸, 오프라인 중 유실됐을 수 있는 write의 복구). 병합/전송
// 모두 항목 단위라 다른 기기가 동시에 갱신 중이어도 서로의 기록을 덮어쓰지 않는다.
// 치트 플래그(cheatDexAll/cheatCaughtAll)는 캐치 기록과 달리 서버 값만 그대로 신뢰하는 읽기
// 전용으로 동작함(로컬→서버 역push 없음) — 자세한 이유는 아래 해당 블록의 주석 참고.
// 네트워크 실패나 미로그인 등으로 서버를 못 읽어도 로컬 캐시만으로 도감은 계속 정상 동작한다.
function loadDexFromCloud() {
    reloadDexForCurrentUserIfNeeded();
    const ref = dexCloudRef();
    if (!ref) return;
    if (dexCloudLoading) return;
    dexCloudLoading = true;

    ref.once('value')
        .then(snapshot => {
            const server = snapshot.val() || {};
            const serverSpecies      = server.species || {};
            const serverForms        = server.forms || {};
            const serverFormsShiny   = server.formsShiny || {};

            // 서버 → 로컬: 서버에만 있던 항목(예: 다른 기기에서 잡았거나, 캐시 삭제 전 기록)을
            // 로컬 Set에 합집합으로 추가
            Object.keys(serverSpecies).forEach(id => { if (serverSpecies[id]) ownedDexSpecies.add(id); });
            Object.keys(serverForms).forEach(id => { if (serverForms[id]) ownedDexForms.add(id); });
            Object.keys(serverFormsShiny).forEach(id => { if (serverFormsShiny[id]) ownedDexShinyForms.add(id); });
            // 치트 플래그는 로컬 값과 OR로 합치지 않고 서버 값을 그대로 신뢰함(읽기 전용) — 로컬에
            // 남은 true는 이 계정에 대한 의도된 조작이 아니라 그냥 브라우저에 남은 잔여 상태일 수
            // 있어서, 서버가 "진짜" 상태를 결정하고 로컬은 표시만 담당함
            dexCheatDexAll    = !!server.cheatDexAll;
            dexCheatCaughtAll = !!server.cheatCaughtAll;

            saveOwnedDex(ownedDexSpecies);
            saveOwnedDexForms(ownedDexForms);
            saveOwnedDexShinyForms(ownedDexShinyForms);
            saveBoolFlag(DEX_CHEAT_ALL_KEY, dexCheatDexAll);
            saveBoolFlag(DEX_CHEAT_CAUGHT_ALL_KEY, dexCheatCaughtAll);

            // 로컬 → 서버: 서버엔 없고 로컬에만 있던 항목만 항목 단위로 올려보냄
            const updates = {};
            ownedDexSpecies.forEach(id => { if (!serverSpecies[id]) updates['species/' + id] = true; });
            ownedDexForms.forEach(id => { if (!serverForms[id]) updates['forms/' + id] = true; });
            ownedDexShinyForms.forEach(id => { if (!serverFormsShiny[id]) updates['formsShiny/' + id] = true; });
            // cheatDexAll/cheatCaughtAll은 여기서 로컬→서버로 절대 밀어 올리지 않음(위에서 이미
            // 서버 값을 그대로 신뢰하도록 바꿨으므로 애초에 로컬이 서버보다 "앞서있는" 경우가
            // 없음). 치트를 실제로 켜는 유일한 경로는 applyDexCheatCode()의 명시적 ref.update() 호출뿐

            if (Object.keys(updates).length > 0) {
                ref.update(updates).catch(() => { /* 실패해도 다음 진입 때 다시 시도됨 */ });
            }

            dexCloudLoading = false;

            // 도감 모달을 이미 열어 목록을 보고 있던 상태로 병합이 끝났다면 최신 값으로 다시 그림
            // (로딩 스피너 없이도 항상 로컬 캐시로 즉시 뭔가를 보여주고, 서버 값이 도착하면
            // 조용히 갱신하는 오프라인 우선 방식)
            if (dexModal && !dexModal.classList.contains('hidden') && !dexListEl.classList.contains('hidden')) {
                renderDexList();
            }
        })
        .catch(() => {
            dexCloudLoading = false; // 오프라인/권한 오류 등 — 로컬 캐시만으로 계속 진행
        });
}

// 종/폼 단위로 "언락 여부"(이름 공개)와 "컬러 표시 여부"(실제로 잡은 것처럼 보임)를 계산하는
// 헬퍼. 도감 목록/정보/폼 그리드 렌더링이 전부 이 함수들을 통해서만 ownedDex* Set을 조회하므로,
// 치트가 꺼져 있으면 지금까지의 동작과 완전히 동일함
function isSpeciesUnlocked(species) {
    return dexCheatDexAll || dexCheatCaughtAll || ownedDexSpecies.has(species);
}
function isSpeciesColored(species) {
    return dexCheatCaughtAll || ownedDexSpecies.has(species);
}
function isFormUnlocked(id) {
    return dexCheatDexAll || dexCheatCaughtAll || ownedDexForms.has(id);
}
function isFormColored(id) {
    return dexCheatCaughtAll || ownedDexForms.has(id);
}
// 폼별 "색이 다른" 칸 전용 — 정확히 그 폼(id)을 이로치로 잡아본 적 있는지로 판정
function isFormShinyUnlocked(id) {
    return dexCheatDexAll || dexCheatCaughtAll || ownedDexShinyForms.has(id);
}
function isFormShinyColored(id) {
    return dexCheatCaughtAll || ownedDexShinyForms.has(id);
}

// 포획 성공 시 호출 — 몬스터의 species(메가/거다이맥스도 기본형 species로 귀속)를 도감에 등록하고,
// 동시에 정확히 잡은 폼(monsterId 그 자체)도 별도로 기록함
function registerDexCatch(monsterId, isShiny) {
    const info = POKEMON_DATA[monsterId];
    const species = info && info.species;
    if (!species || !NORMAL_BY_SPECIES[species]) return; // 알 수 없는 species는 안전하게 무시

    // 로컬 Set/캐시는 항상 즉시(동기적으로) 갱신 — 화면 반응 속도는 기존과 동일하게 유지됨.
    // 이번 포획으로 실제 바뀐 항목만 cloudUpdates에 모아뒀다가 아래에서 Firebase로 한 번에 보냄
    const cloudUpdates = {};

    if (!ownedDexSpecies.has(species)) {
        ownedDexSpecies.add(species);
        saveOwnedDex(ownedDexSpecies);
        cloudUpdates['species/' + species] = true;
    }
    if (!isShiny && !ownedDexForms.has(monsterId)) {
        ownedDexForms.add(monsterId);
        saveOwnedDexForms(ownedDexForms);
        cloudUpdates['forms/' + monsterId] = true;
    }
    if (isShiny && !ownedDexShinyForms.has(monsterId)) {
        ownedDexShinyForms.add(monsterId);
        saveOwnedDexShinyForms(ownedDexShinyForms);
        cloudUpdates['formsShiny/' + monsterId] = true;
    }

    // Firebase 전송은 백그라운드로만 시도 — 실패(오프라인 등)해도 게임 진행에는 영향 없음.
    // 로컬엔 이미 반영돼 있고, 다음 게임 진입 시 loadDexFromCloud()가 서버에 없는 항목을
    // 자동으로 다시 채워 넣으므로 데이터가 유실되지 않음
    const ref = dexCloudRef();
    if (ref && Object.keys(cloudUpdates).length > 0) {
        ref.update(cloudUpdates).catch(() => {});
    }
}

// 도감 헤더 검색창 상태: 빈 문자열이면 전체 표시. 숫자만 입력하면 도감번호(3자리, 0패딩)
// 부분일치, 그 외 문자는 "포획한 종의 이름"에만 부분일치(미포획 종은 이름이 '???'라 검색으로
// 노출되면 안 되므로 잠긴 종은 이름 검색 대상에서 항상 제외함)
let dexSearchQuery = '';

// "포획한 포켓몬만 보기" 체크박스 상태 — true면 검색어와 별개로 미포획 종을 목록에서 아예 제외함
let dexOwnedOnly = false;

function matchesDexSearch(species) {
    const q = dexSearchQuery.trim();
    if (!q) return true;

    if (/^\d+$/.test(q)) {
        return String(species).padStart(3, '0').includes(q);
    }

    if (!isSpeciesUnlocked(species)) return false; // 언락되지 않은 종은 이름으로 검색되지 않음
    const repId = dexRepresentativeId(species);
    const info = POKEMON_DATA[repId] || { name: '' };
    return info.name.toLowerCase().includes(q.toLowerCase());
}

// 도감 목록 렌더링: species 번호 순으로 검색어/"포획한 것만 보기" 조건에 맞는 항목만 나열하고,
// 포획한 적 있는 종만 이름/아이콘 공개, 나머지는 실루엣(검은 그림자) 처리. 상단 카운트는
// 필터와 무관하게 항상 전체 기준(포획수/전체종수)으로 표시함
function renderDexList() {
    dexTotalCountEl.textContent = String(DEX_SPECIES_ORDER.length);
    dexCaughtCountEl.textContent = String(DEX_SPECIES_ORDER.filter(isSpeciesColored).length);

    dexListEl.innerHTML = '';

    const visibleSpecies = DEX_SPECIES_ORDER.filter(species =>
        matchesDexSearch(species) && (!dexOwnedOnly || isSpeciesColored(species))
    );

    if (DEX_SPECIES_ORDER.length === 0) {
        const empty = document.createElement('div');
        empty.id = 'dex-empty';
        empty.textContent = '도감 데이터가 없습니다';
        dexListEl.appendChild(empty);
        return;
    }

    if (visibleSpecies.length === 0) {
        const empty = document.createElement('div');
        empty.id = 'dex-empty';
        empty.textContent = '검색 결과가 없습니다';
        dexListEl.appendChild(empty);
        return;
    }

    visibleSpecies.forEach(species => {
        const unlocked = isSpeciesUnlocked(species);
        const colored = isSpeciesColored(species);
        const repId = dexRepresentativeId(species);
        const info = POKEMON_DATA[repId] || { name: '???' };

        const row = document.createElement('div');
        row.className = unlocked ? 'dex-row' : 'dex-row locked';
        row.dataset.species = species; // 클릭 시 어떤 종을 눌렀는지 식별하는 용도

        const num = document.createElement('div');
        num.className = 'dex-num';
        num.textContent = `No.${String(species).padStart(3, '0')}`;

        // 미언락 종은 아이콘 이미지를 검은 실루엣(그림자)으로, 언락됐지만 실제로 안 잡은 종은
        // (치트 DexAll) 흑백(grayscale)으로, 실제로(또는 치트 CaughtAll로) 잡은 종은 원래 색으로 표시
        const icon = document.createElement('div');
        icon.className = colored ? 'dex-icon' : (unlocked ? 'dex-icon grayed' : 'dex-icon locked');
        icon.style.backgroundImage = `url(${capturedIconSrc(repId, 'normal', false)})`;

        const name = document.createElement('span');
        name.className = 'dex-name';
        name.textContent = unlocked ? info.name : '???';

        row.appendChild(num);
        row.appendChild(icon);
        row.appendChild(name);

        if (colored) {
            const badge = document.createElement('div');
            badge.className = 'dex-owned-badge';
            row.appendChild(badge);
        }

        dexListEl.appendChild(row);
    });
}

// 도감 목록에서는 포획 여부와 무관하게 항목을 누르면 정보 화면으로 전환됨(미포획 종도 "???" +
// 실루엣으로나마 조회 가능하게 함)
dexListEl.addEventListener('click', (e) => {
    const row = e.target.closest('.dex-row');
    if (!row) return;
    openDexInfo(row.dataset.species);
});

// ===================== 포켓몬 정보 화면 (도감 목록 ↔ 정보 화면 전환) =====================

let dexInfoSpriteAnimTimerId = null; // 메인 게임의 몬스터 애니메이션 타이머와는 별개로 관리
function stopDexInfoSpriteAnimation() {
    if (dexInfoSpriteAnimTimerId !== null) {
        clearInterval(dexInfoSpriteAnimTimerId);
        dexInfoSpriteAnimTimerId = null;
    }
}

// 지금 정보 화면에서 큰 스프라이트 카드에 표시 중인 정확한 폼 id. 대표폼으로 시작하지만,
// 아래 폼 그리드에서 다른 칸을 누르면 그 폼으로 바뀜(showDexInfoForm 참고). "색이 다른"(이로치)
// 가상 칸을 눌렀을 때는 실제 POKEMON_DATA에 없는 합성 id("<대표폼id>::shiny")가 여기 들어감
let dexInfoCurrentSpecies = null;
let dexInfoSelectedFormId = null;

// 폼 그리드 칸의 id는 실제 POKEMON_DATA id 그대로거나, "그 정확한 폼을 이로치 색상으로
// 보여주는" 가상 칸(실제 데이터에 없는 합성 id, "<폼id>::shiny")일 수 있음. 폼마다 자기 전용
// 이로치 칸이 하나씩 있음(1:1). "::"는 실제 POKEMON_DATA id에 절대 나오지 않는 구분자라 안전하게
// 씀. 이 헬퍼로 항상 "실제 POKEMON_DATA id"와 "이로치로 보여줄지" 두 값으로 분리해서 씀
const DEX_SHINY_CELL_SUFFIX = '::shiny';
function parseDexCellId(cellId) {
    if (cellId.endsWith(DEX_SHINY_CELL_SUFFIX)) {
        return { realId: cellId.slice(0, -DEX_SHINY_CELL_SUFFIX.length), isShiny: true };
    }
    return { realId: cellId, isShiny: false };
}

// displayMonsterSprite()와 동일한 "정사각형 프레임을 잘라 background-position으로 재생" 방식을
// 정보 화면 전용 박스(#dex-info-sprite-box, 140px 기준)에 맞게 재사용. id의 실제 카테고리
// (normal/mega/gmax)에 맞는 스프라이트 폴더를 찾아서 재생하므로, 폼 그리드에서 메가/거다이맥스
// 칸을 눌러도 정확한 이미지가 나옴 (예전엔 항상 normal/front 폴더만 썼는데, 이제 폼 그리드의
// 아무 폼이나 여기로 표시될 수 있어서 카테고리별 폴더 분기가 반드시 필요해짐).
// cellId는 실제 폼 id이거나 "색이 다른" 가상 칸 id(parseDexCellId 참고) — 둘 다 이 함수 하나로
// 처리하며, displayMonsterSprite와 동일하게 SPRITE_SIZE_REF_SPECIES_NORMAL/_SHINY 기준
// 정지 이미지 크기 보정도 적용함(예전엔 이 보정이 빠져서 716/791-1/792-1/802-1 등이 다른
// 애니메이션 포켓몬보다 크게 보이는 버그가 있었음)
function renderDexInfoSprite(cellId) {
    stopDexInfoSpriteAnimation();
    const { realId: id, isShiny } = parseDexCellId(cellId);
    const category = (POKEMON_DATA[id] && POKEMON_DATA[id].category) || 'normal';
    const folders = CATEGORY_FOLDER[category] || CATEGORY_FOLDER.normal;
    const folder = isShiny ? folders.shiny : folders.base;
    const src = `${SPRITE9_ROOT}/${folder}/${id}.png`;

    dexInfoSpriteEl.style.backgroundRepeat = 'no-repeat';
    dexInfoSpriteEl.style.backgroundPosition = '0 0';
    dexInfoSpriteEl.style.backgroundImage = `url("${src}")`;

    const probe = new Image();
    probe.onload = () => {
        if (dexInfoSelectedFormId !== cellId) return; // 로딩 중 다른 폼/이로치 상태로 바뀌었으면 무시(경쟁 방지)

        const frameSize  = probe.naturalHeight;
        const frameCount = frameSize > 0 ? Math.max(1, Math.round(probe.naturalWidth / frameSize)) : 1;

        // 정지 이미지 관련 종(SPRITE_SIZE_REF_SPECIES_NORMAL/_SHINY 명단)은 메인 게임과 동일하게
        // 형제 폼(기본형)의 그림높이 비율로 실제 표시 크기를 다시 계산함 — displayMonsterSprite의
        // effectiveFrameSize 계산과 완전히 동일한 공식(주석은 그쪽 선언부 참고)
        const refSpeciesId = isShiny ? SPRITE_SIZE_REF_SPECIES_SHINY[id] : SPRITE_SIZE_REF_SPECIES_NORMAL[id];
        const refOff = refSpeciesId && typeof SPRITE_OFFSETS !== 'undefined' ? SPRITE_OFFSETS[refSpeciesId] : null;
        const ownOffForSize = (typeof SPRITE_OFFSETS !== 'undefined' && SPRITE_OFFSETS[id]) || { h: frameSize, shinyH: frameSize };
        const effectiveFrameSize = refOff
            ? (isShiny ? refOff.shinyH * frameSize / ownOffForSize.shinyH : refOff.h * frameSize / ownOffForSize.h)
            : frameSize;

        // 정보 화면 전용 박스는 항상 140px 정사각형 기준 — 메인 게임과 동일한 SPRITE_REFERENCE_SIZE
        // 비율로 종족 간 상대적 크기감을 유지함
        const boxWidth = dexInfoSpriteBox.clientWidth || 140;
        const scale = boxWidth / SPRITE_REFERENCE_SIZE;
        const displaySize = Math.min(effectiveFrameSize * scale, boxWidth);

        dexInfoSpriteEl.style.width  = `${displaySize}px`;
        dexInfoSpriteEl.style.height = `${displaySize}px`;
        dexInfoSpriteEl.style.backgroundSize = `${displaySize * frameCount}px ${displaySize}px`;

        const ownOff = (typeof SPRITE_OFFSETS !== 'undefined' && SPRITE_OFFSETS[id]) || { x: 0, y: 0, shinyX: 0, shinyY: 0 };
        const off = { x: isShiny ? ownOff.shinyX : ownOff.x, y: isShiny ? ownOff.shinyY : ownOff.y };
        const pixelScale = displaySize / frameSize;
        const dx = off.x * pixelScale;
        const dy = off.y * pixelScale;
        dexInfoSpriteEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        let frameIndex = 0;
        const drawFrame = () => {
            dexInfoSpriteEl.style.backgroundPosition = `-${frameIndex * displaySize}px 0px`;
            frameIndex = (frameIndex + 1) % frameCount;
        };
        drawFrame();
        if (frameCount > 1) {
            dexInfoSpriteAnimTimerId = setInterval(drawFrame, SPRITE_FRAME_INTERVAL_MS);
        }
    };
    probe.src = src;
}


// 예전엔 "폼 N"처럼 번호로만 표시되던 것들(지역폼/코스튬/스타일 등)과, 대표폼(기본형)인데도
// 종별로 실제 이름이 따로 있는 것들(예: 아르세우스 기본형="노말", 오거폰 기본형="벽록의 가면")을
// 정리해서 직접 지정한 이름표. dexFormShortLabel에서 최우선으로 확인함 — id가 여기 있으면
// (대표폼이어도) 무조건 이 값을 그대로 씀. 정리 작업 결과를 엑셀로 주고받으며 확정한 값들이라
// 함부로 순서를 재배열하거나 값을 바꾸지 않도록 함
const DEX_FORM_NAME_OVERRIDES = {
    '19-1': '알로라',
    '20-1': '알로라',
    '25-1': '옷갈아입기',
    '25-10': '지우 하나캡',
    '25-11': '지우 칼로스캡',
    '25-12': '지우 알로라캡',
    '25-13': '지우 너로정했다캡',
    '25-14': '지우 월드캡',
    '25-2': '하드록',
    '25-3': '마담',
    '25-4': '아이돌',
    '25-5': '닥터',
    '25-6': '마스크드',
    '25-7': '지우 오리지널캡',
    '25-8': '지우 호연캡',
    '25-9': '지우 신오캡',
    '26-1': '알로라',
    '27-1': '알로라',
    '28-1': '알로라',
    '37-1': '알로라',
    '38-1': '알로라',
    '50-1': '알로라',
    '51-1': '알로라',
    '52-1': '알로라',
    '52-2': '가라르',
    '53-1': '알로라',
    '58-1': '히스이',
    '59-1': '히스이',
    '74-1': '알로라',
    '75-1': '알로라',
    '76-1': '알로라',
    '77-1': '가라르',
    '78-1': '가라르',
    '79-1': '가라르',
    '80-1': '가라르',
    '83-1': '가라르',
    '88-1': '알로라',
    '89-1': '알로라',
    '100-1': '히스이',
    '101-1': '히스이',
    '103-1': '알로라',
    '105-1': '알로라',
    '110-1': '가라르',
    '122-1': '가라르',
    '128-1': '팔데아 컴뱃종',
    '128-2': '팔데아 블레이즈종',
    '128-3': '팔데아 워터종',
    '144-1': '가라르',
    '145-1': '가라르',
    '146-1': '가라르',
    '157-1': '히스이',
    '172-1': '삐죽귀',
    '194-1': '팔데아',
    '199-1': '가라르',
    '201': 'A의 모습',
    '201-1': 'B의 모습',
    '201-10': 'K의 모습',
    '201-11': 'L의 모습',
    '201-12': 'M의 모습',
    '201-13': 'N의 모습',
    '201-14': 'O의 모습',
    '201-15': 'P의 모습',
    '201-16': 'Q의 모습',
    '201-17': 'R의 모습',
    '201-18': 'S의 모습',
    '201-19': 'T의 모습',
    '201-2': 'C의 모습',
    '201-20': 'U의 모습',
    '201-21': 'V의 모습',
    '201-22': 'W의 모습',
    '201-23': 'X의 모습',
    '201-24': 'Y의 모습',
    '201-25': 'Z의 모습',
    '201-26': '?의 모습',
    '201-27': '!의 모습',
    '201-3': 'D의 모습',
    '201-4': 'E의 모습',
    '201-5': 'F의 모습',
    '201-6': 'G의 모습',
    '201-7': 'H의 모습',
    '201-8': 'I의 모습',
    '201-9': 'J의 모습',
    '211-1': '히스이',
    '215-1': '히스이',
    '215-1-female': '히스이 암컷',
    '222-1': '가라르',
    '263-1': '가라르',
    '264-1': '가라르',
    '351': '캐스퐁의 모습',
    '351-1': '태양의 모습',
    '351-2': '빗방울의 모습',
    '351-3': '설운의 모습',
    '382-1': '원시',
    '383-1': '원시',
    '386': '노말폼',
    '386-1': '어택폼',
    '386-2': '디펜스폼',
    '386-3': '스피드폼',
    '412': '초목도롱',
    '412-1': '모래땅도롱',
    '412-2': '슈레도롱',
    '413': '초목도롱',
    '413-1': '모래땅도롱',
    '413-2': '슈레도롱',
    '421': '네거폼',
    '421-1': '포지폼',
    '422': '서쪽바다',
    '422-1': '동쪽바다',
    '423': '서쪽바다',
    '423-1': '동쪽바다',
    '479-1': '히트',
    '479-2': '워시',
    '479-3': '프로스트',
    '479-4': '스핀',
    '479-5': '커트',
    '483-1': '오리진폼',
    '484-1': '오리진폼',
    '487': '어나더폼',
    '487-1': '오리진폼',
    '492': '랜드폼',
    '492-1': '스카이폼',
    '493': '노말',
    '493-1': '격투',
    '493-10': '불꽃',
    '493-11': '물',
    '493-12': '풀',
    '493-13': '전기',
    '493-14': '에스퍼',
    '493-15': '얼음',
    '493-16': '드래곤',
    '493-17': '악',
    '493-18': '페어리',
    '493-2': '비행',
    '493-3': '독',
    '493-4': '땅',
    '493-5': '바위',
    '493-6': '벌레',
    '493-7': '고스트',
    '493-8': '강철',
    '503-1': '히스이',
    '549-1': '히스이',
    '550': '적색근의 모습',
    '550-1': '청색근의 모습',
    '550-2': '백색근의 모습',
    '554-2': '가라르',
    '555-1': '달마모드',
    '555-2': '가라르',
    '555-3': '가라르 달마모드',
    '562-1': '가라르',
    '570-1': '히스이',
    '571-1': '히스이',
    '585': '봄의 모습',
    '585-1': '여름의 모습',
    '585-2': '가을의 모습',
    '585-3': '겨울의 모습',
    '586': '봄의 모습',
    '586-1': '여름의 모습',
    '586-2': '가을의 모습',
    '586-3': '겨울의 모습',
    '618-1': '가라르',
    '628-1': '히스이',
    '641': '화신폼',
    '641-1': '영물폼',
    '642': '화신폼',
    '642-1': '영물폼',
    '645': '화신폼',
    '645-1': '영물폼',
    '646-1': '화이트',
    '646-2': '블랙',
    '647': '평상시 모습',
    '647-1': '각오의 모습',
    '648': '보이스폼',
    '648-1': '스텝폼',
    '649-1': '라이트닝카세트',
    '649-2': '블레이즈카세트',
    '649-3': '프리즈카세트',
    '649-4': '아쿠아카세트',
    '658-1': '지우',
    '666': '군도의 모양',
    '666-1': '대륙의 모양',
    '666-10': '스콜의 모양',
    '666-11': '오션의 모양',
    '666-12': '설국의 모양',
    '666-13': '대하의 모양',
    '666-14': '사진의 모양',
    '666-15': '사바나의 모양',
    '666-16': '태양의 모양',
    '666-17': '설원의 모양',
    '666-18': '팬시한 모양',
    '666-19': '볼의 모양',
    '666-2': '우아한 모양',
    '666-3': '정원의 모양',
    '666-4': '황야의 모양',
    '666-5': '빙설의 모양',
    '666-6': '정글의 모양',
    '666-7': '마린의 모양',
    '666-8': '화원의 모양',
    '666-9': '모던한 모양',
    '669': '빨간 꽃',
    '669-1': '노란 꽃',
    '669-2': '오렌지색 꽃',
    '669-3': '파란 꽃',
    '669-4': '하얀 꽃',
    '670': '빨간 꽃',
    '670-1': '노란 꽃',
    '670-2': '오렌지색 꽃',
    '670-3': '파란 꽃',
    '670-4': '하얀 꽃',
    '670-5': '영원의 꽃',
    '671': '빨간 꽃',
    '671-1': '노란 꽃',
    '671-2': '오렌지색 꽃',
    '671-3': '파란 꽃',
    '671-4': '하얀 꽃',
    '676-1': '하트컷',
    '676-2': '스타컷',
    '676-3': '다이아컷',
    '676-4': '레이디컷',
    '676-5': '마담컷',
    '676-6': '젠틀컷',
    '676-7': '퀸컷',
    '676-8': '가부키컷',
    '676-9': '킹덤컷',
    '681': '실드폼',
    '681-1': '블레이드폼',
    '705-1': '히스이',
    '706-1': '히스이',
    '713-1': '히스이',
    '716': '릴렉스모드',
    '716-1': '액티브모드',
    '718': '50%폼',
    '718-1': '10%폼',
    '718-2': '퍼펙트폼',
    '720': '굴레에 빠진 후파',
    '720-1': '굴레를 벗어난 후파',
    '724-1': '히스이',
    '741': '이글이글스타일',
    '741-1': '파칙파칙스타일',
    '741-2': '훌라훌라스타일',
    '741-3': '하늘하늘스타일',
    '745': '한낮의 모습',
    '745-1': '한밤중의 모습',
    '745-2': '황혼의 모습',
    '746': '단독의 모습',
    '746-1': '군집의 모습',
    '773': '노말',
    '773-1': '격투',
    '773-10': '물',
    '773-11': '풀',
    '773-12': '전기',
    '773-13': '에스퍼',
    '773-14': '얼음',
    '773-15': '드래곤',
    '773-16': '악',
    '773-17': '페어리',
    '773-2': '비행',
    '773-3': '독',
    '773-4': '땅',
    '773-5': '바위',
    '773-6': '벌레',
    '773-7': '고스트',
    '773-8': '강철',
    '773-9': '불꽃',
    '774': '유성의 모습',
    '774-1': '빨간색 코어',
    '774-2': '주황색 코어',
    '774-3': '노란색 코어',
    '774-4': '초록색 코어',
    '774-5': '옥색 코어',
    '774-6': '파란색 코어',
    '774-7': '보라색 코어',
    '778': '둔갑한 모습',
    '778-1': '들킨 모습',
    '791-1': '라이징페이즈',
    '792-1': '풀문페이즈',
    '800-1': '황혼의 갈기',
    '800-2': '새벽의 날개',
    '800-3': '울트라',
    '801-1': '500년 전의 색',
    '802-1': '격투의 영혼',
    '845-1': '그대로 삼킨 모습',
    '845-2': '통째로 삼킨 모습',
    '849': '하이한 모습',
    '849-1': '로우한 모습',
    '869': '밀키바닐라 딸기사탕공예',
    '869-1': '밀키바닐라 베리사탕공예',
    '869-10': '밀키루비 별사탕공예',
    '869-11': '밀키루비 네잎사탕공예',
    '869-12': '밀키루비 꽃사탕공예',
    '869-13': '밀키루비 리본사탕공예',
    '869-14': '밀키말차 딸기사탕공예',
    '869-15': '밀키말차 베리사탕공예',
    '869-16': '밀키말차 하트사탕공예',
    '869-17': '밀키말차 별사탕공예',
    '869-18': '밀키말차 네잎사탕공예',
    '869-19': '밀키말차 꽃사탕공예',
    '869-2': '밀키바닐라 하트사탕공예',
    '869-20': '밀키말차 리본사탕공예',
    '869-21': '밀키민트 딸기사탕공예',
    '869-22': '밀키민트 베리사탕공예',
    '869-23': '밀키민트 하트사탕공예',
    '869-24': '밀키민트 별사탕공예',
    '869-25': '밀키민트 네잎사탕공예',
    '869-26': '밀키민트 꽃사탕공예',
    '869-27': '밀키민트 리본사탕공예',
    '869-28': '밀키레몬 딸기사탕공예',
    '869-29': '밀키레몬 베리사탕공예',
    '869-3': '밀키바닐라 별사탕공예',
    '869-30': '밀키레몬 하트사탕공예',
    '869-31': '밀키레몬 별사탕공예',
    '869-32': '밀키레몬 네잎사탕공예',
    '869-33': '밀키레몬 꽃사탕공예',
    '869-34': '밀키레몬 리본사탕공예',
    '869-35': '밀키솔트 딸기사탕공예',
    '869-36': '밀키솔트 베리사탕공예',
    '869-37': '밀키솔트 하트사탕공예',
    '869-38': '밀키솔트 별사탕공예',
    '869-39': '밀키솔트 네잎사탕공예',
    '869-4': '밀키바닐라 네잎사탕공예',
    '869-40': '밀키솔트 꽃사탕공예',
    '869-41': '밀키솔트 리본사탕공예',
    '869-42': '루비믹스 딸기사탕공예',
    '869-43': '루비믹스 베리사탕공예',
    '869-44': '루비믹스 하트사탕공예',
    '869-45': '루비믹스 별사탕공예',
    '869-46': '루비믹스 네잎사탕공예',
    '869-47': '루비믹스 꽃사탕공예',
    '869-48': '루비믹스 리본사탕공예',
    '869-49': '카라멜믹스 딸기사탕공예',
    '869-5': '밀키바닐라 꽃사탕공예',
    '869-50': '카라멜믹스 베리사탕공예',
    '869-51': '카라멜믹스 하트사탕공예',
    '869-52': '카라멜믹스 별사탕공예',
    '869-53': '카라멜믹스 네잎사탕공예',
    '869-54': '카라멜믹스 꽃사탕공예',
    '869-55': '카라멜믹스 리본사탕공예',
    '869-56': '트리플믹스 딸기사탕공예',
    '869-57': '트리플믹스 베리사탕공예',
    '869-58': '트리플믹스 하트사탕공예',
    '869-59': '트리플믹스 별사탕공예',
    '869-6': '밀키바닐라 리본사탕공예',
    '869-60': '트리플믹스 네잎사탕공예',
    '869-61': '트리플믹스 꽃사탕공예',
    '869-62': '트리플믹스 리본사탕공예',
    '869-7': '밀키루비 딸기사탕공예',
    '869-8': '밀키루비 베리사탕공예',
    '869-9': '밀키루비 하트사탕공예',
    '875': '아이스페이스',
    '875-1': '나이스페이스',
    '877': '배부른 모양',
    '877-1': '배고픈 모양',
    '888-1': '검왕',
    '889-1': '방패왕',
    '890-gmax': '무한다이맥스',
    '892': '일격의 태세',
    '892-1': '연격의 태세',
    '892-gmax': '거다이맥스 일격의 태세',
    '892-gmax-1': '거다이맥스 연격의 태세',
    '893-1': '아빠',
    '898-1': '백마 탄 모습',
    '898-2': '흑마 탄 모습',
    '901-1': '붉은 달',
    '905': '화신폼',
    '905-1': '영물폼',
    '916-1': '암컷',
    '925': '네 식구',
    '925-1': '세 식구',
    '931': '그린 페더',
    '931-1': '블루 페더',
    '931-2': '옐로 페더',
    '931-3': '화이트 페더',
    '964': '나이브폼',
    '964-1': '마이티폼',
    '978': '젖힌 모습',
    '978-1': '늘어진 모습',
    '978-2': '뻗은 모습',
    '982': '두 마디폼',
    '982-1': '세 마디폼',
    '999': '상자폼',
    '999-1': '도보폼',
    '1017': '벽록의 가면',
    '1017-1': '우물의 가면',
    '1017-2': '화덕의 가면',
    '1017-3': '주춧돌의 가면',
    '1024': '노말폼',
    '1024-1': '테라스탈폼',
    '1024-2': '스텔라폼',

    // ===================== 메가진화 확장 (2026-08 패치, 47개 신규) =====================
    '26-mega_x': '메가X',
    '26-mega_y': '메가Y',
    '36-mega': '메가',
    '71-mega': '메가',
    '121-mega': '메가',
    '149-mega': '메가',
    '154-mega': '메가',
    '160-mega': '메가',
    '227-mega': '메가',
    '358-mega': '메가',
    '359-mega_z': '메가Z',
    '398-mega': '메가',
    '445-mega_z': '메가Z',
    '448-mega_z': '메가Z',
    '478-mega': '메가',
    '485-mega': '메가',
    '491-mega': '메가',
    '500-mega': '메가',
    '530-mega': '메가',
    '545-mega': '메가',
    '560-mega': '메가',
    '604-mega': '메가',
    '609-mega': '메가',
    '623-mega': '메가',
    '652-mega': '메가',
    '655-mega': '메가',
    '658-mega': '메가',
    '668-mega': '메가',
    '670-mega': '메가',
    '678-mega': '메가',
    '687-mega': '메가',
    '689-mega': '메가',
    '691-mega': '메가',
    '701-mega': '메가',
    '718-mega': '메가',
    '740-mega': '메가',
    '768-mega': '메가',
    '780-mega': '메가',
    '801-mega': '메가',
    '807-mega': '메가',
    '870-mega': '메가',
    '952-mega': '메가',
    '970-mega': '메가',
    '978-mega': '메가 젖힌 모습',
    '978-1-mega': '메가 늘어진 모습',
    '978-2-mega': '메가 뻗은 모습',
    '998-mega': '메가',
};

// 폼 그리드 칸 안의 이름표는 (긴) 실제 포켓몬 이름 대신 "이게 어떤 폼인지"만 짧게 보여주는
// 태그로 표시함 — 기본/암컷/메가/메가X/메가Y/거다이맥스/섀도우. 지역폼·코스튬처럼 세부 종류가
// 더 있는 폼은 위 DEX_FORM_NAME_OVERRIDES에 개별적으로 정확한 이름이 정리돼 있으면 그걸 쓰고,
// 거기 없는 경우에만 접미사 패턴을 보고 자동으로 라벨을 만듦
const DEX_FORM_SUFFIX_LABELS = {
    female:  '암컷',
    mega:    '메가',
    mega_x:  '메가X',
    mega_y:  '메가Y',
    mega_z:  '메가Z', // 2026-08 메가진화 확장(앱솔/한카리아스/루카리오 2번째 메가) 추가
    gmax:    '거다이맥스',
    shadow:  '섀도우',
};

// 도감 폼 그리드 정렬용 분류표 — 각 폼(POKEMON_DATA id)이 9개 범주(기본/암컷/기타/알로라/가라르/
// 히스이/팔데아/메가/거다이맥스) 중 어디에 속하는지 미리 확정해둔 값. 정렬 순서는
// 기본 -> 암컷 -> 알로라 -> 가라르 -> 히스이 -> 팔데아 -> 기타 -> 메가 -> 거다이맥스이고,
// 같은 범주 안에서는 폼 ID(파일명) 자연 순서로 배열함(renderDexFormGrid 참고). 폼별 "색이 다른"
// 이로치 칸은 이 분류표와 무관하게 매 폼 바로 뒤에 끼워 넣는 가상 칸이라 여기 안 나옴.
// 대표폼(기본형)인데도 실제 이름이 있는 종(아르세우스=노말, 오거폰=벽록의 가면 등 47종)은
// 정렬(분류)상으로는 기본으로 취급하되(사용자 확정), 이름표 텍스트(dexFormShortLabel)는
// 그대로 원래 이름을 씀 — 별개 사안임에 주의.
const DEX_FORM_CATEGORY = {
    '1': '기본',
    '2': '기본',
    '3': '기본',
    '3-female': '암컷',
    '3-gmax': '거다이맥스',
    '3-mega': '메가',
    '4': '기본',
    '5': '기본',
    '6': '기본',
    '6-gmax': '거다이맥스',
    '6-mega_x': '메가',
    '6-mega_y': '메가',
    '7': '기본',
    '8': '기본',
    '9': '기본',
    '9-gmax': '거다이맥스',
    '9-mega': '메가',
    '10': '기본',
    '11': '기본',
    '12': '기본',
    '12-female': '암컷',
    '12-gmax': '거다이맥스',
    '13': '기본',
    '14': '기본',
    '15': '기본',
    '15-mega': '메가',
    '16': '기본',
    '17': '기본',
    '18': '기본',
    '18-mega': '메가',
    '19': '기본',
    '19-1': '알로라',
    '19-female': '암컷',
    '20': '기본',
    '20-1': '알로라',
    '20-female': '암컷',
    '21': '기본',
    '22': '기본',
    '23': '기본',
    '24': '기본',
    '25': '기본',
    '25-1': '기타',
    '25-10': '기타',
    '25-11': '기타',
    '25-12': '기타',
    '25-13': '기타',
    '25-14': '기타',
    '25-2': '기타',
    '25-3': '기타',
    '25-4': '기타',
    '25-5': '기타',
    '25-6': '기타',
    '25-7': '기타',
    '25-8': '기타',
    '25-9': '기타',
    '25-female': '암컷',
    '25-gmax': '거다이맥스',
    '26': '기본',
    '26-1': '알로라',
    '26-female': '암컷',
    '27': '기본',
    '27-1': '알로라',
    '28': '기본',
    '28-1': '알로라',
    '29': '기본',
    '30': '기본',
    '31': '기본',
    '32': '기본',
    '33': '기본',
    '34': '기본',
    '35': '기본',
    '36': '기본',
    '37': '기본',
    '37-1': '알로라',
    '38': '기본',
    '38-1': '알로라',
    '39': '기본',
    '40': '기본',
    '41': '기본',
    '41-female': '암컷',
    '42': '기본',
    '42-female': '암컷',
    '43': '기본',
    '44': '기본',
    '44-female': '암컷',
    '45': '기본',
    '45-female': '암컷',
    '46': '기본',
    '47': '기본',
    '48': '기본',
    '49': '기본',
    '50': '기본',
    '50-1': '알로라',
    '51': '기본',
    '51-1': '알로라',
    '52': '기본',
    '52-1': '알로라',
    '52-2': '가라르',
    '52-gmax': '거다이맥스',
    '53': '기본',
    '53-1': '알로라',
    '54': '기본',
    '55': '기본',
    '56': '기본',
    '57': '기본',
    '58': '기본',
    '58-1': '히스이',
    '59': '기본',
    '59-1': '히스이',
    '60': '기본',
    '61': '기본',
    '62': '기본',
    '63': '기본',
    '64': '기본',
    '64-female': '암컷',
    '65': '기본',
    '65-female': '암컷',
    '65-mega': '메가',
    '66': '기본',
    '67': '기본',
    '68': '기본',
    '68-gmax': '거다이맥스',
    '69': '기본',
    '70': '기본',
    '71': '기본',
    '72': '기본',
    '73': '기본',
    '74': '기본',
    '74-1': '알로라',
    '75': '기본',
    '75-1': '알로라',
    '76': '기본',
    '76-1': '알로라',
    '77': '기본',
    '77-1': '가라르',
    '78': '기본',
    '78-1': '가라르',
    '79': '기본',
    '79-1': '가라르',
    '80': '기본',
    '80-1': '가라르',
    '80-mega': '메가',
    '81': '기본',
    '82': '기본',
    '83': '기본',
    '83-1': '가라르',
    '84': '기본',
    '84-female': '암컷',
    '85': '기본',
    '85-female': '암컷',
    '86': '기본',
    '87': '기본',
    '88': '기본',
    '88-1': '알로라',
    '89': '기본',
    '89-1': '알로라',
    '90': '기본',
    '91': '기본',
    '92': '기본',
    '93': '기본',
    '94': '기본',
    '94-gmax': '거다이맥스',
    '94-mega': '메가',
    '95': '기본',
    '96': '기본',
    '97': '기본',
    '97-female': '암컷',
    '98': '기본',
    '99': '기본',
    '99-gmax': '거다이맥스',
    '100': '기본',
    '100-1': '히스이',
    '101': '기본',
    '101-1': '히스이',
    '102': '기본',
    '103': '기본',
    '103-1': '알로라',
    '104': '기본',
    '105': '기본',
    '105-1': '알로라',
    '106': '기본',
    '107': '기본',
    '108': '기본',
    '109': '기본',
    '110': '기본',
    '110-1': '가라르',
    '111': '기본',
    '111-female': '암컷',
    '112': '기본',
    '112-female': '암컷',
    '113': '기본',
    '114': '기본',
    '115': '기본',
    '115-mega': '메가',
    '116': '기본',
    '117': '기본',
    '118': '기본',
    '118-female': '암컷',
    '119': '기본',
    '119-female': '암컷',
    '120': '기본',
    '121': '기본',
    '122': '기본',
    '122-1': '가라르',
    '123': '기본',
    '123-female': '암컷',
    '124': '기본',
    '125': '기본',
    '126': '기본',
    '127': '기본',
    '127-mega': '메가',
    '128': '기본',
    '128-1': '팔데아',
    '128-2': '팔데아',
    '128-3': '팔데아',
    '129': '기본',
    '129-female': '암컷',
    '130': '기본',
    '130-female': '암컷',
    '130-mega': '메가',
    '131': '기본',
    '131-gmax': '거다이맥스',
    '132': '기본',
    '133': '기본',
    '133-gmax': '거다이맥스',
    '134': '기본',
    '135': '기본',
    '136': '기본',
    '137': '기본',
    '138': '기본',
    '139': '기본',
    '140': '기본',
    '141': '기본',
    '142': '기본',
    '142-mega': '메가',
    '143': '기본',
    '143-gmax': '거다이맥스',
    '144': '기본',
    '144-1': '가라르',
    '145': '기본',
    '145-1': '가라르',
    '146': '기본',
    '146-1': '가라르',
    '147': '기본',
    '148': '기본',
    '149': '기본',
    '150': '기본',
    '150-mega_x': '메가',
    '150-mega_y': '메가',
    '151': '기본',
    '152': '기본',
    '153': '기본',
    '154': '기본',
    '154-female': '암컷',
    '155': '기본',
    '156': '기본',
    '157': '기본',
    '157-1': '히스이',
    '158': '기본',
    '159': '기본',
    '160': '기본',
    '161': '기본',
    '162': '기본',
    '163': '기본',
    '164': '기본',
    '165': '기본',
    '165-female': '암컷',
    '166': '기본',
    '166-female': '암컷',
    '167': '기본',
    '168': '기본',
    '169': '기본',
    '170': '기본',
    '171': '기본',
    '172': '기본',
    '172-1': '기타',
    '173': '기본',
    '174': '기본',
    '175': '기본',
    '176': '기본',
    '177': '기본',
    '178': '기본',
    '178-female': '암컷',
    '179': '기본',
    '180': '기본',
    '181': '기본',
    '181-mega': '메가',
    '182': '기본',
    '183': '기본',
    '184': '기본',
    '185': '기본',
    '185-female': '암컷',
    '186': '기본',
    '186-female': '암컷',
    '187': '기본',
    '188': '기본',
    '189': '기본',
    '190': '기본',
    '190-female': '암컷',
    '191': '기본',
    '192': '기본',
    '193': '기본',
    '194': '기본',
    '194-1': '팔데아',
    '194-female': '암컷',
    '195': '기본',
    '195-female': '암컷',
    '196': '기본',
    '197': '기본',
    '198': '기본',
    '198-female': '암컷',
    '199': '기본',
    '199-1': '가라르',
    '200': '기본',
    '201': '기본',
    '201-1': '기타',
    '201-10': '기타',
    '201-11': '기타',
    '201-12': '기타',
    '201-13': '기타',
    '201-14': '기타',
    '201-15': '기타',
    '201-16': '기타',
    '201-17': '기타',
    '201-18': '기타',
    '201-19': '기타',
    '201-2': '기타',
    '201-20': '기타',
    '201-21': '기타',
    '201-22': '기타',
    '201-23': '기타',
    '201-24': '기타',
    '201-25': '기타',
    '201-26': '기타',
    '201-27': '기타',
    '201-3': '기타',
    '201-4': '기타',
    '201-5': '기타',
    '201-6': '기타',
    '201-7': '기타',
    '201-8': '기타',
    '201-9': '기타',
    '202': '기본',
    '202-female': '암컷',
    '203': '기본',
    '203-female': '암컷',
    '204': '기본',
    '205': '기본',
    '206': '기본',
    '207': '기본',
    '207-female': '암컷',
    '208': '기본',
    '208-female': '암컷',
    '208-mega': '메가',
    '209': '기본',
    '210': '기본',
    '211': '기본',
    '211-1': '히스이',
    '212': '기본',
    '212-female': '암컷',
    '212-mega': '메가',
    '213': '기본',
    '214': '기본',
    '214-female': '암컷',
    '214-mega': '메가',
    '215': '기본',
    '215-1': '히스이',
    '215-1-female': '히스이',
    '215-female': '암컷',
    '216': '기본',
    '217': '기본',
    '217-female': '암컷',
    '218': '기본',
    '219': '기본',
    '220': '기본',
    '221': '기본',
    '221-female': '암컷',
    '222': '기본',
    '222-1': '가라르',
    '223': '기본',
    '224': '기본',
    '224-female': '암컷',
    '225': '기본',
    '226': '기본',
    '227': '기본',
    '228': '기본',
    '229': '기본',
    '229-female': '암컷',
    '229-mega': '메가',
    '230': '기본',
    '231': '기본',
    '232': '기본',
    '232-female': '암컷',
    '233': '기본',
    '234': '기본',
    '235': '기본',
    '236': '기본',
    '237': '기본',
    '238': '기본',
    '239': '기본',
    '240': '기본',
    '241': '기본',
    '242': '기본',
    '243': '기본',
    '244': '기본',
    '245': '기본',
    '246': '기본',
    '247': '기본',
    '248': '기본',
    '248-mega': '메가',
    '249': '기본',
    '250': '기본',
    '251': '기본',
    '252': '기본',
    '253': '기본',
    '254': '기본',
    '254-mega': '메가',
    '255': '기본',
    '255-female': '암컷',
    '256': '기본',
    '256-female': '암컷',
    '257': '기본',
    '257-female': '암컷',
    '257-mega': '메가',
    '258': '기본',
    '259': '기본',
    '260': '기본',
    '260-mega': '메가',
    '261': '기본',
    '262': '기본',
    '263': '기본',
    '263-1': '가라르',
    '264': '기본',
    '264-1': '가라르',
    '265': '기본',
    '266': '기본',
    '267': '기본',
    '267-female': '암컷',
    '268': '기본',
    '269': '기본',
    '269-female': '암컷',
    '270': '기본',
    '271': '기본',
    '272': '기본',
    '272-female': '암컷',
    '273': '기본',
    '274': '기본',
    '274-female': '암컷',
    '275': '기본',
    '275-female': '암컷',
    '276': '기본',
    '277': '기본',
    '278': '기본',
    '279': '기본',
    '280': '기본',
    '281': '기본',
    '282': '기본',
    '282-mega': '메가',
    '283': '기본',
    '284': '기본',
    '285': '기본',
    '286': '기본',
    '287': '기본',
    '288': '기본',
    '289': '기본',
    '290': '기본',
    '291': '기본',
    '292': '기본',
    '293': '기본',
    '294': '기본',
    '295': '기본',
    '296': '기본',
    '297': '기본',
    '298': '기본',
    '299': '기본',
    '300': '기본',
    '301': '기본',
    '302': '기본',
    '302-mega': '메가',
    '303': '기본',
    '303-mega': '메가',
    '304': '기본',
    '305': '기본',
    '306': '기본',
    '306-mega': '메가',
    '307': '기본',
    '307-female': '암컷',
    '308': '기본',
    '308-female': '암컷',
    '308-mega': '메가',
    '309': '기본',
    '310': '기본',
    '310-mega': '메가',
    '311': '기본',
    '312': '기본',
    '313': '기본',
    '314': '기본',
    '315': '기본',
    '315-female': '암컷',
    '316': '기본',
    '316-female': '암컷',
    '317': '기본',
    '317-female': '암컷',
    '318': '기본',
    '319': '기본',
    '319-mega': '메가',
    '320': '기본',
    '321': '기본',
    '322': '기본',
    '322-female': '암컷',
    '323': '기본',
    '323-female': '암컷',
    '323-mega': '메가',
    '324': '기본',
    '325': '기본',
    '326': '기본',
    '327': '기본',
    '328': '기본',
    '329': '기본',
    '330': '기본',
    '331': '기본',
    '332': '기본',
    '332-female': '암컷',
    '333': '기본',
    '334': '기본',
    '334-mega': '메가',
    '335': '기본',
    '336': '기본',
    '337': '기본',
    '338': '기본',
    '339': '기본',
    '340': '기본',
    '341': '기본',
    '342': '기본',
    '343': '기본',
    '344': '기본',
    '345': '기본',
    '346': '기본',
    '347': '기본',
    '348': '기본',
    '349': '기본',
    '350': '기본',
    '350-female': '암컷',
    '351': '기본',
    '351-1': '기타',
    '351-2': '기타',
    '351-3': '기타',
    '352': '기본',
    '353': '기본',
    '354': '기본',
    '354-mega': '메가',
    '355': '기본',
    '356': '기본',
    '357': '기본',
    '358': '기본',
    '359': '기본',
    '359-mega': '메가',
    '360': '기본',
    '361': '기본',
    '362': '기본',
    '362-mega': '메가',
    '363': '기본',
    '364': '기본',
    '365': '기본',
    '366': '기본',
    '367': '기본',
    '368': '기본',
    '369': '기본',
    '369-female': '암컷',
    '370': '기본',
    '371': '기본',
    '372': '기본',
    '373': '기본',
    '373-mega': '메가',
    '374': '기본',
    '375': '기본',
    '376': '기본',
    '376-mega': '메가',
    '377': '기본',
    '378': '기본',
    '379': '기본',
    '380': '기본',
    '380-mega': '메가',
    '381': '기본',
    '381-mega': '메가',
    '382': '기본',
    '382-1': '기타',
    '383': '기본',
    '383-1': '기타',
    '384': '기본',
    '384-mega': '메가',
    '385': '기본',
    '386': '기본',
    '386-1': '기타',
    '386-2': '기타',
    '386-3': '기타',
    '387': '기본',
    '388': '기본',
    '389': '기본',
    '390': '기본',
    '391': '기본',
    '392': '기본',
    '393': '기본',
    '394': '기본',
    '395': '기본',
    '396': '기본',
    '396-female': '암컷',
    '397': '기본',
    '397-female': '암컷',
    '398': '기본',
    '398-female': '암컷',
    '399': '기본',
    '399-female': '암컷',
    '400': '기본',
    '400-female': '암컷',
    '401': '기본',
    '401-female': '암컷',
    '402': '기본',
    '402-female': '암컷',
    '403': '기본',
    '403-female': '암컷',
    '404': '기본',
    '404-female': '암컷',
    '405': '기본',
    '405-female': '암컷',
    '406': '기본',
    '407': '기본',
    '407-female': '암컷',
    '408': '기본',
    '409': '기본',
    '410': '기본',
    '411': '기본',
    '412': '기본',
    '412-1': '기타',
    '412-2': '기타',
    '413': '기본',
    '413-1': '기타',
    '413-2': '기타',
    '414': '기본',
    '415': '기본',
    '415-female': '암컷',
    '416': '기본',
    '417': '기본',
    '417-female': '암컷',
    '418': '기본',
    '418-female': '암컷',
    '419': '기본',
    '419-female': '암컷',
    '420': '기본',
    '421': '기본',
    '421-1': '기타',
    '422': '기본',
    '422-1': '기타',
    '423': '기본',
    '423-1': '기타',
    '424': '기본',
    '424-female': '암컷',
    '425': '기본',
    '426': '기본',
    '427': '기본',
    '428': '기본',
    '428-mega': '메가',
    '429': '기본',
    '430': '기본',
    '431': '기본',
    '432': '기본',
    '433': '기본',
    '434': '기본',
    '435': '기본',
    '436': '기본',
    '437': '기본',
    '438': '기본',
    '439': '기본',
    '440': '기본',
    '441': '기본',
    '442': '기본',
    '443': '기본',
    '443-female': '암컷',
    '444': '기본',
    '444-female': '암컷',
    '445': '기본',
    '445-female': '암컷',
    '445-mega': '메가',
    '446': '기본',
    '447': '기본',
    '448': '기본',
    '448-mega': '메가',
    '449': '기본',
    '449-female': '암컷',
    '450': '기본',
    '450-female': '암컷',
    '451': '기본',
    '452': '기본',
    '453': '기본',
    '453-female': '암컷',
    '454': '기본',
    '454-female': '암컷',
    '455': '기본',
    '456': '기본',
    '456-female': '암컷',
    '457': '기본',
    '457-female': '암컷',
    '458': '기본',
    '459': '기본',
    '459-female': '암컷',
    '460': '기본',
    '460-female': '암컷',
    '460-mega': '메가',
    '461': '기본',
    '461-female': '암컷',
    '462': '기본',
    '463': '기본',
    '464': '기본',
    '464-female': '암컷',
    '465': '기본',
    '465-female': '암컷',
    '466': '기본',
    '467': '기본',
    '468': '기본',
    '469': '기본',
    '470': '기본',
    '471': '기본',
    '472': '기본',
    '473': '기본',
    '473-female': '암컷',
    '474': '기본',
    '475': '기본',
    '475-mega': '메가',
    '476': '기본',
    '477': '기본',
    '478': '기본',
    '479': '기본',
    '479-1': '기타',
    '479-2': '기타',
    '479-3': '기타',
    '479-4': '기타',
    '479-5': '기타',
    '480': '기본',
    '481': '기본',
    '482': '기본',
    '483': '기본',
    '483-1': '기타',
    '484': '기본',
    '484-1': '기타',
    '485': '기본',
    '486': '기본',
    '487': '기본',
    '487-1': '기타',
    '488': '기본',
    '489': '기본',
    '490': '기본',
    '491': '기본',
    '492': '기본',
    '492-1': '기타',
    '493': '기본',
    '493-1': '기타',
    '493-10': '기타',
    '493-11': '기타',
    '493-12': '기타',
    '493-13': '기타',
    '493-14': '기타',
    '493-15': '기타',
    '493-16': '기타',
    '493-17': '기타',
    '493-18': '기타',
    '493-2': '기타',
    '493-3': '기타',
    '493-4': '기타',
    '493-5': '기타',
    '493-6': '기타',
    '493-7': '기타',
    '493-8': '기타',
    '494': '기본',
    '495': '기본',
    '496': '기본',
    '497': '기본',
    '498': '기본',
    '499': '기본',
    '500': '기본',
    '501': '기본',
    '502': '기본',
    '503': '기본',
    '503-1': '히스이',
    '504': '기본',
    '505': '기본',
    '506': '기본',
    '507': '기본',
    '508': '기본',
    '509': '기본',
    '510': '기본',
    '511': '기본',
    '512': '기본',
    '513': '기본',
    '514': '기본',
    '515': '기본',
    '516': '기본',
    '517': '기본',
    '518': '기본',
    '519': '기본',
    '520': '기본',
    '521': '기본',
    '521-female': '암컷',
    '522': '기본',
    '523': '기본',
    '524': '기본',
    '525': '기본',
    '526': '기본',
    '527': '기본',
    '528': '기본',
    '529': '기본',
    '530': '기본',
    '531': '기본',
    '531-mega': '메가',
    '532': '기본',
    '533': '기본',
    '534': '기본',
    '535': '기본',
    '536': '기본',
    '537': '기본',
    '538': '기본',
    '539': '기본',
    '540': '기본',
    '541': '기본',
    '542': '기본',
    '543': '기본',
    '544': '기본',
    '545': '기본',
    '546': '기본',
    '547': '기본',
    '548': '기본',
    '549': '기본',
    '549-1': '히스이',
    '550': '기본',
    '550-1': '기타',
    '550-2': '기타',
    '551': '기본',
    '552': '기본',
    '553': '기본',
    '554': '기본',
    '554-2': '가라르',
    '555': '기본',
    '555-1': '기타',
    '555-2': '가라르',
    '555-3': '가라르',
    '556': '기본',
    '557': '기본',
    '558': '기본',
    '559': '기본',
    '560': '기본',
    '561': '기본',
    '562': '기본',
    '562-1': '가라르',
    '563': '기본',
    '564': '기본',
    '565': '기본',
    '566': '기본',
    '567': '기본',
    '568': '기본',
    '569': '기본',
    '569-gmax': '거다이맥스',
    '570': '기본',
    '570-1': '히스이',
    '571': '기본',
    '571-1': '히스이',
    '572': '기본',
    '573': '기본',
    '574': '기본',
    '575': '기본',
    '576': '기본',
    '577': '기본',
    '578': '기본',
    '579': '기본',
    '580': '기본',
    '581': '기본',
    '582': '기본',
    '583': '기본',
    '584': '기본',
    '585': '기본',
    '585-1': '기타',
    '585-2': '기타',
    '585-3': '기타',
    '586': '기본',
    '586-1': '기타',
    '586-2': '기타',
    '586-3': '기타',
    '587': '기본',
    '588': '기본',
    '589': '기본',
    '590': '기본',
    '591': '기본',
    '592': '기본',
    '592-female': '암컷',
    '593': '기본',
    '593-female': '암컷',
    '594': '기본',
    '595': '기본',
    '596': '기본',
    '597': '기본',
    '598': '기본',
    '599': '기본',
    '600': '기본',
    '601': '기본',
    '602': '기본',
    '603': '기본',
    '604': '기본',
    '605': '기본',
    '606': '기본',
    '607': '기본',
    '608': '기본',
    '609': '기본',
    '610': '기본',
    '611': '기본',
    '612': '기본',
    '613': '기본',
    '614': '기본',
    '615': '기본',
    '616': '기본',
    '617': '기본',
    '618': '기본',
    '618-1': '가라르',
    '619': '기본',
    '620': '기본',
    '621': '기본',
    '622': '기본',
    '623': '기본',
    '624': '기본',
    '625': '기본',
    '626': '기본',
    '627': '기본',
    '628': '기본',
    '628-1': '히스이',
    '629': '기본',
    '630': '기본',
    '631': '기본',
    '632': '기본',
    '633': '기본',
    '634': '기본',
    '635': '기본',
    '636': '기본',
    '637': '기본',
    '638': '기본',
    '639': '기본',
    '640': '기본',
    '641': '기본',
    '641-1': '기타',
    '642': '기본',
    '642-1': '기타',
    '643': '기본',
    '644': '기본',
    '645': '기본',
    '645-1': '기타',
    '646': '기본',
    '646-1': '기타',
    '646-2': '기타',
    '647': '기본',
    '647-1': '기타',
    '648': '기본',
    '648-1': '기타',
    '649': '기본',
    '649-1': '기타',
    '649-2': '기타',
    '649-3': '기타',
    '649-4': '기타',
    '650': '기본',
    '651': '기본',
    '652': '기본',
    '653': '기본',
    '654': '기본',
    '655': '기본',
    '656': '기본',
    '657': '기본',
    '658': '기본',
    '658-1': '기타',
    '659': '기본',
    '660': '기본',
    '661': '기본',
    '662': '기본',
    '663': '기본',
    '664': '기본',
    '665': '기본',
    '666': '기본',
    '666-1': '기타',
    '666-10': '기타',
    '666-11': '기타',
    '666-12': '기타',
    '666-13': '기타',
    '666-14': '기타',
    '666-15': '기타',
    '666-16': '기타',
    '666-17': '기타',
    '666-18': '기타',
    '666-19': '기타',
    '666-2': '기타',
    '666-3': '기타',
    '666-4': '기타',
    '666-5': '기타',
    '666-6': '기타',
    '666-7': '기타',
    '666-8': '기타',
    '666-9': '기타',
    '667': '기본',
    '668': '기본',
    '668-female': '암컷',
    '669': '기본',
    '669-1': '기타',
    '669-2': '기타',
    '669-3': '기타',
    '669-4': '기타',
    '670': '기본',
    '670-1': '기타',
    '670-2': '기타',
    '670-3': '기타',
    '670-4': '기타',
    '670-5': '기타',
    '671': '기본',
    '671-1': '기타',
    '671-2': '기타',
    '671-3': '기타',
    '671-4': '기타',
    '672': '기본',
    '673': '기본',
    '674': '기본',
    '675': '기본',
    '676': '기본',
    '676-1': '기타',
    '676-2': '기타',
    '676-3': '기타',
    '676-4': '기타',
    '676-5': '기타',
    '676-6': '기타',
    '676-7': '기타',
    '676-8': '기타',
    '676-9': '기타',
    '677': '기본',
    '678': '기본',
    '678-female': '암컷',
    '679': '기본',
    '680': '기본',
    '681': '기본',
    '681-1': '기타',
    '682': '기본',
    '683': '기본',
    '684': '기본',
    '685': '기본',
    '686': '기본',
    '687': '기본',
    '688': '기본',
    '689': '기본',
    '690': '기본',
    '691': '기본',
    '692': '기본',
    '693': '기본',
    '694': '기본',
    '695': '기본',
    '696': '기본',
    '697': '기본',
    '698': '기본',
    '699': '기본',
    '700': '기본',
    '701': '기본',
    '702': '기본',
    '703': '기본',
    '704': '기본',
    '705': '기본',
    '705-1': '히스이',
    '706': '기본',
    '706-1': '히스이',
    '707': '기본',
    '708': '기본',
    '709': '기본',
    '710': '기본',
    '711': '기본',
    '712': '기본',
    '713': '기본',
    '713-1': '히스이',
    '714': '기본',
    '715': '기본',
    '716': '기본',
    '716-1': '기타',
    '717': '기본',
    '718': '기본',
    '718-1': '기타',
    '718-2': '기타',
    '719': '기본',
    '719-mega': '메가',
    '720': '기본',
    '720-1': '기타',
    '721': '기본',
    '722': '기본',
    '723': '기본',
    '724': '기본',
    '724-1': '히스이',
    '725': '기본',
    '726': '기본',
    '727': '기본',
    '728': '기본',
    '729': '기본',
    '730': '기본',
    '731': '기본',
    '732': '기본',
    '733': '기본',
    '734': '기본',
    '735': '기본',
    '736': '기본',
    '737': '기본',
    '738': '기본',
    '739': '기본',
    '740': '기본',
    '741': '기본',
    '741-1': '기타',
    '741-2': '기타',
    '741-3': '기타',
    '742': '기본',
    '743': '기본',
    '744': '기본',
    '745': '기본',
    '745-1': '기타',
    '745-2': '기타',
    '746': '기본',
    '746-1': '기타',
    '747': '기본',
    '748': '기본',
    '749': '기본',
    '750': '기본',
    '751': '기본',
    '752': '기본',
    '753': '기본',
    '754': '기본',
    '755': '기본',
    '756': '기본',
    '757': '기본',
    '758': '기본',
    '759': '기본',
    '760': '기본',
    '761': '기본',
    '762': '기본',
    '763': '기본',
    '764': '기본',
    '765': '기본',
    '766': '기본',
    '767': '기본',
    '768': '기본',
    '769': '기본',
    '770': '기본',
    '771': '기본',
    '772': '기본',
    '773': '기본',
    '773-1': '기타',
    '773-10': '기타',
    '773-11': '기타',
    '773-12': '기타',
    '773-13': '기타',
    '773-14': '기타',
    '773-15': '기타',
    '773-16': '기타',
    '773-17': '기타',
    '773-2': '기타',
    '773-3': '기타',
    '773-4': '기타',
    '773-5': '기타',
    '773-6': '기타',
    '773-7': '기타',
    '773-8': '기타',
    '773-9': '기타',
    '774': '기본',
    '774-1': '기타',
    '774-2': '기타',
    '774-3': '기타',
    '774-4': '기타',
    '774-5': '기타',
    '774-6': '기타',
    '774-7': '기타',
    '775': '기본',
    '776': '기본',
    '777': '기본',
    '778': '기본',
    '778-1': '기타',
    '779': '기본',
    '780': '기본',
    '781': '기본',
    '782': '기본',
    '783': '기본',
    '784': '기본',
    '785': '기본',
    '786': '기본',
    '787': '기본',
    '788': '기본',
    '789': '기본',
    '790': '기본',
    '791': '기본',
    '791-1': '기타',
    '792': '기본',
    '792-1': '기타',
    '793': '기본',
    '794': '기본',
    '795': '기본',
    '796': '기본',
    '797': '기본',
    '798': '기본',
    '799': '기본',
    '800': '기본',
    '800-1': '기타',
    '800-2': '기타',
    '800-3': '기타',
    '801': '기본',
    '801-1': '기타',
    '802': '기본',
    '802-1': '기타',
    '803': '기본',
    '804': '기본',
    '805': '기본',
    '806': '기본',
    '807': '기본',
    '808': '기본',
    '809': '기본',
    '809-gmax': '거다이맥스',
    '810': '기본',
    '811': '기본',
    '812': '기본',
    '812-gmax': '거다이맥스',
    '813': '기본',
    '814': '기본',
    '815': '기본',
    '815-gmax': '거다이맥스',
    '816': '기본',
    '817': '기본',
    '818': '기본',
    '818-gmax': '거다이맥스',
    '819': '기본',
    '820': '기본',
    '821': '기본',
    '822': '기본',
    '823': '기본',
    '823-gmax': '거다이맥스',
    '824': '기본',
    '825': '기본',
    '826': '기본',
    '826-gmax': '거다이맥스',
    '827': '기본',
    '828': '기본',
    '829': '기본',
    '830': '기본',
    '831': '기본',
    '832': '기본',
    '833': '기본',
    '834': '기본',
    '834-gmax': '거다이맥스',
    '835': '기본',
    '836': '기본',
    '837': '기본',
    '838': '기본',
    '839': '기본',
    '839-gmax': '거다이맥스',
    '840': '기본',
    '841': '기본',
    '841-gmax': '거다이맥스',
    '842': '기본',
    '842-gmax': '거다이맥스',
    '843': '기본',
    '844': '기본',
    '844-gmax': '거다이맥스',
    '845': '기본',
    '845-1': '기타',
    '845-2': '기타',
    '846': '기본',
    '847': '기본',
    '848': '기본',
    '849': '기본',
    '849-1': '기타',
    '849-gmax': '거다이맥스',
    '850': '기본',
    '851': '기본',
    '851-gmax': '거다이맥스',
    '852': '기본',
    '853': '기본',
    '854': '기본',
    '855': '기본',
    '856': '기본',
    '857': '기본',
    '858': '기본',
    '858-gmax': '거다이맥스',
    '859': '기본',
    '860': '기본',
    '861': '기본',
    '861-gmax': '거다이맥스',
    '862': '기본',
    '863': '기본',
    '864': '기본',
    '865': '기본',
    '866': '기본',
    '867': '기본',
    '868': '기본',
    '869': '기본',
    '869-1': '기타',
    '869-10': '기타',
    '869-11': '기타',
    '869-12': '기타',
    '869-13': '기타',
    '869-14': '기타',
    '869-15': '기타',
    '869-16': '기타',
    '869-17': '기타',
    '869-18': '기타',
    '869-19': '기타',
    '869-2': '기타',
    '869-20': '기타',
    '869-21': '기타',
    '869-22': '기타',
    '869-23': '기타',
    '869-24': '기타',
    '869-25': '기타',
    '869-26': '기타',
    '869-27': '기타',
    '869-28': '기타',
    '869-29': '기타',
    '869-3': '기타',
    '869-30': '기타',
    '869-31': '기타',
    '869-32': '기타',
    '869-33': '기타',
    '869-34': '기타',
    '869-35': '기타',
    '869-36': '기타',
    '869-37': '기타',
    '869-38': '기타',
    '869-39': '기타',
    '869-4': '기타',
    '869-40': '기타',
    '869-41': '기타',
    '869-42': '기타',
    '869-43': '기타',
    '869-44': '기타',
    '869-45': '기타',
    '869-46': '기타',
    '869-47': '기타',
    '869-48': '기타',
    '869-49': '기타',
    '869-5': '기타',
    '869-50': '기타',
    '869-51': '기타',
    '869-52': '기타',
    '869-53': '기타',
    '869-54': '기타',
    '869-55': '기타',
    '869-56': '기타',
    '869-57': '기타',
    '869-58': '기타',
    '869-59': '기타',
    '869-6': '기타',
    '869-60': '기타',
    '869-61': '기타',
    '869-62': '기타',
    '869-7': '기타',
    '869-8': '기타',
    '869-9': '기타',
    '869-gmax': '거다이맥스',
    '870': '기본',
    '871': '기본',
    '872': '기본',
    '873': '기본',
    '874': '기본',
    '875': '기본',
    '875-1': '기타',
    '876': '기본',
    '876-female': '암컷',
    '877': '기본',
    '877-1': '기타',
    '878': '기본',
    '879': '기본',
    '879-gmax': '거다이맥스',
    '880': '기본',
    '881': '기본',
    '882': '기본',
    '883': '기본',
    '884': '기본',
    '884-gmax': '거다이맥스',
    '885': '기본',
    '886': '기본',
    '887': '기본',
    '888': '기본',
    '888-1': '기타',
    '889': '기본',
    '889-1': '기타',
    '890': '기본',
    '890-gmax': '거다이맥스',
    '891': '기본',
    '892': '기본',
    '892-1': '기타',
    '892-gmax': '거다이맥스',
    '892-gmax-1': '거다이맥스',
    '893': '기본',
    '893-1': '기타',
    '894': '기본',
    '895': '기본',
    '896': '기본',
    '897': '기본',
    '898': '기본',
    '898-1': '기타',
    '898-2': '기타',
    '899': '기본',
    '900': '기본',
    '901': '기본',
    '901-1': '기타',
    '902': '기본',
    '902-female': '암컷',
    '903': '기본',
    '904': '기본',
    '905': '기본',
    '905-1': '기타',
    '906': '기본',
    '907': '기본',
    '908': '기본',
    '909': '기본',
    '910': '기본',
    '911': '기본',
    '912': '기본',
    '913': '기본',
    '914': '기본',
    '915': '기본',
    '916': '기본',
    '916-1': '암컷',
    '917': '기본',
    '918': '기본',
    '919': '기본',
    '920': '기본',
    '921': '기본',
    '922': '기본',
    '923': '기본',
    '924': '기본',
    '925': '기본',
    '925-1': '기타',
    '926': '기본',
    '927': '기본',
    '928': '기본',
    '929': '기본',
    '930': '기본',
    '931': '기본',
    '931-1': '기타',
    '931-2': '기타',
    '931-3': '기타',
    '932': '기본',
    '933': '기본',
    '934': '기본',
    '935': '기본',
    '936': '기본',
    '937': '기본',
    '938': '기본',
    '939': '기본',
    '940': '기본',
    '941': '기본',
    '942': '기본',
    '943': '기본',
    '944': '기본',
    '945': '기본',
    '946': '기본',
    '947': '기본',
    '948': '기본',
    '949': '기본',
    '950': '기본',
    '951': '기본',
    '952': '기본',
    '953': '기본',
    '954': '기본',
    '955': '기본',
    '956': '기본',
    '957': '기본',
    '958': '기본',
    '959': '기본',
    '960': '기본',
    '961': '기본',
    '962': '기본',
    '963': '기본',
    '964': '기본',
    '964-1': '기타',
    '965': '기본',
    '966': '기본',
    '967': '기본',
    '968': '기본',
    '969': '기본',
    '970': '기본',
    '971': '기본',
    '972': '기본',
    '973': '기본',
    '974': '기본',
    '975': '기본',
    '976': '기본',
    '977': '기본',
    '978': '기본',
    '978-1': '기타',
    '978-2': '기타',
    '979': '기본',
    '980': '기본',
    '981': '기본',
    '982': '기본',
    '982-1': '기타',
    '983': '기본',
    '984': '기본',
    '985': '기본',
    '986': '기본',
    '987': '기본',
    '988': '기본',
    '989': '기본',
    '990': '기본',
    '991': '기본',
    '992': '기본',
    '993': '기본',
    '994': '기본',
    '995': '기본',
    '996': '기본',
    '997': '기본',
    '998': '기본',
    '999': '기본',
    '999-1': '기타',
    '1000': '기본',
    '1001': '기본',
    '1002': '기본',
    '1003': '기본',
    '1004': '기본',
    '1005': '기본',
    '1006': '기본',
    '1007': '기본',
    '1008': '기본',
    '1009': '기본',
    '1010': '기본',
    '1011': '기본',
    '1012': '기본',
    '1013': '기본',
    '1014': '기본',
    '1015': '기본',
    '1016': '기본',
    '1017': '기본',
    '1017-1': '기타',
    '1017-2': '기타',
    '1017-3': '기타',
    '1018': '기본',
    '1019': '기본',
    '1020': '기본',
    '1021': '기본',
    '1022': '기본',
    '1023': '기본',
    '1024': '기본',
    '1024-1': '기타',
    '1024-2': '기타',
    '1025': '기본',

    // ===================== 메가진화 확장 (2026-08 패치, 47개 신규) =====================
    '26-mega_x': '메가',
    '26-mega_y': '메가',
    '36-mega': '메가',
    '71-mega': '메가',
    '121-mega': '메가',
    '149-mega': '메가',
    '154-mega': '메가',
    '160-mega': '메가',
    '227-mega': '메가',
    '358-mega': '메가',
    '359-mega_z': '메가',
    '398-mega': '메가',
    '445-mega_z': '메가',
    '448-mega_z': '메가',
    '478-mega': '메가',
    '485-mega': '메가',
    '491-mega': '메가',
    '500-mega': '메가',
    '530-mega': '메가',
    '545-mega': '메가',
    '560-mega': '메가',
    '604-mega': '메가',
    '609-mega': '메가',
    '623-mega': '메가',
    '652-mega': '메가',
    '655-mega': '메가',
    '658-mega': '메가',
    '668-mega': '메가',
    '670-mega': '메가',
    '678-mega': '메가',
    '687-mega': '메가',
    '689-mega': '메가',
    '691-mega': '메가',
    '701-mega': '메가',
    '718-mega': '메가',
    '740-mega': '메가',
    '768-mega': '메가',
    '780-mega': '메가',
    '801-mega': '메가',
    '807-mega': '메가',
    '870-mega': '메가',
    '952-mega': '메가',
    '970-mega': '메가',
    '978-mega': '메가',
    '978-1-mega': '메가',
    '978-2-mega': '메가',
    '998-mega': '메가',
};


function dexFormShortLabel(id, species, repId) {
    if (DEX_FORM_NAME_OVERRIDES[id]) return DEX_FORM_NAME_OVERRIDES[id];
    if (id === repId) return '기본';

    const suffix = id.slice(String(species).length + 1); // species 뒤 "-" 다음 부분
    if (DEX_FORM_SUFFIX_LABELS[suffix]) return DEX_FORM_SUFFIX_LABELS[suffix];

    const numFemaleMatch = suffix.match(/^(\d+)_female$/);
    if (numFemaleMatch) return `폼 ${numFemaleMatch[1]} (암컷)`;

    if (/^\d+$/.test(suffix)) return `폼 ${suffix}`;

    return suffix || '기본'; // 알 수 없는 접미사 패턴에 대한 안전장치
}

// 도감 폼 그리드의 "실제 폼" 정렬 순서. DEX_FORM_CATEGORY에 없는 id(있을 수 없지만 안전장치로)는
// '기타'로 취급함. 폼별 "색이 다른" 이로치 칸은 이 정렬과 무관하게 각 실제 폼 바로 뒤에 끼워
// 넣으므로(renderDexFormGrid 참고) 여기엔 버킷으로 안 나옴
const DEX_FORM_BUCKET_ORDER = ['기본', '암컷', '알로라', '가라르', '히스이', '팔데아', '기타', '메가', '거다이맥스'];

// dexFormShortLabel의 결과가 "서로 다른 폼에서 각각 독립적으로 재사용되는 이름 조각"들의 조합인
// 경우, 자동 줄바꿈(폭에 맞춰 아무 데서나 잘리는 방식)에 맡기지 않고 이 조각 경계에서 항상
// 강제로 줄을 나누기 위한 표. 전체 1591개 라벨 중, "앞부분이 다른 어떤 폼에서든 그 자체로
// 완전한 단독 이름으로 실제 쓰인 적이 있는가"로 증명되는 것만 포함함(2026-08 데이터 전수 검증).
// 겉보기엔 비슷해도 증거가 없는 것(869 마휘핑의 "밀키바닐라 딸기사탕공예", 931 시비꼬의
// "화이트 페더" — 큐레무의 "화이트"와는 뜻이 전혀 달라 우연의 일치로 판단)은 여기 넣지 않고
// 기존처럼 자동 줄바꿈에 맡김. 값 배열을 join(' ')하면 반드시 dexFormShortLabel(id, ...)의
// 결과와 정확히 일치해야 함(어긋나면 실제 표시 텍스트와 강제 줄바꿈 위치가 안 맞게 됨).
const DEX_FORM_LABEL_FORCED_SPLIT = {
    '215-1-female': ['히스이', '암컷'],                 // 포푸니: 히스이 지역폼 + 암컷
    '555-3': ['가라르', '달마모드'],                     // 불비달마: 가라르 지역폼 + 달마모드
    '892-gmax': ['거다이맥스', '일격의 태세'],           // 우라오스: 거다이맥스 + 일격의 태세
    '892-gmax-1': ['거다이맥스', '연격의 태세'],         // 우라오스: 거다이맥스 + 연격의 태세
    '128-1': ['팔데아', '컴뱃종'],                       // 켄타로스: 팔데아 지역폼 + 컴뱃종
    '128-2': ['팔데아', '블레이즈종'],                   // 켄타로스: 팔데아 지역폼 + 블레이즈종
    '128-3': ['팔데아', '워터종'],                       // 켄타로스: 팔데아 지역폼 + 워터종
    '25-7': ['지우', '오리지널캡'],                      // 피카츄: 지우(캐릭터) + 오리지널캡
    '25-8': ['지우', '호연캡'],
    '25-9': ['지우', '신오캡'],
    '25-10': ['지우', '하나캡'],
    '25-11': ['지우', '칼로스캡'],
    '25-12': ['지우', '알로라캡'],
    '25-13': ['지우', '너로정했다캡'],
    '25-14': ['지우', '월드캡'],
    '978-mega': ['메가', '젖힌 모습'],     // 싸리용: 메가 + 기본 서브폼(978)과 동일한 "젖힌 모습"
    '978-1-mega': ['메가', '늘어진 모습'], // 싸리용: 메가 + 폼1(978-1)과 동일한 "늘어진 모습"
    '978-2-mega': ['메가', '뻗은 모습'],   // 싸리용: 메가 + 폼2(978-2)와 동일한 "뻗은 모습"
};

// 폼 id를 숫자/비숫자 조각으로 나눠 비교하는 자연 정렬. 문자열 그대로 비교하면 "1017-10"이
// "1017-2"보다 앞에 와버리는(사전식 비교라 '1'<'2') 문제가 있어서, 숫자 조각은 반드시 수치로
// 비교해야 "100" -> "100-1" -> "100-2" -> ... -> "100-10" 순서가 파일명 감각과 일치함
function naturalIdCompare(a, b) {
    const re = /(\d+)|(\D+)/g;
    const aParts = a.match(re) || [];
    const bParts = b.match(re) || [];
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i++) {
        const ap = aParts[i], bp = bParts[i];
        if (ap === undefined) return -1;
        if (bp === undefined) return 1;
        if (ap === bp) continue;
        if (/^\d+$/.test(ap) && /^\d+$/.test(bp)) {
            const diff = Number(ap) - Number(bp);
            if (diff !== 0) return diff;
        } else {
            return ap < bp ? -1 : 1;
        }
    }
    return 0;
}

// naturalIdCompare의 문자열 조각 비교 특성상 "978-mega"가 "978-1-mega"/"978-2-mega"보다
// 뒤로 밀려서 늘어진→뻗은→젖힌으로 꼬임(2026-08 싸리용 메가 3폼 추가로 발견, 일반 서브폼
// 978/978-1/978-2는 정상). naturalIdCompare는 폼 있는 종 전체(400여 종)가 공유하는 함수라
// 알고리즘을 고치면 다른 접미사 조합에도 영향 줄 수 있어, 이 3개 id에만 개입하는 표로 우회함
// — 전수 조사 결과 이런 패턴은 현재 싸리용뿐(2026-08 기준). 같은 패턴이 또 생기면 여기에 추가.
const DEX_FORM_SORT_OVERRIDE = {
    '978-mega': 0,
    '978-1-mega': 1,
    '978-2-mega': 2,
};

// 이 species의 모든 폼(대표폼 포함 + 리전/성별/코스튬/그림자 등 일반폼 + 메가진화 + 거다이맥스)을
// 그려주는데, 각 폼 바로 뒤에 그 폼 전용 "색이 다른"(이로치) 가상 칸을 하나씩 끼워 넣어서 실제
// 폼과 이로치 칸이 정확히 1:1로 짝지어지게 함(예: 알로라 폼 바로 뒤에 "알로라 색이 다른" 칸).
// 칸은 전부 가벼운 정지 아이콘으로 표시하고(움직이는 스프라이트는 위쪽 큰 카드 전용), 실제로
// 잡아본 폼(ownedDexForms 기준, 이로치 칸은 정확히 그 폼을 이로치로 잡았는지 — ownedDexShinyForms
// 기준)은 원래 색으로, 못 잡은 건 검은 실루엣(그림자) 처리해 형태만 드러나게 함. 정렬은 실제
// 폼들을 먼저 DEX_FORM_CATEGORY로 정해진 범주(DEX_FORM_BUCKET_ORDER 순서) 안에서 폼 id 자연
// 순서로 배열한 뒤(DEX_FORM_SORT_OVERRIDE에 둘 다 있으면 그 값을 우선함), 그 순서 그대로 각
// 폼 뒤에 이로치 짝을 삽입하는 방식(별도 정렬 대상 아님).
// 이름표는 [원래 폼 이름] vs [색이 다른] 경계, 그리고 DEX_FORM_LABEL_FORCED_SPLIT에 등록된
// 폼은 그 내부 의미 조각 경계까지 <br>로 강제 줄바꿈하고(자동 줄바꿈에 안 맡김), 그 외 부분은
// 기존처럼 word-break:keep-all 자동 줄바꿈에 맡김. 칸을 누르면 showDexInfoForm으로 큰 카드가
// 그 폼으로 바뀜 (이벤트 위임은 dexInfoFormGridEl의 클릭 리스너 한 곳에서 처리 — 아래 참고)
function renderDexFormGrid(species, repId) {
    dexInfoFormGridEl.innerHTML = '';

    const formIds = Object.keys(POKEMON_DATA).filter(id => POKEMON_DATA[id].species === species);

    // 폼이 있는 한(항상 최소 1개) 그리드를 숨길 일이 없음
    dexInfoFormGridEl.classList.remove('hidden');

    const sortedFormIds = formIds
        .map(id => ({ id, bucket: DEX_FORM_CATEGORY[id] || '기타' }))
        .sort((a, b) => {
            const orderDiff = DEX_FORM_BUCKET_ORDER.indexOf(a.bucket) - DEX_FORM_BUCKET_ORDER.indexOf(b.bucket);
            if (orderDiff !== 0) return orderDiff;
            const aOverride = DEX_FORM_SORT_OVERRIDE[a.id], bOverride = DEX_FORM_SORT_OVERRIDE[b.id];
            if (aOverride !== undefined && bOverride !== undefined) return aOverride - bOverride;
            return naturalIdCompare(a.id, b.id);
        })
        .map(({ id }) => id);

    // 정렬된 실제 폼 순서 그대로, 각 폼 바로 뒤에 그 폼의 이로치 칸을 붙여서 1:1로 짝지음
    const cells = [];
    sortedFormIds.forEach((id) => {
        cells.push({ id, isShinyCell: false, realFormId: id });
        cells.push({ id: `${id}${DEX_SHINY_CELL_SUFFIX}`, isShinyCell: true, realFormId: id });
    });

    cells.forEach(({ id, isShinyCell, realFormId }) => {
        const formInfo = POKEMON_DATA[realFormId];
        const unlocked = isShinyCell ? isFormShinyUnlocked(realFormId) : isFormUnlocked(realFormId);
        const colored  = isShinyCell ? isFormShinyColored(realFormId)  : isFormColored(realFormId);

        const cell = document.createElement('div');
        cell.className = 'dex-form-cell';
        cell.dataset.formId = id;

        const iconBox = document.createElement('div');
        iconBox.className = 'dex-form-sprite-box';
        const iconEl = document.createElement('div');
        iconEl.className = colored ? 'dex-form-icon' : (unlocked ? 'dex-form-icon grayed' : 'dex-form-icon locked');
        iconEl.style.backgroundImage = `url(${capturedIconSrc(realFormId, formInfo.category, isShinyCell)})`;
        iconBox.appendChild(iconEl);
        cell.appendChild(iconBox);

        const label = document.createElement('div');
        label.className = unlocked ? 'dex-form-name' : 'dex-form-name locked';
        if (unlocked) {
            // DEX_FORM_LABEL_FORCED_SPLIT에 있는 폼은 그 조각들로, 없으면 기존 라벨 하나를
            // 통째로 한 조각 취급. 이로치 칸은 항상 "색이 다른"을 별도 조각으로 마지막에 붙임 —
            // 조각 사이는 <br>로 강제로 줄바꿈하고(자동 줄바꿈에 맡기지 않음), 각 조각 내부는
            // 기존처럼 word-break:keep-all 자동 줄바꿈에 맡김(.dex-form-name 3줄 wrap 그대로)
            const segments = (DEX_FORM_LABEL_FORCED_SPLIT[realFormId] || [dexFormShortLabel(realFormId, species, repId)]).slice();
            if (isShinyCell) segments.push('색이 다른');
            segments.forEach((seg, i) => {
                if (i > 0) label.appendChild(document.createElement('br'));
                label.appendChild(document.createTextNode(seg));
            });
        } else {
            label.textContent = '???';
        }
        cell.appendChild(label);

        dexInfoFormGridEl.appendChild(cell);
    });
}

// 폼 그리드 칸 클릭 → 위쪽 큰 카드를 그 폼으로 전환 (이벤트 위임: 그리드를 다시 그릴 때마다
// 리스너를 새로 달 필요 없이 항상 하나만 유지됨)
dexInfoFormGridEl.addEventListener('click', (e) => {
    const cell = e.target.closest('.dex-form-cell');
    if (!cell) return;
    showDexInfoForm(cell.dataset.formId);
});

// 큰 스프라이트 카드 + 이름을 특정 폼 그리드 칸(cellFormId) 기준으로 채움. 대표폼이든 폼
// 그리드에서 고른 다른 폼(리전/성별/코스튬/그림자/메가/거다이맥스)이든, 혹은 그 폼의 "색이 다른"
// 가상 칸이든 전부 이 함수 하나로 처리함(parseDexCellId로 실제 id/이로치 여부를 분리). 정확히
// 그 폼을 잡은 적 있는지(ownedDexForms, 이로치 칸은 정확히 그 폼을 이로치로 잡았는지 —
// ownedDexShinyForms, 둘 다 폼 단위 판정)에 따라 색이 있는 애니메이션 또는 실루엣으로 보여줌.
// 이름 텍스트는 선택한 정확한 폼과 무관하게 항상 그 종의 대표폼 이름(=도감 이름)으로 고정함 —
// 메가/거다이맥스처럼 폼마다 이름이 달라지는 129개 폼을 선택해도(예: "메가리자몽X") 큰 카드
// 이름은 계속 "리자몽" 그대로 표시되고, 스프라이트 이미지만 선택한 폼 그대로 바뀜. 예전에 있던
// "-female" 폼 전용 "♀" 표시(dexFormDisplayName)도 이름 고정 방침에 맞춰 완전히 제거함.
// 그리드 안에서 현재 선택된 칸도 함께 강조 표시함
function showDexInfoForm(cellFormId) {
    dexInfoSelectedFormId = cellFormId;
    const { realId, isShiny } = parseDexCellId(cellFormId);
    const formInfo = POKEMON_DATA[realId] || { name: '???' };
    const unlocked = isShiny ? isFormShinyUnlocked(realId) : isFormUnlocked(realId);
    const colored  = isShiny ? isFormShinyColored(realId)  : isFormColored(realId);
    // 이름은 도감 목록과 동일하게 "종 단위" 잠금해제 기준을 씀 — 어떤 폼을 선택하든 이름 텍스트
    // 자체는 항상 같은 종 이름이라, 폼 단위로 가릴 실익이 없고 목록 화면과 기준이 어긋나는 걸 방지함
    const nameUnlocked = isSpeciesUnlocked(dexInfoCurrentSpecies);

    const repId = formInfo.species ? dexRepresentativeId(formInfo.species) : realId;
    const repInfo = POKEMON_DATA[repId] || formInfo;
    dexInfoNameEl.textContent = nameUnlocked ? repInfo.name : '???';
    dexInfoSpriteEl.classList.toggle('locked', !unlocked);
    dexInfoSpriteEl.classList.toggle('grayed', unlocked && !colored);
    renderDexInfoSprite(cellFormId);

    dexInfoFormGridEl.querySelectorAll('.dex-form-cell').forEach(cell => {
        cell.classList.toggle('selected', cell.dataset.formId === cellFormId);
    });
}

// species를 받아 정보 화면을 채우고 목록 대신 표시함. 미포획 종을 눌렀을 때도 호출되며(이름/스프라이트가
// "???"·실루엣으로만 나옴). 도감번호는 species(종) 단위 정보라 항상 고정 표시되고, 이름도 도감 목록과
// 동일하게 종 단위로 판단함(showDexInfoForm의 nameUnlocked 참고) — 스프라이트만 showDexInfoForm이
// 처리하는 "폼 단위" 정보라 대표폼부터 시작해서 폼 그리드 선택에 따라 바뀜. 이로치 여부는 메가/거다이맥스와
// 마찬가지로 별도 배지 없이 폼 그리드의 컬러(포획)/실루엣(미포획) 구분만으로 표시함
function openDexInfo(species) {
    const repId = dexRepresentativeId(species);

    dexInfoCurrentSpecies = species;
    dexInfoNumEl.textContent = `No.${String(species).padStart(3, '0')}`;

    renderDexFormGrid(species, repId);
    showDexInfoForm(repId); // 처음 열 때는 항상 대표폼부터 보여줌

    dexSettingsEl.classList.add('hidden');
    dexListEl.classList.add('hidden');
    dexInfoEl.classList.remove('hidden');

    // 좌측 상단 자리: 정보 화면에서는 뒤로가기, 설정 버튼은 숨김(목록 화면 전용)
    dexBackBtn.classList.remove('hidden');
    dexSettingsBtn.classList.add('hidden');

    // 검색창/체크박스/포획 수 표시는 목록 화면 전용이라 정보 화면에서는 숨김 (도감번호/이름은
    // 헤더에 따로 안 두고, 이제 본문의 큰 스프라이트 카드 바로 위에 표시됨 — dexInfoNumEl/dexInfoNameEl 참고)
    dexSearchInputEl.classList.add('hidden');
    dexCountBarEl.classList.add('hidden');
}

// 정보/설정/초기화/치트 화면 → 목록 화면으로 복귀 (좌측 상단은 뒤로가기 → 설정 버튼으로, 헤더는
// 검색창+포획 수 표시가 다시 보이도록 복귀)
function showDexList() {
    stopDexInfoSpriteAnimation();
    dexInfoEl.classList.add('hidden');
    dexSettingsEl.classList.add('hidden');
    dexResetPageEl.classList.add('hidden');
    dexCheatPageEl.classList.add('hidden');
    dexListEl.classList.remove('hidden');

    dexBackBtn.classList.add('hidden');
    dexSettingsBtn.classList.remove('hidden');

    dexSearchInputEl.classList.remove('hidden');
    dexCountBarEl.classList.remove('hidden');
}

// 좌측 상단 ⚙ 버튼을 누르면 목록 대신 설정 화면으로 전환 (뒤로가기 버튼을 눌러 목록으로 복귀).
// 설정 화면 자체는 이제 "도감 초기화"/"치트 코드" 버튼 두 개만 있는 목록이고, 각 버튼을 누르면
// showDexResetPage/showDexCheatPage로 완전히 별도 화면 전환됨(토글 패널 아님)
function showDexSettings() {
    stopDexInfoSpriteAnimation();
    dexListEl.classList.add('hidden');
    dexInfoEl.classList.add('hidden');
    dexResetPageEl.classList.add('hidden');
    dexCheatPageEl.classList.add('hidden');
    dexSettingsEl.classList.remove('hidden');

    dexBackBtn.classList.remove('hidden');
    dexSettingsBtn.classList.add('hidden');

    // 설정 화면도 검색창/체크박스/포획 수 표시는 필요 없으니 숨김
    dexSearchInputEl.classList.add('hidden');
    dexCountBarEl.classList.add('hidden');
}

// 설정 화면에서 "도감 초기화"를 누르면 전환되는 전용 페이지. 열 때마다 입력창/피드백을 비움
// (뒤로가기를 눌러 설정 화면으로 돌아가는 것이 사실상 "취소" — 별도 취소 버튼 없음)
function showDexResetPage() {
    stopDexInfoSpriteAnimation();
    dexListEl.classList.add('hidden');
    dexInfoEl.classList.add('hidden');
    dexSettingsEl.classList.add('hidden');
    dexCheatPageEl.classList.add('hidden');
    dexResetPageEl.classList.remove('hidden');

    dexResetInputEl.value = '';
    dexResetFeedbackEl.textContent = '';
    dexResetFeedbackEl.className = '';
    dexResetInputEl.focus();

    dexBackBtn.classList.remove('hidden');
    dexSettingsBtn.classList.add('hidden');
    dexSearchInputEl.classList.add('hidden');
    dexCountBarEl.classList.add('hidden');
}

// 설정 화면에서 "치트 코드"를 누르면 전환되는 전용 페이지. 열 때마다 입력창/피드백을 비움
function showDexCheatPage() {
    stopDexInfoSpriteAnimation();
    dexListEl.classList.add('hidden');
    dexInfoEl.classList.add('hidden');
    dexSettingsEl.classList.add('hidden');
    dexResetPageEl.classList.add('hidden');
    dexCheatPageEl.classList.remove('hidden');

    dexCheatInputEl.value = '';
    dexCheatFeedbackEl.textContent = '';
    dexCheatFeedbackEl.className = '';
    dexCheatInputEl.focus();

    dexBackBtn.classList.remove('hidden');
    dexSettingsBtn.classList.add('hidden');
    dexSearchInputEl.classList.add('hidden');
    dexCountBarEl.classList.add('hidden');
}

// 도감 데이터(species/폼/폼별 이로치 3종 세트)와 치트 코드 상태까지 전부 지우고 목록을
// 빈 상태로 다시 그림 — 치트 흔적 없이 완전히 처음 상태로 되돌리는 게 목적이라 dexCheat* 플래그도 함께 끔
function resetDexData() {
    ownedDexSpecies = new Set();
    ownedDexForms = new Set();
    ownedDexShinyForms = new Set();
    saveOwnedDex(ownedDexSpecies);
    saveOwnedDexForms(ownedDexForms);
    saveOwnedDexShinyForms(ownedDexShinyForms);

    dexCheatDexAll = false;
    dexCheatCaughtAll = false;
    saveBoolFlag(DEX_CHEAT_ALL_KEY, false);
    saveBoolFlag(DEX_CHEAT_CAUGHT_ALL_KEY, false);

    // Firebase에 저장된 이 학생의 도감(pokedex/{학생ID})도 통째로 삭제.
    // 포획 기록과 치트/리워드 플래그가 같은 노드 안에 함께 있어서, 이 한 번의 remove()로
    // 둘 다 자동으로 같이 초기화됨(리워드만 따로 보호하는 별도 로직 없음 — 의도된 동작)
    const ref = dexCloudRef();
    if (ref) ref.remove().catch(() => {});

    showDexList();
    renderDexList();
}

// 뒤로가기 버튼: 도감 초기화/치트 코드 전용 페이지에서는 설정 화면으로, 그 외(정보 화면 등)는
// 목록 화면으로 복귀. 별도 상태 변수 대신 현재 어느 화면이 보이는지 DOM에서 직접 확인해서
// 판단하므로 화면 전환 로직과 상태가 어긋날 일이 없음
dexBackBtn.addEventListener('click', () => {
    if (!dexResetPageEl.classList.contains('hidden') || !dexCheatPageEl.classList.contains('hidden')) {
        showDexSettings();
    } else {
        showDexList();
    }
});
dexSettingsBtn.addEventListener('click', showDexSettings);

// 도감 초기화 버튼: 전용 페이지로 이동
dexResetBtn.addEventListener('click', showDexResetPage);

// 되돌릴 수 없는 파괴적 동작이라, 정확히 이 문구를 입력해야만 실제로 초기화됨(실수 클릭 방지용
// 안전장치 — 치트 코드처럼 정확한 문자열 일치로 판정). 문구가 틀리면 에러 피드백만 보여주고
// 아무 것도 지우지 않음
const DEX_RESET_CONFIRM_PHRASE = '초기화 확인';

function applyDexReset() {
    const typed = dexResetInputEl.value.trim();
    if (!typed) return; // 빈 입력은 조용히 무시(치트 코드 입력과 동일한 패턴)

    if (typed === DEX_RESET_CONFIRM_PHRASE) {
        resetDexData(); // 내부에서 도감 목록 화면으로 이동하므로 패널은 화면 전환과 함께 자연히 사라짐
    } else {
        dexResetFeedbackEl.textContent = `정확히 "${DEX_RESET_CONFIRM_PHRASE}"이라고 입력 후 초기화 버튼을 눌러야 정상적으로 초기화 됩니다.`;
        dexResetFeedbackEl.className = 'error';
    }
}

dexResetApplyBtn.addEventListener('click', applyDexReset);
dexResetInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyDexReset();
});

// 치트 코드 버튼: 전용 페이지로 이동
dexCheatBtn.addEventListener('click', showDexCheatPage);

// 입력된 치트 코드를 검사해 적용함. 대소문자를 정확히 구분해서 비교하므로(예: "DexAll"만
// 인정, "dexall"/"DEXALL"은 불인정) trim만 하고 대소문자는 그대로 둠. 실제 포획 데이터
// (ownedDex*)는 절대 바꾸지 않고 화면 표시용 플래그만 켬 — 그래서 저장해두면 다음에 도감을
// 열어도 그대로 유지되지만, 도감 초기화를 누르면 함께 꺼짐
function applyDexCheatCode() {
    const code = dexCheatInputEl.value.trim();

    if (code === 'DexAll') {
        dexCheatDexAll = true;
        saveBoolFlag(DEX_CHEAT_ALL_KEY, true);
        // 리워드 플래그도 Firebase에 함께 저장 — 이 기기뿐 아니라 이 학생 계정 전체에 유지되게 함
        const dexAllRef = dexCloudRef();
        if (dexAllRef) dexAllRef.update({ cheatDexAll: true }).catch(() => {});
        dexCheatFeedbackEl.textContent = '적용됨: 모든 포켓몬/폼이 도감에 공개돼요 (미포획은 흑백으로 표시)';
        dexCheatFeedbackEl.className = 'success';
    } else if (code === 'CaughtAll') {
        dexCheatCaughtAll = true;
        saveBoolFlag(DEX_CHEAT_CAUGHT_ALL_KEY, true);
        const caughtAllRef = dexCloudRef();
        if (caughtAllRef) caughtAllRef.update({ cheatCaughtAll: true }).catch(() => {});
        dexCheatFeedbackEl.textContent = '적용됨: 모든 포켓몬/폼이 포획한 것처럼 컬러로 표시돼요';
        dexCheatFeedbackEl.className = 'success';
    } else if (code) {
        dexCheatFeedbackEl.textContent = '알 수 없는 코드입니다.';
        dexCheatFeedbackEl.className = 'error';
        return;
    } else {
        return; // 빈 입력은 조용히 무시
    }

    dexCheatInputEl.value = '';
    renderDexList();

    // 정보 화면을 보던 중이었다면(치트를 정보 화면에서 켠 경우) 표시도 바로 갱신
    if (!dexInfoEl.classList.contains('hidden') && dexInfoCurrentSpecies) {
        renderDexFormGrid(dexInfoCurrentSpecies, dexRepresentativeId(dexInfoCurrentSpecies));
        showDexInfoForm(dexInfoSelectedFormId || dexRepresentativeId(dexInfoCurrentSpecies));
    }
}

dexCheatApplyBtn.addEventListener('click', applyDexCheatCode);
dexCheatInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyDexCheatCode();
});

// 도감 모달을 목록 화면부터 새로 여는 공용 진입점 — 시작화면의 dex-btn과 결과화면의
// dex-btn-result 양쪽에서 동일하게 사용함. 열 때마다 검색어를 초기화해서 매번 전체 목록부터 보임
function openDexModal() {
    dexSearchQuery = '';
    dexSearchInputEl.value = '';
    dexOwnedOnly = false;
    if (dexOwnedOnlyCheckbox) dexOwnedOnlyCheckbox.checked = false;
    showDexList(); // 도감을 열 때는 항상 목록 화면부터 시작
    renderDexList();
    dexModal.classList.remove('hidden');
}

dexBtn.addEventListener('click', openDexModal);
if (dexBtnResult) dexBtnResult.addEventListener('click', openDexModal);

if (dexOwnedOnlyCheckbox) {
    dexOwnedOnlyCheckbox.addEventListener('change', () => {
        dexOwnedOnly = dexOwnedOnlyCheckbox.checked;
        renderDexList();
    });
}

dexCloseBtn.addEventListener('click', () => {
    stopDexInfoSpriteAnimation();
    dexModal.classList.add('hidden');
});

// 검색창 입력: 입력할 때마다 검색어를 갱신하고 목록을 다시 그림. 정보 화면을 보고 있는 도중에
// 검색어를 입력하면(뒤로가기 없이 헤더 검색창을 바로 눌러 입력하는 경우) 자동으로 필터링된
// 목록 화면으로 돌아가서 결과를 바로 확인할 수 있게 함
dexSearchInputEl.addEventListener('input', () => {
    dexSearchQuery = dexSearchInputEl.value;
    if (!dexInfoEl.classList.contains('hidden')) {
        showDexList();
    }
    renderDexList();
});



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
    '791-1': '791',
    '792-1': '792',
    '802-1': '802',
};
const SPRITE_SIZE_REF_SPECIES_SHINY = {
    '716': '716',
    '25-1': '25',            // front_shiny만 정지 이미지, front는 정상 애니메이션 → NORMAL 명단엔 없음
    '25-2': '25',
    '25-3': '25',
    '25-4': '25',
    '25-5': '25',
    '25-6': '25',
    '791-1': '791',
    '792-1': '792',
    '802-1': '802',
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
    // 지금 등장한 몬스터를 "정확히 이 폼 + 이로치 여부까지 일치"하게 예전에 잡아본 적 있으면
    // 이름 앞에 포획 완료 아이콘 표시 (도감 폼 그리드의 일반/이로치 1:1 판정 기준과 동일하게
    // isFormColored/isFormShinyColored를 그대로 재사용 — 치트 코드도 자동으로 반영됨)
    const alreadyOwnedExact = picked.isShiny ? isFormShinyColored(picked.id) : isFormColored(picked.id);
    monsterOwnedBadgeEl.classList.toggle('hidden', !alreadyOwnedExact);
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

    // 도감 등록: 이번 판 한정인 capturedList와 별개로, 브라우저에 계속 누적되는 전국도감에도 기록
    registerDexCatch(currentMonsterId, currentIsShiny);

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

    // 도감 클라우드 동기화: 이 학생의 Firebase 도감 데이터를 1회 읽어와 로컬 캐시와 병합.
    // 결과가 오기 전에도 로컬에 남아있던 값으로 도감 화면은 바로 정상 동작하고, 병합이 끝나면
    // 도감을 이미 열어둔 상태였을 경우에만 조용히 다시 그려짐(loadDexFromCloud 내부 참고)
    loadDexFromCloud();
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
