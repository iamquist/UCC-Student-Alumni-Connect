import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, disconnectDB } from '../db/init.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COLLECTIONS = [
  'users', 'studentprofiles', 'alumniprofiles', 'posts', 'conversations',
  'messages', 'connections', 'notifications', 'jobopportunities', 'events',
  'mentorshiprequests', 'studentquestions', 'skills', 'activitylogs',
  'savedsearches', 'settings', 'contentmoderations',
];

async function backup() {
  await connectDB();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../../backups', timestamp);
  await fs.mkdir(backupDir, { recursive: true });

  logger.info(`Starting backup to: ${backupDir}`);
  const summary = {};

  for (const collectionName of COLLECTIONS) {
    try {
      const collection = mongoose.connection.collection(collectionName);
      const docs = await collection.find({}).toArray();
      const filePath = path.join(backupDir, `${collectionName}.json`);
      await fs.writeFile(filePath, JSON.stringify(docs, null, 2));
      summary[collectionName] = docs.length;
      logger.info(`  ✓ ${collectionName}: ${docs.length} documents`);
    } catch (err) {
      logger.error(`  ✗ Failed to backup ${collectionName}`, err);
      summary[collectionName] = 'ERROR';
    }
  }

  const meta = { timestamp, collections: summary, totalCollections: COLLECTIONS.length };
  await fs.writeFile(path.join(backupDir, '_meta.json'), JSON.stringify(meta, null, 2));

  logger.info(`Backup complete: ${backupDir}`);
  await disconnectDB();
  return backupDir;
}

backup().catch(err => {
  logger.error('Backup failed', err);
  process.exit(1);
});
