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

// 3. 渲染前台商品畫面
function renderProducts() {
    const coffeeList = document.getElementById('coffee-list');
    const dessertList = document.getElementById('dessert-list');
    
    if (!coffeeList || !dessertList) return;

    // 清空舊畫面
    coffeeList.innerHTML = '';
    dessertList.innerHTML = '';

    currentMenu.forEach(product => {
        // 剩餘品項有效庫存邏輯：總庫存扣除該商品在購物車內的數量
        const inCartCount = cart.filter(item => item.id === product.id).length;
        const availableStock = product.stock - inCartCount;
        const isOutOfStock = availableStock <= 0;

        // 客製化下拉選單邏輯
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

        // 組裝商品卡片
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

// 6. 更新購物車內容與總金額
function updateCartUI() {
    const list = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    if (!list || !totalEl) return;
    
    list.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        let customText = "";
        if (item.ice || item.sugar) {
            customText = `(${item.ice || ''}${item.ice && item.sugar ? '/' : ''}${item.sugar || ''})`;
        }
        
        list.innerHTML += `<li>${item.name} ${customText} - $${item.price}</li>`;
        total += item.price;
    });
    
    totalEl.innerText = total;
    document.getElementById('cart-count').innerText = cart.length;
}

// 7. 加入購物車
function processAddToCart(productId) {
    const product = currentMenu.find(p => p.id === productId);
    
    if (!product || product.stock <= 0) {
        alert("非常抱歉，該商品已無庫存！");
        return;
    }

    const qtyInput = document.getElementById(`qty-${productId}`);
    const qty = qtyInput ? parseInt(qtyInput.value) : 1;

    const iceSelect = document.getElementById(`ice-${productId}`);
    const sugarSelect = document.getElementById(`sugar-${productId}`);
    const ice = iceSelect ? iceSelect.value : null;
    const sugar = sugarSelect ? sugarSelect.value : null;

    for (let i = 0; i < qty; i++) {
        cart.push({ ...product, ice: ice, sugar: sugar });
    }
    
    document.getElementById('cart-count').innerText = cart.length;
    
    updateCartUI(); 
    renderProducts();

    alert(`已加入 ${qty} 份: ${product.name}`);
}

// 8. 結帳扣庫存
function checkout() {
    if (cart.length === 0) return;
    
    let menu = [...currentMenu];
    cart.forEach(c => {
        let p = menu.find(i => i.id === c.id);
        if (p && p.stock > 0) p.stock--;
    });
    
    database.ref('coffeeMenu').set(menu).then(() => {
        cart = []; 
        document.getElementById('cart-count').innerText = 0;
        updateCartUI(); 
        alert("✨ 訂單已建立，庫存已更新！");
    });
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

                cart.forEach(c => {
                    let p = menu.find(i => i.id === c.id);
                    if (!p || p.stock <= 0) isStockValid = false;
                });

                if (!isStockValid) {
                    alert("❌ 結帳失敗：部分餐點庫存已被其他顧客搶購一空，請重新選購！");
                    return;
                }

                cart.forEach(c => {
                    let p = menu.find(i => i.id === c.id);
                    if (p) p.stock--;
                });

                const newOrder = {
                    id: Date.now(),
                    time: new Date().toLocaleString('zh-TW', { hour12: false }),
                    items: cart, 
                    total: document.getElementById('cart-total').innerText
                };
                database.ref('orders').push(newOrder); 

                cart = []; 
                document.getElementById('cart-count').innerText = 0;

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
// 📱 智慧型自動監聽外掛：專門驅動 Uber 風格底部條
// =================================================================
(function() {
    function syncUberBar() {
        const countEl = document.getElementById('cart-count');
        const totalEl = document.getElementById('cart-total');
        const uberBar = document.getElementById('uber-cart-bar');
        const uberCount = document.getElementById('uber-cart-count');
        const uberTotal = document.getElementById('uber-cart-total');

        if (!countEl || !uberBar) return;

        const count = parseInt(countEl.innerText) || 0;

        if (window.innerWidth <= 768 && count > 0) {
            uberBar.style.display = 'flex';
            if (uberCount) uberCount.innerText = count;
            if (uberTotal && totalEl) {
                let currentTotal = totalEl.innerText;
                uberTotal.innerText = currentTotal.includes('$') ? currentTotal : '$' + currentTotal;
            }
        } else {
            uberBar.style.display = 'none';
        }
    }

    const cartObserver = new MutationObserver(syncUberBar);
    
    window.addEventListener('load', () => {
        const targetSpan = document.getElementById('cart-count');
        if (targetSpan) {
            cartObserver.observe(targetSpan, { childList: true, characterData: true, subtree: true });
        }
        syncUberBar();
        window.addEventListener('resize', syncUberBar);
    });
})();
