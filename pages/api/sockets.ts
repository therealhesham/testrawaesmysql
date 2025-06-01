import { Server } from 'socket.io';

export default function handler(req, res) {
  if (res.socket.server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new Server(res.socket.server, {
      path: '/api/sockets',
      cors: {
        origin: '*', // يمكنك تحديد النطاقات المسموح بها
      },
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // استقبال الرسائل من العميل
      socket.on('send-message', (message) => {
        // إرسال الرسالة لجميع العملاء المتصلين
        io.emit('receive-message', message);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}