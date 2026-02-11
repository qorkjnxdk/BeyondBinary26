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
const NAMES = [
  'Aisha Binte Rahman', 'Priya Nair', 'Mei Ling Tay', 'Hui Min Loh', 'Siti Nurhaliza',
  'Kavitha Devi', 'Wen Xin Yeo', 'Nur Aisyah', 'Li Hua Zhang', 'Jia Wen Foo',
  'Deepa Krishnan', 'Xiu Ting Poh', 'Fatimah Zahra', 'Yan Ting Chua', 'Rajeswari Pillai',
  'Pei Shan Ho', 'Nadia Ismail', 'Zhi Yi Sim', 'Ananya Sharma', 'Su Ling Wee',
  'Hafizah Othman', 'Yi Xuan Lau', 'Lakshmi Menon', 'Jing Yi Heng', 'Nurul Huda',
  'Mei Fang Chia', 'Rohaya Ahmad', 'Shu Min Kwek', 'Gayathri Rajan', 'Wan Ting Seah',
  'Nur Syafiqah', 'Xin Yi Toh', 'Divya Suresh'
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}
function randomNric() {
  const digits = String(Math.floor(Math.random() * 10000000)).padStart(7, '0');
  return 'S' + digits + String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

const TARGET_ONLINE = 49;

async function main() {
  const existingUsers = db.prepare('SELECT user_id FROM users').all();
  const needed = TARGET_ONLINE - existingUsers.length;

  console.log(`Existing users: ${existingUsers.length}, need to create ${needed} more`);

  if (needed > 0) {
    const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    const insert = db.prepare(`
      INSERT INTO users (
        user_id, singpass_nric, email, password_hash, real_name, gender,
        age, marital_status, employment, hobbies, location, has_baby,
        career_field, privacy_settings, created_at, last_active, account_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    for (let i = 0; i < needed; i++) {
      const email = `user${i + 100}@gmail.com`;
      const userId = uuidv4();
      const now = Date.now();
      const privacy = {
        age: 'anonymous_can_see',
        marital_status: pick(['anonymous_can_see', 'match_can_see']),
        employment: pick(['anonymous_can_see', 'match_can_see']),
        hobbies: 'anonymous_can_see',
        location: pick(['anonymous_can_see', 'match_can_see']),
        has_baby: pick(['anonymous_can_see', 'match_can_see', 'no_one_can_see']),
        career_field: pick(['anonymous_can_see', 'match_can_see'])
      };

      try {
        insert.run(
          userId, randomNric(), email, passwordHash, NAMES[i % NAMES.length], 'F',
          18 + Math.floor(Math.random() * 35),
          pick(MARITAL_STATUSES), pick(EMPLOYMENTS),
          JSON.stringify(pickN(ALL_HOBBIES, 2, 6)),
          pick(LOCATIONS), pick(BABY_STATUSES),
          pick(CAREER_FIELDS), JSON.stringify(privacy), now, now
        );
        console.log(`  Created ${email}`);
      } catch (err) {
        console.error(`  Failed ${email}: ${err.message}`);
      }
    }
  }

  // Set all users as online NOW
  const allUsers = db.prepare('SELECT user_id FROM users LIMIT ?').all(TARGET_ONLINE);

  db.exec('DELETE FROM online_users');

  const insertOnline = db.prepare(
    'INSERT INTO online_users (user_id, last_ping) VALUES (?, ?)'
  );
  const updateLastActive = db.prepare('UPDATE users SET last_active = ? WHERE user_id = ?');

  const now = Date.now();
  let onlineCount = 0;
  for (const user of allUsers) {
    insertOnline.run(user.user_id, now);
    updateLastActive.run(now, user.user_id);
    onlineCount++;
  }

  console.log(`\nDone! ${onlineCount} users are now online (last_active + online_users updated).`);
  db.close();
}

main().catch(console.error);
