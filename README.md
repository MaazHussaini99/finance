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

### 2. Set Up Teller SSL Certificates

1. **Sign up for Teller:**
   - Visit: https://teller.io
   - Create a free account

2. **Download your SSL certificates:**
   - Go to your Teller dashboard: https://teller.io/dashboard
   - Navigate to "API Certificates" or "Application" section
   - Download both files:
     - `certificate.pem`
     - `private_key.pem`

3. **Place certificates in the project:**
   ```bash
   # Move your downloaded certificates to the backend/certs directory
   mv ~/Downloads/certificate.pem backend/certs/
   mv ~/Downloads/private_key.pem backend/certs/
   ```

4. **Create environment file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

5. **Get your Application ID:**
   - In Teller dashboard, go to the "Application" section
   - Copy your **Application ID** (it looks like `app_xxxxx`)

6. **Edit `backend/.env`:**
   ```env
   TELLER_CERT_PATH=./certs/certificate.pem
   TELLER_KEY_PATH=./certs/private_key.pem
   TELLER_APPLICATION_ID=app_your_id_here
   TELLER_ENV=production
   PORT=3001
   NODE_ENV=development
   ```

   **Important:**
   - Use `TELLER_ENV=production` to connect your REAL bank accounts (Bank of America, Chase, Discover, Amex, etc.)
   - Use `TELLER_ENV=sandbox` only for testing with fake data
   - This app is designed for local personal use with production mode

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

### Connecting Your Accounts (Production Mode)

1. Open http://localhost:3000
2. Click **"Connect Accounts"** tab
3. Click **"+ Connect New Account"**
4. Teller Connect window will open
5. Search for your bank (e.g., "Chase", "Bank of America", "Discover", "Amex")
6. **Login with your REAL bank credentials** (handled securely by Teller - never stored in this app)
7. Complete any multi-factor authentication if required by your bank
8. Select which accounts to share (or all will be connected automatically)
9. **That's it!** Your account connects automatically and transactions sync immediately

**Security Note:** Your bank username and password are NEVER stored in this application. Teller Connect handles all authentication client-side using bank-level 256-bit encryption. Only an access token is stored locally to fetch your transactions. The entire authentication flow is handled securely by Teller's official JavaScript library.

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
- `POST /api/teller/save_enrollment` - Save Teller access token (provided by TellerConnect.setup()) and fetch accounts
- `GET /api/teller/accounts` - Get all connected accounts
- `POST /api/teller/sync/:accountId` - Sync transactions for an account
- `POST /api/teller/sync_all` - Sync all connected accounts
- `DELETE /api/teller/account/:accountId` - Disconnect an account

**Note:** Teller Connect enrollment is handled client-side using the official Teller Connect JavaScript library. The enrollment URL generation endpoint is no longer needed.

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

- **mTLS Authentication**: Uses mutual TLS with SSL certificates for secure API communication
- **Certificate-based**: Your certificate.pem and private_key.pem authenticate your application
- All bank credentials are handled securely by Teller (never stored in this app)
- Access tokens are stored in local SQLite database
- Teller uses bank-level 256-bit encryption
- OAuth connections when available
- Multi-factor authentication supported

**Certificate Security:**
- Keep your `certificate.pem` and `private_key.pem` files secure
- Never commit them to git (already in .gitignore)
- Treat them like passwords - they authenticate your app to Teller

## Troubleshooting

### Teller Connection Issues

If you see "Failed to load Teller SSL certificates":
1. Check that `certificate.pem` and `private_key.pem` are in `backend/certs/`
2. Verify the file names are exactly: `certificate.pem` and `private_key.pem`
3. Ensure `.env` has correct paths:
   ```env
   TELLER_CERT_PATH=./certs/certificate.pem
   TELLER_KEY_PATH=./certs/private_key.pem
   ```

If you see "Failed to save enrollment":
1. Verify your certificates are valid and not expired
2. Check that your Teller account is active
3. Ensure the access token was copied correctly from Teller Connect

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
