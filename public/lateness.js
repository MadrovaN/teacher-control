async function refreshLate() {
  const data = await api('/api/lateness');
  byId('late-list').textContent = data.length
    ? data.map((x) => `${x.teacherId}: +${x.minutesLate} min (${x.note || 'bez pozn.'})`).join('\n')
    : 'Zatím bez záznamů.';
}

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

(async () => {
  await loadTeachersInto('late-teacher');
  await refreshLate();
})();
