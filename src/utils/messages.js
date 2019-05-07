const generateMessage = (username, message) => {
  return {
    username: username,
    text: message,
    createdAt: new Date().getTime()
  }
};

module.exports = { generateMessage }
