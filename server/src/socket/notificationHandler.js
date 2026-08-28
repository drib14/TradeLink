module.exports = (io, socket) => {
  const userId = socket.user.id;

  // Auto-join personal user room for direct push notifications
  socket.join(`user:${userId}`);

  // Auto-join campus-wide broadcast room
  if (socket.user.campus) {
    socket.join(`campus:${socket.user.campus}`);
  }
  socket.join('campus:All');

  // If user is admin/superadmin, join admin moderation room
  if (['admin', 'superadmin'].includes(socket.user.role)) {
    socket.join('admin:moderation');
  }
};
