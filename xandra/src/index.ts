import { Server, Socket } from 'socket.io';
import { Sequelize, DataTypes, Model } from 'sequelize';
import Logger from './utils/Logger';
import Base64 from '@xetha/base64';
import { User } from './dispatcher/dispatcher';
import hash from './dispatcher/hash';
import validator from 'validator';

const serverSocket = new Server();

const sequelize = new Sequelize('sqlite://data/data.sqlite', { logging: false });

class Data extends Model {

    public database!: string;
    public collection!: string;
    public key!: string;
    public data!: { value: any; };

}

Data.init({
    database: DataTypes.STRING,
    collection: DataTypes.STRING,
    key: DataTypes.STRING,
    data: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
}, {
    sequelize,
    freezeTableName: true,
    modelName: 'data',
    tableName: 'data',
});

sequelize.sync().catch((err) => {
    Logger.error(err);
    process.exit(1);
});

interface Middleware {
    (
        req: {
            method: string;
            collection: string;
            key: string;
            data?: any;
        },
        done: <T>(data?: T) => void
    ): void;
}

serverSocket.use(async (socket, next) => {

    Logger.info(`[${socket.id}|${socket.handshake.address.replace(/\:\:ffff\:/g, '')}] authenticating...`);

    const handshake = socket.request;
    const username =
        handshake.headers.username &&
            validator.isBase64(handshake.headers.username as string) ? Base64.decode(handshake.headers.username as string) : '';

    const password =
        handshake.headers.password &&
            validator.isBase64(handshake.headers.password as string) ? Base64.decode(handshake.headers.password as string) : '';

    if (!username) {
        return next(new Error('Auth Error: No username Header or it\'s invalid'));
    }

    if (!password) {
        return next(new Error('Auth Error: No password Header or it\'s invalid'));
    }

    const user = await User.findOne({ where: { username } });

    if (!user || hash(password) !== user.password) {
        return next(new Error('Auth Error: Invalid Credentials'));
    }

    if (!user.admin && !user.databases.includes(socket.nsp.name)) {
        return next(new Error('Auth Error: Database Access Denied'));
    }

    Logger.info(`[${socket.id}|${socket.handshake.address.replace(/\:\:ffff\:/g, '')}|${user.username}|${socket.nsp.name}] authenticated`);

    next();

});

serverSocket.on('connection', (socket: Socket) => {

    const database = socket.nsp;

    socket.on('message', async (message) => {
        Logger.info(`[${socket.id}|${socket.handshake.address.replace(/\:\:ffff\:/g, '')}|${socket.nsp.name}] ${message}`);
    });

    function use(method: string, fn: Middleware) {
        socket.on(`$${method}`, async (req, done) => {

            if (!(typeof req !== 'object' || typeof done !== 'function')) {
                return socket.emit('error', new Error(`Invalid Payload`));
            }

            Logger.info(`[${socket.id}|${socket.handshake.address.replace(/\:\:ffff\:/g, '')}|${socket.nsp.name}] ${method.toUpperCase()} ${req.collection} ${req.key || ''}`);

            try {

                req.method = method;

                fn(req, (data) => {

                    done(null, data);

                    if (['get', 'set', 'delete'].includes(req.method)) {
                        database.emit(`$sync`, {
                            method: req.method,
                            collection: req.collection,
                            key: req.key,
                            data: data,
                        });
                    }

                });

            } catch (err) {
                done(err);
            }
        });
    };

    use('get', (req, done) => {
        Data.findOne({
            where: {
                database: database.name,
                collection: req.collection,
                key: req.key
            },
        }).then((out) => done(out ? out.data.value : null));
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

                Data.update({ data: data.data }, {
                    where: {
                        database: database.name,
                        collection: req.collection,
                        key: req.key,
                    },
                }).then(() => done(req.data));
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
        Logger.info(`[${socket.id}] disconnected`);
        socket.removeAllListeners();
    });

});

serverSocket.listen(process.env.PORT ? Number.parseInt(process.env.PORT) : 5123);