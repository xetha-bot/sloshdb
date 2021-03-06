import { Socket } from 'socket.io';
import { Sequelize, DataTypes, Model } from 'sequelize';
import Logger from './utils/Logger';
import Base64 from '@xetha/base64';
import { User } from './dispatcher/dispatcher';
import hash from './dispatcher/hash';
import validator from 'validator';

const sequelize = new Sequelize('sqlite://data/data.sqlite', {
    logging: false,
});

class Data extends Model {
    public database!: string;
    public collection!: string;
    public key!: string;
    public data!: { value: any };
}

Data.init(
    {
        database: DataTypes.STRING,
        collection: DataTypes.STRING,
        key: DataTypes.STRING,
        data: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {},
        },
    },
    {
        sequelize,
        freezeTableName: true,
        modelName: 'data',
        tableName: 'data',
    },
);

sequelize.sync().catch((err) => {
    Logger.error(err);
    process.exit(1);
});

interface RequestSocket {
    method: string;
    collection: string;
    key: string;
    data?: any;
}

interface Middleware {
    (req: RequestSocket, done: <T>(data?: T) => void): void;
}

function superLogger(user: string, socket: Socket, message: string) {
    Logger.info(
        `[${user ? user : socket.id}|${socket.handshake.address.replace(
            /\:\:ffff\:/g,
            '',
        )}|${socket.nsp.name}] ${message}`,
    );
}

export default async function SocketHandler(socket: Socket) {
    superLogger(null, socket, 'authenticating...');

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

    const destroy = (err_msg: string) => {
        superLogger(
            null,
            socket,
            `authentication failed: ${err_msg.replace(/Auth Error\: /g, '')}`,
        );
        socket.emit('error', err_msg);
        socket.disconnect(true);
    };

    if (!username) {
        return destroy("Auth Error: No 'username' Header or it's invalid");
    }

    if (!password) {
        return destroy("Auth Error: No 'password' Header or it's invalid");
    }

    const user = await User.findOne({ where: { username } });

    if (!user || hash(password) !== user.password) {
        return destroy('Auth Error: Invalid Credentials');
    }

    if (!user.admin && !user.databases.includes(socket.nsp.name)) {
        return destroy('Auth Error: Database Access Denied');
    }

    superLogger(user.username, socket, 'authenticated');

    const database = socket.nsp;

    socket.emit('ready');

    socket.on('message', async (message) => {
        superLogger(user.username, socket, message);
    });

    function use(method: string, fn: Middleware) {
        socket.on(`$${method}`, async (req: RequestSocket, done) => {
            if (
                typeof req !== 'object' ||
                typeof req.collection !== 'string' ||
                typeof req.key !== 'string' ||
                typeof done !== 'function'
            ) {
                return socket.emit('error', new Error(`Invalid Payload`));
            }

            superLogger(
                user.username,
                socket,
                `${method.toUpperCase()} ${req.collection} ${req.key ?? ''}`,
            );

            try {
                req.method = method;

                fn(req, (data) => {
                    done(null, data);

                    if (['get', 'set', 'delete'].includes(req.method)) {
                        database.emit(`data`, {
                            method: req.method,
                            collection: req.collection,
                            key: req.key,
                            data: data,
                        });
                    }
                });
            } catch (err) {
                done(err.message);
            }
        });
    }

    use('get', (req, done) => {
        Data.findOne({
            where: {
                database: database.name,
                collection: req.collection,
                key: req.key,
            },
        }).then((out) => done(out ? out.data.value : undefined));
    });

    use('set', (req, done) => {
        Data.findOne({
            where: {
                database: database.name,
                collection: req.collection,
                key: req.key,
            },
        }).then((data) => {
            if (data) {
                data.data.value = req.data;

                Data.update(
                    { data: data.data },
                    {
                        where: {
                            database: database.name,
                            collection: req.collection,
                            key: req.key,
                        },
                    },
                ).then(() => done(req.data));
            } else {
                Data.create({
                    database: database.name,
                    collection: req.collection,
                    key: req.key,
                    data: { value: req.data },
                }).then(() => done(req.data));
            }
        });
    });

    use('delete', (req, done) => {
        Data.destroy({
            where: {
                database: database.name,
                collection: req.collection,
                key: req.key,
            },
        }).then((rows) => done(!!rows));
    });

    use('fetch:collection', (req, done) => {
        Data.findAll({
            where: {
                database: database.name,
                collection: req.collection,
            },
        }).then((docs) => done(docs.map((doc) => [doc.key, doc.data.value])));
    });

    use('delete:collection', (req, done) => {
        Data.destroy({
            where: {
                database: database.name,
                collection: req.collection,
            },
        }).then((rows) => done(rows));
    });

    socket.on('disconnect', () => {
        superLogger(user.username, socket, 'disconnected');
        socket.removeAllListeners();
    });
}
