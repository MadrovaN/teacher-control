async function refreshLeaderboard() {
  const data = await api('/api/leaderboard');
  byId('leaderboard').textContent = data.map((x, idx) => `${idx + 1}. ${x.teacherName} - ${x.averageStars}★ (${x.ratingCount} hlasů)`).join('\n');
}

async function refreshReviews() {
  const teacherId = byId('reviews-teacher-filter').value;
  const path = teacherId ? `/api/ratings?teacherId=${encodeURIComponent(teacherId)}` : '/api/ratings';
  const data = await api(path);
  byId('reviews-list').textContent = data.length
    ? data.map((x) => `${new Date(x.createdAt).toLocaleString()} | ${x.teacherName} | ${x.stars}★ | ${x.sentiment} | ${x.text || 'bez komentáře'}`).join('\n')
    : 'Zatím žádné recenze.';
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
  await Promise.all([refreshLeaderboard(), refreshReviews()]);
};

byId('reviews-refresh').onclick = refreshReviews;

(async () => {
  const teachers = await loadTeachersInto('rating-teacher', 'reviews-teacher-filter');
  byId('reviews-teacher-filter').innerHTML = `<option value="">Všichni učitelé</option>${teachers.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}`;
  await Promise.all([refreshLeaderboard(), refreshReviews()]);
})();
