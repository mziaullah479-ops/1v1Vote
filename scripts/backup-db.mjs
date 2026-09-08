import { copyFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const databasePath = path.join(dataDir, '1v1vote.json');
const backupDir = process.env.BACKUP_DIR || path.join(dataDir, 'backups');

await mkdir(backupDir, { recursive: true });
const name = `1v1vote-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
await copyFile(databasePath, path.join(backupDir, name));

const backups = (await readdir(backupDir)).filter((file) => file.startsWith('1v1vote-')).sort().reverse();
await Promise.all(backups.slice(14).map((file) => unlink(path.join(backupDir, file))));
console.log(`Created ${path.join(backupDir, name)}`);
