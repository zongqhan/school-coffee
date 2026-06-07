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
    const coffeeList = document.getElementById('coffee-list');
    const dessertList = document.getElementById('dessert-list');
    
    if (!coffeeList || !dessertList) return;

    coffeeList.innerHTML = '';
    dessertList.innerHTML = '';

    menu.forEach(product => {
        // 算出該品項「目前在購物車被佔用」的數量
        const inCartCount = cart.filter(item => item.id === product.id).length;
        // 實體有效庫存 = 雲端剩餘數量 - 購物車佔用數量
        const realAvailableStock = product.stock - inCartCount;
        const isOutOfStock = realAvailableStock <= 0;

        // 根據雲端後台設定，決定是否動態顯示客製化下拉選單
        let iceSelectHtml = product.hasIce ? `
            <select id="ice-${product.id}" style="padding:4px; margin:4px 0; font-size:13px; width:100%;">
                <option value="正常冰">正常冰</option>
                <option value="少冰">少冰</option>
                <option value="去冰">去冰</option>
                <option value="熱飲">熱飲</option>
            </select>
        ` : '';

        let sugarSelectHtml = product.hasSugar ? `
            <select id="sugar-${product.id}" style="padding:4px; margin:4px 0 0 0; font-size:13px; width:100%;">
                <option value="正常糖">正常糖</option>
                <option value="半糖">半糖</option>
                <option value="微糖">微糖</option>
                <option value="無糖">無糖</option>
            </select>
        ` : '';

        const html = `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <p style="font-size:13px; color:#7f8c8d;">雲端庫存: ${product.stock} (剩餘: ${realAvailableStock})</p>
                <div style="margin: 8px 0;">
                    ${iceSelectHtml}
                    ${sugarSelectHtml}
                </div>
                <button ${isOutOfStock ? 'disabled' : ''} onclick="addToCart(${product.id})">
                    ${isOutOfStock ? '已售完/額滿' : '加入購物車'}
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

    cart.forEach((item, index) => {
        list.innerHTML += `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
                <div>
                    <span style="font-weight:bold;">${item.name}</span> <br>
                    <span style="font-size:12px; color:#888;">(${item.customIce}, ${item.customSugar})</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="color:#a07855; font-weight:bold;">$${item.price}</span>
                    <button onclick="removeFromCart(${index})" style="background:#e74c3c; color:white; width:auto; margin:0; padding:4px 8px; font-size:12px;">刪除</button>
                </div>
            </li>
        `;
        total += item.price;
    });
    totalEl.innerText = total;
}

function removeFromCart(index) {
    cart.splice(index, 1); // 刪除該元素
    document.getElementById('cart-count').innerText = cart.length;
    updateCartUI();      // 刷新購物車清單
    renderProducts();   // 刷新外圍主畫面的「剩餘庫存計算」
}

// 7. 加入購物車
function addToCart(productId) {
    const product = currentMenu.find(p => p.id === productId);
    
    // 安全過濾：算出該商品目前已經在購物車被拿了幾件
    const alreadyInCart = cart.filter(item => item.id === productId).length;
    
    if (alreadyInCart >= product.stock) {
        alert(`❌ 搶購失敗！目前雲端剩餘數量僅剩 ${product.stock} 件，您的購物車已達上限。`);
        return;
    }

    // 讀取動態客製化選單（如果後台有關閉，則填入預設值）
    const iceEl = document.getElementById(`ice-${productId}`);
    const sugarEl = document.getElementById(`sugar-${productId}`);
    const iceSelection = iceEl ? iceEl.value : "固定冰量";
    const sugarSelection = sugarEl ? sugarEl.value : "固定甜度";

    // 將資料打包送入暫存區
    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        customIce: iceSelection,
        customSugar: sugarSelection
    });

    document.getElementById('cart-count').innerText = cart.length;
    alert(`已成功加入購物車：${product.name} (${iceSelection} / ${sugarSelection})`);
    renderProducts(); // 立刻即時同步扣減前台暫存顯示
}

// 8. 內部結帳扣庫存（全面改為推播至雲端）
function checkout() {
    if (cart.length === 0) return;
    
    // 1. 重新從雲端抓最新的菜單，避免結帳瞬間跟其他人衝突（Race Condition 防護機制）
    database.ref('coffeeMenu').once('value').then((snapshot) => {
        let menu = snapshot.val() || [];
        let isStockValid = true;
        let errorMessage = "";

        // 2. 先行驗證所有人的庫存是否足夠
        cart.forEach(c => {
            let p = menu.find(i => i.id === c.id);
            if (!p || p.stock <= 0) {
                isStockValid = false;
                errorMessage += `【${c.name}】庫存不足！\n`;
            }
        });

        if (!isStockValid) {
            alert("❌ 結帳遭到安全系統攔截：\n" + errorMessage + "請移出購物車後重新嘗試。");
            return;
        }

        // 3. 驗證通過，執行庫存扣減
        cart.forEach(c => {
            let p = menu.find(i => i.id === c.id);
            if (p) p.stock--;
        });

        // 4. 打包全新訂單，準備投遞至 Firebase 'orders' 節點
        const total = parseInt(document.getElementById('cart-total').innerText);
        const newOrder = {
            timestamp: firebase.database.ServerValue.TIMESTAMP, // 伺服器時間戳記
            items: cart,
            totalPrice: total
        };

        // 5. 兩階段原子寫入：更新庫存並發送訂單
        database.ref('coffeeMenu').set(menu).then(() => {
            // 庫存更新成功後，在雲端建立訂單
            return database.ref('orders').push(newOrder);
        }).then(() => {
            cart = []; // 清空前台暫存
            const countEl = document.getElementById('cart-count');
            if (countEl) countEl.innerText = 0;
            alert("🎉 結帳成功！訂單已派發至後台，廚房將即時製作。");
        }).catch(err => {
            alert("雲端連線失敗，請檢查網路！");
        });
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
