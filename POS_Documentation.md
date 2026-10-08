# Point of Sale (POS) Software Documentation

## 1. Overview

Point of Sale (POS) software is a digital system that lets businesses record sales, process payments, and track inventory in real time.

This POS is a **desktop application** built with **Express.js** (backend), **React** (frontend) and **Electron** (desktop shell). It is designed for small and medium shops that need a simple way to manage products, stock, payments and profit.

---

## 2. Features

| Feature | Description |
|---|---|
| **Add Product** | Create products with name, cost price, selling price and quantity. |
| **Product Quantity** | View and update stock levels. Stock decreases automatically on every sale. |
| **Remove Product** | Delete a product that is no longer sold. |
| **Check Profit** | See profit per product, per sale, and for a chosen date range. |
| **Payment Methods** | Add, edit and remove payment methods (Cash, Card, Bank Transfer, Mobile Wallet, etc.). |
| **Make a Sale** | Select products, set quantities, choose a payment method and complete the sale. |
| **Low Stock Alert** | Highlight products whose quantity falls below a set threshold. |

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **React** | User interface (product screens, sales screen, reports) |
| Backend | **Express.js** (Node.js) | REST API and business logic |
| Desktop | **Electron** | Packages the app as a Windows/macOS/Linux desktop program |
| Database | SQLite *(recommended)* | Local storage. MongoDB or PostgreSQL can also be used. |

> **Note:** The database was not specified in the requirements. SQLite is suggested because it needs no separate server and works well inside an Electron app. Replace it if you use another database.

---

## 4. System Architecture

```
┌──────────────────────────────────────────────┐
│                Electron (Main)               │
│  - Creates the app window                    │
│  - Starts the Express server                 │
│                                              │
│   ┌──────────────────┐   HTTP/JSON  ┌──────────────────┐
│   │  React (Renderer)│ ───────────► │  Express.js API  │
│   │  UI / Components │ ◄─────────── │  Routes/Services │
│   └──────────────────┘              └────────┬─────────┘
│                                              │
│                                       ┌──────▼──────┐
│                                       │  Database   │
│                                       └─────────────┘
└──────────────────────────────────────────────┘
```

**Flow:** The user interacts with the React UI → React sends a request to the Express API → Express reads or writes the database → the response is shown in the UI.

---

## 5. Project Structure

```
pos-app/
├── electron/
│   ├── main.js              # Electron entry point
│   └── preload.js           # Safe bridge between Electron and React
├── server/
│   ├── index.js             # Express app entry
│   ├── config/
│   │   └── db.js            # Database connection
│   ├── models/
│   │   ├── Product.js
│   │   ├── Sale.js
│   │   └── PaymentMethod.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── sales.js
│   │   ├── payments.js
│   │   └── reports.js
│   └── controllers/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       │   ├── Products.jsx
│       │   ├── Sales.jsx
│       │   ├── Payments.jsx
│       │   └── Profit.jsx
│       ├── services/api.js  # API calls
│       └── App.jsx
├── package.json
└── README.md
```

---

## 6. Data Models

### 6.1 Product

| Field | Type | Description |
|---|---|---|
| `id` | Integer / ObjectId | Unique identifier |
| `name` | String | Product name |
| `sku` | String | Optional product code / barcode |
| `costPrice` | Number | Price the shop pays to buy the product |
| `sellingPrice` | Number | Price the customer pays |
| `quantity` | Number | Current stock |
| `lowStockLimit` | Number | Alert threshold |
| `createdAt` | Date | Date added |

### 6.2 Payment Method

| Field | Type | Description |
|---|---|---|
| `id` | Integer / ObjectId | Unique identifier |
| `name` | String | e.g. Cash, Card, Bank Transfer |
| `isActive` | Boolean | Whether it can be used in sales |

### 6.3 Sale

| Field | Type | Description |
|---|---|---|
| `id` | Integer / ObjectId | Unique identifier |
| `items` | Array | List of `{ productId, name, quantity, costPrice, sellingPrice }` |
| `totalAmount` | Number | Sum of selling price × quantity |
| `totalCost` | Number | Sum of cost price × quantity |
| `profit` | Number | `totalAmount - totalCost` |
| `paymentMethodId` | Reference | Payment method used |
| `createdAt` | Date | Date and time of sale |

---

## 7. Feature Details

### 7.1 Add Product
1. Open the **Products** page and click **Add Product**.
2. Enter name, cost price, selling price and quantity.
3. Click **Save**. The product appears in the product list.

**Validation:** name is required; prices must be positive numbers; quantity must be zero or more.

### 7.2 Product Quantity (Stock)
- The product list shows the current quantity of every item.
- Quantity can be increased (new stock arrives) or corrected manually.
- Quantity is **reduced automatically** when a sale is completed.
- A sale is blocked if the requested quantity is more than the stock available.

### 7.3 Remove Product
1. In the product list, click **Delete** on the product.
2. Confirm the action.

> **Recommendation:** If a product already appears in past sales, use a *soft delete* (mark as inactive) so old sales and profit reports stay correct.

### 7.4 Check Profit
Profit is calculated as:

```
Profit per unit  = sellingPrice - costPrice
Profit per sale  = Σ (sellingPrice - costPrice) × quantity
Total profit     = Σ profit of all sales in the selected period
Profit margin %  = (Profit / Revenue) × 100
```

**Example:** A product costs 60 and sells for 100. Selling 5 units gives:
- Revenue = 500
- Cost = 300
- Profit = 200
- Margin = 40%

The **Profit** page can filter by **today, this week, this month** or a **custom date range**.

### 7.5 Payment Methods
- **Add:** enter a name (e.g. "Credit Card") and save.
- **Edit / Disable:** rename or deactivate a method without deleting past records.
- **Remove:** delete a method that was never used; otherwise disable it.
- During a sale, the cashier must choose one active payment method.

---

## 8. REST API Reference

Base URL: `http://localhost:5000/api`

### 8.1 Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/products` | Get all products |
| `GET` | `/products/:id` | Get one product |
| `POST` | `/products` | Add a new product |
| `PUT` | `/products/:id` | Update product details or quantity |
| `DELETE` | `/products/:id` | Remove a product |

**Add product – request**
```json
POST /api/products
{
  "name": "Notebook",
  "costPrice": 60,
  "sellingPrice": 100,
  "quantity": 50,
  "lowStockLimit": 5
}
```

**Response**
```json
{
  "id": 1,
  "name": "Notebook",
  "costPrice": 60,
  "sellingPrice": 100,
  "quantity": 50,
  "lowStockLimit": 5
}
```

### 8.2 Payment Methods

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/payments` | List payment methods |
| `POST` | `/payments` | Add a payment method |
| `PUT` | `/payments/:id` | Edit or activate/deactivate |
| `DELETE` | `/payments/:id` | Remove a payment method |

```json
POST /api/payments
{ "name": "Cash" }
```

### 8.3 Sales

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/sales` | List all sales |
| `POST` | `/sales` | Create a sale (reduces stock) |

```json
POST /api/sales
{
  "items": [
    { "productId": 1, "quantity": 2 }
  ],
  "paymentMethodId": 1
}
```

### 8.4 Reports

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/reports/profit?from=2026-09-01&to=2026-09-20` | Profit for a date range |
| `GET` | `/reports/low-stock` | Products below their stock limit |

```json
{
  "from": "2026-09-01",
  "to": "2026-09-20",
  "revenue": 12500,
  "cost": 8000,
  "profit": 4500,
  "margin": 36
}
```

### 8.5 Error Format

```json
{ "error": true, "message": "Not enough stock for product 1" }
```

| Status | Meaning |
|---|---|
| `200` / `201` | Success / Created |
| `400` | Invalid input |
| `404` | Item not found |
| `500` | Server error |

---

## 9. Installation and Setup

### Prerequisites
- Node.js 18 or newer
- npm or yarn

### Steps

```bash
# 1. Clone the project
git clone <your-repo-url> pos-app
cd pos-app

# 2. Install dependencies
npm install
cd client && npm install && cd ..

# 3. Run in development
npm run dev
```

### Suggested `package.json` scripts

```json
{
  "scripts": {
    "server": "node server/index.js",
    "client": "cd client && npm start",
    "electron": "electron electron/main.js",
    "dev": "concurrently \"npm run server\" \"npm run client\" \"wait-on http://localhost:3000 && npm run electron\"",
    "build": "cd client && npm run build",
    "dist": "npm run build && electron-builder"
  }
}
```

---

## 10. Electron Integration

**`electron/main.js`** (simplified)

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Start the Express server inside the Electron process
require('../server/index.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../client/build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

**Packaging:** use `electron-builder` to create an installer (`.exe`, `.dmg`, `.AppImage`).

---

## 11. User Interface Screens

| Screen | Purpose |
|---|---|
| **Dashboard** | Today's sales, profit, low-stock warnings |
| **Products** | Table of products with add, edit, quantity update and delete |
| **New Sale** | Search products, build a cart, select payment method, complete sale |
| **Payment Methods** | Manage available payment methods |
| **Profit Report** | Profit and revenue by date range, best-selling products |

---

## 12. Security and Best Practices

- Keep `contextIsolation: true` and `nodeIntegration: false` in Electron.
- Validate all input on the server (for example with `express-validator` or `joi`).
- Add user login and roles (Admin, Cashier) so only admins can delete products or view profit.
- Use database transactions when saving a sale, so stock and sale records stay consistent.
- Back up the database regularly.
- Never store card numbers; record only the payment method name.

---

## 13. Future Improvements

- Barcode scanner support
- Receipt printing (thermal printer)
- Customer management and discounts
- Multi-user login with roles
- Sales returns and refunds
- Export reports to PDF / Excel
- Cloud sync between multiple shops

---

## 14. Glossary

| Term | Meaning |
|---|---|
| **POS** | Point of Sale, the place and system where a sale is completed |
| **SKU** | Stock Keeping Unit, a unique product code |
| **Cost Price** | What the business pays for the product |
| **Selling Price** | What the customer pays |
| **Profit** | Selling price minus cost price |
| **Margin** | Profit as a percentage of revenue |
