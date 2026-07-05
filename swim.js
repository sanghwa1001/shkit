// ==========================================
// 🏃‍♂️ 상티런 인게임용 전역 독립 변수 모음
// ==========================================

function openSangtiRunGamePage() {
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
    
    runWords = selectedSet.words.map(w => ({ eng: String(w.eng), kor: String(w.kor) }));
    
    // 🛠️ 1번 수정 반영: 상티런 페이지가 열릴 때, 메인 플랫폼의 배경과 테두리를 투명하게 지우는 game-mode 클래스 부여
    document.querySelector('.container').classList.add('game-mode');
    
    resetSangtiRunEngineUI();
    showPage('sangtirun-page');
    updateSangtiRunScale();
    requestAnimationFrame(runLoopEngine); // 버그7 수정: 페이지 진입 시 rAF 루프 재시작

    // 🛠️ ResizeObserver로 game-wrapper의 실제 크기 변화를 감시한다.
    // 레이아웃이 자리잡는 동안에도 wrapper 크기가 바뀔 때마다
    // 스케일이 자동으로 다시 계산되므로, 첫 진입 시 배경이 꽉 차지 않던 문제가 해결된다.
    startSangtiRunResizeObserver();

    setTimeout(() => {
        RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
        document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
        
        const charWrapper = document.getElementById("charWrapper");
        const charImg = document.getElementById("character");
        
        if(charWrapper && charImg) {
            runCharW = charImg.offsetWidth || charWrapper.offsetWidth;
            runCharH = charImg.offsetHeight || charWrapper.offsetHeight;
            runPlayerY = (RUN_WORLD_HEIGHT / 2) - (runCharH / 2);
            charWrapper.style.transform = `translate(${RUN_CHAR_X}px, ${runPlayerY}px)`;
            
            runCameraY = (runPlayerY + (runCharH / 2)) - (RUN_BASE_HEIGHT / 2);
            let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
            runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
            document.getElementById("world").style.transform = `translateY(${-runCameraY}px)`;
        }
    }, 50);
}

function exitSangtiRunGamePage() {
    if (runGameStarted) endSangtiRunGame();

    // 🛠️ 게임 페이지를 떠날 때 옵저버를 해제해 불필요한 계산을 막는다.
    stopSangtiRunResizeObserver();

    // 🛠️ 1번 수정 반영: 게임에서 나갈 때 다시 원래의 메인 플랫폼 디자인으로 복구
    document.querySelector('.container').classList.remove('game-mode');
    
    showPage('student-solo-game-page');
}

function updateSangtiRunScale() {
    const wrapper = document.getElementById("game-wrapper");
    const gameCanvas = document.getElementById("game");
    if (!wrapper || !gameCanvas) return;
    const currentScale = wrapper.clientWidth / RUN_BASE_WIDTH;
    gameCanvas.style.setProperty('--game-scale', currentScale);
}

// 🛠️ game-wrapper의 크기가 바뀔 때마다 updateSangtiRunScale()을 호출하는 옵저버를 시작한다.
function startSangtiRunResizeObserver() {
    const wrapper = document.getElementById("game-wrapper");
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    // 기존 옵저버가 남아 있으면 먼저 정리
    stopSangtiRunResizeObserver();

    runResizeObserver = new ResizeObserver(() => {
        updateSangtiRunScale();
    });
    runResizeObserver.observe(wrapper);
}

// 🛠️ 옵저버 해제
function stopSangtiRunResizeObserver() {
    if (runResizeObserver) {
        runResizeObserver.disconnect();
        runResizeObserver = null;
    }
}

function resetSangtiRunEngineUI() {
    document.getElementById("score").textContent = "0";

    // 🛠️ 2번 수정 반영: 페이지 진입 시 시작 대기 오버레이를 보여주고, 종료 오버레이는 숨김
    document.getElementById("gameOver").classList.remove("show");
    document.getElementById("runStartOverlay").classList.add("show");
    document.getElementById("result").innerHTML = "";
    
    document.getElementById("characterBubbleWrapper").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    
    const charImg = document.getElementById("character");
    charImg.classList.remove("red-tint", "shake");
    charImg.src = originalCharacterSrc;
    
    const bgEl = document.getElementById("bg-layer");
    bgEl.classList.remove("bg-shake");
    
    runBgX = 0;
    // 🛠️ 2번 수정 반영: 시작할 때 배경이 점프하지 않도록, 대기화면의 배경 Y좌표를 처음부터 카메라 기준(50%)으로 세팅
    bgEl.style.backgroundPosition = "0px 50%";

    runMonsters.forEach(m => { m.wrapper.remove(); m.bWrapper.remove(); });
    runMonsters = [];
    runActiveCoins.forEach(c => c.remove());
    runActiveCoins = [];
}

function setRunCharacterWord(isFirstTime = false){
    if(runWords.length === 0) return;
    let aliveMonsters = runMonsters.filter(m => !m.dead && m.x > -50);
    if (!isFirstTime && aliveMonsters.length > 0) {
        let candidates = aliveMonsters.filter(m => m.bubble.textContent !== currentRunWord.kor);
        if(candidates.length > 0) {
            let randomMonster = candidates[Math.floor(Math.random() * candidates.length)];
            currentRunWord = runWords.find(w => w.kor === randomMonster.bubble.textContent) || runWords[Math.floor(Math.random()*runWords.length)];
        } else { currentRunWord = runWords[Math.floor(Math.random()*runWords.length)]; }
    } else { currentRunWord = runWords[Math.floor(Math.random()*runWords.length)]; }

    const bubble = document.getElementById("characterBubble");
    const bubbleWrapper = document.getElementById("characterBubbleWrapper");
    
    bubble.textContent = currentRunWord.eng;
    
    if(!isFirstTime) {
        bubble.classList.remove("bubble-pop");
        void bubble.offsetWidth; 
        bubble.classList.add("bubble-pop");
    }
    
    setTimeout(() => { runCharBubbleW = bubbleWrapper.offsetWidth; }, 0);
}

function updateRunTimerUI() {
    const bar = document.getElementById("timer-bar");
    let percentage = (runTimeLeft / RUN_MAX_TIME) * 100;
    bar.style.width = Math.max(0, Math.min(100, percentage)) + "%";
    bar.style.backgroundColor = runTimeLeft <= 10 ? "#ff4757" : "#2ed573";
}

function spawnRunMonster(){
    if(runWords.length === 0 || !runGameStarted) return;
    let spawnGroupHasCorrect = Math.random() < 0.5;
    let correctIndex = spawnGroupHasCorrect ? Math.floor(Math.random() * 2) : -1;

    for (let i = 0; i < 2; i++) {
        const mWrapper = document.createElement("div");
        mWrapper.className = "monster-wrapper";
        mWrapper.style.opacity = "0";

        const monsterImg = document.createElement("img");
        let monsterNum = Math.floor(Math.random() * 9) * 2 + 1;
        monsterImg.src = "images/swim/swimmonster" + monsterNum + ".gif";
        monsterImg.className = "monster-img"; 
        mWrapper.appendChild(monsterImg);

        const bWrapper = document.createElement("div");
        bWrapper.className = "bubble-wrapper";
        bWrapper.style.opacity = "0";

        const bubbleContent = document.createElement("div");
        bubbleContent.className = "bubble"; 
        let isCorrect = (i === correctIndex);
        let word = isCorrect ? currentRunWord : (runWords.filter(w=>w.kor!==currentRunWord.kor)[Math.floor(Math.random()*(runWords.length-1))] || currentRunWord);
        bubbleContent.textContent = word.kor;
        bWrapper.appendChild(bubbleContent);
        
        let y, startX; let isValidPosition = false; let attempts = 0;

        // 🛠️ 초기버전 복원: 몹이 화면 오른쪽 끝에서만 나오지 않고,
        // 게임 화면 가로 범위 전체(0 ~ 화면너비+100) 어디서든 랜덤하게 스폰되도록 변경
        while (!isValidPosition && attempts < 20) {
            startX = Math.random() * (RUN_BASE_WIDTH + 100);
            y = (RUN_BASE_HEIGHT * 0.1) + Math.random() * (RUN_WORLD_HEIGHT - (RUN_BASE_HEIGHT * 0.3));
            isValidPosition = true;
            let charDist = Math.sqrt(Math.pow(startX - RUN_CHAR_X, 2) + Math.pow(y - runPlayerY, 2));
            if(charDist < RUN_BASE_WIDTH * 0.25) { isValidPosition = false; attempts++; continue; }
            for (let j = 0; j < runMonsters.length; j++) {
                if (runMonsters[j].dead) continue;
                if (Math.sqrt(Math.pow(startX - runMonsters[j].x, 2) + Math.pow(y - runMonsters[j].y, 2)) < RUN_BASE_WIDTH * 0.15) { isValidPosition = false; break; }
            }
            attempts++;
        }

        mWrapper.style.transform = `translate(${startX}px, ${y}px)`;
        const wDiv = document.getElementById("world");
        wDiv.appendChild(mWrapper); 
        wDiv.appendChild(bWrapper);
        
        setTimeout(() => { mWrapper.style.opacity = "1"; bWrapper.style.opacity = "1"; }, 50);

        runMonsters.push({ 
            wrapper: mWrapper, img: monsterImg, 
            bWrapper: bWrapper, bubble: bubbleContent, 
            x: startX, y: y, dead: false, speed: 2.0 + (Math.random() * 1.5), 
            spawnedTime: Date.now(), monsterNum: monsterNum, 
            w: 0, h: 0, bw: 0, bh: 0 
        });
    }
}

function runCollision(a,b){ return (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }

function startSangtiRunGame() {
    if(runWords.length === 0) return;
    runScore = 0; runCorrectCount = 0; runWrongCount = 0;
    document.getElementById("score").textContent = "0";

    // 🛠️ 2번 수정 반영: 시작 대기 오버레이/종료 오버레이를 모두 숨기고 게임 화면으로 전환
    document.getElementById("runStartOverlay").classList.remove("show");
    document.getElementById("gameOver").classList.remove("show");
    
    document.getElementById("characterBubbleWrapper").style.display = "block";
    document.getElementById("timer-container").style.display = "block";

    runMonsters.forEach(m => { m.wrapper.remove(); m.bWrapper.remove(); }); 
    runMonsters = [];
    runActiveCoins.forEach(c => c.remove()); 
    runActiveCoins = [];

    RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
    document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
    
    runPlayerY = (RUN_WORLD_HEIGHT / 2) - (runCharH / 2);
    runVelocity = 0; runIsPressing = false; runBgX = 0;

    setRunCharacterWord(true);
    runGameStarted = true; runTimeLeft = RUN_MAX_TIME; updateRunTimerUI();
    runLastTime = 0; 

    clearInterval(runTimerInterval); clearInterval(runSpawnInterval);
    runSpawnInterval = setInterval(spawnRunMonster, 750);
    runTimerInterval = setInterval(() => {
        runTimeLeft -= 0.1; updateRunTimerUI();
        if (runTimeLeft <= 0) { runTimeLeft = 0; endSangtiRunGame(); }
    }, 100);
}

function endSangtiRunGame(){
    if(!runGameStarted) return;
    runGameStarted = false;
    clearInterval(runSpawnInterval); clearInterval(runTimerInterval);
    if (runAvatarChangeTimeout) clearTimeout(runAvatarChangeTimeout);

    document.getElementById("characterBubbleWrapper").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    
    const charImg = document.getElementById("character");
    charImg.src = originalCharacterSrc; 
    charImg.classList.remove("red-tint", "shake");
    document.getElementById("bg-layer").classList.remove("bg-shake");

    // 🛠️ 2번 수정 반영: 게임 종료와 동시에 결과(점수/정답/오답)를 다시하기·이전으로 버튼과 함께 바로 표시
    document.getElementById("result").innerHTML = `🏆 점수 : ${runScore} 점<br>⭕ 정답 : ${runCorrectCount} 개<br>❌ 오답 : ${runWrongCount} 개`;

    document.getElementById("gameOver").classList.add("show");
}

function runLoopEngine(timestamp) {
    if (!runLastTime) runLastTime = timestamp;
    let dt = (timestamp - runLastTime) / 16.666; 
    runLastTime = timestamp;
    if (dt > 3) dt = 3; 

    if(runGameStarted) {
        const charWrapper = document.getElementById("charWrapper");
        const charImg = document.getElementById("character");
        const bubbleWrapper = document.getElementById("characterBubbleWrapper");
        const worldEl = document.getElementById("world");
        const bgEl = document.getElementById("bg-layer");
        const timerContainer = document.getElementById("timer-container");

        runVelocity += runIsPressing ? (-0.3 * dt) : (0.15 * dt);
        if (runVelocity < -4) runVelocity = -4; if (runVelocity > 3) runVelocity = 3;
        runPlayerY += runVelocity * dt;

        if(runPlayerY < -runCharH || runPlayerY > RUN_WORLD_HEIGHT) endSangtiRunGame();

        runCameraY = (runPlayerY + (runCharH / 2)) - (RUN_BASE_HEIGHT / 2);
        let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
        runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
        worldEl.style.transform = `translateY(${-runCameraY}px)`;

        runBgX -= 2 * dt;
        bgEl.style.backgroundPosition = `${runBgX}px ${maxCamY > 0 ? (runCameraY / maxCamY) * 100 : 0}%`;
        
        charWrapper.style.transform = `translate(${RUN_CHAR_X}px, ${runPlayerY}px)`;
        let cbX = RUN_CHAR_X + (runCharW / 2) - (runCharBubbleW / 2);
        let cbY = runPlayerY + runCharH + 2;
        bubbleWrapper.style.transform = `translate(${cbX}px, ${cbY}px)`;

        runActiveCoins.forEach(coin => { coin.style.top = (runPlayerY + parseFloat(coin.dataset.offsetY)) + "px"; });

        runMonsters.forEach(m => {
            // dead 상태여도 wrapper는 500ms 후 remove() 예약됐으므로 transform 업데이트는 계속
            if (m.w === 0) m.w = m.wrapper.offsetWidth;
            if (m.h === 0) m.h = m.wrapper.offsetHeight;
            if (m.bw === 0) m.bw = m.bWrapper.offsetWidth;
            if (m.bh === 0) m.bh = m.bWrapper.offsetHeight;

            m.x -= m.speed * dt;
            m.wrapper.style.transform = `translate(${m.x}px, ${m.y}px)`;
            
            let bx = m.x + (m.w / 2) - (m.bw / 2);
            let by = m.y + m.h + 2;
            m.bWrapper.style.transform = `translate(${bx}px, ${by}px)`;

            if(m.dead || Date.now() - m.spawnedTime < 500) return;

            let hit = false;
            if(m.w > 0 && runCharW > 0) {
                hit = runCollision(
                    { left: RUN_CHAR_X + runCharW*0.15, right: RUN_CHAR_X + runCharW*0.85, top: runPlayerY + runCharH*0.15, bottom: runPlayerY + runCharH*0.85 },
                    { left: m.x + m.w*0.15, right: m.x + m.w*0.85, top: m.y + m.h*0.15, bottom: m.y + m.h*0.85 }
                );
            }

            if(hit){
                m.dead = true; if (runAvatarChangeTimeout) clearTimeout(runAvatarChangeTimeout);
                timerContainer.classList.remove("timer-add", "timer-sub"); void timerContainer.offsetWidth;

                if(m.bubble.textContent === currentRunWord.kor){
                    runScore += 10; runCorrectCount++; runTimeLeft = Math.min(RUN_MAX_TIME, runTimeLeft + 6); updateRunTimerUI();
                    timerContainer.classList.add("timer-add"); 
                    
                    charImg.src = "images/swim/swimcharacter2.gif";
                    m.img.src = "images/swim/swimmonster" + (m.monsterNum + 1) + ".gif"; 
                    m.img.classList.add("shake");

                    const coin = document.createElement("img"); coin.src = "images/swim/swimcoin.gif"; coin.className = "coin-effect";
                    coin.style.left = (RUN_CHAR_X + (runCharW / 2)) + "px"; coin.dataset.offsetY = "15"; coin.style.top = (runPlayerY + 15) + "px";
                    worldEl.appendChild(coin); runActiveCoins.push(coin);
                    setTimeout(() => { coin.remove(); runActiveCoins = runActiveCoins.filter(c => c !== coin); }, 500);
                    
                    setRunCharacterWord();
                } else {
                    runScore -= 10; runWrongCount++; runTimeLeft = Math.max(0, runTimeLeft - 3); updateRunTimerUI();
                    timerContainer.classList.add("timer-sub"); 
                    
                    charImg.src = "images/swim/swimcharacter3.gif"; charImg.classList.add("red-tint");
                    m.img.src = "images/swim/swimmonster" + (m.monsterNum + 1) + ".gif";
                    
                    charImg.classList.remove("shake"); void charImg.offsetWidth; charImg.classList.add("shake");
                    
                    bgEl.classList.remove("bg-shake"); void bgEl.offsetWidth; bgEl.classList.add("bg-shake");
                    setTimeout(() => charImg.classList.remove("red-tint"), 300);
                }
                runAvatarChangeTimeout = setTimeout(() => { charImg.src = originalCharacterSrc; }, 800);
                document.getElementById("score").textContent = runScore;
                
                // 500ms 후 DOM 제거 + 배열에서도 제거
                setTimeout(() => { m.wrapper.remove(); m.bWrapper.remove(); runMonsters = runMonsters.filter(x => x !== m); }, 500);
            }
            // 화면 왼쪽 밖으로 나간 몬스터: dead가 아닌 것만 제거 (dead는 위의 setTimeout에서 처리)
            if(m.x < -200 && !m.dead){ m.wrapper.remove(); m.bWrapper.remove(); runMonsters = runMonsters.filter(x => x !== m); }
        });
    }
    if (runGameStarted || document.getElementById('sangtirun-page').classList.contains('active')) {
        requestAnimationFrame(runLoopEngine);
    }
}

document.addEventListener("keydown", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) { e.preventDefault(); runIsPressing = true; } });
document.addEventListener("keyup", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) runIsPressing = false; });
document.addEventListener("mousedown", () => { if(document.getElementById('sangtirun-page').classList.contains('active')) runIsPressing = true; });
document.addEventListener("mouseup", () => { runIsPressing = false; });

document.addEventListener("touchstart", (e) => { 
    if (document.getElementById('sangtirun-page').classList.contains('active') && e.target.closest('#game-wrapper')) {
        runIsPressing = true; 
    }
}, { passive: true });
document.addEventListener("touchend", () => { runIsPressing = false; });

document.addEventListener("touchcancel", () => { runIsPressing = false; });
window.addEventListener("blur", () => { runIsPressing = false; });
document.addEventListener("visibilitychange", () => { if (document.hidden) runIsPressing = false; });

window.addEventListener("resize", () => { if (document.getElementById('sangtirun-page').classList.contains('active')) updateSangtiRunScale(); });

// rAF 루프는 openSangtiRunGamePage() 진입 시에만 시작 (앱 로드 시 자동 실행 제거 — 이중 루프 방지)
