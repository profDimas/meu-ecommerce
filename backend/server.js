const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Conexão MySQL

const app = express();
const PORT = 3000;
const SECRET_KEY = "minha_chave_secreta_super_segura_para_jwt";

app.use(cors());
app.use(express.json());

// --- MIDDLEWARES ---
function autenticarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ mensagem: "Acesso negado." });

    jwt.verify(token, SECRET_KEY, (err, usuario) => {
        if (err) return res.status(403).json({ mensagem: "Token inválido." });
        req.usuario = usuario;
        next();
    });
}

function autorizarAdmin(req, res, next) {
    if (req.usuario.role !== 'admin') {
        return res.status(403).json({ mensagem: "Acesso restrito a Administradores." });
    }
    next();
}

// ==========================================
// ROTA DE CADASTRO DE USUÁRIOS
// ==========================================
app.post('/api/cadastro', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ sucesso: false, mensagem: "Preencha todos os campos!" });
    }

    try {
        // 1. Verifica se e-mail já existe
        const [usuarios] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuarios.length > 0) {
            return res.status(400).json({ sucesso: false, mensagem: "E-mail já cadastrado!" });
        }

        // 2. Criptografa a senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(password, salt);

        // 3. Insere o novo usuário (por padrão como 'client')
        await db.query(
            'INSERT INTO usuarios (nome, email, senha, role) VALUES (?, ?, ?, ?)',
            [name, email, senhaCriptografada, 'client']
        );

        res.status(201).json({ sucesso: true, mensagem: "Usuário cadastrado com sucesso!" });
    } catch (error) {
        console.error("Erro no cadastro:", error);
        res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
    }
});

// ==========================================
// ROTA DE LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Busca o usuário no MySQL
        const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuarios.length === 0) {
            return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos!" });
        }

        const usuario = usuarios[0];

        // 2. Compara a senha digitada com a hash salva no banco
        const senhaValida = await bcrypt.compare(password, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ sucesso: false, mensagem: "E-mail ou senha incorretos!" });
        }

        // 3. Gera o Token JWT com o NOME REAL do MySQL (usuario.nome)
        const payload = { 
            id: usuario.id, 
            name: usuario.nome, 
            role: usuario.role 
        };
        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '2h' });

        return res.json({
            sucesso: true,
            token: token,
            user: payload
        });

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ sucesso: false, mensagem: "Erro no servidor ao autenticar." });
    }
});

// --- ROTAS PROTEGIDAS ---
app.get('/api/admin/produtos', autenticarToken, autorizarAdmin, (req, res) => {
    res.json({ mensagem: "Acesso autorizado ao painel admin!" });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT} e conectado ao MySQL!`);
});