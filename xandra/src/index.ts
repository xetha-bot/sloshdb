import { Server } from 'socket.io';
import SocketHandler from './SocketHandler';
import Logger from './utils/Logger';
import processor from '@xetha/processor';

processor(Logger);

const serverSocket = new Server();

const server = serverSocket.of(/^\/\w+$/);

serverSocket.on('connection', (socket) => {
    socket.emit('error', 'Database Root Connection Not Allowed.');
    socket.disconnect(true);
});

server.on('connection', SocketHandler);

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 5123;

serverSocket.listen(PORT);

Logger.info(`Database running on PORT ${PORT}`);
