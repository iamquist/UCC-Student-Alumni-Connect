import { connectDB, disconnectDB } from '../db/init.js';
import { Setting } from '../db/models/index.js';
import logger from '../utils/logger.js';

const MIGRATIONS = [
  {
    version: 1,
    name: 'create_default_settings',
    async up() {
      const defaults = [
        { key: 'maintenanceMode', value: false, description: 'Enable/disable maintenance mode' },
        { key: 'registrationOpen', value: true, description: 'Allow new user registrations' },
        { key: 'emailNotifications', value: true, description: 'Enable email notifications' },
        { key: 'smsNotifications', value: false, description: 'Enable SMS notifications' },
        { key: 'maxFileSize', value: 5242880, description: 'Maximum upload file size in bytes' },
        { key: 'allowedFileTypes', value: ['jpg','jpeg','png','gif','webp','pdf','doc','docx'], description: 'Allowed upload file types' },
        { key: 'maxConnectionsPerUser', value: 5000, description: 'Max connections per user' },
        { key: 'postsPerPage', value: 20, description: 'Posts per page in feed' },
      ];
      for (const s of defaults) {
        await Setting.updateOne({ key: s.key }, { $setOnInsert: s }, { upsert: true });
      }
      logger.info('Migration 1: Default settings created');
    },
  },
];

async function migrate() {
  await connectDB();
  logger.info('Running migrations...');

  for (const migration of MIGRATIONS) {
    try {
      logger.info(`Running migration ${migration.version}: ${migration.name}`);
      await migration.up();
      logger.info(`Migration ${migration.version} completed`);
    } catch (err) {
      logger.error(`Migration ${migration.version} failed`, err);
      throw err;
    }
  }

  logger.info('All migrations completed');
  await disconnectDB();
}

migrate().catch(err => {
  logger.error('Migration runner failed', err);
  process.exit(1);
});
