async function refreshDaily() {
  const data = await api('/api/daily-vote');
  byId('daily-results').textContent = JSON.stringify(data.voteCounts, null, 2);
}

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

(async () => {
  await loadTeachersInto('daily-teacher');
  await refreshDaily();
})();
