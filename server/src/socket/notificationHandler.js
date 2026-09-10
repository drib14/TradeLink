module.exports = (io, socket) => {
  const userId = socket.user.id;

  // Auto-join personal user room for direct push notifications
  socket.join(`user:${userId}`);

  // Auto-join campus-wide broadcast room
  if (socket.user.campus) {
    socket.join(`campus:${socket.user.campus}`);
  }
  socket.join('campus:All');

  // If user is admin, join admin moderation room
  if (socket.user.role === 'admin') {
    socket.join('admin:moderation');
  }
};
