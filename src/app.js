const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const MAX_TEXT = 500;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'teacher-admin';

const DEFAULT_TEACHERS = [
  { id: 'novak', name: 'Mgr. Novák' },
  { id: 'svobodova', name: 'Mgr. Svobodová' },
  { id: 'kral', name: 'Mgr. Král' },
];

function createStore() {
  return {
    teachers: [...DEFAULT_TEACHERS],
    ratings: [],
    lateness: [],
    chatMessages: [],
    dailyVotes: new Map(),
    semesterVotes: new Map(),
    nextId: 1,
  };
}

function sanitizeText(value, max = MAX_TEXT) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function getSemesterKey(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}-${month <= 6 ? 'H1' : 'H2'}`;
}

function isTeacher(store, id) {
  return store.teachers.some((t) => t.id === id);
}

function requireAnonId(req, res) {
  const anonId = sanitizeText(req.body?.anonId || req.header('x-anon-id'), 64);
  if (!anonId) {
    res.status(400).json({ error: 'anonId is required' });
    return null;
  }
  return anonId;
}

function computeLeaderboard(store) {
  return store.teachers
    .map((teacher) => {
      const teacherRatings = store.ratings.filter((r) => r.teacherId === teacher.id);
      const count = teacherRatings.length;
      const total = teacherRatings.reduce((sum, r) => sum + r.stars, 0);
      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        ratingCount: count,
        averageStars: count ? Math.round((total / count) * 100) / 100 : 0,
      };
    })
    .sort((a, b) => b.averageStars - a.averageStars || b.ratingCount - a.ratingCount);
}

function ensureDayRecord(store, dayKey) {
  if (!store.dailyVotes.has(dayKey)) {
    store.dailyVotes.set(dayKey, {
      nominations: new Map(),
      votesByUser: new Map(),
    });
  }
  return store.dailyVotes.get(dayKey);
}

function ensureSemesterRecord(store, semester) {
  if (!store.semesterVotes.has(semester)) {
    store.semesterVotes.set(semester, new Map());
  }
  return store.semesterVotes.get(semester);
}

function createApp(store = createStore()) {
  const app = express();
  const limiter = rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(express.json());
  app.use(limiter);
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/api/teachers', (_req, res) => {
    res.json(store.teachers);
  });

  app.post('/api/ratings', (req, res) => {
    const anonId = requireAnonId(req, res);
    if (!anonId) return;

    const teacherId = sanitizeText(req.body.teacherId, 64);
    const stars = Number(req.body.stars);
    const sentiment = sanitizeText(req.body.sentiment, 16);
    const text = sanitizeText(req.body.text);

    if (!isTeacher(store, teacherId)) return res.status(400).json({ error: 'Unknown teacher' });
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });
    if (!['positive', 'negative'].includes(sentiment)) return res.status(400).json({ error: 'Sentiment must be positive/negative' });

    const item = {
      id: store.nextId++,
      teacherId,
      stars,
      sentiment,
      text,
      anonId,
      createdAt: new Date().toISOString(),
    };
    store.ratings.push(item);
    return res.status(201).json(item);
  });

  app.get('/api/leaderboard', (_req, res) => {
    res.json(computeLeaderboard(store));
  });

  app.post('/api/lateness', (req, res) => {
    const anonId = requireAnonId(req, res);
    if (!anonId) return;

    const teacherId = sanitizeText(req.body.teacherId, 64);
    const minutesLate = Number(req.body.minutesLate);
    const note = sanitizeText(req.body.note, 200);

    if (!isTeacher(store, teacherId)) return res.status(400).json({ error: 'Unknown teacher' });
    if (!Number.isFinite(minutesLate) || minutesLate < 1 || minutesLate > 120) {
      return res.status(400).json({ error: 'minutesLate must be 1-120' });
    }

    const entry = {
      id: store.nextId++,
      teacherId,
      minutesLate,
      note,
      anonId,
      createdAt: new Date().toISOString(),
    };
    store.lateness.push(entry);
    return res.status(201).json(entry);
  });

  app.get('/api/lateness', (req, res) => {
    const teacherId = sanitizeText(req.query.teacherId, 64);
    const list = teacherId ? store.lateness.filter((x) => x.teacherId === teacherId) : store.lateness;
    res.json(list);
  });

  app.post('/api/daily-vote/nominate', (req, res) => {
    const anonId = requireAnonId(req, res);
    if (!anonId) return;

    const teacherId = sanitizeText(req.body.teacherId, 64);
    const dayKey = sanitizeText(req.body.dayKey, 32) || new Date().toISOString().slice(0, 10);

    if (!isTeacher(store, teacherId)) return res.status(400).json({ error: 'Unknown teacher' });

    const dayRecord = ensureDayRecord(store, dayKey);
    const nominationKey = `${anonId}:${teacherId}`;
    if (!dayRecord.nominations.has(nominationKey)) {
      dayRecord.nominations.set(nominationKey, teacherId);
    }

    return res.json({ dayKey, nominations: Array.from(dayRecord.nominations.values()) });
  });

  app.post('/api/daily-vote/vote', (req, res) => {
    const anonId = requireAnonId(req, res);
    if (!anonId) return;

    const teacherId = sanitizeText(req.body.teacherId, 64);
    const dayKey = sanitizeText(req.body.dayKey, 32) || new Date().toISOString().slice(0, 10);

    if (!isTeacher(store, teacherId)) return res.status(400).json({ error: 'Unknown teacher' });

    const dayRecord = ensureDayRecord(store, dayKey);
    dayRecord.votesByUser.set(anonId, teacherId);

    return res.json({ dayKey, teacherId });
  });

  app.get('/api/daily-vote', (req, res) => {
    const dayKey = sanitizeText(req.query.dayKey, 32) || new Date().toISOString().slice(0, 10);
    const dayRecord = ensureDayRecord(store, dayKey);
    const voteCounts = {};

    for (const teacherId of dayRecord.votesByUser.values()) {
      voteCounts[teacherId] = (voteCounts[teacherId] || 0) + 1;
    }

    res.json({ dayKey, voteCounts });
  });

  app.post('/api/semester-vote', (req, res) => {
    const anonId = requireAnonId(req, res);
    if (!anonId) return;

    const teacherId = sanitizeText(req.body.teacherId, 64);
    const category = sanitizeText(req.body.category, 80);
    const semester = sanitizeText(req.body.semester, 16) || getSemesterKey();

    if (!isTeacher(store, teacherId)) return res.status(400).json({ error: 'Unknown teacher' });
    if (!category) return res.status(400).json({ error: 'category is required' });

    const semesterRecord = ensureSemesterRecord(store, semester);
    if (!semesterRecord.has(category)) {
      semesterRecord.set(category, new Map());
    }

    const categoryVotes = semesterRecord.get(category);
    if (categoryVotes.has(anonId)) {
      return res.status(409).json({ error: 'User already voted in this category this semester' });
    }

    categoryVotes.set(anonId, teacherId);
    return res.status(201).json({ semester, category, teacherId });
  });

  app.get('/api/semester-vote/results', (req, res) => {
    const semester = sanitizeText(req.query.semester, 16) || getSemesterKey();
    const semesterRecord = ensureSemesterRecord(store, semester);
    const results = {};

    for (const [category, votes] of semesterRecord.entries()) {
      const counts = {};
      for (const teacherId of votes.values()) {
        counts[teacherId] = (counts[teacherId] || 0) + 1;
      }
      results[category] = counts;
    }

    res.json({ semester, results });
  });

  app.delete('/api/chat/:id', (req, res) => {
    if (req.header('x-admin-token') !== ADMIN_TOKEN) return res.status(403).json({ error: 'Forbidden' });

    const id = Number(req.params.id);
    const index = store.chatMessages.findIndex((m) => m.id === id);
    if (index < 0) return res.status(404).json({ error: 'Not found' });

    store.chatMessages.splice(index, 1);
    return res.status(204).end();
  });

  app.get('/api/chat', (_req, res) => {
    res.json(store.chatMessages.slice(-100));
  });

  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  return app;
}

module.exports = {
  createApp,
  createStore,
  getSemesterKey,
  sanitizeText,
  computeLeaderboard,
};
