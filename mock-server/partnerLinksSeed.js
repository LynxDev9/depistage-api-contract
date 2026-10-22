// partnerLinksSeed.js — partner links managed by MSPS staff in AdminWeb
// (contract v3.9.0 / v3.10.0).
//
// SERVER-SIDE rows. The route (routes/partnerLinks.js) returns only the links
// that have a website or a phone, ordered by `partner_link_id`, through a
// whitelist projection of the eight fields of the contract.
//
// The three institutions are the ones the app used to hardcode in its drawer;
// their logos are served from GitHub for the mock. (The real API serves WebP
// from `GET /media`; the app shows PNG and JPEG just as well.)
//
// `source_platform` is kept for the four links seeded before v3.9.0 and is
// `null` for every link staff added since — the app must not rely on it.

const LOGOS =
  'https://raw.githubusercontent.com/LynxDev9/MSPS/b011f6fc89c79278c68f4171284e15ccdb008eac/logos';

const partnerLinks = [
  // Pinned (« Épinglé »): shown apart, before the other partners. Four at most.
  {
    partner_link_id: 1,
    source_platform: 'SIHATI',
    display_label: 'Ministère de la Santé',
    url: 'https://www.sante.gov.ma',
    logo_url: `${LOGOS}/Ministere-sante-maroc_onlyLogo.png`,
    phone_label: null,
    phone_number: null,
    is_featured: true,
  },
  // A website and a phone: two actions on one card. The number is the ALCS
  // hotline, which the app opens in WhatsApp rather than the dialer.
  {
    partner_link_id: 2,
    source_platform: null,
    display_label: 'ALCS',
    url: 'https://www.alcs.ma',
    logo_url: `${LOGOS}/ALCS2-Fr.png`,
    phone_label: "Ligne d'écoute Bila7araj",
    phone_number: '+212 6 14 18 41 84',
    is_featured: true,
  },
  {
    partner_link_id: 3,
    source_platform: null,
    display_label: 'OMS Maroc',
    url: 'https://www.emro.who.int/fr/countries/mor/',
    logo_url: `${LOGOS}/oms-300x262.jpg`,
    phone_label: null,
    phone_number: null,
    is_featured: true,
  },
  // Not pinned, phone only, no logo: the app shows a generic icon and a dial
  // action, and no website.
  {
    partner_link_id: 100,
    source_platform: null,
    display_label: "Ligne d'écoute Hépatites",
    url: null,
    logo_url: null,
    phone_label: "Ligne d'écoute",
    phone_number: '0801 00 11 22',
    is_featured: false,
  },
  // Not pinned, website only, no logo.
  {
    partner_link_id: 101,
    source_platform: 'SANTE_JEUNES',
    display_label: 'Santé Jeunes',
    url: 'https://santejeunes.example.msps.test',
    logo_url: null,
    phone_label: null,
    phone_number: null,
    is_featured: false,
  },
  // Neither a website nor a phone: the server never returns it.
  {
    partner_link_id: 102,
    source_platform: null,
    display_label: 'Lien incomplet',
    url: null,
    logo_url: null,
    phone_label: null,
    phone_number: null,
    is_featured: false,
  },
];

module.exports = { partnerLinks };
