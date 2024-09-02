let cartItems = [];

// Função para abrir o carrinho
function openCart() {
    document.getElementById("cart").classList.add("active");
}

// Função para fechar o carrinho
function closeCart() {
    const cart = document.getElementById("cart");

    if (cart) {
        cart.classList.remove("active");
    } else {
        console.error('Elemento com ID "cart" não encontrado.');
    }
}

// Função para abrir o modal
function openModal() {
    document.getElementById("loginRegisterModal").style.display = "block";
    showLogin(); // Abre o formulário de login por padrão
}

// Função para fechar o modal
function closeModal() {
    document.getElementById("loginRegisterModal").style.display = "none";
}

// Alternar para o formulário de login
function showLogin() {
    document.getElementById("loginForm").classList.add("active");
    document.getElementById("registerForm").classList.remove("active");
}

// Alternar para o formulário de registro
function showRegister() {
    document.getElementById("loginForm").classList.remove("active");
    document.getElementById("registerForm").classList.add("active");
}

// Adiciona os eventos de clique para alternar entre login e registro
document.getElementById("showLogin").addEventListener("click", (event) => {
    event.preventDefault();
    showLogin();
});

document.getElementById("showRegister").addEventListener("click", (event) => {
    event.preventDefault();
    showRegister();
});

// Evento para fechar o modal ao clicar no botão de fechar
document.getElementById("closeModal").addEventListener("click", closeModal);

// Fechar o modal ao clicar fora do conteúdo
window.onclick = function(event) {
    if (event.target === document.getElementById("loginRegisterModal")) {
        closeModal();
    }
};

// Abrir o carrinho ao clicar no ícone do carrinho
document.getElementById("cart_icon").addEventListener("click", openCart);

// Fechar o carrinho ao clicar no botão de fechar
document.getElementById("close_cart").addEventListener("click", closeCart);

// Função simulada para verificar se o usuário está logado
function isLoggedIn() {
    // Retorne true se o usuário estiver logado, false se não estiver
    // Substitua isso pela lógica real, como verificar um token de sessão ou cookie
    return false; // Supondo que o usuário não esteja logado
}

// Função para adicionar um item ao carrinho
function addToCart(productName, productPrice, productImg) {
    const existingItem = cartItems.find(item => item.name === productName);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cartItems.push({
            name: productName,
            price: productPrice,
            img: productImg,
            quantity: 1
        });
    }

    updateCart();
    document.getElementById("cart").classList.add("active");
}

// Função para atualizar o conteúdo do carrinho
function updateCart() {
    const cartContent = document.getElementById("cartContent");
    cartContent.innerHTML = "";
    let total = 0;

    let hasItems = false;

    cartItems.forEach(item => {
        total += item.price * item.quantity;

        const cartBox = document.createElement("div");
        cartBox.classList.add("cart_box");

        cartBox.innerHTML = `
            <img src="${item.img}" alt="${item.name}">
            <div class="detail_box">
                <div class="cart_product_tittle">${item.name}</div>
                <div class="cart_price">R$${item.price.toFixed(2)}</div>
                <div class="cart_quantity_container">
                    <button class="cart_decrease">-</button>
                    <input class="cart_quantity" type="number" value="${item.quantity}" readonly>
                    <button class="cart_increase">+</button>
                </div>
            </div>
            <button class="cart_remove bx bx-trash-alt"></button>
        `;

        cartContent.appendChild(cartBox);

        cartBox.querySelector(".cart_remove").addEventListener("click", () => {
            cartItems = cartItems.filter(cartItem => cartItem.name !== item.name);
            updateCart();
        });

        cartBox.querySelector(".cart_decrease").addEventListener("click", () => {
            if (item.quantity > 1) {
                item.quantity -= 1;
            } else {
                cartItems = cartItems.filter(cartItem => cartItem.name !== item.name);
            }
            updateCart();
        });

        cartBox.querySelector(".cart_increase").addEventListener("click", () => {
            item.quantity += 1;
            updateCart();
        });

        hasItems = true;
    });

    document.getElementById("totalPrice").textContent = `R$${total.toFixed(2)}`;

    if (hasItems) {
        document.getElementById("emptyCartMessage").style.display = "none";
    } else {
        document.getElementById("emptyCartMessage").style.display = "block";
        closeCart(); // Fechar o carrinho se não houver mais itens
    }
}

updateCart();

// Função para iniciar o checkout
document.querySelector('.btn_buy').addEventListener('click', () => {
    if (cartItems.length === 0) {
        alert("O carrinho está vazio. Adicione itens antes de comprar.");
        return;
    }

    if (!isLoggedIn()) {
        openModal(); // Abre o modal de login se o usuário não estiver logado
    } else {
        document.getElementById("customerFormModal").style.display = "flex";
    }
});

// Fechar o modal de formulário ao clicar no botão de fechar
document.getElementById('closeCustomerForm').addEventListener('click', () => {
    document.getElementById("customerFormModal").style.display = "none";
});

// Capturar e Submeter os Dados do Formulário
document.getElementById('customerForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const customerData = {
        name: document.getElementById('name').value,
        address: document.getElementById('address').value,
        houseNumber: document.getElementById('houseNumber').value,
        cep: document.getElementById('cep').value,
        email: document.getElementById('email').value,
    };

    try {
        const response = await fetch('/create-preference', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer: customerData,
                items: cartItems.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            })
        });

        const data = await response.json();

        if (data.ticket_url) {
            document.getElementById("customerFormModal").style.display = "none";

            // Criar overlay e modal do iframe de pagamento
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            const modal = document.createElement('div');
            modal.className = 'modal-content';

            const iframe = document.createElement('iframe');
            iframe.src = data.ticket_url;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.border = 'none';

            const closeButton = document.createElement('button');
            closeButton.className = 'modal-close';
            closeButton.textContent = '×';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(overlay);
            });

            modal.appendChild(closeButton);
            modal.appendChild(iframe);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Redirecionar após o pagamento confirmado (simulação)
            setTimeout(() => {
                window.location.href = '/assets/pages/sucess.html'; 
            }, 5000);
        } else {
            console.error('Erro: Não foi possível obter o link de pagamento.');
        }
    } catch (error) {
        console.error('Erro ao criar a preferência de pagamento:', error);
    }
});