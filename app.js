const firebaseConfig = {
    apiKey: "AIzaSyAs5o4rlC1-bhA4J0P8LXp54CzDQ_aRNCo",
    authDomain: "shkit-300c7.firebaseapp.com",
    projectId: "shkit-300c7",
    storageBucket: "shkit-300c7.firebasestorage.app",
    messagingSenderId: "233422083288",
    appId: "1:233422083288:web:2943bf7fdcc1c64ab333ad",
    measurementId: "G-3X7SHWR081",
    databaseURL: "https://shkit-300c7-default-rtdb.firebaseio.com" 
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const DEFAULT_AVATARS = ['image_0.gif', 'image_1.gif'];
const ALL_SHOP_AVATARS = ['1.gif', '2.gif', '3.gif', '4.gif', '5.gif', '6.gif', '7.gif', '8.gif', '9.gif', '10.gif'];

let currentUser = null;
let myCurrentAvatar = null;
let tempSelectedAvatar = null; 
let isAdmin = false; 
let selectedStudentsForGems = []; 
let pendingRequests = []; 
let adminShopReturnPage = 'admin-menu-page'; 
let adminManageReturnPage = 'admin-menu-page';
let isChatMuted = false; 

let tempShopItems = [];
let localStudentAccounts = {}; 
let localOnlineUsers = {}; 
let localShopItems = []; 
let localShopNames = {}; 
let localShopPrices = {}; 

// 하이파이브 변수
let hfParticipants = {};
let hfState = { isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] };
let hfRequests = {};
let selectedHfUser = null;
const PAIR_COLORS = ['#ff9800', '#17a2b8', '#28a745', '#e83e8c', '#6f42c1', '#d84315', '#007bff', '#20c997'];

// 파도타기 변수
let waveParticipants = {};
let waveState = { isOpen: false, isStarted: false, shuffledIds: [] };
let waveClicks = {}; 

// 학습 관련 전역 변수
let localLearningData = {};
let currentEditDataSet = null;
let currentLearnMode = null; 
let currentSelectedData = null;

function getNameClass(text) {
    const len = text ? text.length : 0;
    if (len <= 4) return 'name-sm';
    if (len <= 6) return 'name-md';
    if (len <= 8) return 'name-lg';
    return 'name-xl';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

db.ref('studentAccounts').on('value', (snapshot) => {
    localStudentAccounts = snapshot.val() || {};
    if (document.getElementById('student-manage-page').classList.contains('active')) renderStudentList();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

db.ref('onlineUsers').on('value', (snapshot) => {
    localOnlineUsers = snapshot.val() || {};
    if (document.getElementById('student-lobby-page').classList.contains('active')) renderOnlineUsers();
});

db.ref('shopItems').on('value', (snapshot) => {
    localShopItems = snapshot.val() || [];
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

db.ref('shopItemNames').on('value', (snapshot) => {
    localShopNames = snapshot.val() || {};
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
    if (document.getElementById('storage-page').classList.contains('active')) renderAvatarList();
});

db.ref('shopItemPrices').on('value', (snapshot) => {
    localShopPrices = snapshot.val() || {};
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

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

db.ref('chatLog').on('child_added', (snapshot) => {
    const data = snapshot.val();
    const logDiv = document.getElementById('chat-log');
    
    if (data.isAlert) {
        const color = data.alertColor || '#007bff'; 
        logDiv.innerHTML += `<div style="margin-bottom: 8px; color: ${color}; font-weight: bold; text-align: center; background: #f8f9fa; padding: 6px; border-radius: 8px; border: 2px dashed ${color}80; font-size:14px; word-break:keep-all;">📢 ${data.message}</div>`;
    } else {
        const displayName = data.senderName || data.sender;
        const isMe = data.sender === currentUser;
        let nameColor = '#333'; let msgColor = '#333';
        
        if (data.sender === '⭐상티' || displayName === '⭐상티') {
            nameColor = '#007bff'; msgColor = '#007bff';
        } else if (isMe) {
            nameColor = '#007bff';
        }
        
        logDiv.innerHTML += `<div style="margin-bottom: 5px;"><strong style="color:${nameColor}">${displayName}:</strong> <span style="color:${msgColor}">${data.message}</span></div>`;
    }
    logDiv.scrollTop = logDiv.scrollHeight;
});

db.ref('chatLog').on('value', (snapshot) => {
    if (!snapshot.exists()) document.getElementById('chat-log').innerHTML = '';
});

db.ref('chatState/isMuted').on('value', (snapshot) => {
    isChatMuted = snapshot.val() || false;
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const muteBtn = document.getElementById('admin-mute-btn');

    if (isChatMuted) {
        if (!isAdmin) {
            chatInput.disabled = true;
            chatInput.placeholder = "관리자가 채팅을 금지했습니다 🤫";
            chatSendBtn.disabled = true;
            chatSendBtn.className = "btn-disabled chat-action-btn";
        }
        if (isAdmin && muteBtn) {
            muteBtn.innerText = "음소거 해제";
            muteBtn.className = "btn-red chat-action-btn";
        }
    } else {
        if (!isAdmin) {
            chatInput.disabled = false;
            chatInput.placeholder = "채팅 입력!";
            chatSendBtn.disabled = false;
            chatSendBtn.className = "btn-green chat-action-btn";
        }
        if (isAdmin && muteBtn) {
            muteBtn.innerText = "음소거";
            muteBtn.className = "btn-gray chat-action-btn";
        }
    }
});

// 학습 데이터 리스너
db.ref('learningData').on('value', (snapshot) => {
    localLearningData = snapshot.val() || {};
    if (document.getElementById('admin-edit-learn-page').classList.contains('active')) renderLearnDataList();
    if (document.getElementById('admin-edit-words-page').classList.contains('active') && currentEditDataSet) renderWordsList(currentEditDataSet);
    if (document.getElementById('student-select-data-page').classList.contains('active')) renderStudentDataList();
});

function listenForGemRequests() {
    db.ref(`gemRequests/${currentUser}`).on('value', snapshot => {
        const reqs = snapshot.val();
        pendingRequests = [];
        const now = Date.now(); 
        
        if (reqs) {
            for (let key in reqs) {
                const req = reqs[key];
                if (!req.expiresAt || now > req.expiresAt) {
                    db.ref(`gemRequests/${currentUser}/${key}`).remove();
                } else {
                    pendingRequests.push({ key, ...req });
                }
            }
        }
        
        const acceptBtn = document.getElementById('accept-request-btn');
        if (pendingRequests.length > 0) {
            acceptBtn.disabled = false;
            acceptBtn.className = "btn-orange gem-action-btn";
            acceptBtn.innerText = `🤝 수락 (${pendingRequests.length})`; 
        } else {
            acceptBtn.disabled = true;
            acceptBtn.className = "btn-disabled gem-action-btn";
            acceptBtn.innerText = '🤝 수락';
        }

        if (document.getElementById('student-lobby-page').classList.contains('active')) {
            renderOnlineUsers();
        }
    });
}

setInterval(() => {
    if (!currentUser || isAdmin) return;
    const now = Date.now();

    pendingRequests.forEach(req => {
        if (req.expiresAt && now > req.expiresAt) {
            if (req.isDeleting) return;
            req.isDeleting = true; 
            db.ref(`gemRequests/${currentUser}/${req.key}`).remove().then(() => {
                const requesterNick = localStudentAccounts[req.from]?.nickname || req.from;
                db.ref('chatLog').push().set({
                    sender: 'system',
                    message: `${requesterNick}이(가) 보낸 조르기가 취소되었습니다. ⏳`,
                    isAlert: true,
                    alertColor: '#6c757d', 
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        } else if (req.expiresAt) {
            let timeLeft = Math.max(0, Math.ceil((req.expiresAt - now) / 1000));
            const safeId = req.from.replace(/[^a-zA-Z0-9_-]/g, '_');
            const badgeEl = document.getElementById(`badge-${safeId}`);
            if (badgeEl) badgeEl.innerText = `🙏${req.amount}개 (${timeLeft}s)`;
        }
    });
}, 1000);

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'student-lobby-page') {
        const logDiv = document.getElementById('chat-log');
        logDiv.scrollTop = logDiv.scrollHeight;
        renderOnlineUsers();
    }
}

function applySelectedAvatar() {
    if (!tempSelectedAvatar) return;
    myCurrentAvatar = tempSelectedAvatar;
    db.ref('studentAccounts/' + currentUser).update({ avatarId: tempSelectedAvatar });
    db.ref('onlineUsers/' + currentUser).update({ avatarId: tempSelectedAvatar });
    
    showPage('student-lobby-page');
    renderOnlineUsers();
}

function checkStudentLogin() {
    const inputId = document.getElementById('student-id').value.trim();
    const inputPw = document.getElementById('student-pw').value.trim();
    const loginBtn = document.querySelector('#student-page .btn-blue');
    const originalText = loginBtn.innerText;
    
    loginBtn.innerText = "로그인 중... ⏳";
    loginBtn.disabled = true;

    // 약간의 딜레이를 주어 UI 상 로딩 효과 연출
    setTimeout(() => {
        if (Object.keys(localStudentAccounts).length === 0) {
            alert('서버와 연결 중입니다. 잠시 후 다시 눌러주세요 ⏳');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            return;
        }

        const account = localStudentAccounts[inputId];

        if (account && account.pw === inputPw) {
            currentUser = inputId;
            isAdmin = false;
            
            let fixedOwned = account.ownedAvatars || DEFAULT_AVATARS;
            let fixedAvatar = account.avatarId || DEFAULT_AVATARS[0];

            myCurrentAvatar = fixedAvatar;
            
            if (account.gems === undefined) {
                db.ref('studentAccounts/' + currentUser).update({ gems: 10 });
            }
            
            document.getElementById('student-nickname').value = account.nickname || inputId;
            
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            showPage('nickname-page');
        } else {
            alert('아이디 또는 비밀번호가 틀렸습니다.');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    }, 300);
}

function checkAdminLogin() {
    const inputId = document.getElementById('admin-id').value.trim();
    const inputPw = document.getElementById('admin-pw').value.trim();
    if (inputId === '' || inputPw === '') { alert('아이디와 비밀번호를 모두 입력해주세요.'); return; }
    
    const loginBtn = document.querySelector('#admin-login-page .btn-blue');
    const originalText = loginBtn.innerText;
    loginBtn.innerText = "로그인 중... ⏳";
    loginBtn.disabled = true;

    const adminEmail = inputId + "@gmail.com";
    firebase.auth().signInWithEmailAndPassword(adminEmail, inputPw)
        .then((userCredential) => { 
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            showPage('admin-menu-page'); 
        })
        .catch((error) => { 
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            alert('관리자 정보가 일치하지 않습니다.'); 
        });
}

function createStudentAccount() {
    const newId = document.getElementById('new-student-id').value.trim();
    const newPw = document.getElementById('new-student-pw').value.trim();
    if (newId === '' || newPw === '') return alert('아이디와 비밀번호를 모두 입력해주세요.');
    if (localStudentAccounts[newId]) return alert('이미 존재하는 아이디입니다.');
    db.ref('studentAccounts/' + newId).set({ pw: newPw, nickname: newId, avatarId: DEFAULT_AVATARS[0], ownedAvatars: DEFAULT_AVATARS, gems: 10 });
    alert(`학생 계정(${newId})이 생성되었습니다!`);
    showPage('admin-menu-page');
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        let successCount = 0; let duplicateCount = 0; let updates = {};
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row[0] === undefined || row[1] === undefined) continue;
            const id = String(row[0]).trim(); const pw = String(row[1]).trim();
            if (id === '' || pw === '' || id === '아이디' || id.toLowerCase() === 'id') continue;
            if (localStudentAccounts[id]) { duplicateCount++; continue; }
            updates[id] = { pw: pw, nickname: id, avatarId: DEFAULT_AVATARS[0], ownedAvatars: DEFAULT_AVATARS, gems: 10 };
            successCount++;
        }
        if (successCount > 0) db.ref('studentAccounts').update(updates);
        alert(`일괄 등록 완료!\n생성: ${successCount}개\n중복 제외: ${duplicateCount}개`);
        event.target.value = ''; showPage('admin-menu-page');
    };
    reader.readAsArrayBuffer(file);
}

function showManagePage(returnPage = 'admin-menu-page') { 
    adminManageReturnPage = returnPage;
    renderStudentList(); 
    showPage('student-manage-page'); 
}

function closeManagePage() { showPage(adminManageReturnPage); }

function renderStudentList() {
    const listDiv = document.getElementById('student-list');
    listDiv.innerHTML = '';
    const ids = Object.keys(localStudentAccounts);
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color:#888; font-size:16px;">생성된 계정이 없습니다.</p>'; return; }
    
    listDiv.innerHTML = `<div class="list-header"><div class="h-id">ID</div><div class="h-nick">별명</div><div class="h-pw">PW</div><div class="h-btn">관리</div></div>`;
    
    ids.forEach((id) => {
        if (id.toLowerCase() === 'admin' || id === '⭐상티') return;

        const account = localStudentAccounts[id];
        const currentNick = account.nickname || id;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'account-item';
        itemDiv.innerHTML = `
            <input type="text" value="${id}" readonly style="background:#eee;">
            <input type="text" id="edit-nickname-${id}" value="${currentNick}" placeholder="별명" maxlength="10">
            <input type="text" id="edit-pw-${id}" value="${account.pw}" placeholder="PW">
            <button class="btn-green btn-sm edit-btn" onclick="updateAccount('${id}')">수정</button>
            <button class="btn-red btn-sm edit-btn" onclick="deleteAccount('${id}')">삭제</button>
        `;
        listDiv.appendChild(itemDiv);
    });
}

function updateAccount(id) {
    const newPw = document.getElementById(`edit-pw-${id}`).value.trim();
    const newNick = document.getElementById(`edit-nickname-${id}`).value.trim().substring(0, 10);
    if (newPw === '') return alert('비밀번호를 입력해주세요.');
    
    db.ref('studentAccounts/' + id).update({ pw: newPw, nickname: newNick });
    if (localOnlineUsers[id]) db.ref('onlineUsers/' + id).update({ nickname: newNick });
    alert('계정 정보가 성공적으로 수정되었습니다.');
}

function deleteAccount(id) {
    if (localOnlineUsers[id]) return alert('현재 접속 중인 학생은 삭제할 수 없습니다.');
    if (confirm('정말 삭제하시겠습니까?')) db.ref('studentAccounts/' + id).remove();
}

function deleteAllAccounts() {
    if (Object.keys(localStudentAccounts).length === 0) return alert('삭제할 계정이 없습니다.');
    if (Object.keys(localOnlineUsers).length > 0) return alert('접속 중인 학생이 있어 삭제할 수 없습니다.');
    if (confirm('⚠️ 모든 학생 계정을 삭제하시겠습니까?')) db.ref('studentAccounts').remove();
}

function showAdminShopPage(returnPage = 'admin-menu-page') { 
    adminShopReturnPage = returnPage;
    tempShopItems = [...localShopItems]; 
    renderAdminShopPage(); 
    showPage('admin-shop-page'); 
}

function closeAdminShopPage() { showPage(adminShopReturnPage); }

function renderAdminShopPage() {
    const listDiv = document.getElementById('admin-shop-list');
    listDiv.innerHTML = '';
    ALL_SHOP_AVATARS.forEach((avatarId, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'avatar-item';
        if (tempShopItems.includes(avatarId)) itemDiv.classList.add('selected');

        const dbKey = avatarId.replace('.', '_'); 
        
        const currentName = localShopNames[dbKey] || `아바타 ${index + 1}`;
        const currentPrice = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
        
        itemDiv.innerHTML = `
            <img src="${avatarId}" alt="아바타">
            <div id="view-name-mode-${index}" style="margin-top: 8px; display:flex; align-items:center; gap:4px; justify-content:center; width:100%;">
                <span class="name-text-fit ${getNameClass(currentName)}" style="margin-top:0; flex:1;">${currentName}</span>
                <span title="이름 수정" style="cursor: pointer; font-size: 14px; background: #eee; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="enableEditMode(event, ${index}, 'name')">✏️</span>
            </div>
            <div id="edit-name-mode-${index}" style="margin-top: 8px; display:none; align-items:center; gap:4px; justify-content:center; width:100%;">
                <input type="text" id="name-input-${index}" value="${currentName}" maxlength="10" style="flex:1; width: 0; padding: 4px; font-size: 13px; text-align: center; border: 2px solid #ccc; border-radius: 6px; margin:0;" onclick="event.stopPropagation();" onkeypress="handleEnter(event, '${avatarId}', ${index}, 'name')">
                <span title="저장" style="cursor: pointer; font-size: 14px; background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="saveSingleData(event, '${avatarId}', ${index}, 'name')">✔️</span>
            </div>
            <div id="view-price-mode-${index}" style="margin-top: 8px; margin-bottom: 5px; display:flex; align-items:center; gap:4px; justify-content:center; width:100%;">
                <span style="font-size: 16px; color: #d84315; flex:1;">${currentPrice}</span>
                <span title="가격 수정" style="cursor: pointer; font-size: 14px; background: #eee; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="enableEditMode(event, ${index}, 'price')">💎</span>
            </div>
            <div id="edit-price-mode-${index}" style="margin-top: 8px; margin-bottom: 5px; display:none; align-items:center; gap:4px; justify-content:center; width:100%;">
                <input type="number" id="price-input-${index}" value="${currentPrice}" min="0" style="flex:1; width: 0; padding: 4px; font-size: 13px; text-align: center; border: 2px solid #ccc; border-radius: 6px; margin:0;" onclick="event.stopPropagation();" onkeypress="handleEnter(event, '${avatarId}', ${index}, 'price')">
                <span title="저장" style="cursor: pointer; font-size: 14px; background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="saveSingleData(event, '${avatarId}', ${index}, 'price')">✔️</span>
            </div>
        `;
        itemDiv.onclick = (e) => {
            if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'SPAN') {
                if (tempShopItems.includes(avatarId)) {
                    tempShopItems = tempShopItems.filter(id => id !== avatarId);
                    itemDiv.classList.remove('selected'); 
                } else {
                    tempShopItems.push(avatarId);
                    itemDiv.classList.add('selected'); 
                }
            }
        };
        listDiv.appendChild(itemDiv);
    });
}

function enableEditMode(event, index, type) {
    event.stopPropagation();
    document.getElementById(`view-${type}-mode-${index}`).style.display = 'none';
    document.getElementById(`edit-${type}-mode-${index}`).style.display = 'flex';
    document.getElementById(`${type}-input-${index}`).focus(); 
}

function saveSingleData(event, avatarId, index, type) {
    event.stopPropagation();
    const inputField = document.getElementById(`${type}-input-${index}`);
    let newValue = inputField.value.trim();
    const dbKey = avatarId.replace('.', '_');

    if (type === 'name') {
        newValue = newValue.substring(0, 10); 
        const currentNameInDB = localShopNames[dbKey];
        if (newValue === '') {
            if (currentNameInDB !== undefined) db.ref('shopItemNames/' + dbKey).remove().then(() => renderAdminShopPage());
            else renderAdminShopPage(); 
        } else {
            if (newValue !== currentNameInDB) db.ref('shopItemNames/' + dbKey).set(newValue).then(() => renderAdminShopPage());
            else renderAdminShopPage(); 
        }
    } else if (type === 'price') {
        const currentPriceInDB = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
        let parsedPrice = parseInt(newValue, 10);
        if (isNaN(parsedPrice) || parsedPrice < 0) parsedPrice = 1;
        if (parsedPrice !== currentPriceInDB) db.ref('shopItemPrices/' + dbKey).set(parsedPrice).then(() => renderAdminShopPage());
        else renderAdminShopPage();
    }
}

function handleEnter(event, avatarId, index, type) { if(event.key === 'Enter') saveSingleData(event, avatarId, index, type); }

function saveShopItems() { 
    db.ref('shopItems').set(tempShopItems); 
    showPage(adminShopReturnPage); 
}

function enterLobbyWithNickname() {
    const nicknameInput = document.getElementById('student-nickname').value.trim();
    const finalNickname = (nicknameInput === '' ? currentUser : nicknameInput).substring(0, 10);

    db.ref('studentAccounts/' + currentUser).update({ nickname: finalNickname });
    
    document.getElementById('admin-chat-reset-btn').style.display = 'none';
    document.getElementById('admin-mute-btn').style.display = 'none';
    
    document.getElementById('student-learn-btn').style.display = 'block';
    document.getElementById('admin-learn-lobby-btn').style.display = 'none';
    
    document.getElementById('shop-btn').style.display = 'block';
    document.getElementById('storage-btn').style.display = 'block';
    document.getElementById('student-hf-btn').style.display = 'block';
    document.getElementById('student-wave-btn').style.display = 'block';
    document.getElementById('student-logout-btn').style.display = 'block';
    
    document.getElementById('admin-gem-controls').style.display = 'none';
    document.getElementById('student-gem-controls').style.display = 'flex'; 
    
    document.getElementById('admin-shop-lobby-btn').style.display = 'none';
    document.getElementById('admin-manage-lobby-btn').style.display = 'none';
    document.getElementById('admin-hf-btn').style.display = 'none';
    document.getElementById('admin-wave-btn').style.display = 'none';
    document.getElementById('admin-back-lobby-btn').style.display = 'none';
    
    selectedStudentsForGems = [];
    listenForGemRequests(); 

    const myOnlineRef = db.ref('onlineUsers/' + currentUser);
    myOnlineRef.set({ avatarId: myCurrentAvatar, nickname: finalNickname });
    myOnlineRef.onDisconnect().remove(); 
    
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    if (isChatMuted) {
        chatInput.disabled = true;
        chatInput.placeholder = "관리자가 채팅을 금지했습니다 🤫";
        chatSendBtn.disabled = true;
        chatSendBtn.className = "btn-disabled chat-action-btn";
    } else {
        chatInput.disabled = false;
        chatInput.placeholder = "채팅 입력!";
        chatSendBtn.disabled = false;
        chatSendBtn.className = "btn-green chat-action-btn";
    }

    showPage('student-lobby-page');
}

function enterAdminLobby() {
    isAdmin = true;
    currentUser = '⭐상티';
    myCurrentAvatar = ""; 
    
    document.getElementById('admin-chat-reset-btn').style.display = 'block';
    document.getElementById('admin-mute-btn').style.display = 'block';
    
    document.getElementById('student-learn-btn').style.display = 'none';
    document.getElementById('admin-learn-lobby-btn').style.display = 'block';
    
    document.getElementById('shop-btn').style.display = 'none';
    document.getElementById('storage-btn').style.display = 'none';
    document.getElementById('student-hf-btn').style.display = 'none';
    document.getElementById('student-wave-btn').style.display = 'none';
    document.getElementById('student-logout-btn').style.display = 'none';
    
    document.getElementById('admin-gem-controls').style.display = 'flex';
    document.getElementById('student-gem-controls').style.display = 'none';
    
    document.getElementById('admin-shop-lobby-btn').style.display = 'block';
    document.getElementById('admin-manage-lobby-btn').style.display = 'block';
    document.getElementById('admin-hf-btn').style.display = 'block';
    document.getElementById('admin-wave-btn').style.display = 'block';
    document.getElementById('admin-back-lobby-btn').style.display = 'block';
    
    document.getElementById('chat-input').disabled = false;
    document.getElementById('chat-input').placeholder = "채팅 입력!";
    document.getElementById('chat-send-btn').disabled = false;
    document.getElementById('chat-send-btn').className = "btn-green chat-action-btn";

    const muteBtn = document.getElementById('admin-mute-btn');
    if (isChatMuted) {
        muteBtn.innerText = "음소거 해제";
        muteBtn.className = "btn-red chat-action-btn";
    } else {
        muteBtn.innerText = "음소거";
        muteBtn.className = "btn-gray chat-action-btn";
    }

    selectedStudentsForGems = []; 
    showPage('student-lobby-page');
}

function logoutStudent() {
    if (currentUser && !isAdmin) {
        db.ref('onlineUsers/' + currentUser).remove();
        db.ref(`gemRequests/${currentUser}`).off(); 
        
        const pRef = db.ref('highfive/participants/' + currentUser);
        if (hfState.isStarted) {
            pRef.update({ isOnline: false });
        } else {
            pRef.remove();
        }

        const wRef = db.ref('wave/participants/' + currentUser);
        if (waveState.isStarted) {
            wRef.update({ isOnline: false });
        } else {
            wRef.remove();
        }
    }
    currentUser = null;
    isAdmin = false;
    
    document.getElementById('admin-chat-reset-btn').style.display = 'none';
    document.getElementById('admin-mute-btn').style.display = 'none';
    
    document.getElementById('student-learn-btn').style.display = 'none';
    document.getElementById('admin-learn-lobby-btn').style.display = 'none';
    
    document.getElementById('admin-gem-controls').style.display = 'none';
    document.getElementById('student-gem-controls').style.display = 'none';
    document.getElementById('admin-shop-lobby-btn').style.display = 'none';
    document.getElementById('admin-manage-lobby-btn').style.display = 'none';
    document.getElementById('student-hf-btn').style.display = 'none';
    document.getElementById('student-wave-btn').style.display = 'none';
    document.getElementById('admin-hf-btn').style.display = 'none';
    document.getElementById('admin-wave-btn').style.display = 'none';
    document.getElementById('admin-back-lobby-btn').style.display = 'none';
    
    selectedStudentsForGems = [];
    showPage('main-page');
}

function sendChat() {
    if (!isAdmin && isChatMuted) return; 

    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg || !currentUser) return;

    let senderName = isAdmin ? '⭐상티' : (localStudentAccounts[currentUser]?.nickname || currentUser);

    const newChatRef = db.ref('chatLog').push();
    newChatRef.set({ 
        sender: currentUser, 
        senderName: senderName,
        message: msg, 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    });

    if (!isAdmin) {
        const now = Date.now();
        db.ref('onlineUsers/' + currentUser).update({ bubble: msg, bubbleTime: now });
        setTimeout(() => {
            db.ref('onlineUsers/' + currentUser).once('value').then(snap => {
                const data = snap.val();
                if(data && data.bubbleTime === now) {
                    db.ref('onlineUsers/' + currentUser).update({ bubble: null, bubbleTime: null });
                }
            });
        }, 5000);
    }
    input.value = '';
}

function clearAllChat() {
    if (confirm('🚨 모든 학생의 채팅 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        db.ref('chatLog').remove()
            .then(() => alert('채팅 기록이 깔끔하게 지워졌습니다.'))
            .catch((error) => alert('초기화 중 오류가 발생했습니다.'));
    }
}

function toggleMute() {
    const newState = !isChatMuted;
    db.ref('chatState/isMuted').set(newState);

    const sysMsg = newState ? "상티가 채팅창을 비활성화했습니다." : "상티가 채팅창을 활성화했습니다.";
    
    db.ref('chatLog').push().set({ 
        sender: 'system',
        message: sysMsg, 
        isAlert: true,
        alertColor: '#007bff', 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    });
}

function modifyGems(action) {
    if (selectedStudentsForGems.length === 0) {
        alert(`보석을 ${action === 'add' ? '지급' : '차감'}할 학생을 선택해 주세요.`);
        return;
    }
    
    const amountInput = document.getElementById('gem-control-amount');
    const gemsToModify = parseInt(amountInput.value, 10);
    
    if (isNaN(gemsToModify) || gemsToModify <= 0) {
        alert('올바른 보석 개수를 입력해 주세요. (1 이상의 정수)');
        return;
    }
    
    let updates = {};
    let nicknameArray = [];
    
    selectedStudentsForGems.forEach(id => {
        const currentGems = localStudentAccounts[id]?.gems || 0;
        let newGems = currentGems;
        
        if (action === 'add') {
            newGems = currentGems + gemsToModify;
        } else if (action === 'sub') {
            newGems = Math.max(0, currentGems - gemsToModify); 
        }
        updates[`studentAccounts/${id}/gems`] = newGems;
        
        const nick = localStudentAccounts[id]?.nickname || id;
        nicknameArray.push(nick);
    });
    
    db.ref().update(updates).then(() => {
        const nicknamesStr = nicknameArray.join(', ');
        const actionText = action === 'add' ? '지급' : '차감';
        const alertColor = action === 'add' ? '#28a745' : '#dc3545'; 
        const sysMsg = `${nicknamesStr}이(가) 보석을 ${gemsToModify}개 ${actionText}받았습니다.`;
        
        db.ref('chatLog').push().set({
            sender: 'system',
            message: sysMsg,
            isAlert: true,
            alertColor: alertColor,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        selectedStudentsForGems = []; 
        renderOnlineUsers();
    }).catch((error) => {
        alert('보석을 업데이트하는 중 오류가 발생했습니다.');
    });
}

function giftGems() {
    if (selectedStudentsForGems.length === 0) return alert('선물할 친구를 선택해 주세요!');
    
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');
    
    const totalCost = amt * selectedStudentsForGems.length;
    const myGems = localStudentAccounts[currentUser]?.gems || 0;
    
    if (myGems < totalCost) return alert(`보석이 부족합니다! (필요: ${totalCost}개, 현재: ${myGems}개)`);

    let updates = {};
    updates[`studentAccounts/${currentUser}/gems`] = myGems - totalCost;
    
    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        const targetGems = localStudentAccounts[id]?.gems || 0;
        updates[`studentAccounts/${id}/gems`] = targetGems + amt;
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });

    db.ref().update(updates).then(() => {
        const myNick = localStudentAccounts[currentUser]?.nickname || currentUser;
        db.ref('chatLog').push().set({
            sender: 'system',
            message: `${myNick}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 선물했습니다. 🎁`,
            isAlert: true,
            alertColor: '#28a745',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        selectedStudentsForGems = [];
        renderOnlineUsers();
    });
}

function requestGems() {
    if (selectedStudentsForGems.length === 0) return alert('조를 친구를 선택해 주세요!');
    
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');

    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        db.ref(`gemRequests/${id}`).push({
            from: currentUser,
            amount: amt,
            expiresAt: Date.now() + 60000 // 60초 만료 설정
        });
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });

    const myNick = localStudentAccounts[currentUser]?.nickname || currentUser;
    db.ref('chatLog').push().set({
        sender: 'system',
        message: `${myNick}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 조르기했습니다. 🙏`,
        isAlert: true,
        alertColor: '#17a2b8', 
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });

    selectedStudentsForGems = [];
    renderOnlineUsers();
    alert('조르기 요청을 보냈습니다! (1분 후 자동 취소됩니다.)');
}

function acceptGemRequest() {
    if (pendingRequests.length === 0) return;
    if (selectedStudentsForGems.length === 0) {
        alert('조르기를 수락할 친구를 대기실에서 먼저 선택해 주세요!');
        return;
    }

    let myGems = localStudentAccounts[currentUser]?.gems || 0;
    let updates = {};
    let acceptedNicks = [];
    let totalDeduction = 0;

    let matchedRequests = pendingRequests.filter(req => selectedStudentsForGems.includes(req.from));

    if (matchedRequests.length === 0) {
        alert('선택한 친구 중에는 조르기를 요청한 친구가 없습니다.');
        return;
    }

    matchedRequests.forEach(req => { totalDeduction += req.amount; });

    if (myGems < totalDeduction) {
        alert(`보석이 부족하여 선택한 요청을 모두 수락할 수 없습니다.\n(필요: ${totalDeduction}개, 보유: ${myGems}개)`);
        return;
    }

    updates[`studentAccounts/${currentUser}/gems`] = myGems - totalDeduction;

    matchedRequests.forEach(req => {
        const requesterGems = localStudentAccounts[req.from]?.gems || 0;
        updates[`studentAccounts/${req.from}/gems`] = requesterGems + req.amount;
        updates[`gemRequests/${currentUser}/${req.key}`] = null; 
        acceptedNicks.push(localStudentAccounts[req.from]?.nickname || req.from);
    });

    db.ref().update(updates).then(() => {
        const myNick = localStudentAccounts[currentUser]?.nickname || currentUser;
        db.ref('chatLog').push().set({
            sender: 'system',
            message: `${myNick}이(가) ${acceptedNicks.join(', ')}의 조르기를 수락하여 보석을 주었습니다! 🎉`,
            isAlert: true,
            alertColor: '#28a745',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        alert('선택한 친구들의 조르기를 수락했습니다!');
        selectedStudentsForGems = [];
        renderOnlineUsers();
    });
}

function renderOnlineUsers() {
    const listDiv = document.getElementById('online-users-list');
    listDiv.innerHTML = '';
    const ids = Object.keys(localOnlineUsers);
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px;">현재 대기실에 아무도 없습니다.</p>'; return; }
    
    const now = Date.now();
    ids.forEach(id => {
        if (id === '⭐상티') return; 

        const user = localOnlineUsers[id];
        const userDiv = document.createElement('div');
        userDiv.className = 'online-user-item';
        
        if (selectedStudentsForGems.includes(id)) {
            userDiv.classList.add('selected');
        }
        
        if (id !== currentUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => {
                if (selectedStudentsForGems.includes(id)) {
                    selectedStudentsForGems = selectedStudentsForGems.filter(sid => sid !== id);
                } else {
                    selectedStudentsForGems.push(id);
                }
                renderOnlineUsers();
            };
        }

        let requestBadge = '';
        if (!isAdmin && currentUser) {
            const reqFromThisUser = pendingRequests.find(req => req.from === id);
            if (reqFromThisUser) {
                let timeLeft = Math.max(0, Math.ceil((reqFromThisUser.expiresAt - now) / 1000));
                const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
                requestBadge = `<div id="badge-${safeId}" style="position:absolute; top:-10px; right:-10px; background:#dc3545; color:white; font-size:11px; font-weight:bold; padding:2px 4px; border-radius:10px; z-index:11; box-shadow:0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">🙏${reqFromThisUser.amount}개 (${timeLeft}s)</div>`;
            }
        }

        let bubbleHTML = '';
        if (user.bubble && user.bubbleTime && (now - user.bubbleTime < 5000)) {
            let displayMsg = user.bubble.length > 15 ? user.bubble.substring(0, 15) + '...' : user.bubble;
            bubbleHTML = `<div class="speech-bubble">${displayMsg}</div>`;
        }
        
        let displayId = user.nickname || id;
        const isMe = (id === currentUser) ? '<span style="color: #ff9800; margin-left:2px;">(나)</span>' : '';
        
        let avatarSrc = user.avatarId || 'image_0.gif';
        
        userDiv.innerHTML = `${requestBadge}${bubbleHTML}<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayId)}">${displayId}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>`;
        listDiv.appendChild(userDiv);
    });
}

function showStudentShopPage() { renderStudentShop(); showPage('student-shop-page'); }
function renderStudentShop() {
    const listDiv = document.getElementById('student-shop-list');
    listDiv.innerHTML = '';
    const myGems = localStudentAccounts[currentUser]?.gems || 0;
    document.getElementById('my-gems-display').innerText = `내 보석: 💎 ${myGems}`;
    if (localShopItems.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px; grid-column: 1 / -1;">현재 등록된 상품이 없습니다.</p>'; return; }
    const myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS;
    localShopItems.forEach(avatarId => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'avatar-item';
        const dbKey = avatarId.replace('.', '_');
        
        const avatarName = localShopNames[dbKey] || `${avatarId.split('.')[0]}번 아바타`;
        const nameText = `<span class="name-text-fit ${getNameClass(avatarName)}">${avatarName}</span>`;
        const avatarPrice = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
        
        if (myOwnedAvatars.includes(avatarId)) {
            itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타" style="opacity: 0.5;">${nameText}<div class="owned-tag">보유 중</div>`;
        } else {
            itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타">${nameText}<button class="btn-cyan buy-btn" style="padding: 8px 2px; font-size: clamp(12px, 3.5vw, 15px); border-radius: 8px;" onclick="buyAvatar('${avatarId}')">💎 ${avatarPrice} 구입</button>`;
        }
        listDiv.appendChild(itemDiv);
    });
}

function buyAvatar(avatarId) {
    const dbKey = avatarId.replace('.', '_');
    const price = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
    
    let myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS;
    let myGems = localStudentAccounts[currentUser]?.gems || 0;
    if (myOwnedAvatars.includes(avatarId)) return alert('이미 보유한 아바타입니다.');
    if (myGems < price) return alert('보석이 부족합니다!');
    myGems -= price; myOwnedAvatars.push(avatarId); 
    db.ref('studentAccounts/' + currentUser).update({ ownedAvatars: myOwnedAvatars, gems: myGems });
    alert('아바타를 성공적으로 구입했습니다! 보관함에서 확인해보세요. 🎉');
}

function showStoragePage() { tempSelectedAvatar = myCurrentAvatar; renderAvatarList(); showPage('storage-page'); }

function renderAvatarList() {
    const listDiv = document.getElementById('avatar-list');
    listDiv.innerHTML = '';
    const myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS;
    myOwnedAvatars.forEach(avatarId => {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-item';
        if (avatarId === tempSelectedAvatar) avatarDiv.classList.add('selected');
        
        avatarDiv.onclick = () => { 
            tempSelectedAvatar = avatarId; 
            const allItems = listDiv.querySelectorAll('.avatar-item');
            allItems.forEach(item => item.classList.remove('selected'));
            avatarDiv.classList.add('selected');
        };

        const dbKey = avatarId.replace('.', '_');
        let avatarName = (avatarId === 'image_0.gif') ? '기본 남자' : (avatarId === 'image_1.gif') ? '기본 여자' : (localShopNames[dbKey] || `${avatarId.split('.')[0]}번 아바타`);
        
        avatarDiv.innerHTML = `<img src="${avatarId}" alt="아바타"><p class="name-text-fit ${getNameClass(avatarName)}" style="margin-bottom:0;">${avatarName}</p>`;
        listDiv.appendChild(avatarDiv);
    });
}

// 하이파이브 함수
function enterHighFiveRoom() {
    if (isAdmin) {
        db.ref('highfive/state/isOpen').set(true);
    } else {
        const pRef = db.ref('highfive/participants/' + currentUser);
        pRef.once('value', snap => {
            const data = snap.val();
            if (!data) {
                pRef.set({ status: 'waiting', pairId: null, pairColor: null, isOnline: true });
            } else {
                pRef.update({ isOnline: true });
            }
            pRef.child('isOnline').onDisconnect().set(false);
        });
    }
    selectedHfUser = null;
    showPage('highfive-page');
    renderHighFiveRoom();
}

function exitHighFiveRoom() {
    if (isAdmin) {
        db.ref('highfive/state').update({ isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] });
        db.ref('highfive/participants').remove();
        db.ref('highfive/requests').remove();
        showPage('student-lobby-page');
    } else {
        const pRef = db.ref('highfive/participants/' + currentUser);
        pRef.child('isOnline').onDisconnect().cancel();
        
        if (hfState.isStarted) {
            pRef.update({ isOnline: false });
        } else {
            pRef.remove();
            db.ref('highfive/requests/' + currentUser).remove();
        }
        
        showPage('student-lobby-page');
    }
}

function toggleHfReady() {
    if (hfState.isStarted) return;
    const myData = hfParticipants[currentUser];
    if (!myData) return;
    const newStatus = myData.status === 'ready' ? 'waiting' : 'ready';
    db.ref('highfive/participants/' + currentUser).update({ status: newStatus });
}

function startHfGame() {
    const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false);
    
    if (onlineIds.length < 2) {
        return alert('대기실에 최소 2명 이상의 학생이 있어야 시작할 수 있습니다.');
    }
    
    const allReady = onlineIds.every(id => hfParticipants[id].status === 'ready');
    if (!allReady) {
        return alert('아직 모든 학생이 준비를 완료하지 않았습니다!');
    }

    const shuffledIds = shuffleArray([...onlineIds]);
    db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffledIds });
    db.ref('highfive/requests').remove();
}

function restartHfGame() {
    const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false);
    const shuffledIds = shuffleArray([...onlineIds]);
    db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffledIds });
    db.ref('highfive/requests').remove();
    
    const updates = {};
    for (let uid in hfParticipants) {
        updates[`highfive/participants/${uid}/pairId`] = null;
        updates[`highfive/participants/${uid}/pairColor`] = null;
    }
    db.ref().update(updates);
}

function renderHighFiveRoom() {
    const adminBtnGroup = document.getElementById('hf-admin-btn-group');
    const studentBtnGroup = document.getElementById('hf-student-btn-group');
    const startBtn = document.getElementById('hf-admin-start-btn');
    const readyBtn = document.getElementById('hf-ready-btn');
    
    const listDiv = document.getElementById('hf-users-list');
    listDiv.innerHTML = '';
    
    let ids = Object.keys(hfParticipants);
    
    if (!hfState.isStarted) {
        ids = ids.filter(id => hfParticipants[id].isOnline !== false);
    } else if (hfState.shuffledIds && hfState.shuffledIds.length > 0) {
        ids = hfState.shuffledIds.filter(id => hfParticipants[id]);
        Object.keys(hfParticipants).forEach(id => {
            if (!ids.includes(id)) ids.push(id);
        });
    }

    const onlineStudentIds = ids.filter(id => hfParticipants[id].isOnline !== false);
    const unPairedCount = onlineStudentIds.filter(id => hfParticipants[id].pairId == null).length;
    const isMatchComplete = onlineStudentIds.length >= 2 && unPairedCount <= 1;
    const isFailureState = hfState.isStarted && unPairedCount === 1;

    document.getElementById('hf-controls').style.display = isAdmin ? 'none' : 'flex';

    if (isAdmin) {
        studentBtnGroup.style.display = 'none';
        adminBtnGroup.style.display = 'flex';
        
        if (hfState.isStarted && isMatchComplete) {
            startBtn.innerText = '다시하기';
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.onclick = restartHfGame;
        } else {
            startBtn.innerText = '시작';
            startBtn.onclick = startHfGame;
            startBtn.disabled = hfState.isStarted;
            startBtn.style.opacity = startBtn.disabled ? '0.5' : '1';
        }
    } else {
        adminBtnGroup.style.display = 'none';
        studentBtnGroup.style.display = 'flex';
        
        if (hfState.isStarted) {
            readyBtn.style.display = 'none';
        } else {
            readyBtn.style.display = 'block';
            const myData = hfParticipants[currentUser] || {};
            if (myData.status === 'ready') {
                readyBtn.innerText = '취소';
                readyBtn.className = "btn-red";
            } else {
                readyBtn.innerText = '준비';
                readyBtn.className = "btn-green";
            }
        }
    }

    const reqBtn = document.getElementById('hf-request-btn');
    const acceptBtn = document.getElementById('hf-accept-btn');
    const myRequests = hfRequests[currentUser] || {};
    const requestCount = Object.keys(myRequests).length;

    if (!isAdmin) {
        if (hfState.isStarted) {
            reqBtn.disabled = false;
            reqBtn.className = "btn-cyan hf-action-btn";
            reqBtn.style.opacity = ''; 
        } else {
            reqBtn.disabled = true;
            reqBtn.className = "btn-disabled hf-action-btn";
            reqBtn.style.opacity = ''; 
        }

        if (hfState.isStarted && requestCount > 0) {
            acceptBtn.disabled = false;
            acceptBtn.className = "btn-orange hf-action-btn";
            acceptBtn.innerText = `🤝 파이브! (${requestCount})`; 
        } else {
            acceptBtn.disabled = true;
            acceptBtn.className = "btn-disabled hf-action-btn";
            acceptBtn.innerText = '🤝 파이브!';
        }
    }

    if (ids.length === 0) {
        listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>';
        return;
    }

    ids.forEach(id => {
        const data = hfParticipants[id];
        const realAcc = localStudentAccounts[id] || {};
        const isMe = id === currentUser;
        const userIsPaired = data.pairId != null;
        const isOffline = data.isOnline === false;
        const isFailedUser = isFailureState && !userIsPaired && !isOffline;
        
        let avatarSrc = realAcc.avatarId || 'image_0.gif';
        let displayName = realAcc.nickname || id;
        let statusTextHtml = '';
        
        if (hfState.isStarted && !userIsPaired) {
            if (isFailedUser) {
                avatarSrc = realAcc.avatarId || 'image_0.gif';
                displayName = realAcc.nickname || id;
            } else {
                avatarSrc = 'unknown.gif'; 
                displayName = '???';
            }
        } 
        
        if (isOffline) {
            statusTextHtml = '<div class="hf-ready-text" style="color: #999;">나감</div>';
        } else if (userIsPaired) {
            statusTextHtml = `<div class="hf-ready-text" style="color: ${data.pairColor};">하이파이브 완료!</div>`;
        } else if (isFailedUser) {
            statusTextHtml = `<div class="hf-ready-text" style="color: #dc3545;">하이파이브 실패</div>`;
        } else if (!hfState.isStarted) {
            statusTextHtml = data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>';
        } else {
            statusTextHtml = '<div class="hf-ready-text">고르는중</div>';
        }

        let badgeHtml = '';
        if (!isAdmin && hfState.isStarted && !userIsPaired && !isOffline && !isFailedUser) {
            if (hfRequests[currentUser] && hfRequests[currentUser][id]) {
                badgeHtml = '<div class="hf-badge">✋</div>';
            }
        }

        const userDiv = document.createElement('div');
        userDiv.className = 'online-user-item';
        
        if (isOffline) {
            userDiv.style.opacity = '0.5';
        }
        
        if (userIsPaired && data.pairColor) {
            userDiv.style.borderColor = data.pairColor;
            userDiv.style.borderWidth = '4px';
            userDiv.style.backgroundColor = data.pairColor + '15';
        } else if (isFailedUser) {
            userDiv.style.borderColor = '#dc3545';
            userDiv.style.borderWidth = '4px';
            userDiv.style.backgroundColor = '#f8d7da';
        } else if (selectedHfUser === id) {
            userDiv.classList.add('selected');
        }

        if (!isAdmin && hfState.isStarted && !userIsPaired && id !== currentUser && !isOffline && !isFailedUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => { selectedHfUser = id; renderHighFiveRoom(); };
        }

        userDiv.innerHTML = `${badgeHtml}<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`;
        listDiv.appendChild(userDiv);
    });
}

function sendHighFiveRequest() {
    if (!hfState.isStarted) return alert('게임이 아직 시작되지 않았습니다.');
    
    const myData = hfParticipants[currentUser];
    if (myData?.pairId != null) return alert('이미 하이파이브를 완료했습니다!');
    
    const studentIds = Object.keys(hfParticipants);
    const onlineStudentIds = studentIds.filter(id => hfParticipants[id].isOnline !== false);
    const unPairedCount = onlineStudentIds.filter(id => hfParticipants[id].pairId == null).length;
    if (unPairedCount === 1) return alert('모든 매칭이 종료되었습니다.');

    if (!selectedHfUser) return alert('하이파이브 하고 싶은 친구를 선택하세요.');
    if (selectedHfUser === currentUser) return alert('자신에게 요청할 수 없습니다.');
    if (hfParticipants[selectedHfUser]?.pairId != null) return alert('이미 짝이 된 친구입니다.');

    db.ref(`highfive/requests/${selectedHfUser}/${currentUser}`).set(Date.now());
    selectedHfUser = null;
    renderHighFiveRoom();
}

function acceptHighFive() {
    if (!hfState.isStarted) return alert('게임이 아직 시작되지 않았습니다.');
    
    const myData = hfParticipants[currentUser];
    if (myData?.pairId != null) return alert('이미 하이파이브를 완료했습니다!');
    
    const studentIds = Object.keys(hfParticipants);
    const onlineStudentIds = studentIds.filter(id => hfParticipants[id].isOnline !== false);
    const unPairedCount = onlineStudentIds.filter(id => hfParticipants[id].pairId == null).length;
    if (unPairedCount === 1) return alert('모든 매칭이 종료되었습니다.');

    if (!selectedHfUser) return alert('하이파이브 할 친구를 선택하세요.');
    
    const myRequests = hfRequests[currentUser] || {};
    if (!myRequests[selectedHfUser]) return alert('선택한 친구에게서 온 요청이 없습니다.');

    const targetId = selectedHfUser; 
    
    const targetData = hfParticipants[targetId];
    if (targetData?.pairId != null) {
        alert('앗! 상대방이 이미 다른 친구와 하이파이브를 완료했습니다. 😥');
        db.ref(`highfive/requests/${currentUser}/${targetId}`).remove(); 
        selectedHfUser = null;
        renderHighFiveRoom();
        return;
    }
    
    const nextPairId = hfState.pairCount + 1;
    const pairColor = PAIR_COLORS[nextPairId % PAIR_COLORS.length];
    
    const updates = {};
    updates[`highfive/state/pairCount`] = nextPairId;
    updates[`highfive/participants/${currentUser}/pairId`] = nextPairId;
    updates[`highfive/participants/${currentUser}/pairColor`] = pairColor;
    updates[`highfive/participants/${targetId}/pairId`] = nextPairId;
    updates[`highfive/participants/${targetId}/pairColor`] = pairColor;
    
    updates[`highfive/requests/${currentUser}`] = null;
    updates[`highfive/requests/${targetId}`] = null;

    db.ref().update(updates).then(() => {
        selectedHfUser = null;
        for (let uid in hfRequests) {
            if (hfRequests[uid][currentUser]) db.ref(`highfive/requests/${uid}/${currentUser}`).remove();
            if (hfRequests[uid][targetId]) db.ref(`highfive/requests/${uid}/${targetId}`).remove();
        }
    });
}

// ==========================
// 파도타기 전용 함수들
// ==========================
function enterWaveRoom() {
    if (isAdmin) {
        db.ref('wave/state/isOpen').set(true);
    } else {
        const pRef = db.ref('wave/participants/' + currentUser);
        pRef.once('value', snap => {
            const data = snap.val();
            if (!data) pRef.set({ status: 'waiting', isOnline: true });
            else pRef.update({ isOnline: true });
            pRef.child('isOnline').onDisconnect().set(false);
        });
    }
    showPage('wave-page');
    renderWaveRoom();
}

function exitWaveRoom() {
    if (isAdmin) {
        db.ref('wave/state').update({ isOpen: false, isStarted: false, shuffledIds: [] });
        db.ref('wave/participants').remove();
        db.ref('wave/clicks').remove();
        showPage('student-lobby-page');
    } else {
        const pRef = db.ref('wave/participants/' + currentUser);
        pRef.child('isOnline').onDisconnect().cancel();
        if (waveState.isStarted) pRef.update({ isOnline: false });
        else pRef.remove();
        showPage('student-lobby-page');
    }
}

function toggleWaveReady() {
    if (waveState.isStarted) return;
    const myData = waveParticipants[currentUser];
    if (!myData) return;
    const newStatus = myData.status === 'ready' ? 'waiting' : 'ready';
    db.ref('wave/participants/' + currentUser).update({ status: newStatus });
}

function startWaveGame() {
    const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false);
    if (onlineIds.length < 4) return alert('최소 4명 이상의 학생이 있어야 시작할 수 있습니다.');
    
    const allReady = onlineIds.every(id => waveParticipants[id].status === 'ready');
    if (!allReady) return alert('아직 모든 학생이 준비를 완료하지 않았습니다!');

    const shuffledIds = shuffleArray([...onlineIds]);
    db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffledIds });
    db.ref('wave/clicks').remove();
}

function restartWaveGame() {
    const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false);
    const shuffledIds = shuffleArray([...onlineIds]);
    db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffledIds });
    db.ref('wave/clicks').remove();
}

function clickWaveBtn() {
    if (!waveState.isStarted) return;
    db.ref('wave/clicks').push(currentUser);
}

function renderWaveRoom() {
    const adminBtnGroup = document.getElementById('wave-admin-btn-group');
    const studentBtnGroup = document.getElementById('wave-student-btn-group');
    const startBtn = document.getElementById('wave-admin-start-btn');
    const readyBtn = document.getElementById('wave-ready-btn');
    const waveBtn = document.getElementById('wave-action-btn');
    const listDiv = document.getElementById('wave-users-list');
    
    listDiv.innerHTML = '';
    let ids = Object.keys(waveParticipants);
    
    if (!waveState.isStarted) {
        ids = ids.filter(id => waveParticipants[id].isOnline !== false);
    } else if (waveState.shuffledIds && waveState.shuffledIds.length > 0) {
        ids = waveState.shuffledIds.filter(id => waveParticipants[id]);
        Object.keys(waveParticipants).forEach(id => {
            if (!ids.includes(id)) ids.push(id);
        });
    }

    const onlineStudentIds = ids.filter(id => waveParticipants[id].isOnline !== false);
    
    const clickArray = Object.values(waveClicks || {});
    const isGameFinished = waveState.isStarted && onlineStudentIds.every(id => clickArray.includes(id));

    document.getElementById('wave-controls').style.display = isAdmin ? 'none' : 'flex';

    if (isAdmin) {
        studentBtnGroup.style.display = 'none';
        adminBtnGroup.style.display = 'flex';
        
        if (waveState.isStarted && isGameFinished) {
            startBtn.innerText = '다시하기';
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.onclick = restartWaveGame;
        } else {
            startBtn.innerText = '시작';
            startBtn.onclick = startWaveGame;
            startBtn.disabled = waveState.isStarted;
            startBtn.style.opacity = startBtn.disabled ? '0.5' : '1';
        }
    } else {
        adminBtnGroup.style.display = 'none';
        studentBtnGroup.style.display = 'flex';
        
        if (waveState.isStarted) readyBtn.style.display = 'none';
        else {
            readyBtn.style.display = 'block';
            const myData = waveParticipants[currentUser] || {};
            if (myData.status === 'ready') {
                readyBtn.innerText = '취소';
                readyBtn.className = "btn-red";
            } else {
                readyBtn.innerText = '준비';
                readyBtn.className = "btn-green";
            }
        }

        const hasClicked = clickArray.includes(currentUser);
        if (waveState.isStarted && !hasClicked) {
            waveBtn.disabled = false;
            waveBtn.className = "btn-cyan hf-action-btn";
        } else {
            waveBtn.disabled = true;
            waveBtn.className = "btn-disabled hf-action-btn";
        }
    }

    if (ids.length === 0) {
        listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>';
        return;
    }

    ids.forEach(id => {
        const data = waveParticipants[id];
        const realAcc = localStudentAccounts[id] || {};
        const isMe = id === currentUser;
        const isOffline = data.isOnline === false;
        
        const clickIndex = clickArray.indexOf(id);
        const userHasClicked = clickIndex !== -1;
        const teamNumber = userHasClicked ? Math.floor(clickIndex / 4) + 1 : null;
        const isTeamComplete = userHasClicked && clickArray.length >= teamNumber * 4;
        
        let avatarSrc = realAcc.avatarId || 'image_0.gif';
        let displayName = realAcc.nickname || id;
        let statusTextHtml = '';

        if (waveState.isStarted && !isTeamComplete && !isOffline) {
            avatarSrc = 'unknown.gif';
            displayName = '???';
        }

        if (isOffline) {
            statusTextHtml = '<div class="hf-ready-text" style="color: #999;">나감</div>';
        } else if (isTeamComplete) {
            const teamColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length];
            statusTextHtml = `<div class="hf-ready-text" style="color: ${teamColor};">파도타기 완료!</div>`;
        } else if (userHasClicked) {
            statusTextHtml = '<div class="hf-ready-text" style="color: #17a2b8;">팀원 대기중..</div>';
        } else if (!waveState.isStarted) {
            statusTextHtml = data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>';
        } else {
            statusTextHtml = '<div class="hf-ready-text" style="color: #d84315;">타이밍!</div>';
        }

        const userDiv = document.createElement('div');
        userDiv.className = 'online-user-item';
        
        if (isOffline) {
            userDiv.style.opacity = '0.5';
        } else if (isTeamComplete) {
            const teamColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length];
            userDiv.style.borderColor = teamColor;
            userDiv.style.borderWidth = '4px';
            userDiv.style.backgroundColor = teamColor + '15';
        }

        userDiv.innerHTML = `<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`;
        listDiv.appendChild(userDiv);
    });
}

// ==========================
// 학습 관리 및 게임 기능 함수 모음
// ==========================

// 1. 엑셀을 통한 학습데이터 업로드 (A열: 영어, B열: 뜻)
function handleLearnExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const fileName = file.name.replace(/\.[^/.]+$/, ""); 
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        
        let words = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row[0] === undefined || row[1] === undefined) continue;
            const eng = String(row[0]).trim();
            const kor = String(row[1]).trim();
            if (eng === '' || kor === '' || eng.toLowerCase() === 'english' || kor === '한글') continue;
            words.push({ eng: eng, kor: kor });
        }
        
        if (words.length > 0) {
            const safeName = fileName.replace(/[.#$[\]]/g, '_'); 
            db.ref('learningData/' + safeName).set({ name: fileName, words: words });
            alert(`[${fileName}] 데이터가 성공적으로 생성되었습니다! (총 ${words.length}단어)`);
        } else {
            alert('유효한 단어가 없습니다. A열에 영어단어, B열에 한글뜻이 있는지 확인해주세요.');
        }
        event.target.value = ''; 
        showPage('admin-learn-menu-page');
    };
    reader.readAsArrayBuffer(file);
}

// 2. 학습 데이터 수정 리스트 렌더링
function showManageLearnPage() {
    renderLearnDataList();
    showPage('admin-edit-learn-page');
}

function renderLearnDataList() {
    const listDiv = document.getElementById('learn-data-list');
    listDiv.innerHTML = '';
    const keys = Object.keys(localLearningData);
    
    if (keys.length === 0) { 
        listDiv.innerHTML = '<p style="color:#888;">생성된 학습데이터가 없습니다.</p>'; 
        return; 
    }
    
    keys.forEach(key => {
        const dataSet = localLearningData[key];
        const itemDiv = document.createElement('div');
        itemDiv.className = 'account-item';
        itemDiv.innerHTML = `
            <input type="text" id="edit-dataset-name-${key}" value="${dataSet.name}" placeholder="데이터 이름" style="flex:2;">
            <button class="btn-green btn-sm edit-btn" onclick="updateDatasetName('${key}')">이름저장</button>
            <button class="btn-blue btn-sm edit-btn" onclick="openWordsEdit('${key}')">내용수정</button>
            <button class="btn-red btn-sm edit-btn" onclick="deleteDataset('${key}')">삭제</button>
        `;
        listDiv.appendChild(itemDiv);
    });
}

// 3. 학습 데이터셋 이름 수정 및 삭제
function updateDatasetName(key) {
    const newName = document.getElementById(`edit-dataset-name-${key}`).value.trim();
    if(newName === '') return alert('데이터 이름을 입력해주세요.');
    db.ref(`learningData/${key}/name`).set(newName);
    alert('이름이 성공적으로 변경되었습니다.');
}

function deleteDataset(key) {
    if(confirm('이 학습데이터를 완전히 삭제하시겠습니까?')) {
        db.ref(`learningData/${key}`).remove();
    }
}

// 4. 세부 단어 리스트 오픈 및 렌더링
function openWordsEdit(key) {
    currentEditDataSet = key;
    document.getElementById('edit-words-title').innerText = `${localLearningData[key].name} 내용 수정`;
    renderWordsList(key);
    showPage('admin-edit-words-page');
}

function renderWordsList(key) {
    const listDiv = document.getElementById('words-list');
    listDiv.innerHTML = '';
    const words = localLearningData[key]?.words || [];
    
    words.forEach((word, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'account-item';
        itemDiv.innerHTML = `
            <input type="text" id="edit-eng-${key}-${index}" value="${word.eng}" placeholder="영어단어">
            <input type="text" id="edit-kor-${key}-${index}" value="${word.kor}" placeholder="한글뜻">
            <button class="btn-green btn-sm edit-btn" onclick="updateWord('${key}', ${index})">저장</button>
            <button class="btn-red btn-sm edit-btn" onclick="deleteWord('${key}', ${index})">삭제</button>
        `;
        listDiv.appendChild(itemDiv);
    });
}

// 5. 개별 단어 수정 및 삭제
function updateWord(key, index) {
    const eng = document.getElementById(`edit-eng-${key}-${index}`).value.trim();
    const kor = document.getElementById(`edit-kor-${key}-${index}`).value.trim();
    if(eng === '' || kor === '') return alert('영어단어와 뜻을 모두 입력해주세요.');
    db.ref(`learningData/${key}/words/${index}`).update({ eng: eng, kor: kor });
    alert('단어가 수정되었습니다.');
}

function deleteWord(key, index) {
    if(confirm('이 단어를 삭제하시겠습니까?')) {
        let words = localLearningData[key].words;
        words.splice(index, 1);
        db.ref(`learningData/${key}/words`).set(words);
    }
}

// 6. 학생 학습 모드 - 데이터 선택
function showSelectDataPage(mode) {
    currentLearnMode = mode;
    renderStudentDataList();
    showPage('student-select-data-page');
}

function renderStudentDataList() {
    const listDiv = document.getElementById('student-data-list');
    listDiv.innerHTML = '';
    const keys = Object.keys(localLearningData);
    
    if (keys.length === 0) { 
        listDiv.innerHTML = '<p style="color:#888;">등록된 학습데이터가 아직 없습니다.</p>'; 
        return; 
    }
    
    // 버튼 색상을 순환하기 위한 배열
    const colors = ['btn-blue', 'btn-green', 'btn-orange', 'btn-purple', 'btn-pink', 'btn-cyan'];
    
    keys.forEach((key, index) => {
        const dataSet = localLearningData[key];
        const btn = document.createElement('button');
        
        // 인덱스를 활용해 색상을 순서대로 적용
        const colorClass = colors[index % colors.length];
        btn.className = colorClass;
        btn.style.marginBottom = '12px';
        
        // 버튼 텍스트 변경
        btn.innerText = `${dataSet.name} (총 ${dataSet.words ? dataSet.words.length : 0}단어)`;
        btn.onclick = () => selectDatasetForGame(key);
        listDiv.appendChild(btn);
    });
}

// 7. 게임 선택 (상티런 등)
function selectDatasetForGame(key) {
    currentSelectedData = key;
    if (currentLearnMode === 'solo') {
        showPage('student-solo-game-page');
    } else {
        alert('함께하기(멀티플레이) 게임 목록은 곧 업데이트됩니다! 🚀');
    }
}
