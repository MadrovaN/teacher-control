const anonIdKey = 'teacher-control-anon-id';
const anonId = localStorage.getItem(anonIdKey) || `anon-${Math.random().toString(36).slice(2, 10)}`;
localStorage.setItem(anonIdKey, anonId);

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-anon-id': anonId,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let message = 'Požadavek selhal';
    try {
      const json = await res.json();
      message = json.error || JSON.stringify(json);
    } catch {
      message = await res.text();
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

function byId(id) {
  return document.getElementById(id);
}

async function loadTeachersInto(...ids) {
  const teachers = await api('/api/teachers');
  ids.forEach((id) => {
    const select = byId(id);
    if (!select) return;
    select.innerHTML = teachers.map((t) => `<option value="${t.id}">${t.name}</option>`).join('');
  });
  return teachers;
}
