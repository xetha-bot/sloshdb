import Base64 from '@xetha/base64';
import { Socket } from 'socket.io';
import { ExtendedError } from 'socket.io/dist/namespace';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import validator from 'validator';
import { User } from './dispatcher/dispatcher';
import hash from './dispatcher/hash';
import Logger from './utils/Logger';

export default async function authenticator(socket: Socket<DefaultEventsMap, DefaultEventsMap>, next: (err?: ExtendedError) => void) {


    Logger.info(
        `[${socket.id}|${socket.handshake.address.replace(
            /\:\:ffff\:/g,
            '',
        )}] authenticating...`,
    );

    const handshake = socket.request;
    const username =
        handshake.headers.username &&
            validator.isBase64(handshake.headers.username as string)
            ? Base64.decode(handshake.headers.username as string)
            : '';

    const password =
        handshake.headers.password &&
            validator.isBase64(handshake.headers.password as string)
            ? Base64.decode(handshake.headers.password as string)
            : '';

    if (!username) {
        const err = new Error(
            "Auth Error: No 'username' Header or it's invalid",
        );
        socket.emit('error', err.message);
        return next(err);
    }

    if (!password) {
        const err = new Error(
            "Auth Error: No 'password' Header or it's invalid",
        );
        socket.emit('error', err.message);
        return next(err);
    }

    const user = await User.findOne({ where: { username } });

    if (!user || hash(password) !== user.password) {
        const err = new Error('Auth Error: Invalid Credentials');
        socket.emit('error', err.message);
        return next(err);
    }

    if (!user.admin && !user.databases.includes(socket.nsp.name)) {
        const err = new Error('Auth Error: Database Access Denied');
        socket.emit('error', err.message);
        return next(err);
    }

    Logger.info(
        `[${socket.id}|${socket.handshake.address.replace(/\:\:ffff\:/g, '')}|${user.username
        }|${socket.nsp.name}] authenticated`,
    );

    next();

}