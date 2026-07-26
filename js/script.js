document.addEventListener("DOMContentLoaded", () => {
    // --- AUTENTICAÇÃO ---
    const loggedInElements = document.querySelectorAll(".auth-logged-in");
    const loggedOutElements = document.querySelectorAll(".auth-logged-out");
    const userGreeting = document.getElementById("user-greeting");
    const btnLogout = document.getElementById("btn-logout");

    function atualizarInterfaceAuth() {
        const token = localStorage.getItem("user_token");
        const userName = localStorage.getItem("user_name");

        if (token) {
            loggedInElements.forEach(el => el.classList.remove("hidden"));
            loggedOutElements.forEach(el => el.classList.add("hidden"));
            if (userGreeting) userGreeting.textContent = `Olá, ${userName || 'Usuário'}`;
        } else {
            loggedInElements.forEach(el => el.classList.add("hidden"));
            loggedOutElements.forEach(el => el.classList.remove("hidden"));
        }
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_name");
            atualizarInterfaceAuth();
        });
    }

    // --- CARRINHO DE COMPRAS E MODAL ---
    const cartBtn = document.getElementById("cart-btn");
    const cartModal = document.getElementById("cart-modal");
    const closeCart = document.getElementById("close-cart");
    const cartItemsContainer = document.getElementById("cart-items");
    const cartTotalPrice = document.getElementById("cart-total-price");
    const cartCountElement = document.getElementById("cart-count");
    const clearCartBtn = document.getElementById("clear-cart-btn");
    const btnAddCartList = document.querySelectorAll(".btn-add");

    function obterCarrinho() {
        return JSON.parse(localStorage.getItem("cart")) || [];
    }

    function salvarCarrinho(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
        atualizarContadorCarrinho();
    }

    function atualizarContadorCarrinho() {
        const cart = obterCarrinho();
        const totalItens = cart.reduce((acc, item) => acc + item.quantidade, 0);
        if (cartCountElement) cartCountElement.textContent = totalItens;
    }

    function renderizarCarrinho() {
        const cart = obterCarrinho();
        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
            cartTotalPrice.textContent = "R$ 0,00";
            return;
        }

        let total = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantidade;
            total += itemTotal;

            const div = document.createElement("div");
            div.classList.add("cart-item");
            div.innerHTML = `
                <div>
                    <strong>${item.name}</strong><br>
                    <small>Qtd: ${item.quantidade} x R$ ${item.price.toFixed(2).replace('.', ',')}</small>
                </div>
                <div>
                    <strong>R$ ${itemTotal.toFixed(2).replace('.', ',')}</strong>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        cartTotalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // Adicionar item
    btnAddCartList.forEach(button => {
        button.addEventListener("click", () => {
            const id = button.getAttribute("data-id");
            const name = button.getAttribute("data-name");
            const price = parseFloat(button.getAttribute("data-price"));

            let cart = obterCarrinho();
            const itemExistente = cart.find(item => item.id === id);

            if (itemExistente) {
                itemExistente.quantidade += 1;
            } else {
                cart.push({ id, name, price, quantidade: 1 });
            }

            salvarCarrinho(cart);
            alert(`${name} adicionado ao carrinho!`);
        });
    });

    // Abrir e Fechar Modal
    if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
            e.preventDefault();
            renderizarCarrinho();
            cartModal.classList.remove("hidden");
        });
    }

    if (closeCart) {
        closeCart.addEventListener("click", () => {
            cartModal.classList.add("hidden");
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            localStorage.removeItem("cart");
            atualizarContadorCarrinho();
            renderizarCarrinho();
        });
    }

    // Fechar modal ao clicar fora da caixa
    window.addEventListener("click", (e) => {
        if (e.target === cartModal) {
            cartModal.classList.add("hidden");
        }
    });

    // Inicialização
    atualizarInterfaceAuth();
    atualizarContadorCarrinho();
});