const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp, createStore, computeLeaderboard } = require('../src/app');

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
    body: { category: 'nejtezsi testy', teacherId: 'novak', semester: '2026-H1' },
    anonId: 'anon-a',
  });
  assert.equal(first.status, 201);

  const second = await jsonRequest(app, '/api/semester-vote', {
    method: 'POST',
    body: { category: 'nejtezsi testy', teacherId: 'kral', semester: '2026-H1' },
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
