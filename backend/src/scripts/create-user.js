import { connectDB, disconnectDB } from '../db/init.js';
import { registerUser } from '../services/authService.js';
import logger from '../utils/logger.js';

const args = process.argv.slice(2);
const [firstName, lastName, email, password, role = 'admin'] = args;

if (!firstName || !lastName || !email || !password) {
  console.log('Usage: node create-user.js <firstName> <lastName> <email> <password> [role]');
  console.log('Example: node create-user.js Admin User admin@unialum.com Admin@123456 admin');
  process.exit(1);
}

async function createUser() {
  await connectDB();
  try {
    const result = await registerUser({ firstName, lastName, email, password, role });
    logger.info(`User created: ${result.user.email} (${result.user.role})`);
    console.log('\n✓ User created successfully');
    console.log(`  Email: ${result.user.email}`);
    console.log(`  Role:  ${result.user.role}`);
    console.log(`  ID:    ${result.user._id}`);
  } catch (err) {
    logger.error('Failed to create user', err);
    console.error(`\n✗ Error: ${err.message}`);
  } finally {
    await disconnectDB();
  }
}

createUser();
