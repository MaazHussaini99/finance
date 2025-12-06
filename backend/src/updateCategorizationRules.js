#!/usr/bin/env node
/**
 * Script to update categorization rules in the database
 * This will clear old rules and insert the comprehensive new rules
 */

const db = require('./database');

console.log('Updating categorization rules...');

// Clear existing rules
const deleteStmt = db.prepare('DELETE FROM categorization_rules');
const deleted = deleteStmt.run();
console.log(`✓ Deleted ${deleted.changes} old rules`);

// Insert comprehensive new rules
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
  INSERT INTO categorization_rules (pattern, category, priority) VALUES (?, ?, ?)
`);

let insertedCount = 0;
defaultRules.forEach((rule) => {
  insertRule.run(rule.pattern, rule.category, rule.priority);
  insertedCount++;
});

console.log(`✓ Inserted ${insertedCount} new comprehensive rules`);
console.log('\nRules updated successfully!');
console.log('\nNext steps:');
console.log('1. Restart your backend server to reload the rules');
console.log('2. Visit the app and your transactions will be categorized with the new rules');
console.log('3. To recategorize existing transactions, run: npm run recategorize');
