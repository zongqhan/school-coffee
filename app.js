// 1. 全域 Firebase 雲端連線設定
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
        renderProducts(); // 資料一有變動，立刻重繪前台商品畫面
        if (document.getElementById('cart-modal').style.display === 'block') {
            updateCartUI(); // 如果購物車開著，同步更新內部
        }
    }
});

// 3. 渲染前台商品畫面（原版邏輯 100% 搬回，不更動剩餘庫存計算與客製化標籤）
function renderProducts() {
    const coffeeList = document.getElementById('coffee-list');
    const dessertList = document.getElementById('dessert-list');
    
    if (!coffeeList || !dessertList) return;

    // 清空舊畫面
    coffeeList.innerHTML = '';
    dessertList.innerHTML = '';

    currentMenu.forEach(product => {
        // 原版剩餘品項有效庫存邏輯：總庫存扣除該商品在購物車內的數量
        const inCartCount = cart.filter(item => item.id === product.id).length;
        const availableStock = product.stock - inCartCount;
        const isOutOfStock = availableStock <= 0;

        // 原版客製化下拉選單邏輯
        let iceSelectHtml = product.hasIce ? `
            <select id="ice-${product.id}" style="padding:5px; margin:5px 0; font-size:13px; width:100%; border-radius:4px; border:1px solid #ccc;">
                <option value="正常冰">正常冰</option>
                <option value="少冰">少冰</option>
                <option value="去冰">去冰</option>
                <option value="熱飲">熱飲</option>
            </select>
        ` : '';

        let sugarSelectHtml = product.hasSugar ? `
            <select id="sugar-${product.id}" style="padding:5px; margin:2px 0 8px 0; font-size:13px; width:100%; border-radius:4px; border:1px solid #ccc;">
                <option value="正常糖">正常糖</option>
                <option value="半糖">半糖</option>
                <option value="微糖">微糖</option>
                <option value="無糖">無糖</option>
            </select>
        ` : '';

        // 組裝商品卡片，僅在按鈕上方新增「數量選擇框」
        const html = `
            <div class="product-card">
                <h3>${product.name}</h3>
                <p class="price">$${product.price}</p>
                <p>剩餘有效庫存: ${availableStock <= 0 ? '已達上限/售完' : availableStock}</p>
                <div>
                    ${iceSelectHtml}
                    ${sugarSelectHtml}
                </div>
                
                <div class="batch-qty-section">
                    <span style="font-size:13px; color:#555;">下單數量:</span>
                    <input type="number" id="qty-${product.id}" class="batch-qty-input" value="1" min="1" max="${availableStock <= 0 ? 1 : availableStock}" ${isOutOfStock ? 'disabled' : ''}>
                </div>

                <button ${isOutOfStock ? 'disabled' : ''} onclick="processAddToCart(${product.id})" style="background: ${isOutOfStock ? '#ccc' : '#8d6e63'}">
                    ${isOutOfStock ? '已售完' : '加入購物車'}
                </button>
            </div>
        `;
        
        // 分流到各自的區域
        if (product.category === 'coffee' && currentCategory === 'coffee') {
            coffeeList.innerHTML += html;
        } else if (product.category === 'dessert' && currentCategory === 'dessert') {
            dessertList.innerHTML += html;
        }
    });
}

// 4. 切換分類標籤
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

// 5. 開啟 / 關閉購物車側邊欄
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.style.display = (modal.style.display === 'none' || modal.style.display === '') ? 'block' : 'none';
    if (modal.style.display === 'block') updateCartUI();
}

// 6. 更新購物車 UI (100% 沿用原版結構呈現)
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    if (!list || !totalEl) return;

    list.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        list.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${item.name}</strong> <br>
                    <span style="font-size: 11px; color: #888;">(${item.ice}, ${item.sugar})</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span>$${item.price}</span>
                    <button onclick="removeFromCart(${index})" style="background: #e74c3c; color: white; border: none; padding: 3px 8px; border-radius: 4px; cursor: pointer; width: auto; margin-top: 0; font-size: 12px;">移除</button>
                </div>
            </li>
        `;
    });

    totalEl.innerText = total;
    document.getElementById('cart-count').innerText = cart.length;
}

// 7. 新增優化：大量下單外包循環函數（不改動原 addToCart 的安全做法）
function processAddToCart(productId) {
    const product = currentMenu.find(p => p.id === productId);
    const qtyInput = document.getElementById(`qty-${productId}`);
    const buyCount = qtyInput ? parseInt(qtyInput.value) : 1;

    if (isNaN(buyCount) || buyCount <= 0) {
        alert("請輸入有效的購買數量！");
        return;
    }

    // 檢查總量是否會爆庫存
    const inCartCount = cart.filter(item => item.id === productId).length;
    if (inCartCount + buyCount > product.stock) {
        alert(`❌ 超出有效庫存！目前購物車已有 ${inCartCount} 件，雲端總庫存僅剩 ${product.stock} 件，無法一次加入 ${buyCount} 件。`);
        return;
    }

    // 利用迴圈，幫使用者連續呼叫原本的「加入購物車」
    for (let i = 0; i < buyCount; i++) {
        addToCart(productId);
    }

    alert(`🎉 成功將 ${buyCount} 份「${product.name}」加入購物車！`);
    if (qtyInput) qtyInput.value = 1; // 復原為1
}

// 100% 原版一模一樣的單杯加入邏輯（確保客製化選項能精準撈到）
function addToCart(productId) {
    const product = currentMenu.find(p => p.id === productId);
    
    const iceEl = document.getElementById(`ice-${productId}`);
    const sugarEl = document.getElementById(`sugar-${productId}`);
    
    const iceSelection = iceEl ? iceEl.value : "固定冰量";
    const sugarSelection = sugarEl ? sugarEl.value : "固定甜度";

    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        ice: iceSelection,
        sugar: sugarSelection
    });

    document.getElementById('cart-count').innerText = cart.length;
    renderProducts();
}

// 8. 從購物車單筆移除商品
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    renderProducts();
}

// 9. 產生 QR Code 
function generateQR() {
    if (cart.length === 0) return alert("購物車空的喔！");

    document.getElementById('view-cart').style.display = 'none';
    document.getElementById('view-qr').style.display = 'block';

    const itemsText = cart.map(item => `${item.name}(${item.ice}/${item.sugar})`).join(", ");
    const total = document.getElementById('cart-total').innerText;
    const qrData = `咖啡廳訂單 - 內容: ${itemsText} | 總金額: $${total}`;
    
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    document.getElementById('qr-image').src = qrUrl;
}

// 10. 商家端確認結帳機制
function merchantVerify() {
    database.ref('merchantPin').once('value').then((snapshot) => {
        const CURRENT_MERCHANT_PIN = snapshot.val() || "8888"; 
        
        const userInput = prompt("【商家專用】請櫃檯人員核對金額後，輸入當前的「動態確認碼」以完成點單：");
        
        if (userInput === CURRENT_MERCHANT_PIN) {
            database.ref('coffeeMenu').once('value').then((snap) => {
                let menu = snap.val() || [];
                let isStockValid = true;

                // 防超賣校驗
                cart.forEach(c => {
                    let p = menu.find(i => i.id === c.id);
                    if (!p || p.stock <= 0) isStockValid = false;
                });

                if (!isStockValid) {
                    alert("❌ 結帳失敗：部分餐點庫存已被其他顧客搶購一空，請重新選購！");
                    return;
                }

                // 扣除實體雲端庫存物件
                cart.forEach(c => {
                    let p = menu.find(i => i.id === c.id);
                    if (p) p.stock--;
                });

                // 🌟 【本次新增】：將結帳後的訂單資料獨立存入雲端訂單區
                const newOrder = {
                    id: Date.now(),
                    time: new Date().toLocaleString('zh-TW', { hour12: false }),
                    items: cart, // 包含品名、冰塊、甜度
                    total: document.getElementById('cart-total').innerText
                };
                database.ref('orders').push(newOrder); // 推播到 Firebase

                // 【狀態預先解耦】：寫入雲端前立刻清空購物車
                cart = []; 
                document.getElementById('cart-count').innerText = 0;

                // 同步回 Firebase 實時資料庫
                database.ref('coffeeMenu').set(menu).then(() => {
                    alert("🎉 結帳成功！訂單已推播至店家後台，庫存已更新。");
                    
                    const cartModal = document.getElementById('cart-modal');
                    if (cartModal) {
                        cartModal.style.display = 'none';
                    }
                    resetToCartView();
                }).catch(err => {
                    console.error("雲端交易失敗:", err);
                    alert("雲端連線失敗，請檢查網路！");
                });
            });
        } else if (userInput !== null) {
            alert("❌ 驗證碼錯誤！請向櫃檯人員確認管理後台當前密碼。");
        }
    });
}

// 11. 返回購物車狀態還原
function resetToCartView() {
    document.getElementById('view-cart').style.display = 'block';
    document.getElementById('view-qr').style.display = 'none';
}

// =================================================================
// 📱 智慧型自動監聽外掛：專門驅動 Uber 風格底部條 (完全不改動原有核心邏輯)
// =================================================================
(function() {
    function syncUberBar() {
        const countEl = document.getElementById('cart-count');
        const totalEl = document.getElementById('cart-total');
        const uberBar = document.getElementById('uber-cart-bar');
        const uberCount = document.getElementById('uber-cart-count');
        const uberTotal = document.getElementById('uber-cart-total');

        if (!countEl || !uberBar) return;

        // 讀取原本購物車的真實數字
        const count = parseInt(countEl.innerText) || 0;

        // 判斷：如果是手機尺寸 (<=768px) 且 購物車有東西，就優雅現身
        if (window.innerWidth <= 768 && count > 0) {
            uberBar.style.display = 'flex';
            if (uberCount) uberCount.innerText = count;
            if (uberTotal && totalEl) {
                // 自動捕捉原本的總金額文字（補上金錢符號）
                let currentTotal = totalEl.innerText;
                uberTotal.innerText = currentTotal.includes('$') ? currentTotal : '$' + currentTotal;
            }
        } else {
            // 桌機版或是購物車空了，就隱藏
            uberBar.style.display = 'none';
        }
    }

    // 利用瀏覽器內建的 MutationObserver 監聽器
    // 只要原本的 HTML「購物車(X)」數字被你原本的程式碼修改，這裡就會「秒同步」觸發
    const cartObserver = new MutationObserver(syncUberBar);
    
    window.addEventListener('load', () => {
        const targetSpan = document.getElementById('cart-count');
        if (targetSpan) {
            // 開始被動監聽數字變化
            cartObserver.observe(targetSpan, { childList: true, characterData: true, subtree: true });
        }
        // 初始化與視窗縮放防禦調整
        syncUberBar();
        window.addEventListener('resize', syncUberBar);
    });
})();
