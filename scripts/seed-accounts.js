const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'app.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const PASSWORD = 'Password123';
const SALT_ROUNDS = 12;

const LOCATIONS = [
  'Woodlands', 'Tampines', 'Jurong East', 'Bedok', 'Ang Mo Kio',
  'Toa Payoh', 'Bishan', 'Clementi', 'Bukit Batok', 'Sengkang',
  'Punggol', 'Yishun', 'Hougang', 'Pasir Ris', 'Bukit Merah',
  'Queenstown', 'Geylang', 'Serangoon', 'Kallang', 'Marine Parade',
  'Choa Chu Kang', 'Bukit Panjang', 'Sembawang', 'Novena', 'Tanjong Pagar'
];

const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed', 'In Relationship', "It's Complicated"];
const EMPLOYMENTS = ['Full-time', 'Part-time', 'Self-employed', 'Unemployed', 'Student', 'Retired', 'Homemaker'];
const BABY_STATUSES = ['Yes', 'No', 'Expecting'];
const CAREER_FIELDS = [
  'Technology', 'Healthcare', 'Education', 'Finance', 'Engineering',
  'Arts & Design', 'Marketing', 'Legal', 'Hospitality', 'Social Work',
  'Science & Research', 'Media & Communications', 'Real Estate', 'Logistics',
  'Government', 'Non-Profit', 'Retail', 'Manufacturing', 'Agriculture', 'Other'
];

const ALL_HOBBIES = [
  'Reading', 'Cooking', 'Yoga', 'Running', 'Swimming', 'Painting',
  'Photography', 'Gardening', 'Hiking', 'Dancing', 'Baking', 'Crafting',
  'Writing', 'Singing', 'Cycling', 'Travelling', 'Gaming', 'Knitting',
  'Meditation', 'Volunteering', 'Board Games', 'Movies', 'Music',
  'Pilates', 'Shopping', 'Journaling', 'Podcasts', 'Pottery', 'Sewing'
];

const FEMALE_NAMES = [
  'Sarah Lim', 'Rachel Tan', 'Michelle Wong', 'Amanda Chen', 'Jessica Ng',
  'Emily Goh', 'Sophia Lee', 'Natalie Koh', 'Chloe Teo', 'Isabelle Ong'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomAge() {
  return 18 + Math.floor(Math.random() * 35); // 18-52
}

function randomNric() {
  const prefix = 'S';
  const digits = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  const suffix = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return prefix + digits + suffix;
}

function randomBabyBirthDate() {
  // Random date within last 18 months
  const now = Date.now();
  const eighteenMonthsAgo = now - (18 * 30 * 24 * 60 * 60 * 1000);
  const randomTime = eighteenMonthsAgo + Math.floor(Math.random() * (now - eighteenMonthsAgo));
  const d = new Date(randomTime);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function generatePrivacySettings() {
  const fields = ['marital_status', 'employment', 'hobbies', 'location', 'has_baby', 'career_field'];
  const levels = ['anonymous_can_see', 'match_can_see', 'no_one_can_see'];
  const settings = {};
  for (const field of fields) {
    settings[field] = pick(levels);
  }
  // Age is always visible
  settings['age'] = 'anonymous_can_see';
  return settings;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const insert = db.prepare(`
    INSERT INTO users (
      user_id, singpass_nric, email, password_hash, real_name, gender,
      age, marital_status, employment, hobbies, location, has_baby,
      baby_birth_date, career_field, privacy_settings, created_at, last_active, account_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  const accounts = [];
  for (let i = 5; i <= 14; i++) {
    const email = `sr${i}@gmail.com`;
    const userId = uuidv4();
    const nric = randomNric();
    const realName = FEMALE_NAMES[i - 5];
    const age = randomAge();
    const maritalStatus = pick(MARITAL_STATUSES);
    const employment = pick(EMPLOYMENTS);
    const hobbies = pickN(ALL_HOBBIES, 2, 6);
    const location = pick(LOCATIONS);
    const hasBaby = pick(BABY_STATUSES);
    const babyBirthDate = (hasBaby === 'Yes' || hasBaby === 'Expecting') ? randomBabyBirthDate() : null;
    const careerField = pick(CAREER_FIELDS);
    const privacySettings = generatePrivacySettings();
    const now = Date.now();

    try {
      insert.run(
        userId, nric, email, passwordHash, realName, 'F',
        age, maritalStatus, employment, JSON.stringify(hobbies), location, hasBaby,
        babyBirthDate, careerField, JSON.stringify(privacySettings), now, now
      );
      accounts.push({ email, realName, age, location, employment, hasBaby, careerField, hobbies });
      console.log(`Created: ${email} (${realName}, age ${age}, ${location})`);
    } catch (err) {
      console.error(`Failed to create ${email}:`, err.message);
    }
  }

  console.log(`\nDone! Created ${accounts.length} accounts.`);
  console.log('Password for all accounts: Password123');
  db.close();
}

main().catch(console.error);
