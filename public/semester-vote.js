async function loadCategories() {
  const categories = await api('/api/semester-vote/categories');
  byId('sem-category').innerHTML = categories.map((x) => `<option value="${x}">${x}</option>`).join('');
}

async function refreshSemester() {
  const data = await api('/api/semester-vote/results');
  byId('sem-results').textContent = JSON.stringify(data.results, null, 2);
}

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
    if (e.message.includes('already voted')) {
      alert('V této kategorii už jsi hlasoval/a.');
      return;
    }
    if (e.message.includes('Unknown category')) {
      alert('Kategorie není platná.');
      return;
    }
    alert('Hlasování se nepovedlo, zkus to prosím znovu.');
  }
};

(async () => {
  await Promise.all([loadTeachersInto('sem-teacher'), loadCategories()]);
  await refreshSemester();
})();
