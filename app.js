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
let isGemFrozen = false; 

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
const originalCharacterSrc = "images/swim/swimcharacter1.gif"; 
let runAvatarChangeTimeout; 
let runActiveCoins = [];
let runTimeLeft = 60; 
const RUN_MAX_TIME = 60; 
let runTimerInterval;
let runResizeObserver = null; // 🛠️ wrapper 크기 변화를 감시해 스케일을 자동 재계산하는 옵저버

const RUN_BASE_WIDTH = 900;
const RUN_BASE_HEIGHT = 506.25;
const RUN_CHAR_X = RUN_BASE_WIDTH * 0.08; 

let runLastTime = 0;

let runCharW = 0;
let runCharH = 0;
let runCharBubbleW = 0;

function avatarPath(filename) { return 'images/avatar/' + filename; }

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
            muteBtn.className = "btn-gray chat-action-btn";
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
            muteBtn.className = "btn-red chat-action-btn";
        }
    }
});

// 보석 거래 잠금(얼음/땡) 리스너
db.ref('gemState/isFrozen').on('value', (snapshot) => {
    isGemFrozen = snapshot.val() || false;
    const freezeBtn = document.getElementById('admin-gem-freeze-btn');
    const giftBtn = document.getElementById('student-gift-btn');
    const requestBtn = document.getElementById('student-request-btn');
    const acceptBtn = document.getElementById('accept-request-btn');

    if (isGemFrozen) {
        if (!isAdmin && giftBtn && requestBtn && acceptBtn) {
            giftBtn.disabled = true;    giftBtn.className = "btn-disabled gem-action-btn";
            requestBtn.disabled = true; requestBtn.className = "btn-disabled gem-action-btn";
            acceptBtn.disabled = true;  acceptBtn.className = "btn-disabled gem-action-btn";
        }
        if (isAdmin && freezeBtn) {
            freezeBtn.innerText = "💥 땡!";
            freezeBtn.className = "btn-gray gem-action-btn";
        }
    } else {
        if (!isAdmin && giftBtn && requestBtn) {
            giftBtn.disabled = false;    giftBtn.className = "btn-green gem-action-btn";
            requestBtn.disabled = false; requestBtn.className = "btn-cyan gem-action-btn";
            // accept-request-btn은 여기서 건드리지 않음 — 대기 중인 조르기 요청 유무에 따라
            // listenForGemRequests()가 이미 정확하게 활성/비활성을 관리하고 있음
        }
        if (isAdmin && freezeBtn) {
            freezeBtn.innerText = "🧊 얼음!";
            freezeBtn.className = "btn-blue gem-action-btn";
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
            <img src="${avatarPath(avatarId)}" alt="아바타">
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
        muteBtn.className = "btn-gray chat-action-btn";
    } else {
        muteBtn.innerText = "음소거";
        muteBtn.className = "btn-red chat-action-btn";
    }

    const freezeBtn = document.getElementById('admin-gem-freeze-btn');
    if (isGemFrozen) {
        freezeBtn.innerText = "💥 땡!";
        freezeBtn.className = "btn-gray gem-action-btn";
    } else {
        freezeBtn.innerText = "🧊 얼음!";
        freezeBtn.className = "btn-blue gem-action-btn";
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

function toggleGemFreeze() {
    const newState = !isGemFrozen;
    db.ref('gemState/isFrozen').set(newState);

    if (newState) {
        db.ref('gemRequests').remove(); // 대기 중이던 조르기 요청 전체 취소
    }

    const sysMsg = newState
        ? '상티가 보석 거래를 잠갔습니다. 진행 중이던 조르기 요청은 모두 취소됩니다.'
        : '상티가 보석 거래를 다시 열었습니다.';

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
    if (!isAdmin && isGemFrozen) return;
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
    if (!isAdmin && isGemFrozen) return;
    if (selectedStudentsForGems.length === 0) return alert('조를 친구를 선택해 주세요!');
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');

    const now = Date.now();
    const targets = [...selectedStudentsForGems];

    // 대상별로 "내가 보낸(from === currentUser)" 요청이 아직 살아있는지(만료 전인지) 먼저 확인
    // → 같은 사람에게 중복으로 조르기가 쌓여, 화면엔 1개만 보이는데 수락 시 전부 합산 차감되는 문제를 방지
    Promise.all(targets.map(id =>
        db.ref(`gemRequests/${id}`).once('value').then(snap => ({ id, val: snap.val() }))
    )).then(results => {
        const duplicateIds = [];
        const newIds = [];
        results.forEach(({ id, val }) => {
            const hasActiveRequest = val && Object.values(val).some(req => req.from === currentUser && req.expiresAt && req.expiresAt > now);
            (hasActiveRequest ? duplicateIds : newIds).push(id);
        });

        newIds.forEach(id => {
            db.ref(`gemRequests/${id}`).push({ from: currentUser, amount: amt, expiresAt: Date.now() + 60000 });
        });

        if (newIds.length > 0) {
            const newNicks = newIds.map(id => localStudentAccounts[id]?.nickname || id);
            db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${newNicks.join(', ')}에게 보석 ${amt}개를 조르기했습니다. 🙏`, isAlert: true, alertColor: '#17a2b8', timestamp: firebase.database.ServerValue.TIMESTAMP });
        }

        let resultMessage;
        if (duplicateIds.length === 0) {
            resultMessage = '조르기 요청을 보냈습니다! (1분 후 자동 취소됩니다.)';
        } else if (newIds.length === 0) {
            resultMessage = '선택한 친구 모두에게 이미 조르기 요청을 보낸 상태입니다. 자동 취소(최대 1분)까지 기다려 주세요.';
        } else {
            const dupNicks = duplicateIds.map(id => localStudentAccounts[id]?.nickname || id);
            const newNicks = newIds.map(id => localStudentAccounts[id]?.nickname || id);
            resultMessage = `${dupNicks.join(', ')}에게는 이미 조르기 요청을 보낸 상태라 다시 보내지 않았습니다.\n${newNicks.join(', ')}에게는 조르기 요청을 보냈습니다! (1분 후 자동 취소됩니다.)`;
        }

        selectedStudentsForGems = [];
        renderOnlineUsers();
        alert(resultMessage);
    });
}

function acceptGemRequest() {
    if (!isAdmin && isGemFrozen) return;
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
        userDiv.innerHTML = `${requestBadge}${bubbleHTML}<img src="${avatarPath(user.avatarId || 'image_0.gif')}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayId)}">${displayId}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>`;
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
        if (myOwnedAvatars.includes(avatarId)) itemDiv.innerHTML = `<img src="${avatarPath(avatarId)}" alt="아바타" style="opacity: 0.5;">${nameText}<div class="owned-tag">보유 중</div>`;
        else itemDiv.innerHTML = `<img src="${avatarPath(avatarId)}" alt="아바타">${nameText}<button class="btn-cyan buy-btn" style="padding: 8px 2px; font-size: clamp(12px, 3.5vw, 15px); border-radius: 8px;" onclick="buyAvatar('${avatarId}')">💎 ${localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1} 구입</button>`;
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
        avatarDiv.innerHTML = `<img src="${avatarPath(avatarId)}" alt="아바타"><p class="name-text-fit ${getNameClass(avatarName)}" style="margin-bottom:0;">${avatarName}</p>`;
        listDiv.appendChild(avatarDiv);
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

