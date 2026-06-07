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

database.ref('orders').on('value', (snapshot) => {
    const orders = snapshot.val() || {};
    renderOrderBoard(orders);
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
        tbody.innerHTML += `<tr><td>${item.name}</td><td>${item.price}</td><td>${item.category}</td><td>${item.stock}</td></tr>`;
    });
}

// 5. 新增 / 更新商品 (推播至雲端)
function addNewItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseInt(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);
    const category = document.getElementById('itemCategory').value;
    // 抓取勾選狀態
    const hasIce = document.getElementById('itemIce').checked;
    const hasSugar = document.getElementById('itemSugar').checked;

    if (!name || isNaN(price) || isNaN(stock)) return alert("請填寫正確且完整的商品資訊");

    let menu = [...currentMenu];
    const index = menu.findIndex(i => i.name === name);

    if (index !== -1) {
        // 更新現有商品
        menu[index] = { ...menu[index], price, stock, category, hasIce, hasSugar };
    } else {
        // 新增全新商品
        menu.push({ id: Date.now(), name, price, stock, category, hasIce, hasSugar });
    }

    database.ref('coffeeMenu').set(menu).then(() => {
        alert(`✨ 商品「${name}」已成功同步至雲端！`);
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
        document.getElementById('itemStock').value = '';
        document.getElementById('itemIce').checked = false;
        document.getElementById('itemSugar').checked = false;
    });
}

function renderOrderBoard(ordersObject) {
    const board = document.getElementById('order-board');
    if (!board) return;
    board.innerHTML = '';

    const orderIds = Object.keys(ordersObject);
    if (orderIds.length === 0) {
        board.innerHTML = `<p style="color: #7f8c8d; text-align: center; padding: 20px;">📭 目前暫無新訂單</p>`;
        return;
    }

    orderIds.forEach(id => {
        const order = ordersObject[id];
        // 解析時間戳記
        const time = new Date(order.timestamp).toLocaleTimeString();
        
        let itemsHtml = order.items.map(item => 
            `<li style="margin: 4px 0;">👉 <strong>${item.name}</strong> <span style="color:#7f8c8d; font-size:13px;">(${item.customIce || '固定冰'}, ${item.customSugar || '固定糖'})</span></li>`
        ).join('');

        board.innerHTML += `
            <div style="background: white; border: 1px solid #eae1d4; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #f1ebd9; padding-bottom:8px; margin-bottom:10px;">
                    <span style="font-weight:bold; color:#a07855;">⏱️ 點單時間：${time}</span>
                    <span style="background:#e74c3c; color:white; padding:3px 8px; border-radius:4px; font-size:12px; font-weight:bold;">待製作</span>
                </div>
                <ul style="padding-left:15px; margin:0 0 12px 0; color:#4a3728;">${itemsHtml}</ul>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="color:#c0392b; font-size:16px;">總計 TWD $${order.totalPrice}</strong>
                    <button onclick="completeOrder('${id}')" style="width:auto; margin:0; padding:6px 12px; background:#27ae60; font-size:14px;">✅ 完成出餐</button>
                </div>
            </div>
        `;
    });
}

function completeOrder(orderId) {
    if (confirm("確認該筆訂單已出餐完畢？")) {
        database.ref(`orders/${orderId}`).remove().then(() => {
            alert("訂單核銷成功！");
        });
    }
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
