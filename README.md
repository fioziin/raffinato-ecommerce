# RAFFINATO — Loja Premium

E-commerce de moda premium. Frontend estático + Backend Node.js + MongoDB.

---

## Rodar localmente

### Frontend
Abra `index.html` com o Live Server do VS Code (porta padrão 5500).

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edite o .env com seus valores
npm run seed:admin     # cria o admin
npm run seed:products  # popula os produtos
npm run dev            # inicia o servidor
```

Testar: `http://localhost:5000/api/health`

---

## Deploy

### 1. MongoDB Atlas
1. Crie conta em [mongodb.com/atlas](https://mongodb.com/atlas)
2. Crie um cluster gratuito (M0)
3. Em **Database Access**: crie usuário com senha
4. Em **Network Access**: libere `0.0.0.0/0`
5. Copie a connection string: `mongodb+srv://user:senha@cluster.mongodb.net/raffinato`

### 2. Backend — Railway
1. Crie conta em [railway.app](https://railway.app)
2. New Project → Deploy from GitHub → selecione o repositório
3. Em **Settings → Root Directory**: defina `backend`
4. Em **Variables**, adicione:

| Variável         | Valor                                      |
|------------------|--------------------------------------------|
| `PORT`           | `5000`                                     |
| `MONGODB_URI`    | `mongodb+srv://...` (do Atlas)             |
| `JWT_SECRET`     | string longa e aleatória (mín. 32 chars)   |
| `CORS_ORIGIN`    | `https://SEU-SITE.vercel.app`              |
| `ADMIN_NAME`     | `Admin RAFFINATO`                          |
| `ADMIN_EMAIL`    | `admin@raffinato.com`                      |
| `ADMIN_PASSWORD` | senha forte                                |

5. Após o deploy, copie a URL pública (ex: `https://raffinato-api.up.railway.app`)
6. Execute os seeds via Railway Shell:
```bash
npm run seed:admin
npm run seed:products
```

### 3. Frontend — Vercel
1. Crie conta em [vercel.com](https://vercel.com)
2. New Project → Import do GitHub → selecione o repositório
3. **Framework Preset**: Other
4. **Root Directory**: `/` (raiz do projeto)
5. Não configure build command
6. Clique em Deploy

Após o deploy:
- Copie a URL da Vercel (ex: `https://raffinato.vercel.app`)
- Edite `config.js` na raiz e substitua `COLE_AQUI_A_URL_DO_RAILWAY` pela URL real do Railway
- Faça commit e push — a Vercel atualiza automaticamente

---

## Configurar config.js após deploy

```js
// config.js
window.RAFFINATO_CONFIG = {
  API_URL:
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : 'https://raffinato-api.up.railway.app/api'  // ← URL real do Railway
};
```

---

## Endpoints principais

| Método | Rota                          | Descrição               |
|--------|-------------------------------|-------------------------|
| GET    | `/api/health`                 | Status da API           |
| GET    | `/api/products`               | Listar produtos         |
| POST   | `/api/auth/login`             | Login admin             |
| GET    | `/api/auth/me`                | Dados do admin logado   |
| POST   | `/api/orders`                 | Criar pedido            |
| GET    | `/api/orders/track`           | Rastrear pedido         |
| GET    | `/api/admin/dashboard`        | Stats do dashboard      |
| GET    | `/api/admin/orders`           | Listar pedidos (admin)  |
| GET    | `/api/admin/products`         | Listar produtos (admin) |

---

## Estrutura do projeto

```
SITE/
├── index.html
├── produto.html
├── produtos.html
├── checkout.html
├── obrigado.html
├── rastrear.html
├── config.js          ← URL da API (alterar antes do deploy)
├── main.js
├── products.js
├── styles.css
├── vercel.json
├── assets/
├── admin/
│   ├── login.html
│   ├── dashboard.html
│   ├── products.html
│   ├── orders.html
│   ├── order-detail.html
│   ├── admin.css
│   └── admin.js
└── backend/
    ├── package.json
    ├── .env.example
    └── src/
        ├── server.js
        ├── config/
        ├── models/
        ├── controllers/
        ├── routes/
        ├── middleware/
        └── seed/
```
