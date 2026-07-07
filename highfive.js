// ===== 하이파이브 게임 모듈 =====
// 하이파이브 리스너
db.ref('highfive/state').on('value', snap => {
    const newState = snap.val() || { isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] };
    if (!isAdmin && newState.isOpen === false && document.getElementById('highfive-page').classList.contains('active')) {
        alert('관리자가 하이파이브 게임을 종료하여 메인 로비로 이동합니다.');
        db.ref('highfive/participants/' + currentUser).child('isOnline').onDisconnect().cancel(); 
        showPage('student-lobby-page');
    }
    hfState = newState;
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

db.ref('highfive/participants').on('value', snap => {
    hfParticipants = snap.val() || {};
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

db.ref('highfive/requests').on('value', snap => {
    hfRequests = snap.val() || {};
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

// 하이파이브 및 파도타기 생략(원형 유지)
function enterHighFiveRoom() { if (isAdmin) { db.ref('highfive/state/isOpen').set(true); } else { const pRef = db.ref('highfive/participants/' + currentUser); pRef.once('value', snap => { if (!snap.val()) pRef.set({ status: 'waiting', pairId: null, pairColor: null, isOnline: true }); else pRef.update({ isOnline: true }); pRef.child('isOnline').onDisconnect().set(false); }); } selectedHfUser = null; showPage('highfive-page'); renderHighFiveRoom(); }
function exitHighFiveRoom() { if (isAdmin) { db.ref('highfive/state').update({ isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] }); db.ref('highfive/participants').remove(); db.ref('highfive/requests').remove(); showPage('student-lobby-page'); } else { const pRef = db.ref('highfive/participants/' + currentUser); pRef.child('isOnline').onDisconnect().cancel(); if (hfState.isStarted) pRef.update({ isOnline: false }); else pRef.remove(); showPage('student-lobby-page'); } }
function toggleHfReady() { if (hfState.isStarted) return; const myData = hfParticipants[currentUser]; if (!myData) return; db.ref('highfive/participants/' + currentUser).update({ status: myData.status === 'ready' ? 'waiting' : 'ready' }); }
function startHfGame() { const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false); if (onlineIds.length < 2) return alert('최소 2명 이상이어야 합니다.'); if (!onlineIds.every(id => hfParticipants[id].status === 'ready')) return alert('모두 준비되지 않았습니다!'); db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('highfive/requests').remove(); }
function restartHfGame() { const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false); db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('highfive/requests').remove(); let updates = {}; for (let uid in hfParticipants) { updates[`highfive/participants/${uid}/pairId`] = null; updates[`highfive/participants/${uid}/pairColor`] = null; } db.ref().update(updates); }
function renderHighFiveRoom() {
    const adminBtnGroup = document.getElementById('hf-admin-btn-group'); const studentBtnGroup = document.getElementById('hf-student-btn-group'); const startBtn = document.getElementById('hf-admin-start-btn'); const readyBtn = document.getElementById('hf-ready-btn'); const listDiv = document.getElementById('hf-users-list'); listDiv.innerHTML = '';
    let ids = !hfState.isStarted ? Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false) : (hfState.shuffledIds || []);
    const onlineStudentIds = ids.filter(id => hfParticipants[id] && hfParticipants[id].isOnline !== false); const unPairedCount = onlineStudentIds.filter(id => hfParticipants[id].pairId == null).length; const isMatchComplete = onlineStudentIds.length >= 2 && unPairedCount <= 1;
    document.getElementById('hf-controls').style.display = isAdmin ? 'none' : 'flex';
    if (isAdmin) { studentBtnGroup.style.display = 'none'; adminBtnGroup.style.display = 'flex'; if (hfState.isStarted && isMatchComplete) { startBtn.innerText = '다시하기'; startBtn.disabled = false; startBtn.style.opacity = '1'; startBtn.onclick = restartHfGame; } else { startBtn.innerText = '시작'; startBtn.onclick = startHfGame; startBtn.disabled = hfState.isStarted; startBtn.style.opacity = startBtn.disabled ? '0.5' : '1'; } }
    else { adminBtnGroup.style.display = 'none'; studentBtnGroup.style.display = 'flex'; if (hfState.isStarted) readyBtn.style.display = 'none'; else { readyBtn.style.display = 'block'; readyBtn.innerText = (hfParticipants[currentUser] || {}).status === 'ready' ? '취소' : '준비'; readyBtn.className = (hfParticipants[currentUser] || {}).status === 'ready' ? "btn-red" : "btn-green"; } }
    const reqBtn = document.getElementById('hf-request-btn'); const acceptBtn = document.getElementById('hf-accept-btn'); const myRequests = hfRequests[currentUser] || {};
    if (!isAdmin) { reqBtn.disabled = !hfState.isStarted; reqBtn.className = hfState.isStarted ? "btn-cyan hf-action-btn" : "btn-disabled hf-action-btn"; acceptBtn.disabled = !(hfState.isStarted && Object.keys(myRequests).length > 0); acceptBtn.className = (hfState.isStarted && Object.keys(myRequests).length > 0) ? "btn-orange hf-action-btn" : "btn-disabled hf-action-btn"; acceptBtn.innerText = Object.keys(myRequests).length > 0 ? `🤝 파이브! (${Object.keys(myRequests).length})` : '🤝 파이브!'; }
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>'; return; }
    ids.forEach(id => {
        if(!hfParticipants[id]) return; const data = hfParticipants[id]; const realAcc = localStudentAccounts[id] || {}; const isMe = id === currentUser; const userIsPaired = data.pairId != null; const isOffline = data.isOnline === false; const isFailedUser = hfState.isStarted && unPairedCount === 1 && !userIsPaired && !isOffline;
        let avatarSrc = (hfState.isStarted && !userIsPaired && !isFailedUser) ? 'unknown.gif' : (realAcc.avatarId || 'image_0.gif'); let displayName = (hfState.isStarted && !userIsPaired && !isFailedUser) ? '???' : (realAcc.nickname || id);
        let statusTextHtml = isOffline ? '<div class="hf-ready-text" style="color: #999;">나감</div>' : userIsPaired ? `<div class="hf-ready-text" style="color: ${data.pairColor};">하이파이브 완료!</div>` : isFailedUser ? `<div class="hf-ready-text" style="color: #dc3545;">하이파이브 실패</div>` : !hfState.isStarted ? (data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>') : '<div class="hf-ready-text">고르는중</div>';
        let badgeHtml = (!isAdmin && hfState.isStarted && !userIsPaired && !isOffline && !isFailedUser && hfRequests[currentUser] && hfRequests[currentUser][id]) ? '<div class="hf-badge">✋</div>' : '';
        const userDiv = document.createElement('div'); userDiv.className = 'online-user-item'; if (isOffline) userDiv.style.opacity = '0.5'; if (userIsPaired && data.pairColor) { userDiv.style.borderColor = data.pairColor; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = data.pairColor + '15'; } else if (isFailedUser) { userDiv.style.borderColor = '#dc3545'; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = '#f8d7da'; } else if (selectedHfUser === id) userDiv.classList.add('selected');
        if (!isAdmin && hfState.isStarted && !userIsPaired && id !== currentUser && !isOffline && !isFailedUser) { userDiv.style.cursor = 'pointer'; userDiv.onclick = () => { selectedHfUser = id; renderHighFiveRoom(); }; }
        userDiv.innerHTML = `${badgeHtml}<img src="${avatarPath(avatarSrc)}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}
function sendHighFiveRequest() { if (!hfState.isStarted) return; if (!selectedHfUser || selectedHfUser === currentUser || hfParticipants[selectedHfUser]?.pairId != null || hfParticipants[currentUser]?.pairId != null) return; db.ref(`highfive/requests/${selectedHfUser}/${currentUser}`).set(Date.now()); selectedHfUser = null; renderHighFiveRoom(); }
function acceptHighFive() {
    if (!hfState.isStarted || !selectedHfUser) return;
    const targetId = selectedHfUser;

    // 로컬 캐시(hfRequests/hfParticipants)는 리스너 전파 지연이 있을 수 있으므로,
    // 실제로 페어링을 확정하기 직전엔 서버의 최신 상태를 직접 조회해서 사용
    Promise.all([
        db.ref('highfive/requests').once('value'),
        db.ref('highfive/participants').once('value')
    ]).then(([reqSnap, partSnap]) => {
        const freshRequests = reqSnap.val() || {};
        const freshParticipants = partSnap.val() || {};

        const hasRequest = !!(freshRequests[currentUser] && freshRequests[currentUser][targetId]);
        const targetAlreadyPaired = freshParticipants[targetId]?.pairId != null;
        const selfAlreadyPaired = freshParticipants[currentUser]?.pairId != null;

        if (!hasRequest || targetAlreadyPaired || selfAlreadyPaired) {
            // 그 사이 상대가 이미 다른 사람과 매칭되었거나 요청이 사라진 경우 — 선택 해제 후 최신 상태로 재렌더링
            selectedHfUser = null;
            renderHighFiveRoom();
            if (targetAlreadyPaired) alert('선택한 친구는 이미 다른 친구와 하이파이브가 성사되었습니다. 다른 친구를 선택해 주세요.');
            return;
        }

        // pairCount는 트랜잭션으로 원자적으로 증가시켜, 여러 쌍이 동시에 수락해도 번호가 겹치지 않도록 함
        db.ref('highfive/state/pairCount').transaction(current => (current || 0) + 1).then(result => {
            if (!result.committed) {
                selectedHfUser = null;
                renderHighFiveRoom();
                alert('선택한 친구는 이미 다른 친구와 하이파이브가 성사되었습니다. 다른 친구를 선택해 주세요.');
                return;
            }

            const nextPairId = result.snapshot.val();
            const pairColor = PAIR_COLORS[nextPairId % PAIR_COLORS.length];
            let updates = {};
            updates[`highfive/participants/${currentUser}/pairId`] = nextPairId;
            updates[`highfive/participants/${currentUser}/pairColor`] = pairColor;
            updates[`highfive/participants/${targetId}/pairId`] = nextPairId;
            updates[`highfive/participants/${targetId}/pairColor`] = pairColor;

            // 페어링이 확정된 두 사람이 "발신자(from)"로 걸려있는 모든 요청을 전부 정리
            // (다른 사람에게 보내둔 요청까지 함께 지워서 유령 요청이 남지 않도록 함)
            for (const receiverId in freshRequests) {
                if (freshRequests[receiverId] && freshRequests[receiverId][currentUser] !== undefined) {
                    updates[`highfive/requests/${receiverId}/${currentUser}`] = null;
                }
                if (freshRequests[receiverId] && freshRequests[receiverId][targetId] !== undefined) {
                    updates[`highfive/requests/${receiverId}/${targetId}`] = null;
                }
            }

            db.ref().update(updates).then(() => { selectedHfUser = null; });
        });
    });
}
