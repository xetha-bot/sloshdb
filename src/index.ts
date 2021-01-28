import { Server, Socket } from 'socket.io';
const serverSocket = new Server().listen(5123);

const cache: {
    [namespace: string]: {
        [collection: string]: Map<string, any>;
    };
} = {};

serverSocket.on('connection', (socket: Socket) => {
    console.log(`[${socket.id}] connected`);

    const use = (
        method: string,
        fn: (
            req: {
                collection: string;
                key: string;
                data?: any;
            },
            res: <T>(data: T) => T
        ) => any
    ) => socket.on(`$${method}`, (req, ack) => fn(req, (data: any) => ack(data)));

    const namespace = socket.nsp.name;
    if (!cache[namespace]) cache[namespace] = {};

    use('get', (req, res) => {
        if (!cache[namespace][req.collection]) return res(null);
        res(cache[namespace][req.collection].get(req.key) || null);
    });

    use('set', (req, res) => {
        if (!cache[namespace][req.collection]) cache[namespace][req.collection] = new Map();
        cache[namespace][req.collection].set(req.key, req.data);
        res([req.key, req.data]);
    });

    use('has', (req, res) => {
        if (!cache[namespace][req.collection]) return res(false);
        res(cache[namespace][req.collection].has(req.key));
    });

    use('delete', (req, res) => {
        if (!cache[namespace][req.collection]) return res(false);
        res(cache[namespace][req.collection].delete(req.key));
    });

    socket.on('disconnect', () => console.log(`[${socket.id}] disconnected`));
});