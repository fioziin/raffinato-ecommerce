# RAFFINATO — Backend API

Node.js + Express + MongoDB REST API for the RAFFINATO e-commerce.

## Requirements

- Node.js 18+
- MongoDB 6+ (local or Atlas)

## Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run seed:admin   # create admin user
npm run dev          # start dev server with nodemon
```

## Environment Variables

| Variable         | Default                              | Description                   |
|-----------------|--------------------------------------|-------------------------------|
| PORT            | 5000                                 | Server port                   |
| MONGODB_URI     | mongodb://127.0.0.1:27017/raffinato  | MongoDB connection string      |
| JWT_SECRET      | —                                    | Long random string for JWT     |
| CORS_ORIGIN     | http://127.0.0.1:5500                | Frontend origin (Live Server)  |
| ADMIN_NAME      | Admin RAFFINATO                      | Seed admin display name        |
| ADMIN_EMAIL     | admin@raffinato.com                  | Seed admin email               |
| ADMIN_PASSWORD  | admin123456                          | Seed admin password            |

## API Endpoints

### Auth
| Method | Path           | Auth | Description        |
|--------|---------------|------|--------------------|
| POST   | /api/auth/login | —  | Login, returns JWT |
| GET    | /api/auth/me   | ✓   | Current admin info |

### Products (Public)
| Method | Path                       | Description           |
|--------|---------------------------|-----------------------|
| GET    | /api/products              | List products (filter by `genero`, `ativo`, `q`, `page`, `limit`) |
| GET    | /api/products/:id          | Product by ID         |
| GET    | /api/products/slug/:slug   | Product by slug       |

### Products (Admin)
| Method | Path                                    | Description          |
|--------|-----------------------------------------|----------------------|
| GET    | /api/admin/products                     | List all (with search) |
| POST   | /api/admin/products                     | Create product       |
| PUT    | /api/admin/products/:id                 | Update product       |
| DELETE | /api/admin/products/:id                 | Delete product       |
| PATCH  | /api/admin/products/:id/toggle-active   | Toggle active status |

### Orders (Public)
| Method | Path               | Description                        |
|--------|-------------------|------------------------------------|
| POST   | /api/orders        | Create order                       |
| GET    | /api/orders/track  | Track by `?email=&orderNumber=`    |

### Orders (Admin)
| Method | Path                           | Description                |
|--------|-------------------------------|----------------------------|
| GET    | /api/admin/orders              | List (filter status, q, page) |
| GET    | /api/admin/orders/:id          | Order detail               |
| PATCH  | /api/admin/orders/:id/status   | Update status              |
| GET    | /api/admin/dashboard           | Dashboard stats            |

## Admin Panel

Open `admin/login.html` in your browser (or via Live Server).

Default credentials:
- Email: `admin@raffinato.com`
- Password: `admin123456`

**Change the password after first login.**

## Scripts

```bash
npm run dev        # Start with nodemon (hot reload)
npm start          # Start production server
npm run seed:admin # Create admin user from .env
```
