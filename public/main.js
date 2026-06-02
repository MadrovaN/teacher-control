const anonIdKey = 'teacher-control-anon-id';
const anonId = localStorage.getItem(anonIdKey) || `anon-${Math.random().toString(36).slice(2, 10)}`;
localStorage.setItem(anonIdKey, anonId);

const tips = [
  'Nezapomeň pitný režim před testem.',
  'Meme dne: pošli do drbárny něco školně safe.',
  'Když se ti hodina líbila, dej 5★ a pochvalu.',
];

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-anon-id': anonId,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

function byId(id) { return document.getElementById(id); }

async function loadTeachers() {
  const teachers = await api('/api/teachers');
  ['rating-teacher', 'late-teacher', 'daily-teacher', 'sem-teacher'].forEach((id) => {
    const select = byId(id);
    select.innerHTML = teachers.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  });
}

async function refreshLeaderboard() {
  const data = await api('/api/leaderboard');
  byId('leaderboard').textContent = data.map((x, idx) => `${idx + 1}. ${x.teacherName} - ${x.averageStars}★ (${x.ratingCount} hlasů)`).join('\n');
}

async function refreshLate() {
  const data = await api('/api/lateness');
  byId('late-list').textContent = data.map((x) => `${x.teacherId}: +${x.minutesLate} min (${x.note || 'bez pozn.'})`).join('\n');
}

async function refreshDaily() {
  const data = await api('/api/daily-vote');
  byId('daily-results').textContent = JSON.stringify(data.voteCounts, null, 2);
}

async function refreshSemester() {
  const data = await api('/api/semester-vote/results');
  byId('sem-results').textContent = JSON.stringify(data.results, null, 2);
}

byId('rating-submit').onclick = async () => {
  await api('/api/ratings', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: byId('rating-teacher').value,
      stars: Number(byId('rating-stars').value),
      sentiment: byId('rating-sentiment').value,
      text: byId('rating-text').value,
    }),
  });
  byId('rating-text').value = '';
  await refreshLeaderboard();
};

byId('late-send').onclick = async () => {
  await api('/api/lateness', {
    method: 'POST',
    body: JSON.stringify({
      teacherId: byId('late-teacher').value,
      minutesLate: Number(byId('late-min').value),
      note: byId('late-note').value,
    }),
  });
  byId('late-note').value = '';
  await refreshLate();
};

byId('daily-nom').onclick = async () => {
  await api('/api/daily-vote/nominate', {
    method: 'POST',
    body: JSON.stringify({ teacherId: byId('daily-teacher').value }),
  });
  await refreshDaily();
};

byId('daily-vote').onclick = async () => {
  await api('/api/daily-vote/vote', {
    method: 'POST',
    body: JSON.stringify({ teacherId: byId('daily-teacher').value }),
  });
  await refreshDaily();
};

byId('sem-vote').onclick = async () => {
  try {
    await api('/api/semester-vote', {
      method: 'POST',
      body: JSON.stringify({
        category: byId('sem-category').value,
        teacherId: byId('sem-teacher').value,
      }),
    });
    await refreshSemester();
  } catch (e) {
    alert('V této kategorii už jsi hlasoval/a.');
  }
};

byId('fun-btn').onclick = () => {
  byId('fun-text').textContent = tips[Math.floor(Math.random() * tips.length)];
};

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

(async () => {
  await loadTeachers();
  await Promise.all([refreshLeaderboard(), refreshLate(), refreshDaily(), refreshSemester()]);
})();
