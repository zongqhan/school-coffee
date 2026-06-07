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
