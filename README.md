# Transaction Categorizer

A full-stack web application for automatically categorizing and tracking financial transactions from multiple bank accounts and credit cards with real-time synchronization.

## Features

- **Real-time Bank Integration**: Connect Bank of America, Chase, Discover, American Express, and 11,000+ other institutions via Plaid
- **Automatic Categorization**: Smart categorization engine that automatically sorts transactions into predefined categories
- **Monthly Breakdown**: View spending by category for each month
- **Dashboard**: Comprehensive overview of all transactions with editing capabilities
- **CSV Upload**: Fallback option to manually upload transaction CSV files
- **Auto-sync**: Transactions automatically sync every 6 hours

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- Plaid API for bank connections
- Natural language processing for categorization

**Frontend:**
- React + TypeScript
- Vite for build tooling
- React Plaid Link for account connections
- Recharts for visualizations

## Prerequisites

- Node.js 18+ and npm
- A Plaid account (free for development)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd finance
npm run install-all
```

### 2. Set Up Plaid API Credentials

1. Sign up for a free Plaid account at https://dashboard.plaid.com/signup
2. Get your credentials:
   - Go to Team Settings > Keys
   - Copy your `client_id` and `sandbox` secret
3. Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

4. Edit `backend/.env` and add your Plaid credentials:

```env
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
PORT=3001
NODE_ENV=development
```

### 3. Start the Application

From the root directory:

```bash
# Development mode (runs both frontend and backend)
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

### Connecting Your Accounts

1. Click "Connect Accounts" in the navigation
2. Click "+ Connect New Account"
3. Search for your bank (e.g., "Chase", "Bank of America")
4. Login with your credentials (handled securely by Plaid)
5. Select which accounts to connect
6. Click "Continue" to complete the connection

**Note:** In sandbox mode, use these test credentials:
- Username: `user_good`
- Password: `pass_good`

### Syncing Transactions

- **Automatic**: Transactions sync every 6 hours automatically
- **Manual**: Click "Sync" next to any account or "Sync All Accounts"
- Initial sync pulls up to 2 years of transaction history

### Viewing Your Data

- **Dashboard**: See all transactions, category summaries, and edit categories
- **Monthly Breakdown**: View spending by category for each month
- **Upload CSV**: Alternative method to import transactions via CSV files

### Supported Institutions (via Plaid)

- Bank of America
- Chase
- Discover
- American Express
- Wells Fargo
- Citibank
- Capital One
- And 11,000+ more institutions

## Environment Modes

### Sandbox Mode (Development)
- Use test credentials to simulate bank connections
- No real financial data
- Free to use
- Perfect for testing

### Development Mode (Real Data)
- Connect to real bank accounts
- Requires Plaid Development tier (free)
- Limited to 100 connected items
- Ideal for personal use

### Production Mode
- Full production deployment
- Requires Plaid Production tier (paid)
- Unlimited connections
- Required for public apps

To switch modes, change `PLAID_ENV` in `backend/.env`:
```env
PLAID_ENV=sandbox    # or development or production
```

## Categories

The app includes these default categories:

- 🛒 Groceries
- 🍽️ Dining
- 🚗 Transportation
- 🛍️ Shopping
- 🎬 Entertainment
- 💡 Bills & Utilities
- 🏥 Healthcare
- ✈️ Travel
- 💰 Income
- 📌 Other

You can add custom categories or edit existing ones through the API.

## Project Structure

```
finance/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server file
│   │   ├── database.js           # SQLite database setup
│   │   ├── plaidClient.js        # Plaid API client
│   │   ├── categorizer.js        # Transaction categorization engine
│   │   ├── parsers/
│   │   │   └── csvParser.js      # CSV parsing for manual uploads
│   │   └── routes/
│   │       ├── transactions.js   # Transaction API endpoints
│   │       ├── categories.js     # Category API endpoints
│   │       └── plaid.js          # Plaid integration endpoints
│   ├── data/                     # SQLite database storage
│   ├── package.json
│   └── .env                      # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectAccount.tsx   # Plaid Link integration
│   │   │   ├── Dashboard.tsx        # Main dashboard view
│   │   │   ├── MonthlyBreakdown.tsx # Monthly analysis view
│   │   │   └── Upload.tsx           # CSV upload component
│   │   ├── App.tsx               # Main app component
│   │   ├── api.ts                # API client
│   │   ├── types.ts              # TypeScript types
│   │   └── index.css             # Styles
│   ├── package.json
│   └── vite.config.ts
└── package.json                  # Root package.json
```

## API Endpoints

### Plaid Integration
- `POST /api/plaid/create_link_token` - Generate Plaid Link token
- `POST /api/plaid/exchange_public_token` - Exchange public token for access token
- `GET /api/plaid/accounts` - Get all connected accounts
- `POST /api/plaid/sync/:accountId` - Sync transactions for an account
- `POST /api/plaid/sync_all` - Sync all connected accounts
- `DELETE /api/plaid/account/:accountId` - Disconnect an account

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/stats` - Get category statistics
- `GET /api/transactions/monthly` - Get monthly breakdown
- `POST /api/transactions/upload` - Upload CSV file
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create a category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

## Security

- All bank credentials are handled securely by Plaid (never stored in this app)
- Access tokens are stored encrypted in the SQLite database
- Plaid uses bank-level 256-bit encryption
- OAuth connections are used when available
- Multi-factor authentication is supported

## Troubleshooting

### Plaid Connection Issues

If you see "Failed to initialize Plaid":
1. Check that your `.env` file has correct credentials
2. Verify `PLAID_CLIENT_ID` and `PLAID_SECRET` are set
3. Ensure you're using the correct environment (`sandbox`, `development`, or `production`)

### Database Issues

If the database isn't working:
```bash
# Delete and recreate the database
rm backend/data/transactions.db
# Restart the backend server
npm run dev:backend
```

### Port Already in Use

If port 3000 or 3001 is in use:
```bash
# Change PORT in backend/.env
PORT=3002

# Or kill the process using the port
lsof -ti:3001 | xargs kill
```

## Building for Production

```bash
# Build the frontend
npm run build

# Start the production server
npm start
```

The built frontend will be served by the Express backend at http://localhost:3001

## Future Enhancements

- [ ] Budget tracking and alerts
- [ ] Recurring transaction detection
- [ ] Custom categorization rules editor
- [ ] Export to CSV/PDF
- [ ] Multi-user support with authentication
- [ ] Mobile app
- [ ] Receipt upload and OCR
- [ ] Investment account tracking

## License

MIT

## Support

For issues or questions:
- Check the Plaid documentation: https://plaid.com/docs
- Review the troubleshooting section above
- Open an issue on GitHub
