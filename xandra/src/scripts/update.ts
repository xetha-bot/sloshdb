import Config from '../config.json';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import sha256File from 'sha256-file';
import fetch from 'node-fetch';
import { version } from '../../package.json';
import { exec } from 'child_process';

const execute = promisify(exec);

(async function () {

    const response = await fetch(`https://api.github.com/repos/${Config.owner}/${Config.repository}/releases/latest`);
    const json = await response.json();

    if (`v${version}` === json.tag_name) {
        throw new Error(`Everything is up-to-date.`);
    }

    await fs.unlink(path.join(path.resolve(process.cwd()), 'dist')).catch(() => { });

    const archive = path.join(path.resolve(process.cwd()), Config.filename);

    await execute(`curl -Lo ${Config.filename} https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/${Config.filename}`);
    const res = await fetch(`https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/checksum.txt`);
    const stdout = await res.text();

    const checksum = sha256File(archive);
    const shasum = stdout.split(' ')[0];

    if (shasum !== checksum) {
        throw new Error(`SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`);
    }

    await execute(`tar -xzf ${Config.filename}`);
    await fs.unlink(archive);

    await execute(`npm install --production`);

    console.log('Updated.');

    process.exit();

}()).catch((err) => {

    console.error(err);
    process.exit(1);

});