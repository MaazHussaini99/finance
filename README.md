# Transaction Categorizer

A full-stack personal finance web application for automatically categorizing and tracking transactions from multiple bank accounts and credit cards with real-time API synchronization powered by **Teller.io**.

## Features

- **Real-time Bank Integration**: Connect Bank of America, Chase, Discover, American Express, and 11,000+ other institutions via Teller API
- **Automatic Categorization**: Smart categorization engine that automatically sorts transactions into predefined categories
- **Monthly Breakdown**: View spending by category for each month
- **Dashboard**: Comprehensive overview of all transactions with editing capabilities
- **CSV Upload**: Fallback option to manually upload transaction CSV files
- **Auto-sync**: Transactions automatically sync every 6 hours
- **Duplicate Detection**: Prevents importing the same transaction twice

## Tech Stack

**Backend:**
- Node.js + Express
- SQLite database
- Teller API for bank connections
- Natural language processing for categorization

**Frontend:**
- React + TypeScript
- Vite for build tooling
- Axios for API calls
- Recharts for visualizations

## Prerequisites

- Node.js 18+ and npm
- A Teller account (free for up to 100 connections)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd finance
npm run install-all
```

### 2. Set Up Teller API Credentials

1. **Sign up for Teller:**
   - Visit: https://teller.io
   - Create a free account

2. **Get your API key:**
   - Go to your Teller dashboard
   - Navigate to API Keys section
   - Copy your API key

3. **Create environment file:**

```bash
cd backend
cp .env.example .env
```

4. **Edit `backend/.env` and add your Teller credentials:**

```env
TELLER_API_KEY=your_teller_api_key_here
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

1. Open http://localhost:3000
2. Click **"Connect Accounts"** tab
3. Click **"+ Connect New Account"**
4. A Teller Connect window will open
5. Search for your bank (e.g., "Chase", "Bank of America", "Discover", "Amex")
6. Login with your real bank credentials (handled securely by Teller)
7. After successful connection, you'll receive an access token
8. Copy the access token and paste it in the app
9. Click **"Save Token"** to complete the connection
10. Your transactions will sync automatically!

### Syncing Transactions

- **Automatic**: Transactions sync every 6 hours automatically
- **Manual**: Click "Sync" next to any account or "Sync All Accounts"
- Initial sync pulls up to 500 most recent transactions
- Duplicate detection prevents re-importing the same transactions

### Viewing Your Data

- **Dashboard**: See all transactions, category summaries, and edit categories
- **Monthly Breakdown**: View spending by category for each month with visual breakdowns
- **Upload CSV**: Alternative method to import transactions via CSV files

### Supported Institutions (via Teller)

- Bank of America
- Chase
- Discover
- American Express
- Wells Fargo
- Citibank
- Capital One
- And 11,000+ more institutions

## Teller API

### Pricing

- **Free Tier**: Up to 100 connections (perfect for personal use!)
- **Paid Plans**: Available for larger scale applications

### Features

- Real-time transaction data
- Secure OAuth-based authentication
- Bank-level security (256-bit encryption)
- No screen scraping - uses official bank APIs when available
- Automatic daily updates

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

You can manually edit categories for any transaction.

## Project Structure

```
finance/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server file
│   │   ├── database.js           # SQLite database setup
│   │   ├── tellerClient.js       # Teller API client
│   │   ├── categorizer.js        # Transaction categorization engine
│   │   ├── parsers/
│   │   │   └── csvParser.js      # CSV parsing for manual uploads
│   │   └── routes/
│   │       ├── transactions.js   # Transaction API endpoints
│   │       ├── categories.js     # Category API endpoints
│   │       └── teller.js         # Teller integration endpoints
│   ├── data/                     # SQLite database storage
│   ├── package.json
│   └── .env                      # Environment variables (create this)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectAccount.tsx   # Teller connection UI
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

### Teller Integration
- `POST /api/teller/create_enrollment` - Generate Teller enrollment URL
- `POST /api/teller/save_enrollment` - Save Teller access token and fetch accounts
- `GET /api/teller/accounts` - Get all connected accounts
- `POST /api/teller/sync/:accountId` - Sync transactions for an account
- `POST /api/teller/sync_all` - Sync all connected accounts
- `DELETE /api/teller/account/:accountId` - Disconnect an account

### Transactions
- `GET /api/transactions` - Get all transactions (with optional filters)
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

- All bank credentials are handled securely by Teller (never stored in this app)
- Access tokens are stored in local SQLite database
- Teller uses bank-level 256-bit encryption
- OAuth connections when available
- Multi-factor authentication supported

## Troubleshooting

### Teller Connection Issues

If you see "Failed to save enrollment":
1. Check that your `.env` file has the correct `TELLER_API_KEY`
2. Verify your Teller account is active
3. Ensure the access token was copied correctly

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

## Teller vs Plaid

This app uses **Teller** instead of Plaid for several reasons:

| Feature | Teller | Plaid |
|---------|--------|-------|
| Free Tier | ✅ 100 connections | ❌ Sandbox only |
| Setup | ✅ Immediate access | ❌ Requires approval |
| API Complexity | ✅ Simple | ⚠️ Complex |
| Personal Use | ✅ Perfect | ⚠️ Production requires payment |
| Developer Experience | ✅ Excellent | ⚠️ Good |

## Future Enhancements

- [ ] Budget tracking and alerts
- [ ] Recurring transaction detection
- [ ] Custom categorization rules editor
- [ ] Export to CSV/PDF
- [ ] Multi-user support with authentication
- [ ] Mobile app
- [ ] Receipt upload and OCR
- [ ] Investment account tracking
- [ ] Bill payment reminders

## Alternative: CSV Upload

If you prefer not to use the Teller API, the app fully supports CSV uploads:

1. Download transaction CSVs from your bank websites
2. Click **"Upload CSV"** tab
3. Select your bank or use auto-detect
4. Upload the file
5. Transactions are automatically categorized

Supported CSV formats:
- Bank of America
- Chase
- Discover
- American Express
- Generic CSV (with date, description, amount columns)

## License

MIT

## Support

For issues or questions:
- Check the Teller documentation: https://teller.io/docs
- Review the troubleshooting section above
- Open an issue on GitHub

## Contributing

This is a personal project, but contributions are welcome! Feel free to fork and submit pull requests.
