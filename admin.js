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

database.ref('coffeeMenu').on('value', (snapshot) => {
    currentMenu = snapshot.val() || [];
    renderInventory(); 
});

database.ref('merchantPin').on('value', (snapshot) => {
    const pin = snapshot.val() || "8888";
    const pinEl = document.getElementById('current-pin');
    if (pinEl) pinEl.innerText = pin;
});

// 渲染現有庫存表格（保留原本價格與格式，加入刪除按鈕）
function renderInventory() {
    const tbody = document.getElementById('inventory-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    currentMenu.forEach(item => {
        const categoryText = item.category === 'coffee' ? '☕ 咖啡' : '🍰 甜點';
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.name}</strong></td>
                <td style="color: #b8860b; font-weight: bold;">$${item.price}</td>
                <td>${categoryText}</td>
                <td style="font-weight: bold; color: ${item.stock <= 0 ? '#e74c3c' : '#2e7d32'}">${item.stock}</td>
                <td>
                    <button class="delete-btn" onclick="deleteItem(${item.id})">🗑️ 刪除</button>
                </td>
            </tr>
        `;
    });
}

// 新增 / 更新商品至雲端（完整保留 hasIce, hasSugar 客製化標籤）
function addNewItem() {
    const name = document.getElementById('itemName').value.trim();
    const price = parseInt(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);
    const category = document.getElementById('itemCategory').value;
    const hasIce = document.getElementById('itemIce').checked;
    const hasSugar = document.getElementById('itemSugar').checked;

    if (!name || isNaN(price) || isNaN(stock)) {
        return alert("請填寫正確且完整的商品資訊（品名、價格、庫存）！");
    }

    let menu = [...currentMenu];
    const index = menu.findIndex(i => i.name === name);

    if (index !== -1) {
        menu[index] = { ...menu[index], price, stock, category, hasIce, hasSugar };
    } else {
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

// 刪除商品功能
function deleteItem(productId) {
    const targetItem = currentMenu.find(item => item.id === productId);
    if (!targetItem) return;

    if (confirm(`確定要完全刪除商品「${targetItem.name}」嗎？此動作將同步影響顧客端菜單！`)) {
        const updatedMenu = currentMenu.filter(item => item.id !== productId);
        database.ref('coffeeMenu').set(updatedMenu).then(() => {
            alert(`商品「${targetItem.name}」已成功自雲端刪除！`);
        });
    }
}

function generateNewPin() {
    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    database.ref('merchantPin').set(newPin).then(() => {
        alert(`🔑 密碼已更新為：${newPin}，前台結帳將同步生效！`);
    });
}

// 🌟 新增：監聽雲端最新訂單
database.ref('orders').on('value', (snapshot) => {
    const ordersData = snapshot.val();
    renderOrders(ordersData);
});

// 🌟 新增：渲染訂單畫面
function renderOrders(ordersData) {
    const container = document.getElementById('orders-container');
    if (!container) return;
    
    if (!ordersData) {
        container.innerHTML = '<p style="color: #7f8c8d; font-size: 14px;">目前尚無新訂單</p>';
        return;
    }

    container.innerHTML = '';
    // 轉換為陣列，並以時間排序 (舊的在前面，符合排隊出餐邏輯)
    const ordersArray = Object.keys(ordersData).map(key => ({
        firebaseKey: key,
        ...ordersData[key]
    })).sort((a, b) => a.id - b.id);

    ordersArray.forEach(order => {
        // 相同商品合併數量計算 (讓店家看起來比較舒服)
        const itemCounts = {};
        order.items.forEach(item => {
            const key = `${item.name}-${item.ice}-${item.sugar}`;
            if(itemCounts[key]) {
                itemCounts[key].count++;
            } else {
                itemCounts[key] = { name: item.name, ice: item.ice, sugar: item.sugar, count: 1 };
            }
        });

        const itemsHtml = Object.values(itemCounts).map(i => 
            `<li style="margin-bottom: 5px; font-size: 15px;">
                <strong>${i.name}</strong> 
                <span style="color: #666; font-size: 13px;">(${i.ice}, ${i.sugar})</span> 
                <span style="color: #e67e22; font-weight: bold;"> x ${i.count}</span>
            </li>`
        ).join('');

        container.innerHTML += `
            <div style="background: #fff; border: 2px solid #f1ebd9; padding: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1ebd9; padding-bottom: 10px; margin-bottom: 10px;">
                    <span style="font-weight: bold; color: #4a3728;">訂單號: #${order.id.toString().slice(-4)}</span>
                    <span style="color: #888; font-size: 13px;">🕒 ${order.time}</span>
                </div>
                <ul style="margin: 0 0 15px 0; padding-left: 20px;">
                    ${itemsHtml}
                </ul>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #c0392b; font-size: 16px;">總金額: $${order.total}</span>
                    <button onclick="completeOrder('${order.firebaseKey}')" style="background: #27ae60; color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; margin: 0; width: auto;">✅ 標記完成並移除</button>
                </div>
            </div>
        `;
    });
}

// 🌟 新增：完成訂單並從雲端刪除
function completeOrder(firebaseKey) {
    if(confirm('餐點做完了嗎？確定要將此訂單結案並移除？')) {
        database.ref('orders/' + firebaseKey).remove();
    }
}
