const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'transactions.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    institution TEXT NOT NULL,
    account_type TEXT NOT NULL,
    account_id INTEGER,
    transaction_id TEXT,
    hash TEXT UNIQUE,
    original_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES connected_accounts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS connected_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT NOT NULL,
    enrollment_id TEXT,
    institution_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    account_type TEXT,
    account_subtype TEXT,
    mask TEXT,
    last_sync DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT '📁',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categorization_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pattern TEXT NOT NULL,
    category TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_category_cache (
    description TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
  CREATE INDEX IF NOT EXISTS idx_transactions_institution ON transactions(institution);
  CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(hash);
  CREATE INDEX IF NOT EXISTS idx_connected_accounts_enrollment ON connected_accounts(enrollment_id);
`);

const defaultCategories = [
  { name: 'Groceries', color: '#10b981', icon: '🛒' },
  { name: 'Dining', color: '#f59e0b', icon: '🍽️' },
  { name: 'Transportation', color: '#3b82f6', icon: '🚗' },
  { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
  { name: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
  { name: 'Bills & Utilities', color: '#ef4444', icon: '💡' },
  { name: 'Healthcare', color: '#06b6d4', icon: '🏥' },
  { name: 'Travel', color: '#14b8a6', icon: '✈️' },
  { name: 'Income', color: '#22c55e', icon: '💰' },
  { name: 'Other', color: '#6b7280', icon: '📌' }
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, color, icon) VALUES (?, ?, ?)
`);

defaultCategories.forEach(cat => {
  insertCategory.run(cat.name, cat.color, cat.icon);
});

const defaultRules = [
  // Groceries - comprehensive grocery store patterns
  {
    pattern: 'whole foods|trader joe|safeway|kroger|publix|wegmans|costco|sam\'s club|bj\'s wholesale|' +
             'albertsons|vons|ralphs|food lion|giant|stop & shop|hannaford|fred meyer|king soopers|' +
             'harris teeter|meijer|heb|winco|aldi|lidl|sprouts|fresh market|mariano|jewel osco|' +
             'winn dixie|piggly wiggly|acme|shoprite|price chopper|market basket|wegman|hy-vee|' +
             'food 4 less|save mart|smart & final|gelson|bristol farms|nugget market|raley|' +
             'grocery|supermarket|market',
    category: 'Groceries',
    priority: 10
  },

  // Dining & Restaurants
  {
    pattern: 'restaurant|cafe|coffee|starbucks|dunkin|mcdonald|burger king|wendy|taco bell|kfc|' +
             'chipotle|subway|panera|chick-fil-a|five guys|shake shack|in-n-out|whataburger|' +
             'pizza hut|domino|papa john|little caesars|pizza|pizzeria|' +
             'cheesecake factory|olive garden|red lobster|applebee|chili|outback|' +
             'buffalo wild|texas roadhouse|longhorn|cracker barrel|denny|ihop|waffle house|' +
             'panda express|pei wei|benihana|p.f. chang|asian|sushi|hibachi|' +
             'dining|eatery|bistro|grill|tavern|bar & grill|pub|brewpub|' +
             'doordash|uber eats|grubhub|postmates|seamless|food delivery|' +
             'bakery|deli|bagel|donut|krispy kreme',
    category: 'Dining',
    priority: 10
  },

  // Transportation - gas, parking, rideshare, public transit
  {
    pattern: 'uber|lyft|taxi|cab|rideshare|' +
             'shell|chevron|exxon|mobil|bp|arco|sunoco|marathon|speedway|circle k|' +
             '76|valero|conoco|phillips 66|citgo|gulf|texaco|amoco|' +
             'gas station|fuel|gasoline|petrol|' +
             'parking|park & ride|valet|garage|meter|' +
             'metro|subway|bus|transit|mta|bart|septa|mbta|cta|wmata|' +
             'toll|ezpass|fastrak|sunpass|ipass|' +
             'car wash|oil change|jiffy lube|valvoline|midas|pep boys|autozone|advance auto|' +
             'dmv|registration|smog check',
    category: 'Transportation',
    priority: 10
  },

  // Shopping - retail stores
  {
    pattern: 'amazon|amzn|prime|aws marketplace|' +
             'target|walmart|best buy|' +
             'home depot|lowes|ace hardware|menards|true value|' +
             'bed bath|container store|ikea|wayfair|overstock|' +
             'macy|nordstrom|kohl|jcpenney|dillard|sears|' +
             'tj maxx|marshalls|ross|burlington|homegoods|' +
             'gap|old navy|banana republic|h&m|zara|uniqlo|forever 21|' +
             'nike|adidas|foot locker|finish line|dick\'s sporting|' +
             'sephora|ulta|sally beauty|cvs beauty|' +
             'staples|office depot|officemax|' +
             'ebay|etsy|wish|aliexpress|' +
             'apple store|microsoft store|' +
             'petco|petsmart|pet supplies',
    category: 'Shopping',
    priority: 10
  },

  // Entertainment - streaming, movies, games, hobbies
  {
    pattern: 'netflix|hulu|disney|hbo|showtime|paramount|peacock|discovery|' +
             'amazon prime video|apple tv|youtube premium|' +
             'spotify|apple music|pandora|tidal|soundcloud|' +
             'movie|cinema|theater|amc|regal|cinemark|' +
             'playstation|xbox|nintendo|steam|epic games|blizzard|riot games|' +
             'twitch|patreon|onlyfans|' +
             'gym|fitness|planet fitness|24 hour fitness|la fitness|equinox|orange theory|' +
             'concert|ticketmaster|stubhub|vivid seats|eventbrite|' +
             'golf|bowling|arcade|mini golf|laser tag|escape room|' +
             'zoo|aquarium|museum|theme park|disneyland|universal studios|six flags|' +
             'books|barnes|bookstore|audible|kindle',
    category: 'Entertainment',
    priority: 10
  },

  // Bills & Utilities - comprehensive utility patterns
  {
    pattern: 'electric|electricity|power|pge|sce|duke energy|constellation|' +
             'water|sewer|waste management|trash|recycling|republic services|' +
             'gas company|natural gas|propane|' +
             'internet|comcast|xfinity|spectrum|cox|att|verizon fios|centurylink|optimum|' +
             'phone bill|wireless|t-mobile|sprint|boost mobile|cricket|metro pcs|' +
             'cable|directv|dish network|sling|' +
             'insurance|geico|state farm|progressive|allstate|farmers|liberty mutual|usaa|' +
             'rent|lease|apartment|housing|property management|' +
             'mortgage|loan payment|wells fargo home|quicken loans|' +
             'hoa|homeowner association|condo fee|' +
             'storage unit|public storage|extra space|' +
             'pest control|lawn care|landscaping|pool service',
    category: 'Bills & Utilities',
    priority: 10
  },

  // Healthcare - medical, dental, pharmacy
  {
    pattern: 'cvs pharmacy|walgreens|rite aid|pharmacy|prescription|rx|' +
             'hospital|medical center|clinic|urgent care|emergency|' +
             'doctor|physician|dr\\.|dentist|dental|orthodont|' +
             'optometry|eye care|vision|eyeglasses|contacts|lenscrafters|pearle vision|' +
             'physical therapy|chiropract|massage|acupuncture|' +
             'lab corp|quest diagnostics|laboratory|' +
             'mental health|therapist|counselor|psychiatr|psycholog|' +
             'veterinary|vet|animal hospital|banfield',
    category: 'Healthcare',
    priority: 10
  },

  // Travel - airlines, hotels, vacation
  {
    pattern: 'airline|flight|united|delta|american airlines|southwest|jetblue|alaska air|spirit|frontier|' +
             'hotel|hilton|marriott|hyatt|ihg|holiday inn|best western|motel|inn|resort|' +
             'airbnb|vrbo|booking\\.com|expedia|hotels\\.com|priceline|kayak|orbitz|travelocity|' +
             'rental car|hertz|enterprise|avis|budget|national|alamo|thrifty|dollar|' +
             'cruise|carnival|royal caribbean|norwegian|princess cruises|' +
             'travel|vacation|trip|tour',
    category: 'Travel',
    priority: 10
  },

  // Income - salary, payroll, deposits
  {
    pattern: 'payroll|salary|paycheck|wages|direct deposit|direct dep|dd|' +
             'venmo|zelle|cashapp|cash app|paypal|square cash|' +
             'refund|reimbursement|tax refund|irs treas|' +
             'dividend|interest earned|interest income|' +
             'bonus|commission|tip',
    category: 'Income',
    priority: 10
  },

  // Additional categories with high-priority patterns

  // Subscriptions (separate from Entertainment for better tracking)
  {
    pattern: 'subscription|monthly membership|annual fee|membership dues',
    category: 'Entertainment',
    priority: 5
  },

  // ATM withdrawals and transfers
  {
    pattern: 'atm withdrawal|cash withdrawal|atm fee|' +
             'transfer|xfer|payment to|from account',
    category: 'Other',
    priority: 3
  },

  // Education
  {
    pattern: 'tuition|school|university|college|education|student loan|' +
             'coursera|udemy|skillshare|masterclass|textbook',
    category: 'Bills & Utilities',
    priority: 8
  },

  // Charity & Donations
  {
    pattern: 'donation|charity|red cross|salvation army|goodwill|united way|' +
             'gofundme|patreon|kickstarter',
    category: 'Other',
    priority: 8
  }
];

const insertRule = db.prepare(`
  INSERT OR IGNORE INTO categorization_rules (pattern, category, priority) VALUES (?, ?, ?)
`);

defaultRules.forEach((rule) => {
  insertRule.run(rule.pattern, rule.category, rule.priority);
});

module.exports = db;
