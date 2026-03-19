import { Setting } from '../db/models/index.js';

const DEFAULTS = {
  maintenanceMode: false,
  registrationOpen: true,
  emailNotifications: true,
  smsNotifications: false,
  maxFileSize: 5242880,
  allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'],
  maxConnectionsPerUser: 5000,
  postsPerPage: 20,
};

export async function getSettings() {
  const settings = await Setting.find({});
  const result = { ...DEFAULTS };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}

export async function updateSettings(newValues) {
  const ops = Object.entries(newValues).map(([key, value]) => ({
    updateOne: {
      filter: { key },
      update: { $set: { key, value } },
      upsert: true,
    },
  }));
  if (ops.length > 0) await Setting.bulkWrite(ops);
  return getSettings();
}

export async function getSetting(key) {
  const s = await Setting.findOne({ key });
  return s ? s.value : DEFAULTS[key];
}

export default { getSettings, updateSettings, getSetting };
