# F4TE Staff Panel

> Painel interno de staff para hotéis retro Habbo — criando essa versão pra equipe de DEV que me chamou, e resolvi liberar open-source pro nosso projeto.

Eu sou o **f4te**, membro da equipe de DEV de um Habbo pirata, e esse painel é a ferramenta que eu uso (e a galera do MOD usa) pra executar as ações rápidas do dia a dia: teletransportar usuário, mandar alerta, criar evento, abrir chooser, gerenciar hall e pagamentos, e zerar cota. Tudo numa Janelinha flutuante que pode ser minimizada e arrastada pela tela.

---

## ✨ O que o painel faz

- **:TELE** — teletransporta um usuário para qualquer quarto, via API do emulador.
- **ATT.** — envia um alerta global para o hotel.
- **ADD EVENTO.** — cadastra evento no log interno (tipo EVENTO, PAGAMENTO, HALL, CUSTOM).
- **:CHOOSER** — abre um chooser com até 10 opções pra galera votar.
- **Hall** — define/atualiza o hall do hotel (apenas ADMIN).
- **Reg. Pagamento** — registra um pagamento e soma na cota.
- **Zerar Cota** — zera a cota global (apenas ADMIN).
- **Contadores** — `AUMENTAR` / `DIMINUIR` / `QUARTO` / `NICKNAME` / `RESET` no topo.
- **Janela minimizável** — botão `—` recolhe o painel para um FAB flutuante; estado fica salvo no `localStorage` pra reabrir do mesmo jeito.
- **Arrastável** — você pode puxar o painel pela barra superior.
- **Autenticação** — JWT com bcrypt, controle de roles (`MOD`, `ADMIN`, `HELPER`).
- **Logs** — toda ação executada entra na tabela `panel_logs`.

---

## 🧱 Stack

- **Backend:** Node.js + Express + MySQL (`mysql2`, prepared statements).
- **Frontend:** HTML + CSS + JS puro (zero build step, dá pra abrir direto).
- **Segurança:** bcrypt (hash de senha), JWT, helmet, CORS, rate-limit no login.

---

## 📦 Estrutura

```
f4te-panel/
├── backend/
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/auth.js
│   └── routes/
│       ├── auth.js
│       ├── actions.js
│       ├── events.js
│       ├── payments.js
│       └── users.js
├── frontend/
│   ├── index.html
│   ├── css/panel.css
│   └── js/panel.js
├── db/schema.sql
├── .gitignore
├── .env.example
├── LICENSE
└── README.md
```

---

## 🚀 Instalação

```bash
# 1) clonar o projeto
git clone https://github.com/seu-user/f4te-panel.git
cd f4te-panel

# 2) instalar dependências do backend
cd backend
npm install

# 3) configurar variáveis de ambiente
cp .env.example .env
# edite o .env com seu host MySQL, senha e JWT_SECRET

# 4) criar banco e tabelas (execute uma vez)
#    use o arquivo db/schema.sql no seu MySQL/MariaDB
mysql -u root -p < ../db/schema.sql

# 5) subir o servidor
npm start
# servidor rodando em http://localhost:3000
```

A página inicial (`http://localhost:3000`) já carrega o painel. Use o **login** (default `f4te` — troque a senha no primeiro acesso) pra poder executar as ações.

---

## 🔐 Roles

| Role      | O que pode                                                   |
| --------- | ------------------------------------------------------------ |
| `HELPER`  | ATT., pagamentos                                              |
| `MOD`     | tudo do HELPER + :TELE, ADD EVENTO, :CHOOSER                 |
| `ADMIN`   | tudo do MOD + Hall, Zerar Cota, gerenciar usuários internos    |

Pra criar novos usuários do painel, faça login como ADMIN e use `POST /api/users`:
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"senha1234","display_name":"Alice","role":"MOD","rank_habbo":6}'
```

---

## 🧩 Integração com o Emulador

Os endpoints de `:TELE`, `ATT.` e `:CHOOSER` precisam conversar com o emulador (Arcturus/Nitro/whatever). Eu deixei o ponto de integração marcado em `backend/routes/actions.js` com **TODO**. Plugue sua API interna ali — exemplo:

```js
// dentro do router.post('/tele', ...)
await axios.post(`${process.env.EMULATOR_API_URL}/tele`, { user, room }, {
  headers: { 'X-Api-Key': process.env.EMULATOR_API_KEY }
});
```

---

## 🖼️ Screenshot

> _Em breve coloco um print aqui do painel em uso._

---

## 👤 Sobre

Eu (f4te) fiz esse projeto pra equipe interna, mas como tá rodando redondo resolvi abrir o código pra comunidade de devs de retro Habbo adaptarem pro hotel deles. Pull Requests são bem-vindos.

## 📜 Licença

MIT — vê o arquivo `LICENSE`.
