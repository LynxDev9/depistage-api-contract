// notificationsSeed.js — in-app notifications written in AdminWeb (contract v3.7.0).
//
// SERVER-SIDE rows: `status` is internal and never reaches the wire. The route
// (routes/notifications.js) only returns PUBLISHED rows that are active now in
// the requested language, through a whitelist projection.
//
// Dates are relative to boot so that "active now" stays true however long ago
// the seed was written. The set covers every case the route must handle:
// both languages, the three types, a content link, a centre link, a multi-line
// body, and rows that must stay hidden (expired, not started yet, DRAFT,
// ARCHIVED).

const DAY = 24 * 60 * 60 * 1000;
const at = (days) => new Date(Date.now() + days * DAY).toISOString();

const notification = (fields) => ({
  content_id: null,
  center_id: null,
  ends_at: null,
  ...fields,
  updated_at: fields.updated_at || fields.starts_at,
});

const notifications = [
  notification({
    notification_id: 12,
    status: 'PUBLISHED',
    type: 'AWARENESS',
    language: 'fr',
    title: 'Journée mondiale de lutte contre le sida',
    body: 'Le dépistage est gratuit et anonyme dans les centres participants ce 1er décembre.',
    content_id: 1,
    starts_at: at(-1),
    ends_at: at(6),
  }),
  notification({
    notification_id: 9,
    status: 'PUBLISHED',
    type: 'INFO',
    language: 'fr',
    title: 'Nouveau centre à Rabat',
    body: 'Un nouveau centre de dépistage est ouvert à Rabat.\nIl vous accueille du lundi au vendredi, de 9 h à 16 h.',
    center_id: 120,
    starts_at: at(-3),
  }),
  notification({
    notification_id: 7,
    status: 'PUBLISHED',
    type: 'REMINDER',
    language: 'fr',
    title: 'Pensez à vous faire dépister',
    body: 'Un dépistage régulier permet de prendre soin de sa santé. Il est gratuit et confidentiel.',
    starts_at: at(-10),
    updated_at: at(-2),
  }),
  notification({
    notification_id: 13,
    status: 'PUBLISHED',
    type: 'AWARENESS',
    language: 'ar',
    title: 'اليوم العالمي لمكافحة السيدا',
    body: 'الكشف مجاني ومجهول في المراكز المشاركة يوم فاتح دجنبر.',
    content_id: 4,
    starts_at: at(-1),
    ends_at: at(6),
  }),
  notification({
    notification_id: 10,
    status: 'PUBLISHED',
    type: 'INFO',
    language: 'ar',
    title: 'مركز جديد بالرباط',
    body: 'تم افتتاح مركز جديد للكشف بالرباط.\nيستقبلكم من الإثنين إلى الجمعة، من 9 صباحاً إلى 4 مساءً.',
    center_id: 120,
    starts_at: at(-3),
  }),
  notification({
    notification_id: 8,
    status: 'PUBLISHED',
    type: 'REMINDER',
    language: 'ar',
    title: 'فكّر في إجراء الكشف',
    body: 'الكشف المنتظم يساعدك على الاعتناء بصحتك. وهو مجاني وسري.',
    starts_at: at(-10),
  }),
  // Hidden: ended yesterday.
  notification({
    notification_id: 5,
    status: 'PUBLISHED',
    type: 'INFO',
    language: 'fr',
    title: 'Fermeture exceptionnelle',
    body: 'Les centres étaient fermés pendant le jour férié.',
    starts_at: at(-5),
    ends_at: at(-1),
  }),
  // Hidden: starts tomorrow.
  notification({
    notification_id: 14,
    status: 'PUBLISHED',
    type: 'REMINDER',
    language: 'fr',
    title: 'Campagne de la semaine prochaine',
    body: 'Une campagne de dépistage commence bientôt.',
    starts_at: at(1),
  }),
  // Hidden: not published.
  notification({
    notification_id: 15,
    status: 'DRAFT',
    type: 'INFO',
    language: 'fr',
    title: 'Brouillon',
    body: 'Message en cours de rédaction.',
    starts_at: at(-1),
  }),
  notification({
    notification_id: 3,
    status: 'ARCHIVED',
    type: 'AWARENESS',
    language: 'fr',
    title: 'Ancienne campagne',
    body: 'Cette campagne est terminée.',
    starts_at: at(-60),
  }),
];

module.exports = { notifications };
