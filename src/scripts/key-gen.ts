import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

(async function () {
    try {
        const key = randomBytes(16).toString('utf-8');
        await fs.writeFile(path.join(process.cwd(), '.env'), `ENCRYPTION_KEY=${key}\nDATABASE_URI=sqlite://tmp/temp.db`);
    } catch (err) {
        console.error(err);
    }
}());