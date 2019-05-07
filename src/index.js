const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const {generateMessage} = require('./utils/messages');
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users');

const port = process.env.PORT || 3333;
const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

let count = 0;

io.on('connection', (socket) => {
  //socket.broadcast.emit for emitting to all clients but the one connected
  //io.emit for emitting to all clients
  //socket.emit for emitting to one client

  socket.on('join', (options, callback) => {
    const {error, user} = addUser({id:socket.id, ...options}); // ... uses properties of options
    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    //specific room events : io.to.emit and socket.brocast.to.emit
    socket.emit('receivedMessage', generateMessage('Admin', `Welcome ${user.username}!`));
    socket.broadcast.to(user.room).emit('receivedMessage', generateMessage('Admin', `${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room : user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message,callback) => {
      // listen for event sent by client
      const filter = new Filter();
      if (filter.isProfane(message)) {
          return callback('Profanity is not allowed');
      } else {
        count++;
        const user = getUser(socket.id);
        io.to(user.room).emit('receivedMessage', generateMessage(user.username,message));
        callback();
      };
  });

  socket.on('sendLocation', (position, callback) => { // listen for event sent by client
      const user = getUser(socket.id);
      io.to(user.room).emit('userLocation', user.username, position.latitude, position.longitude, new Date().getTime());
      callback('Location shared !');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('receivedMessage', generateMessage('Admin', `${user.username} has left`));
      io.to(user.room).emit('roomData', {
        room : user.room,
        users: getUsersInRoom(user.room)
      });
    }
  })
})

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
