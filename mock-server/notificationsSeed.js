// notificationsSeed.js — in-app notifications written in AdminWeb (contract v3.7.1).
//
// SERVER-SIDE rows: `status` is internal and never reaches the wire. The route
// (routes/notifications.js) only returns PUBLISHED rows in the requested
// language, through a whitelist projection.
//
// v3.7.1: a message is visible from its publication until staff archive it —
// there are no start/end dates and no centre link. `published_at` is when staff
// first published it (never changes on edit; it is the display date and the
// sort key), `updated_at` is when it was last edited.
//
// Dates are relative to boot so the list always reads as recent. The set covers
// every case the route must handle: both languages, the three types, a content
// link, a multi-line body, an edited message (updated_at after published_at),
// and rows that must stay hidden (DRAFT, ARCHIVED).

const DAY = 24 * 60 * 60 * 1000;
const at = (days) => new Date(Date.now() + days * DAY).toISOString();

const notification = (fields) => ({
  content_id: null,
  ...fields,
  updated_at: fields.updated_at || fields.published_at,
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
    published_at: at(-1),
  }),
  notification({
    notification_id: 9,
    status: 'PUBLISHED',
    type: 'INFO',
    language: 'fr',
    title: 'Nouveau centre à Rabat',
    body: 'Un nouveau centre de dépistage est ouvert à Rabat.\nIl vous accueille du lundi au vendredi, de 9 h à 16 h.',
    published_at: at(-3),
  }),
  // Edited after publication: published_at (and so its place and date) stays,
  // updated_at moves — the app shows it as unread again.
  notification({
    notification_id: 7,
    status: 'PUBLISHED',
    type: 'REMINDER',
    language: 'fr',
    title: 'Pensez à vous faire dépister',
    body: 'Un dépistage régulier permet de prendre soin de sa santé. Il est gratuit et confidentiel.',
    published_at: at(-10),
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
    published_at: at(-1),
  }),
  notification({
    notification_id: 10,
    status: 'PUBLISHED',
    type: 'INFO',
    language: 'ar',
    title: 'مركز جديد بالرباط',
    body: 'تم افتتاح مركز جديد للكشف بالرباط.\nيستقبلكم من الإثنين إلى الجمعة، من 9 صباحاً إلى 4 مساءً.',
    published_at: at(-3),
  }),
  notification({
    notification_id: 8,
    status: 'PUBLISHED',
    type: 'REMINDER',
    language: 'ar',
    title: 'فكّر في إجراء الكشف',
    body: 'الكشف المنتظم يساعدك على الاعتناء بصحتك. وهو مجاني وسري.',
    published_at: at(-10),
  }),
  // Hidden: not published.
  notification({
    notification_id: 15,
    status: 'DRAFT',
    type: 'INFO',
    language: 'fr',
    title: 'Brouillon',
    body: 'Message en cours de rédaction.',
    published_at: at(-1),
  }),
  // Hidden: archived by staff.
  notification({
    notification_id: 3,
    status: 'ARCHIVED',
    type: 'AWARENESS',
    language: 'fr',
    title: 'Ancienne campagne',
    body: 'Cette campagne est terminée.',
    published_at: at(-60),
  }),
];

module.exports = { notifications };
