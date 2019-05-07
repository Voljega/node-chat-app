const socket = io();

// Elements ($ is a convention)
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const {username,room} = Qs.parse(location.search, { ignoreQueryPrefix: true});

const autoscroll = () => {
  // New message Element
  const $newMessage = $messages.lastElementChild;
  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage); // browser function
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;
  // Visible Height
  const visibleHeight = $messages.offsetHeight;
  // Height of messages container
  const containerHeight = $messages.scrollHeight;
  // How far have I scrolled ?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on('receivedMessage', (message) => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    createdAt: moment(message.createdAt).format('HH:mm:ss'),
    message: message.text //{{message}} on mustache template
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('userLocation', (username, latitude,longitude, createdAt) => {
  const html = Mustache.render(locationTemplate, {
    username: username,
    createdAt: moment(createdAt).format('HH:mm:ss'),
    locationurl: `https://google.com/maps?q=${latitude},${longitude}` //{{message}} on mustache template
  });
  $messages.insertAdjacentHTML('beforeend', html);
  autoscroll();
});

socket.on('roomData', ({room, users}) => {
  console.log(room);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  document.querySelector('#sidebar').innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault(); // prevent browser going to another page on form submit
  $messageFormButton.setAttribute('disabled','disabled');
  // DISABLE
  const message = $messageFormInput.value;
  socket.emit('sendMessage', message, (message) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();
    if (message) {
      return console.log(message);
    } else {
      console.log('Message delivered');
    }
  }); //client emits to server
});

$locationButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    return alert("'Your browser doesn't support geolocation");
  } else {
    $locationButton.setAttribute('disabled','disabled');
    navigator.geolocation.getCurrentPosition((position) => {
      socket.emit('sendLocation', {
        latitude:position.coords.latitude,
        longitude: position.coords.longitude},
      (message) => {
        $locationButton.removeAttribute('disabled');
        console.log(message);
      });
    });
  }
});

socket.emit('join', {username, room}, (error) => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
