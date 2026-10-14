import test from 'node:test';
import assert from 'node:assert/strict';
import { starterCards, validCard, makeCard, dueCards, scheduleCard, nextDueLabel } from '../src/core.js';

test('starter deck has complete trilingual cards', () => {
  assert.equal(starterCards.length, 12);
  assert.equal(starterCards.every(validCard), true);
  assert.equal(new Set(starterCards.map(c => c.id)).size, 12);
});

test('cards need every translation', () => {
  assert.throws(() => makeCard({ en: 'tree', kk: '', ru: 'дерево' }), /three languages/);
  assert.equal(makeCard({ en: 'tree', kk: 'ағаш', ru: 'дерево' }, 'tree').id, 'tree');
});

test('ratings schedule increasingly distant practice', () => {
  const now = Date.UTC(2026, 9, 14);
  const fresh = starterCards[0];
  assert.equal(dueCards([fresh], now).length, 1);
  const again = scheduleCard(fresh, 'again', now);
  const good = scheduleCard(fresh, 'good', now);
  const easy = scheduleCard(fresh, 'easy', now);
  assert.ok(again.dueAt < good.dueAt);
  assert.ok(good.dueAt < easy.dueAt);
  assert.equal(again.lapses, 1);
  assert.equal(good.repetitions, 1);
  assert.equal(nextDueLabel(good, now), 'In 24 hr');
});

test('a second good review extends the interval', () => {
  const now = Date.UTC(2026, 9, 14);
  const first = scheduleCard(starterCards[0], 'good', now);
  const second = scheduleCard(first, 'good', first.dueAt);
  assert.equal(second.intervalDays, 3);
  assert.equal(second.repetitions, 2);
});
