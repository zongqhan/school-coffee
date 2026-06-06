// 1. 全域 Firebase 雲端連線設定 (與前台一模一樣)
const firebaseConfig = {
    apiKey: "AIzaSyAC9mjaOrDCLdzsdcyZyaESO4fWQ57X1TU",
    authDomain: "schoocl-coffee.firebaseapp.com",
    databaseURL: "https://schoocl-coffee-default-rtdb.firebaseio.com",
    projectId: "schoocl-coffee",
    storageBucket: "schoocl-coffee.firebasestorage.app",
    messagingSenderId: "1036272963335",
    appId: "1:1036272963335:web:6284f91f1d5317ad5dffa2",
    measurementId: "G-57E9DVZ4S8"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

let currentMenu = [];

// 2. ⚡ 監聽雲端菜單：確保表格永遠顯示最新庫存
database.ref('coffeeMenu').on('value', (snapshot) => {
    currentMenu = snapshot.val() || [];
    renderInventory(); 
});

// 3. ⚡ 監聽雲端密碼：將最新密碼顯示在畫面上
database.ref('merchantPin').on('value', (snapshot) => {
    const pin = snapshot.val() || "8888";
    const pinDisplay = document.getElementById('current-pin');
    if (pinDisplay) {
        pinDisplay.innerText = pin;
    }
});

// 4. 渲染庫存表格
function renderInventory() {
    const menu = currentMenu; 
    const tbody = document.getElementById('inventory-list');
    tbody.innerHTML = '';
    menu.forEach(item => {
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.category}</td><td>${item.stock}</td></tr>`;
    });
}

// 5. 新增 / 更新商品 (推播至雲端)
function addNewItem() {
    const name = document.getElementById('itemName').value;
    const price = parseInt(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);
    const category = document.getElementById('itemCategory').value;

    if (!name || isNaN(price)) return alert("請填寫正確資訊");

    let menu = [...currentMenu];
    const index = menu.findIndex(i => i.name === name);

    if (index !== -1) {
        menu[index] = { ...menu[index], price, stock, category };
    } else {
        menu.push({ id: Date.now(), name, price, stock, category });
    }

    // 將新資料推上 Firebase
    database.ref('coffeeMenu').set(menu).then(() => {
        alert(`✨ 商品「${name}」已同步至雲端！`);
        // 清空輸入框
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemStock').value = '';
    });
}

// 6. 產生並推播新的動態密碼
function generateNewPin() {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    // 寫入雲端，兩邊的設備會瞬間同步這個新密碼
    database.ref('merchantPin').set(newPin).then(() => {
        console.log("密碼已於雲端更新");
    });
}
// 當雲端資料改變，自動執行 renderInventory()
database.ref('coffeeMenu').on('value', (snapshot) => {
    currentMenu = snapshot.val();
    renderInventory(); // 後台表格也會自動更新
});