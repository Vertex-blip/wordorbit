export const STORAGE_KEY = 'wordorbit:v1';
export const languages = { en: 'English', kk: 'Қазақша', ru: 'Русский' };

const starterWords = [
  ['hello', 'сәлем', 'привет', 'A friendly greeting.'],
  ['thank you', 'рақмет', 'спасибо', 'A way to show gratitude.'],
  ['book', 'кітап', 'книга', 'Something you read.'],
  ['water', 'су', 'вода', 'Something you drink.'],
  ['home', 'үй', 'дом', 'A place to call your own.'],
  ['friend', 'дос', 'друг', 'Someone you enjoy spending time with.'],
  ['school', 'мектеп', 'школа', 'A place for learning.'],
  ['time', 'уақыт', 'время', 'What the clock helps us measure.'],
  ['sun', 'күн', 'солнце', 'The star that lights the day.'],
  ['work', 'жұмыс', 'работа', 'An activity or a job.'],
  ['journey', 'сапар', 'путешествие', 'A trip from one place to another.'],
  ['dream', 'арман', 'мечта', 'A hope for the future.']
];

export const starterCards = starterWords.map(([en, kk, ru, note], index) => ({
  id: `starter-${index + 1}`, en, kk, ru, note, sample: true,
  dueAt: 0, intervalDays: 0, ease: 2.5, repetitions: 0, reviews: 0, lapses: 0, lastReviewedAt: null
}));

export function validCard(card) {
  return !!card && typeof card.id === 'string' && card.id.length <= 100
    && ['en', 'kk', 'ru'].every(lang => typeof card[lang] === 'string' && card[lang].trim().length > 0 && card[lang].length <= 120)
    && typeof card.note === 'string' && card.note.length <= 250
    && Number.isFinite(card.dueAt) && card.dueAt >= 0
    && Number.isFinite(card.intervalDays) && card.intervalDays >= 0
    && Number.isFinite(card.ease) && card.ease >= 1.3 && card.ease <= 4
    && Number.isInteger(card.repetitions) && card.repetitions >= 0
    && Number.isInteger(card.reviews) && card.reviews >= 0
    && Number.isInteger(card.lapses) && card.lapses >= 0;
}

export function makeCard({ en, kk, ru, note }, id = crypto.randomUUID()) {
  const card = {
    id, en: String(en || '').trim().slice(0, 120), kk: String(kk || '').trim().slice(0, 120),
    ru: String(ru || '').trim().slice(0, 120), note: String(note || '').trim().slice(0, 250),
    sample: false, dueAt: 0, intervalDays: 0, ease: 2.5, repetitions: 0, reviews: 0, lapses: 0, lastReviewedAt: null
  };
  if (!validCard(card)) throw new Error('Add the word in all three languages.');
  return card;
}

export function dueCards(cards, now = Date.now()) { return cards.filter(card => card.dueAt <= now); }

export function scheduleCard(card, rating, now = Date.now()) {
  if (!['again', 'hard', 'good', 'easy'].includes(rating)) throw new Error('Unknown rating');
  let ease = card.ease;
  let intervalDays;
  let repetitions = card.repetitions;
  let lapses = card.lapses;
  if (rating === 'again') {
    ease = Math.max(1.3, ease - 0.2); intervalDays = 10 / 1440; repetitions = 0; lapses++;
  } else if (rating === 'hard') {
    ease = Math.max(1.3, ease - 0.15); intervalDays = repetitions ? Math.max(1 / 24, card.intervalDays * 1.2) : 1 / 24;
  } else if (rating === 'good') {
    intervalDays = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(1, card.intervalDays * ease);
    repetitions++;
  } else {
    ease = Math.min(4, ease + 0.15);
    intervalDays = repetitions === 0 ? 4 : Math.max(4, card.intervalDays * ease * 1.3);
    repetitions++;
  }
  intervalDays = Math.round(intervalDays * 1000) / 1000;
  return { ...card, ease, intervalDays, repetitions, lapses, reviews: card.reviews + 1, lastReviewedAt: now, dueAt: now + intervalDays * 86400000 };
}

export function nextDueLabel(card, now = Date.now()) {
  if (card.dueAt <= now) return 'Ready now';
  const hours = (card.dueAt - now) / 3600000;
  if (hours < 1) return `In ${Math.max(1, Math.ceil(hours * 60))} min`;
  if (hours < 36) return `In ${Math.ceil(hours)} hr`;
  return `In ${Math.ceil(hours / 24)} days`;
}
