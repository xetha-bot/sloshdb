import { Server } from 'socket.io';
import authenticator from './authenticator';
import SocketHandler from './SocketHandler';

const serverSocket = new Server();

const server = serverSocket.of(/^\/\w+$/);

serverSocket.on('connection', (socket) => {
    socket.emit('error', 'Database Root Connection Not Allowed.');
    socket.disconnect(true);
});

server.use(authenticator);
server.on('connection', SocketHandler);

serverSocket.listen(
    process.env.PORT ? Number.parseInt(process.env.PORT) : 5123,
);
