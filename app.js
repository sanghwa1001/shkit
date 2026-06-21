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

// ==========================================
// 🏃‍♂️ 상티런 인게임용 전역 독립 변수 모음
// ==========================================
let runWords = []; 
let currentRunWord = null;
let runScore = 0;
let runCorrectCount = 0;
let runWrongCount = 0;
let runGameStarted = false;
let RUN_WORLD_HEIGHT = 0;
let runCameraY = 0;
let runPlayerY = 0;
let runVelocity = 0;
let runIsPressing = false; 
let runMonsters = [];
let runSpawnInterval;
let runBgX = 0; 
// 1번 반영: 오리지널 캐릭터 이미지 및 에셋 문자열 전면 영문화 교체 완료
const originalCharacterSrc = "swimcharacter1.gif"; 
let runAvatarChangeTimeout; 
let runActiveCoins = [];
let runTimeLeft = 60; 
const RUN_MAX_TIME = 60; 
let runTimerInterval;
const RUN_BASE_WIDTH = 900;
const RUN_BASE_HEIGHT = 506.25;

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
    
    if (inputId === '' || inputPw === '') {
        alert('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }

    const loginBtn = document.querySelector('#student-page .btn-blue');
    const originalText = loginBtn.innerText;
    
    loginBtn.innerText = "로그인 중... ⏳";
    loginBtn.disabled = true;

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
    if (selectedStudentsForGems.length === 0) { alert(`보석을 ${action === 'add' ? '지급' : '차감'}할 학생을 선택해 주세요.`); return; }
    const amountInput = document.getElementById('gem-control-amount'); const gemsToModify = parseInt(amountInput.value, 10);
    if (isNaN(gemsToModify) || gemsToModify <= 0) { alert('올바른 보석 개수를 입력해 주세요. (1 이상의 정수)'); return; }
    
    let updates = {}; let nicknameArray = [];
    selectedStudentsForGems.forEach(id => {
        const currentGems = localStudentAccounts[id]?.gems || 0;
        let newGems = action === 'add' ? currentGems + gemsToModify : Math.max(0, currentGems - gemsToModify);
        updates[`studentAccounts/${id}/gems`] = newGems;
        nicknameArray.push(localStudentAccounts[id]?.nickname || id);
    });
    
    db.ref().update(updates).then(() => {
        const sysMsg = `${nicknameArray.join(', ')}이(가) 보석을 ${gemsToModify}개 ${action === 'add' ? '지급' : '차감'}받았습니다.`;
        db.ref('chatLog').push().set({ sender: 'system', message: sysMsg, isAlert: true, alertColor: action === 'add' ? '#28a745' : '#dc3545', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function giftGems() {
    if (selectedStudentsForGems.length === 0) return alert('선물할 친구를 선택해 주세요!');
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');
    const totalCost = amt * selectedStudentsForGems.length;
    const myGems = localStudentAccounts[currentUser]?.gems || 0;
    if (myGems < totalCost) return alert(`보석이 부족합니다! (필요: ${totalCost}개, 현재: ${myGems}개)`);

    let updates = {}; updates[`studentAccounts/${currentUser}/gems`] = myGems - totalCost;
    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        updates[`studentAccounts/${id}/gems`] = (localStudentAccounts[id]?.gems || 0) + amt;
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });

    db.ref().update(updates).then(() => {
        db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 선물했습니다. 🎁`, isAlert: true, alertColor: '#28a745', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function requestGems() {
    if (selectedStudentsForGems.length === 0) return alert('조를 친구를 선택해 주세요!');
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');

    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        db.ref(`gemRequests/${id}`).push({ from: currentUser, amount: amt, expiresAt: Date.now() + 60000 });
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });
    db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 조르기했습니다. 🙏`, isAlert: true, alertColor: '#17a2b8', timestamp: firebase.database.ServerValue.TIMESTAMP });
    selectedStudentsForGems = []; renderOnlineUsers(); alert('조르기 요청을 보냈습니다! (1분 후 자동 취소됩니다.)');
}

function acceptGemRequest() {
    if (pendingRequests.length === 0) return;
    if (selectedStudentsForGems.length === 0) return alert('조르기를 수락할 친구를 대기실에서 먼저 선택해 주세요!');
    let myGems = localStudentAccounts[currentUser]?.gems || 0;
    let updates = {}; let acceptedNicks = []; let totalDeduction = 0;
    let matchedRequests = pendingRequests.filter(req => selectedStudentsForGems.includes(req.from));
    if (matchedRequests.length === 0) return alert('선택한 친구 중에는 조르기를 요청한 친구가 없습니다.');
    matchedRequests.forEach(req => { totalDeduction += req.amount; });
    if (myGems < totalDeduction) return alert(`보석이 부족하여 선택한 요청을 모두 수락할 수 없습니다.`);

    updates[`studentAccounts/${currentUser}/gems`] = myGems - totalDeduction;
    matchedRequests.forEach(req => {
        updates[`studentAccounts/${req.from}/gems`] = (localStudentAccounts[req.from]?.gems || 0) + req.amount;
        updates[`gemRequests/${currentUser}/${req.key}`] = null; 
        acceptedNicks.push(localStudentAccounts[req.from]?.nickname || req.from);
    });
    db.ref().update(updates).then(() => {
        db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${acceptedNicks.join(', ')}의 조르기를 수락하여 보석을 주었습니다! 🎉`, isAlert: true, alertColor: '#28a745', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function renderOnlineUsers() {
    const listDiv = document.getElementById('online-users-list'); listDiv.innerHTML = '';
    const ids = Object.keys(localOnlineUsers); if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px;">현재 대기실에 아무도 없습니다.</p>'; return; }
    const now = Date.now();
    ids.forEach(id => {
        if (id === '⭐상티') return; 
        const user = localOnlineUsers[id]; const userDiv = document.createElement('div'); userDiv.className = 'online-user-item';
        if (selectedStudentsForGems.includes(id)) userDiv.classList.add('selected');
        if (id !== currentUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => {
                selectedStudentsForGems = selectedStudentsForGems.includes(id) ? selectedStudentsForGems.filter(sid => sid !== id) : [...selectedStudentsForGems, id];
                renderOnlineUsers();
            };
        }
        let requestBadge = '';
        if (!isAdmin && currentUser) {
            const reqFromThisUser = pendingRequests.find(req => req.from === id);
            if (reqFromThisUser) {
                let timeLeft = Math.max(0, Math.ceil((reqFromThisUser.expiresAt - now) / 1000));
                requestBadge = `<div id="badge-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}" style="position:absolute; top:-10px; right:-10px; background:#dc3545; color:white; font-size:11px; font-weight:bold; padding:2px 4px; border-radius:10px; z-index:11; box-shadow:0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">🙏${reqFromThisUser.amount}개 (${timeLeft}s)</div>`;
            }
        }
        let bubbleHTML = (user.bubble && user.bubbleTime && (now - user.bubbleTime < 5000)) ? `<div class="speech-bubble">${user.bubble.length > 15 ? user.bubble.substring(0, 15) + '...' : user.bubble}</div>` : '';
        let displayId = user.nickname || id; const isMe = (id === currentUser) ? '<span style="color: #ff9800; margin-left:2px;">(나)</span>' : '';
        userDiv.innerHTML = `${requestBadge}${bubbleHTML}<img src="${user.avatarId || 'image_0.gif'}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayId)}">${displayId}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>`;
        listDiv.appendChild(userDiv);
    });
}

function showStudentShopPage() { renderStudentShop(); showPage('student-shop-page'); }
function renderStudentShop() {
    const listDiv = document.getElementById('student-shop-list'); listDiv.innerHTML = '';
    document.getElementById('my-gems-display').innerText = `내 보석: 💎 ${localStudentAccounts[currentUser]?.gems || 0}`;
    if (localShopItems.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px; grid-column: 1 / -1;">현재 등록된 상품이 없습니다.</p>'; return; }
    const myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS;
    localShopItems.forEach(avatarId => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'avatar-item'; const dbKey = avatarId.replace('.', '_');
        const avatarName = localShopNames[dbKey] || `${avatarId.split('.')[0]}번 아바타`; const nameText = `<span class="name-text-fit ${getNameClass(avatarName)}">${avatarName}</span>`;
        if (myOwnedAvatars.includes(avatarId)) itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타" style="opacity: 0.5;">${nameText}<div class="owned-tag">보유 중</div>`;
        else itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타">${nameText}<button class="btn-cyan buy-btn" style="padding: 8px 2px; font-size: clamp(12px, 3.5vw, 15px); border-radius: 8px;" onclick="buyAvatar('${avatarId}')">💎 ${localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1} 구입</button>`;
        listDiv.appendChild(itemDiv);
    });
}

function buyAvatar(avatarId) {
    const dbKey = avatarId.replace('.', '_'); const price = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
    let myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS; let myGems = localStudentAccounts[currentUser]?.gems || 0;
    if (myGems < price) return alert('보석이 부족합니다!');
    db.ref('studentAccounts/' + currentUser).update({ ownedAvatars: [...myOwnedAvatars, avatarId], gems: myGems - price });
    alert('아바타를 성공적으로 구입했습니다! 🎉');
}

function showStoragePage() { tempSelectedAvatar = myCurrentAvatar; renderAvatarList(); showPage('storage-page'); }
function renderAvatarList() {
    const listDiv = document.getElementById('avatar-list'); listDiv.innerHTML = '';
    (localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS).forEach(avatarId => {
        const avatarDiv = document.createElement('div'); avatarDiv.className = 'avatar-item';
        if (avatarId === tempSelectedAvatar) avatarDiv.classList.add('selected');
        avatarDiv.onclick = () => { tempSelectedAvatar = avatarId; listDiv.querySelectorAll('.avatar-item').forEach(item => item.classList.remove('selected')); avatarDiv.classList.add('selected'); };
        let avatarName = (avatarId === 'image_0.gif') ? '기본 남자' : (avatarId === 'image_1.gif') ? '기본 여자' : (localShopNames[avatarId.replace('.', '_')] || `${avatarId.split('.')[0]}번 아바타`);
        avatarDiv.innerHTML = `<img src="${avatarId}" alt="아바타"><p class="name-text-fit ${getNameClass(avatarName)}" style="margin-bottom:0;">${avatarName}</p>`;
        listDiv.appendChild(avatarDiv);
    });
}

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
        userDiv.innerHTML = `${badgeHtml}<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}
function sendHighFiveRequest() { if (!hfState.isStarted) return; if (!selectedHfUser || selectedHfUser === currentUser || hfParticipants[selectedHfUser]?.pairId != null) return; db.ref(`highfive/requests/${selectedHfUser}/${currentUser}`).set(Date.now()); selectedHfUser = null; renderHighFiveRoom(); }
function acceptHighFive() { if (!hfState.isStarted || !selectedHfUser) return; const targetId = selectedHfUser; if ((hfRequests[currentUser] || {})[targetId] && hfParticipants[targetId]?.pairId == null) { const nextPairId = hfState.pairCount + 1; const pairColor = PAIR_COLORS[nextPairId % PAIR_COLORS.length]; let updates = {}; updates[`highfive/state/pairCount`] = nextPairId; updates[`highfive/participants/${currentUser}/pairId`] = nextPairId; updates[`highfive/participants/${currentUser}/pairColor`] = pairColor; updates[`highfive/participants/${targetId}/pairId`] = nextPairId; updates[`highfive/participants/${targetId}/pairColor`] = pairColor; updates[`highfive/requests/${currentUser}`] = null; updates[`highfive/requests/${targetId}`] = null; db.ref().update(updates).then(() => { selectedHfUser = null; }); } }
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
        userDiv.innerHTML = `<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}

function handleLearnExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return; const fileName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader(); reader.onload = function(e) {
        const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        let words = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]; if (!row || row[0] === undefined || row[1] === undefined) continue;
            const eng = String(row[0]).trim(); const kor = String(row[1]).trim();
            if (eng === '' || kor === '' || eng.toLowerCase() === 'english' || kor === '한글') continue;
            words.push({ eng: eng, kor: kor });
        }
        if (words.length > 0) { db.ref('learningData/' + fileName.replace(/[.#$[\]]/g, '_')).set({ name: fileName, words: words }); alert(`[${fileName}] 생성 완료!`); }
        else { alert('유효한 단어가 없습니다.'); }
        event.target.value = ''; showPage('admin-learn-menu-page');
    }; reader.readAsArrayBuffer(file);
}
function showManageLearnPage() { renderLearnDataList(); showPage('admin-edit-learn-page'); }
function renderLearnDataList() {
    const listDiv = document.getElementById('learn-data-list'); listDiv.innerHTML = ''; const keys = Object.keys(localLearningData);
    if (keys.length === 0) { listDiv.innerHTML = '<p style="color:#888;">생성된 학습 데이터가 없습니다.</p>'; return; }
    keys.forEach(key => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'account-item';
        itemDiv.innerHTML = `<input type="text" id="edit-dataset-name-${key}" value="${localLearningData[key].name}" style="flex:2;"><button class="btn-green btn-sm edit-btn" onclick="updateDatasetName('${key}')">이름저장</button><button class="btn-blue btn-sm edit-btn" onclick="openWordsEdit('${key}')">내용수정</button><button class="btn-red btn-sm edit-btn" onclick="deleteDataset('${key}')">삭제</button>`; listDiv.appendChild(itemDiv);
    });
}
function updateDatasetName(key) { const newName = document.getElementById(`edit-dataset-name-${key}`).value.trim(); if(newName === '') return; db.ref(`learningData/${key}/name`).set(newName); alert('변경 완료!'); }
function deleteDataset(key) { if(confirm('완전히 삭제하시겠습니까?')) db.ref(`learningData/${key}`).remove(); }
function openWordsEdit(key) { currentEditDataSet = key; document.getElementById('edit-words-title').innerText = `${localLearningData[key].name} 내용 수정`; renderWordsList(key); showPage('admin-edit-words-page'); }
function renderWordsList(key) {
    const listDiv = document.getElementById('words-list'); listDiv.innerHTML = ''; const words = localLearningData[key]?.words || [];
    words.forEach((word, index) => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'account-item';
        itemDiv.innerHTML = `<input type="text" id="edit-eng-${key}-${index}" value="${word.eng}"><input type="text" id="edit-kor-${key}-${index}" value="${word.kor}"><button class="btn-green btn-sm edit-btn" onclick="updateWord('${key}', ${index})">저장</button><button class="btn-red btn-sm edit-btn" onclick="deleteWord('${key}', ${index})">삭제</button>`; listDiv.appendChild(itemDiv);
    });
}
function updateWord(key, index) { const eng = document.getElementById(`edit-eng-${key}-${index}`).value.trim(); const kor = document.getElementById(`edit-kor-${key}-${index}`).value.trim(); db.ref(`learningData/${key}/words/${index}`).update({ eng: eng, kor: kor }); alert('수정 완료!'); }
function deleteWord(key, index) { if(confirm('삭제하시겠습니까?')) { let words = localLearningData[key].words; words.splice(index, 1); db.ref(`learningData/${key}/words`).set(words); } }
function showSelectDataPage(mode) { currentLearnMode = mode; renderStudentDataList(); showPage('student-select-data-page'); }
function renderStudentDataList() {
    const listDiv = document.getElementById('student-data-list'); listDiv.innerHTML = ''; const keys = Object.keys(localLearningData);
    if (keys.length === 0) { listDiv.innerHTML = '<p style="color:#888;">등록된 데이터가 없습니다.</p>'; return; }
    const colors = ['btn-blue', 'btn-green', 'btn-orange', 'btn-purple', 'btn-pink', 'btn-cyan'];
    keys.forEach((key, index) => {
        const btn = document.createElement('button'); btn.className = colors[index % colors.length]; btn.style.marginBottom = '12px';
        btn.innerText = `${localLearningData[key].name} (총 ${localLearningData[key].words ? localLearningData[key].words.length : 0}단어)`;
        btn.onclick = () => selectDatasetForGame(key); listDiv.appendChild(btn);
    });
}
function selectDatasetForGame(key) { currentSelectedData = key; if (currentLearnMode === 'solo') { showPage('student-solo-game-page'); } else { alert('함께하기 목록은 곧 업데이트됩니다!'); } }

// ==========================================
// 🏃‍♂️ 상티런 인게임용 전용 융합 함수 로직
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
    
    resetSangtiRunEngineUI();
    showPage('sangtirun-page');
    updateSangtiRunScale();

    // 🛠️ 2번 반영: display가 active된 직후 브라우저가 크기를 읽을 수 있도록 비동기(50ms)로 정중앙 Y좌표 계산 후 배치
    setTimeout(() => {
        RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
        document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
        
        const charEl = document.getElementById("character");
        if(charEl) {
            runPlayerY = (RUN_WORLD_HEIGHT / 2) - (charEl.offsetHeight / 2);
            charEl.style.top = runPlayerY + "px";
            
            // 월드 카메라도 플레이어 중앙에 정확히 추적 매칭
            runCameraY = (runPlayerY + (charEl.offsetHeight / 2)) - (RUN_BASE_HEIGHT / 2);
            let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
            runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
            document.getElementById("world").style.transform = `translateY(${-runCameraY}px)`;
        }
    }, 50);
}

function exitSangtiRunGamePage() {
    if (runGameStarted) endSangtiRunGame();
    showPage('student-solo-game-page');
}

function updateSangtiRunScale() {
    const wrapper = document.getElementById("game-wrapper");
    const gameCanvas = document.getElementById("game");
    if (!wrapper || !gameCanvas) return;
    const currentScale = wrapper.clientWidth / RUN_BASE_WIDTH;
    gameCanvas.style.setProperty('--game-scale', currentScale);
}

function resetSangtiRunEngineUI() {
    document.getElementById("score").textContent = "0";
    // 🛠️ 3번 반영: display 제거하고 show 클래스를 제어하여 부드럽게 감춤
    document.getElementById("gameOver").classList.remove("show");
    document.getElementById("characterBubble").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    document.getElementById("character").classList.remove("red-tint");
    document.getElementById("character").src = originalCharacterSrc;
    document.getElementById("bg-layer").classList.remove("bg-shake");
    
    const startBtn = document.getElementById("runStartBtn");
    startBtn.className = "btn-blue";
    startBtn.disabled = false;
    startBtn.innerText = "🎮 게임 시작!";

    runMonsters.forEach(m => { m.el.remove(); m.bubble.remove(); });
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
    bubble.textContent = currentRunWord.eng;
    if(!isFirstTime) {
        bubble.classList.remove("bubble-pop");
        void bubble.offsetWidth; 
        bubble.classList.add("bubble-pop");
    }
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
        const monster = document.createElement("img");
        let monsterNum = Math.floor(Math.random() * 9) * 2 + 1;
        
        // 🛠️ 1번 반영: 상티런 몬스터 파일명 규칙 영문화 적용 (swimrunmonster1.gif 등)
        monster.src = "swimrunmonster" + monsterNum + ".gif";
        monster.className = "monster"; monster.style.opacity = "0";

        const bubble = document.createElement("div");
        bubble.className = "bubble"; bubble.style.opacity = "0";
        let isCorrect = (i === correctIndex);
        let word = isCorrect ? currentRunWord : (runWords.filter(w=>w.kor!==currentRunWord.kor)[Math.floor(Math.random()*(runWords.length-1))] || currentRunWord);

        bubble.textContent = word.kor;
        let y, startX; let isValidPosition = false; let attempts = 0;

        while (!isValidPosition && attempts < 20) {
            startX = RUN_BASE_WIDTH + (Math.random() * RUN_BASE_WIDTH * 0.3);
            y = (RUN_BASE_HEIGHT * 0.1) + Math.random() * (RUN_WORLD_HEIGHT - (RUN_BASE_HEIGHT * 0.3));
            isValidPosition = true;
            let charDist = Math.sqrt(Math.pow(startX - (RUN_BASE_WIDTH * 0.08), 2) + Math.pow(y - runPlayerY, 2));
            if(charDist < RUN_BASE_WIDTH * 0.25) { isValidPosition = false; attempts++; continue; }
            for (let j = 0; j < runMonsters.length; j++) {
                if (runMonsters[j].dead) continue;
                if (Math.sqrt(Math.pow(startX - runMonsters[j].x, 2) + Math.pow(y - runMonsters[j].y, 2)) < RUN_BASE_WIDTH * 0.15) { isValidPosition = false; break; }
            }
            attempts++;
        }

        monster.style.left = startX+"px"; monster.style.top = y+"px";
        const wDiv = document.getElementById("world");
        wDiv.appendChild(monster); wDiv.appendChild(bubble);
        setTimeout(() => { monster.style.opacity = "1"; bubble.style.opacity = "1"; }, 50);

        runMonsters.push({ el:monster, bubble:bubble, x:startX, y:y, dead:false, speed: 2.0 + (Math.random() * 1.5), spawnedTime: Date.now(), monsterNum: monsterNum });
    }
}

function runCollision(a,b){ return (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }

function startSangtiRunGame() {
    if(runWords.length === 0) return;
    runScore = 0; runCorrectCount = 0; runWrongCount = 0;
    document.getElementById("score").textContent = "0";
    // 🛠️ 3번 반영: 인게임 리셋 시 show 클래스 오프
    document.getElementById("gameOver").classList.remove("show");
    document.getElementById("characterBubble").style.display = "block";
    document.getElementById("timer-container").style.display = "block";
    
    const startBtn = document.getElementById("runStartBtn");
    startBtn.className = "btn-disabled"; startBtn.disabled = true; startBtn.innerText = "🚀 진행 중...";

    runMonsters.forEach(m=>{ m.el.remove(); m.bubble.remove(); }); runMonsters = [];
    runActiveCoins.forEach(c => c.remove()); runActiveCoins = [];

    RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
    document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
    
    // 게임을 실제 시작할 때도 정중앙 고정 해상도 물리 매칭
    runPlayerY = (RUN_WORLD_HEIGHT / 2) - (document.getElementById("character").offsetHeight / 2);
    runVelocity = 0; runIsPressing = false; runBgX = 0;

    setRunCharacterWord(true);
    runGameStarted = true; runTimeLeft = RUN_MAX_TIME; updateRunTimerUI();

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

    document.getElementById("characterBubble").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    
    const charEl = document.getElementById("character");
    charEl.src = originalCharacterSrc; charEl.classList.remove("red-tint");
    document.getElementById("bg-layer").classList.remove("bg-shake");

    const startBtn = document.getElementById("runStartBtn");
    startBtn.className = "btn-blue"; startBtn.disabled = false; startBtn.innerText = "🎮 다시 시작하기";
    
    // 🛠️ 3번 반영: 모달 트리거 시 show 클래스를 올려 레이아웃 깜빡임 완벽 차단
    document.getElementById("gameOver").classList.add("show");
    document.getElementById("result").innerHTML = `🏆 점수 : ${runScore} 점<br><br>⭕ 정답 : ${runCorrectCount} 개<br><br>❌ 오답 : ${runWrongCount} 개`;
}

function runLoopEngine(){
    if(runGameStarted){
        const charEl = document.getElementById("character");
        const bubbleEl = document.getElementById("characterBubble");
        const worldEl = document.getElementById("world");
        const bgEl = document.getElementById("bg-layer");
        const timerContainer = document.getElementById("timer-container");

        runVelocity += runIsPressing ? -0.3 : 0.15;
        if (runVelocity < -4) runVelocity = -4; if (runVelocity > 3) runVelocity = 3;
        runPlayerY += runVelocity;

        if(runPlayerY < -charEl.offsetHeight || runPlayerY > RUN_WORLD_HEIGHT) endSangtiRunGame();

        runCameraY = (runPlayerY + (charEl.offsetHeight / 2)) - (RUN_BASE_HEIGHT / 2);
        let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
        runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
        worldEl.style.transform = `translateY(${-runCameraY}px)`;

        runBgX -= 2;
        bgEl.style.backgroundPosition = `${runBgX}px ${maxCamY > 0 ? (runCameraY / maxCamY) * 100 : 0}%`;
        charEl.style.top = runPlayerY+"px";
        bubbleEl.style.left = (charEl.offsetLeft + (charEl.offsetWidth / 2) - (bubbleEl.offsetWidth / 2)) + "px";
        bubbleEl.style.top = (runPlayerY + charEl.offsetHeight + 2) + "px";

        runActiveCoins.forEach(coin => { coin.style.top = (runPlayerY + parseFloat(coin.dataset.offsetY)) + "px"; });

        runMonsters.forEach(monster=>{
            monster.x -= monster.speed; monster.el.style.left = monster.x+"px";
            monster.bubble.style.left = (monster.x + (monster.el.offsetWidth / 2) - (monster.bubble.offsetWidth / 2)) + "px";
            monster.bubble.style.top = (monster.y + monster.el.offsetHeight + 2) + "px";

            if(monster.dead || Date.now() - monster.spawnedTime < 500) return;

            let hit = runCollision(
                { left: charEl.offsetLeft + charEl.offsetWidth*0.15, right: charEl.offsetLeft + charEl.offsetWidth*0.85, top: runPlayerY + charEl.offsetHeight*0.15, bottom: runPlayerY + charEl.offsetHeight*0.85 },
                { left: monster.x + monster.el.offsetWidth*0.15, right: monster.x + monster.el.offsetWidth*0.85, top: monster.y + monster.el.offsetHeight*0.15, bottom: monster.y + monster.el.offsetHeight*0.85 }
            );

            if(hit){
                monster.dead = true; if (runAvatarChangeTimeout) clearTimeout(runAvatarChangeTimeout);
                timerContainer.classList.remove("timer-add", "timer-sub"); void timerContainer.offsetWidth;

                if(monster.bubble.textContent === currentRunWord.kor){
                    runScore += 10; runCorrectCount++; runTimeLeft = Math.min(RUN_MAX_TIME, runTimeLeft + 3); updateRunTimerUI();
                    timerContainer.classList.add("timer-add"); 
                    
                    // 🛠️ 1번 반영: 상티런 캐릭터 반응 영문화 매칭 (swimcharacter2.gif)
                    charEl.src = "swimcharacter2.gif";
                    monster.el.src = "swimrunmonster" + (monster.monsterNum + 1) + ".gif"; monster.el.classList.add("shake");

                    // 🛠️ 1번 반영: 상티런 코인 에셋 명칭 교체 (swimcoin.gif)
                    const coin = document.createElement("img"); coin.src = "swimcoin.gif"; coin.className = "coin-effect";
                    coin.style.left = (charEl.offsetLeft + (charEl.offsetWidth / 2)) + "px"; coin.dataset.offsetY = "15"; coin.style.top = (runPlayerY + 15) + "px";
                    worldEl.appendChild(coin); runActiveCoins.push(coin);
                    setTimeout(() => { coin.remove(); runActiveCoins = runActiveCoins.filter(c => c !== coin); }, 500);
                    setRunCharacterWord();
                } else {
                    runScore -= 10; runWrongCount++; runTimeLeft = Math.max(0, runTimeLeft - 3); updateRunTimerUI();
                    timerContainer.classList.add("timer-sub"); 
                    
                    // 🛠️ 1번 반영: 오답 표정 캐릭터 영문화 매칭 (swimcharacter3.gif)
                    charEl.src = "swimcharacter3.gif"; charEl.classList.add("red-tint");
                    monster.el.src = "swimrunmonster" + (monster.monsterNum + 1) + ".gif";
                    charEl.classList.remove("shake"); void charEl.offsetWidth; charEl.classList.add("shake");
                    bgEl.classList.remove("bg-shake"); void bgEl.offsetWidth; bgEl.classList.add("bg-shake");
                    setTimeout(() => charEl.classList.remove("red-tint"), 300);
                }
                runAvatarChangeTimeout = setTimeout(() => { charEl.src = originalCharacterSrc; }, 800);
                document.getElementById("score").textContent = runScore;
                setTimeout(()=>{ monster.el.remove(); monster.bubble.remove(); }, 500);
            }
            if(monster.x < -200){ monster.el.remove(); monster.bubble.remove(); }
        });
    }
    requestAnimationFrame(runLoopEngine);
}

// ==========================================
// 윈도우 및 글로벌 바인딩 이벤트 처리
// ==========================================
document.addEventListener("keydown", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) { e.preventDefault(); runIsPressing = true; } });
document.addEventListener("keyup", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) runIsPressing = false; });
document.addEventListener("mouseup", () => { runIsPressing = false; });
document.addEventListener("touchend", () => { runIsPressing = false; });
window.addEventListener("resize", () => { if (document.getElementById('sangtirun-page').classList.contains('active')) updateSangtiRunScale(); });

// 최초 가동 시작
requestAnimationFrame(runLoopEngine);
