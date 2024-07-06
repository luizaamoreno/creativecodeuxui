// Variáveis globais
let products = [];
let cart = [];
let editingIndex = -1;
let nextProductId = 1; // Novo: para gerar códigos de produto sequenciais

// Elementos do DOM
const productForm = document.getElementById('product-form');
const productGrid = document.getElementById('product-grid');
const cartIcon = document.getElementById('cart-icon');
const cartBadge = document.getElementById('cart-badge');
const cartMenu = document.getElementById('cart-menu');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const paymentMethod = document.getElementById('payment-method');
const cashPayment = document.getElementById('cash-payment');
const cashAmount = document.getElementById('cash-amount');
const change = document.getElementById('change');
const finishPayment = document.getElementById('finish-payment');
const clearCart = document.getElementById('clear-cart');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editName = document.getElementById('edit-name');
const editPrice = document.getElementById('edit-price');
const editQuantity = document.getElementById('edit-quantity');
const editUnit = document.getElementById('edit-unit');
const closeModal = document.getElementsByClassName('close')[0];

// Função para gerar código de produto
function generateProductCode() {
    const code = `PROD${String(nextProductId).padStart(4, '0')}`;
    nextProductId++;
    return code;
}

// Carregar dados do localStorage
function loadData() {
    const storedProducts = localStorage.getItem('products');
    if (storedProducts) {
        products = JSON.parse(storedProducts);
        // Atualizar nextProductId baseado nos produtos existentes
        const maxId = products.reduce((max, product) => {
            const id = parseInt(product.code.slice(4));
            return id > max ? id : max;
        }, 0);
        nextProductId = maxId + 1;
    }

    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }

    renderProducts();
    updateCartBadge();
    renderCart();
}

// Salvar dados no localStorage
function saveData() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('nextProductId', nextProductId.toString());
}

// Renderizar produtos
function renderProducts() {
    productGrid.innerHTML = '';
    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <h3>${product.name}</h3>
            <p>Código: ${product.code}</p>
            <p>R$ ${product.price.toFixed(2)} / ${product.unit}</p>
            <p>Quantidade: ${product.quantity}</p>
            <button onclick="addToCart(${index})">Adicionar ao Carrinho</button>
            <button onclick="editProduct(${index})">Editar</button>
            <button onclick="deleteProduct(${index})">Excluir</button>
        `;
        productGrid.appendChild(productCard);
    });
}

// Adicionar produto
productForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const quantity = parseFloat(document.getElementById('product-quantity').value);
    const unit = document.getElementById('product-unit').value;
    const code = generateProductCode(); // Gerar código automaticamente

    products.push({ name, price, quantity, unit, code });
    saveData();
    renderProducts();
    productForm.reset();
});

// Adicionar ao carrinho
function addToCart(index) {
    const product = products[index];
    if (product.quantity <= 0) {
        alert('Produto fora de estoque!');
        return;
    }

    let quantity;
    if (product.unit === 'kg') {
        quantity = parseFloat(prompt(`Quantos quilos de ${product.name} (${product.code}) deseja adicionar? (Disponível: ${product.quantity.toFixed(3)} kg)`));
    } else {
        quantity = parseInt(prompt(`Quantas unidades de ${product.name} (${product.code}) deseja adicionar? (Disponível: ${product.quantity})`));
    }

    if (isNaN(quantity) || quantity <= 0) {
        alert('Por favor, insira uma quantidade válida.');
        return;
    }

    if (quantity > product.quantity) {
        alert('Quantidade indisponível em estoque.');
        return;
    }

    const existingItem = cart.find(item => item.code === product.code);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ ...product, quantity: quantity });
    }

    product.quantity -= quantity;
    updateCartBadge();
    saveData();
    renderProducts();
    renderCart();
}

// Atualizar badge do carrinho
function updateCartBadge() {
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartBadge.textContent = totalItems;
}

// Renderizar carrinho
function renderCart() {
    cartItems.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const quantityDisplay = item.unit === 'kg' ? 
            `${item.quantity.toFixed(3)} kg` : 
            `${item.quantity} ${item.unit}`;

        itemElement.innerHTML = `
            <p>${item.name} (${item.code}) - ${quantityDisplay} x R$ ${item.price.toFixed(2)} = R$ ${itemTotal.toFixed(2)}</p>
            <button onclick="removeFromCart(${index})">Remover</button>
        `;
        cartItems.appendChild(itemElement);
    });

    cartTotal.textContent = `Total: R$ ${total.toFixed(2)}`;
}

// Remover do carrinho
function removeFromCart(index) {
    const item = cart[index];
    const product = products.find(p => p.name === item.name);
    if (product) {
        product.quantity += item.quantity;
    }
    cart.splice(index, 1);
    updateCartBadge();
    saveData();
    renderProducts();
    renderCart();
}

// Limpar carrinho
clearCart.addEventListener('click', () => {
    cart.forEach(item => {
        const product = products.find(p => p.name === item.name);
        if (product) {
            product.quantity += item.quantity;
        }
    });
    cart = [];
    updateCartBadge();
    saveData();
    renderProducts();
    renderCart();
});

// Abrir/fechar carrinho
cartIcon.addEventListener('click', () => {
    cartMenu.style.display = cartMenu.style.display === 'block' ? 'none' : 'block';
});

document.addEventListener('click', (e) => {
    if (!cartMenu.contains(e.target) && e.target !== cartIcon) {
        cartMenu.style.display = 'none';
    }
});

// Método de pagamento
paymentMethod.addEventListener('change', () => {
    if (paymentMethod.value === 'cash') {
        cashPayment.style.display = 'block';
    } else {
        cashPayment.style.display = 'none';
        change.textContent = '';
    }
});

// Calcular troco
cashAmount.addEventListener('input', () => {
    const totalValue = parseFloat(cartTotal.textContent.split('R$')[1]);
    const cashValue = parseFloat(cashAmount.value);

    if (cashValue >= totalValue) {
        const changeValue = cashValue - totalValue;
        change.textContent = `Troco: R$ ${changeValue.toFixed(2)}`;
    } else {
        change.textContent = 'Valor insuficiente';
    }
});

// Finalizar pagamento
finishPayment.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('O carrinho está vazio.');
        return;
    }

    if (!paymentMethod.value) {
        alert('Selecione um método de pagamento.');
        return;
    }

    if (paymentMethod.value === 'cash') {
        const totalValue = parseFloat(cartTotal.textContent.split('R$')[1]);
        const cashValue = parseFloat(cashAmount.value);

        if (!cashValue) {
            alert('Digite o valor em dinheiro.');
            return;
        }

        if (cashValue < totalValue) {
            alert('Valor em dinheiro insuficiente.');
            return;
        }
    }

    alert('Pagamento finalizado com sucesso!');
    cart = [];
    updateCartBadge();
    saveData();
    renderCart();
    cartMenu.style.display = 'none';
});

// Editar produto
function editProduct(index) {
    const product = products[index];
    editingIndex = index;
    editName.value = product.name;
    editPrice.value = product.price;
    editQuantity.value = product.quantity;
    editUnit.value = product.unit;
    // Adicione um campo para exibir o código do produto (somente leitura)
    document.getElementById('edit-code').value = product.code;
    editModal.style.display = 'block';
}

// Deletar produto
function deleteProduct(index) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        products.splice(index, 1);
        saveData();
        renderProducts();
    }
}

// Fechar modal
closeModal.onclick = function() {
    editModal.style.display = 'none';
}

// Salvar edições
editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editingIndex === -1) return;

    const editedProduct = {
        name: editName.value,
        price: parseFloat(editPrice.value),
        quantity: parseFloat(editQuantity.value),
        unit: editUnit.value,
        code: products[editingIndex].code // Manter o código original
    };

    products[editingIndex] = editedProduct;
    saveData();
    renderProducts();
    editModal.style.display = 'none';
    editingIndex = -1;
});
// Carregar dados ao iniciar
loadData();
