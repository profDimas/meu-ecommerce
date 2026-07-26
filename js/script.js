document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. CONTROLE DE AUTENTICAÇÃO E PERMISSÕES
    // ==========================================
    const loggedInElements = document.querySelectorAll(".auth-logged-in");
    const loggedOutElements = document.querySelectorAll(".auth-logged-out");
    const userGreeting = document.getElementById("user-greeting");
    const btnLogout = document.getElementById("btn-logout");
    const navAdmin = document.getElementById("nav-admin");

    // Atualiza os elementos visuais com base no estado do login
    function atualizarInterfaceAuth() {
        const token = localStorage.getItem("user_token");
        const userName = localStorage.getItem("user_name");
        const userRole = localStorage.getItem("user_role"); // 'admin' ou 'client'

        if (token) {
            // Exibe botões para usuários autenticados
            loggedInElements.forEach(el => el.classList.remove("hidden"));
            loggedOutElements.forEach(el => el.classList.add("hidden"));

            if (userGreeting) {
                userGreeting.textContent = `Olá, ${userName || 'Usuário'}`;
            }

            // Exibe a aba Administração APENAS se o perfil retornado da API for 'admin'
            if (userRole === "admin" && navAdmin) {
                navAdmin.classList.remove("hidden");
            } else if (navAdmin) {
                navAdmin.classList.add("hidden");
            }

        } else {
            // Esconde botões restritos e a aba de Admin quando estiver deslogado
            loggedInElements.forEach(el => el.classList.add("hidden"));
            loggedOutElements.forEach(el => el.classList.remove("hidden"));

            if (navAdmin) {
                navAdmin.classList.add("hidden");
            }
        }
    }

    // Ação do Botão de Logout
    if (btnLogout) {
        btnLogout.addEventListener("click", (e) => {
            e.preventDefault();
            // Remove o Token JWT e as credenciais
            localStorage.removeItem("user_token");
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_role");
            
            alert("Sessão encerrada com sucesso!");
            atualizarInterfaceAuth();
            
            // Redireciona para a página principal
            window.location.href = "index.html";
        });
    }

    // ==========================================
    // 2. INTEGRAÇÃO COM A API NODE.JS (LOGIN)
    // ==========================================
    const loginForm = document.getElementById("login-form"); // ID do form na tela login.html

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById("email").value;
            const passwordInput = document.getElementById("password").value;

            try {
                // Requisição assíncrona para o servidor Node.js
                const response = await fetch("http://localhost:3000/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailInput,
                        password: passwordInput
                    })
                });

                const data = await response.json();

                if (response.ok && data.sucesso) {
                    // Armazena os dados retornados pela API no localStorage
                    localStorage.setItem("user_token", data.token);
                    localStorage.setItem("user_name", data.user.name);
                    localStorage.setItem("user_role", data.user.role);

                    alert(`Bem-vindo, ${data.user.name}!`);
                    window.location.href = "index.html";
                } else {
                    alert(data.mensagem || "Credenciais inválidas!");
                }
            } catch (error) {
                console.error("Erro na comunicação com a API:", error);
                alert("Erro ao conectar com o servidor Node.js. Verifique se o 'server.js' está rodando!");
            }
        });
    }

    // ==========================================
    // 3. CONTROLE DO CARRINHO DE COMPRAS E MODAL
    // ==========================================
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
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = "";

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
            if (cartTotalPrice) cartTotalPrice.textContent = "R$ 0,00";
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

        if (cartTotalPrice) {
            cartTotalPrice.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        }
    }

    // Evento de Adicionar ao Carrinho
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

    // Eventos do Modal do Carrinho
    if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
            e.preventDefault();
            renderizarCarrinho();
            if (cartModal) cartModal.classList.remove("hidden");
        });
    }

    if (closeCart) {
        closeCart.addEventListener("click", () => {
            if (cartModal) cartModal.classList.add("hidden");
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", () => {
            localStorage.removeItem("cart");
            atualizarContadorCarrinho();
            renderizarCarrinho();
        });
    }

    // Fechar Modal ao clicar no fundo escuro
    window.addEventListener("click", (e) => {
        if (e.target === cartModal) {
            cartModal.classList.add("hidden");
        }
    });

    // ==========================================
    // 4. INICIALIZAÇÃO
    // ==========================================
    atualizarInterfaceAuth();
    atualizarContadorCarrinho();
});