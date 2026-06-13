import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const DB_PATH = path.join(__dirname, '../../data/nashtypos.db');
const BACKUP_DIR = path.join(__dirname, '../../data/backups');

async function runBackup() {
  console.log('Memulai proses backup database NASHTY POS...');
  
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const dateStr = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
    const backupFile = path.join(BACKUP_DIR, `nashtypos_backup_${dateStr}.sqlite`);
    const zipFile = `${backupFile}.zip`;

    // Copy file database (Aman untuk SQLite jika menggunakan .backup command, tapi copy biasa cukup untuk ini)
    fs.copyFileSync(DB_PATH, backupFile);
    console.log(`Database berhasil disalin ke: ${backupFile}`);

    // Kompres ke ZIP menggunakan perintah OS bawaan
    const platform = process.platform;
    if (platform === 'win32') {
      await execAsync(`powershell Compress-Archive -Path "${backupFile}" -DestinationPath "${zipFile}"`);
    } else {
      await execAsync(`zip -j "${zipFile}" "${backupFile}"`);
    }

    // Hapus file asli setelah dizip
    fs.unlinkSync(backupFile);
    console.log(`Backup berhasil dikompresi ke: ${zipFile}`);

    // TODO: Upload ke S3 / Google Drive / Cloud Storage di sini
    console.log('Silakan hubungkan script ini ke Cloud Storage provider (AWS S3, Google Cloud Storage, dsb).');
    
  } catch (error) {
    console.error('Gagal melakukan backup:', error);
  }
}

runBackup();
