// ===== 파도타기 게임 모듈 =====
// 파도타기 리스너
db.ref('wave/state').on('value', snap => {
    const newState = snap.val() || { isOpen: false, isStarted: false, shuffledIds: [] };
    if (!isAdmin && newState.isOpen === false && document.getElementById('wave-page').classList.contains('active')) {
        alert('관리자가 파도타기 게임을 종료하여 메인 로비로 이동합니다.');
        db.ref('wave/participants/' + currentUser).child('isOnline').onDisconnect().cancel(); 
        showPage('student-lobby-page');
    }
    waveState = newState;
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

db.ref('wave/participants').on('value', snap => {
    waveParticipants = snap.val() || {};
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

db.ref('wave/clicks').on('value', snap => {
    waveClicks = snap.val() || {};
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

function enterWaveRoom() { if (isAdmin) { db.ref('wave/state/isOpen').set(true); } else { const pRef = db.ref('wave/participants/' + currentUser); pRef.once('value', snap => { if (!snap.val()) pRef.set({ status: 'waiting', isOnline: true }); else pRef.update({ isOnline: true }); pRef.child('isOnline').onDisconnect().set(false); }); } showPage('wave-page'); renderWaveRoom(); }
function exitWaveRoom() { if (isAdmin) { db.ref('wave/state').update({ isOpen: false, isStarted: false, shuffledIds: [] }); db.ref('wave/participants').remove(); db.ref('wave/clicks').remove(); showPage('student-lobby-page'); } else { const pRef = db.ref('wave/participants/' + currentUser); pRef.child('isOnline').onDisconnect().cancel(); if (waveState.isStarted) pRef.update({ isOnline: false }); else pRef.remove(); showPage('student-lobby-page'); } }
function toggleWaveReady() { if (waveState.isStarted) return; const myData = waveParticipants[currentUser]; if (!myData) return; db.ref('wave/participants/' + currentUser).update({ status: myData.status === 'ready' ? 'waiting' : 'ready' }); }
function startWaveGame() { const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false); if (onlineIds.length < 4) return alert('최소 4명 이상이어야 합니다.'); if (!onlineIds.every(id => waveParticipants[id].status === 'ready')) return alert('모두 준비되지 않았습니다!'); db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('wave/clicks').remove(); }
function restartWaveGame() { const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false); db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('wave/clicks').remove(); }
function clickWaveBtn() { if (waveState.isStarted) db.ref('wave/clicks').push(currentUser); }
function renderWaveRoom() {
    const adminBtnGroup = document.getElementById('wave-admin-btn-group'); const studentBtnGroup = document.getElementById('wave-student-btn-group'); const startBtn = document.getElementById('wave-admin-start-btn'); const readyBtn = document.getElementById('wave-ready-btn'); const waveBtn = document.getElementById('wave-action-btn'); const listDiv = document.getElementById('wave-users-list'); listDiv.innerHTML = '';
    let ids = !waveState.isStarted ? Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false) : (waveState.shuffledIds || []); const onlineStudentIds = ids.filter(id => waveParticipants[id] && waveParticipants[id].isOnline !== false); const clickArray = Object.values(waveClicks || {}); const isGameFinished = waveState.isStarted && onlineStudentIds.every(id => clickArray.includes(id));
    document.getElementById('wave-controls').style.display = isAdmin ? 'none' : 'flex';
    if (isAdmin) { studentBtnGroup.style.display = 'none'; adminBtnGroup.style.display = 'flex'; if (waveState.isStarted && isGameFinished) { startBtn.innerText = '다시하기'; startBtn.disabled = false; startBtn.style.opacity = '1'; startBtn.onclick = restartWaveGame; } else { startBtn.innerText = '시작'; startBtn.onclick = startWaveGame; startBtn.disabled = waveState.isStarted; startBtn.style.opacity = startBtn.disabled ? '0.5' : '1'; } }
    else { adminBtnGroup.style.display = 'none'; studentBtnGroup.style.display = 'flex'; if (waveState.isStarted) readyBtn.style.display = 'none'; else { readyBtn.style.display = 'block'; readyBtn.innerText = (waveParticipants[currentUser] || {}).status === 'ready' ? '취소' : '준비'; readyBtn.className = (waveParticipants[currentUser] || {}).status === 'ready' ? "btn-red" : "btn-green"; } const hasClicked = clickArray.includes(currentUser); waveBtn.disabled = !waveState.isStarted || hasClicked; waveBtn.className = (waveState.isStarted && !hasClicked) ? "btn-cyan hf-action-btn" : "btn-disabled hf-action-btn"; }
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>'; return; }
    ids.forEach(id => {
        if(!waveParticipants[id]) return; const data = waveParticipants[id]; const realAcc = localStudentAccounts[id] || {}; const isMe = id === currentUser; const isOffline = data.isOnline === false; const clickIndex = clickArray.indexOf(id); const userHasClicked = clickIndex !== -1; const teamNumber = userHasClicked ? Math.floor(clickIndex / 4) + 1 : null; const isTeamComplete = userHasClicked && clickArray.length >= teamNumber * 4;
        let avatarSrc = (waveState.isStarted && !isTeamComplete && !isOffline) ? 'unknown.gif' : (realAcc.avatarId || 'image_0.gif'); let displayName = (waveState.isStarted && !isTeamComplete && !isOffline) ? '???' : (realAcc.nickname || id);
        let statusTextHtml = isOffline ? '<div class="hf-ready-text" style="color: #999;">나감</div>' : isTeamComplete ? `<div class="hf-ready-text" style="color: ${PAIR_COLORS[teamNumber % PAIR_COLORS.length]};">파도타기 완료!</div>` : userHasClicked ? '<div class="hf-ready-text" style="color: #17a2b8;">팀원 대기중..</div>' : !waveState.isStarted ? (data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>') : '<div class="hf-ready-text" style="color: #d84315;">타이밍!</div>';
        const userDiv = document.createElement('div'); userDiv.className = 'online-user-item'; if (isOffline) userDiv.style.opacity = '0.5'; else if (isTeamComplete) { userDiv.style.borderColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length]; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length] + '15'; }
        userDiv.innerHTML = `<img src="${avatarPath(avatarSrc)}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}

