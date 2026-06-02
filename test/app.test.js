const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, createStore, computeLeaderboard, SEMESTER_CATEGORIES } = require('../src/app');

async function jsonRequest(app, path, { method = 'GET', body, anonId = 'anon-tester' } = {}) {
  const res = await fetch(`http://localhost:${app.address().port}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-anon-id': anonId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

test('one user can vote only once per semester category', async (t) => {
  const app = createApp(createStore()).listen(0);
  t.after(() => app.close());

  const first = await jsonRequest(app, '/api/semester-vote', {
    method: 'POST',
    body: { category: 'nejtěžší testy', teacherId: 'novak', semester: '2026-H1' },
    anonId: 'anon-a',
  });
  assert.equal(first.status, 201);

  const second = await jsonRequest(app, '/api/semester-vote', {
    method: 'POST',
    body: { category: 'nejtěžší testy', teacherId: 'kral', semester: '2026-H1' },
    anonId: 'anon-a',
  });
  assert.equal(second.status, 409);
});

test('leaderboard calculates average stars', () => {
  const store = createStore();
  store.ratings.push({ teacherId: 'novak', stars: 5 }, { teacherId: 'novak', stars: 3 }, { teacherId: 'svobodova', stars: 4 });

  const leaderboard = computeLeaderboard(store);
  const novak = leaderboard.find((x) => x.teacherId === 'novak');
  assert.equal(novak.averageStars, 4);
  assert.equal(novak.ratingCount, 2);
});

test('leaderboard rounds decimal average to 2 places', () => {
  const store = createStore();
  store.ratings.push({ teacherId: 'novak', stars: 5 }, { teacherId: 'novak', stars: 5 }, { teacherId: 'novak', stars: 4 });

  const leaderboard = computeLeaderboard(store);
  const novak = leaderboard.find((x) => x.teacherId === 'novak');
  assert.equal(novak.averageStars, 4.67);
});

test('semester vote rejects non-static category', async (t) => {
  const app = createApp(createStore()).listen(0);
  t.after(() => app.close());

  const res = await jsonRequest(app, '/api/semester-vote', {
    method: 'POST',
    body: { category: 'vlastní kategorie', teacherId: 'novak', semester: '2026-H1' },
    anonId: 'anon-a',
  });
  assert.equal(res.status, 400);
});

test('ratings endpoint returns public reviews', async (t) => {
  const app = createApp(createStore()).listen(0);
  t.after(() => app.close());

  const ratingRes = await jsonRequest(app, '/api/ratings', {
    method: 'POST',
    body: { teacherId: 'novak', stars: 5, sentiment: 'positive', text: 'Super výklad' },
    anonId: 'anon-a',
  });
  assert.equal(ratingRes.status, 201);

  const listRes = await jsonRequest(app, '/api/ratings');
  assert.equal(listRes.status, 200);
  const payload = await listRes.json();
  assert.equal(payload.length, 1);
  assert.equal(payload[0].text, 'Super výklad');
  assert.equal(payload[0].teacherName, 'Mgr. Novák');
  assert.equal('anonId' in payload[0], false);
});

test('categories endpoint returns static categories', async (t) => {
  const app = createApp(createStore()).listen(0);
  t.after(() => app.close());

  const res = await jsonRequest(app, '/api/semester-vote/categories');
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.deepEqual(payload, SEMESTER_CATEGORIES);
});
