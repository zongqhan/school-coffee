// 1. 全域 Firebase 雲端連線設定 (必須放在最外層)
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

// 初始化雲端連線
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

// 建立全域變數
let currentMenu = []; 
let cart = [];
let currentCategory = 'coffee';

// 2. ⚡ 核心功能：24小時即時監聽雲端菜單
database.ref('coffeeMenu').on('value', (snapshot) => {
    const menu = snapshot.val();
    
    if (menu) {
        currentMenu = menu;
        renderProducts(); // 資料一有變動，畫面立刻自動重繪
    } else {
        // 如果雲端資料庫是空的，自動塞入初始資料
        const defaultMenu = [
            { id: 1, name: "經典美式咖啡", price: 65, stock: 10, category: "coffee" },
            { id: 2, name: "重烘焙拿鐵", price: 85, stock: 5, category: "coffee" },
            { id: 3, name: "起司蛋糕", price: 120, stock: 10, category: "dessert" },
            { id: 4, name: "火腿蛋三明治", price: 70, stock: 8, category: "dessert" },
            { id: 5, name: "草莓提拉米蘇", price: 130, stock: 5, category: "dessert" },
            { id: 6, name: "樹莓派", price: 90, stock: 10, category: "dessert" },
            { id: 7, name: "布朗妮", price: 80, stock: 15, category: "dessert" },
            { id: 8, name: "提拉米蘇", price: 110, stock: 5, category: "dessert" },
            { id: 9, name: "檸檬塔", price: 95, stock: 8, category: "dessert" },
            { id: 10, name: "熔岩巧克力蛋糕", price: 140, stock: 3, category: "dessert" },
            { id: 11, name: "焦糖烤布蕾", price: 85, stock: 10, category: "dessert" },
            { id: 12, name: "昭和布丁", price: 75, stock: 12, category: "dessert" },
            { id: 13, name: "鮮奶酪", price: 60, stock: 20, category: "dessert" },
            { id: 14, name: "焦糖瑪奇朵", price: 95, stock: 10, category: "coffee" },
            { id: 15, name: "巧克力冰沙", price: 85, stock: 8, category: "coffee" },
            { id: 16, name: "黑糖珍珠鮮奶茶", price: 75, stock: 12, category: "coffee" },
            { id: 17, name: "蕎麥鮮奶茶", price: 70, stock: 15, category: "coffee" },
            { id: 18, name: "青茶", price: 40, stock: 20, category: "coffee" },
            { id: 19, name: "紅茶", price: 40, stock: 25, category: "coffee" },
            { id: 20, name: "綠茶", price: 40, stock: 25, category: "coffee" },
            { id: 21, name: "多多綠", price: 55, stock: 15, category: "coffee" },
            { id: 22, name: "卡布奇諾", price: 85, stock: 10, category: "coffee" }
        ];
        database.ref('coffeeMenu').set(defaultMenu);
    }
});

// 3. 渲染商品畫面
function renderProducts() {
    const menu = currentMenu; 
    
    // 🔍 修正：確實抓取 HTML 元素
    const coffeeList = document.getElementById('coffee-list');
    const dessertList = document.getElementById('dessert-list');
    
    if (!coffeeList || !dessertList) return;

    coffeeList.innerHTML = '';
    dessertList.innerHTML = '';

    menu.forEach(product => {
        const isOutOfStock = product.stock <= 0;
        const html = `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <p>庫存: ${product.stock}</p>
                <button ${isOutOfStock ? 'disabled' : ''} onclick="addToCart(${product.id})">
                    ${isOutOfStock ? '已售完' : '加入購物車'}
                </button>
            </div>
        `;
        
        if (product.category === 'coffee' && currentCategory === 'coffee') {
            coffeeList.innerHTML += html;
        } else if (product.category === 'dessert' && currentCategory === 'dessert') {
            dessertList.innerHTML += html;
        }
    });
}

// 4. 切換分類按鈕
function switchCategory(category) {
    currentCategory = category;
    
    const coffeeSection = document.getElementById('coffee-list-section');
    const dessertSection = document.getElementById('dessert-list-section');
    const tabs = document.querySelectorAll('.tab-btn');

    if (!tabs || tabs.length < 2) return;

    if (category === 'coffee') {
        if (coffeeSection) coffeeSection.style.display = 'block';
        if (dessertSection) dessertSection.style.display = 'none';
        
        tabs[0].style.background = '#a07855'; tabs[0].style.color = 'white';
        tabs[1].style.background = '#eae1d4'; tabs[1].style.color = '#4a3728';
    } else {
        if (coffeeSection) coffeeSection.style.display = 'none';
        if (dessertSection) dessertSection.style.display = 'block';
        
        tabs[0].style.background = '#eae1d4'; tabs[0].style.color = '#4a3728';
        tabs[1].style.background = '#a07855'; tabs[1].style.color = 'white';
    }

    renderProducts();
}

// 5. 切換購物車顯示狀態
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'block' : 'none';
    if (modal.style.display === 'block') updateCartUI();
}

// 6. 更新購物車內容與總金額
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!list || !totalEl) return;
    list.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        list.innerHTML += `<li>${item.name} - $${item.price}</li>`;
        total += item.price;
    });
    totalEl.innerText = total;
}

// 7. 加入購物車
function addToCart(productId) {
    const menu = currentMenu; 
    const product = menu.find(p => p.id === productId);
    
    if (product.stock <= 0) {
        alert("非常抱歉，該商品已無庫存！");
        return;
    }
    cart.push(product);
    document.getElementById('cart-count').innerText = cart.length;
    alert(`已加入: ${product.name}`);
}

// 8. 內部結帳扣庫存（全面改為推播至雲端）
function checkout() {
    if (cart.length === 0) return;
    
    let menu = [...currentMenu]; // 複製一份目前的雲端資料
    
    // 依據購物車內容扣除庫存
    cart.forEach(c => {
        let p = menu.find(i => i.id === c.id);
        if (p && p.stock > 0) p.stock--;
    });
    
    // 🌟 將更新後的菜單直接推上 Firebase 雲端！
    database.ref('coffeeMenu').set(menu).then(() => {
        cart = []; // 清空購物車
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.innerText = 0;
        // 注意：這裡不用呼叫 renderProducts()，因為上面的 .on('value') 監聽到資料改變，會自動幫我們重繪畫面！
    }).catch(err => {
        alert("結帳失敗，請檢查網路連線！");
    });
}

// 9. 產生 QR Code 
function generateQR() {
    if (cart.length === 0) return alert("購物車空的喔！");

    document.getElementById('view-cart').style.display = 'none';
    document.getElementById('view-qr').style.display = 'block';

    const itemsText = cart.map(item => item.name).join(", ");
    const total = document.getElementById('cart-total').innerText;
    const qrData = `咖啡廳訂單 - 內容: ${itemsText} | 總金額: $${total}`;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    
    const qrImage = document.getElementById('qr-image');
    if (qrImage) {
        qrImage.src = qrUrl;
    }
}

// 10. 商家端確認結帳機制（從雲端抓取動態密碼）
function merchantVerify() {
    // ⚡ 去雲端抓最新的店家密碼
    database.ref('merchantPin').once('value').then((snapshot) => {
        const CURRENT_MERCHANT_PIN = snapshot.val() || "8888"; 
        
        const userInput = prompt("【商家專用】請櫃檯人員核對金額後，輸入當前的「動態確認碼」以完成點單：");
        
        if (userInput === null) return; 
        
        if (userInput === CURRENT_MERCHANT_PIN) {
            checkout(); 
            alert("✨ 驗證成功！已成功建立訂單並同步更新雲端庫存，謝謝光臨。");
            resetToCartView();
            toggleCart();
        } else {
            alert("❌ 確認碼錯誤！無法結帳，請確認店家最新的動態密碼。");
        }
    });
}

// 11. 返回購物車檢視
function resetToCartView() {
    document.getElementById('view-cart').style.display = 'block';
    document.getElementById('view-qr').style.display = 'none';
}