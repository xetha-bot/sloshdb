import Config from '../config.json';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import sha256File from 'sha256-file';
import fetch from 'node-fetch';
import { version } from '../../package.json';
import { exec } from 'child_process';
import Logger from '../utils/Logger';

const execute = promisify(exec);

(async function () {
    Logger.info(`Checking for Updates...`);

    const response = await fetch(
        `https://api.github.com/repos/${Config.owner}/${Config.repository}/releases/latest`,
    );
    const json = await response.json();

    if (`v${version}` === json.tag_name) {
        Logger.error(`Everything is up-to-date.`);
        return process.exit(1);
    }

    Logger.info(`New Update Available: ${json.tag_name}`);

    Logger.info('Deleting old files...');
    await fs
        .unlink(path.join(path.resolve(process.cwd()), 'dist'))
        .catch(() => {});

    const archive = path.join(path.resolve(process.cwd()), Config.filename);

    Logger.info('Downloading Update...');
    Logger.profile('download');

    await execute(
        `curl -Lo ${Config.filename} https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/${Config.filename}`,
    );

    Logger.profile('download');

    Logger.info('Fetching Checksums...');
    const res = await fetch(
        `https://github.com/${Config.owner}/${Config.repository}/releases/latest/download/checksum.txt`,
    );

    const stdout = await res.text();

    const checksum = sha256File(archive);
    const shasum = stdout.split(' ')[0];

    Logger.info('Validating Checksums...');
    if (shasum !== checksum) {
        throw new Error(
            `SHA256 Checksum failed. Expected to be '${shasum}' but gotten '${checksum}'`,
        );
    }
    Logger.info(`Checksums Matched!`);

    Logger.info('Installing Update...');
    Logger.profile('install');

    await execute(`tar -xzf ${Config.filename}`);
    await fs.unlink(archive);
    await execute(`npm install --production`);

    Logger.profile('install');

    process.exit();
})().catch((err) => {
    console.error(err);
    process.exit(1);
});
