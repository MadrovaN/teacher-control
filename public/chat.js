const socket = io({ query: { anonId } });
const chatLog = byId('chat-log');

function addMessage(msg) {
  const p = document.createElement('p');
  const parts = [`[${new Date(msg.createdAt).toLocaleTimeString()}] ${msg.anonId}: ${msg.text || ''}`];
  if (msg.imageUrl) parts.push(`meme: ${msg.imageUrl}`);
  p.textContent = parts.join(' | ');
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

socket.on('chat:init', (messages) => {
  chatLog.textContent = '';
  messages.forEach(addMessage);
});
socket.on('chat:message', addMessage);

byId('chat-send').onclick = () => {
  socket.emit('chat:message', { text: byId('chat-text').value, imageUrl: byId('chat-image').value });
  byId('chat-text').value = '';
  byId('chat-image').value = '';
};
