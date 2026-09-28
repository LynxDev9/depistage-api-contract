// assessmentSeed.js — the published auto-evaluation questionnaire (contract v3.4.0).
//
// This is the SERVER-SIDE configuration, so it carries everything the contract
// forbids exposing: question weights, option scores, band thresholds, and the
// classification an option assigns to the device profile (`sets_*`). The route
// (routes/assessment.js) projects it onto the public shape through a whitelist;
// nothing here may reach the wire as-is.
//
// Two of the seven questions are classification questions: they score nothing,
// and instead set the server-owned `user_type` / `family_situation` of the
// profile. That is how the profile is now collected "implicitly" inside the
// risk questionnaire rather than in a separate form.
//
// Texts are copied from the app's arb files so the mock reads like the real
// thing in both languages.

// Deterministic, well-formed UUIDs (version 4, variant 8): stable across
// restarts, easy to recognise in a log.
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Frequency answers shared by the five risk questions. `score` is per option;
// the question `weight` multiplies it.
const frequencyOptions = (base) => [
  { option_id: id(base + 1), score: 0, label: { fr: 'Non, jamais / toujours protégé(e)', ar: 'لا، أبداً / دائماً محمي(ة)' } },
  { option_id: id(base + 2), score: 1, label: { fr: 'Oui, occasionnellement', ar: 'نعم، أحياناً' } },
  { option_id: id(base + 3), score: 2, label: { fr: 'Oui, fréquemment', ar: 'نعم، كثيراً' } },
  { option_id: id(base + 4), score: 1, label: { fr: 'Je préfère ne pas répondre', ar: 'أفضل عدم الإفصاح' } },
];

const riskQuestion = (n, weight, fr, ar) => ({
  question_id: id(100 + n),
  weight,
  text: { fr, ar },
  options: frequencyOptions(1000 + n * 10),
});

const quiz = {
  quiz_id: id(1),
  version: 1,
  published: true,
  title: {
    fr: 'Auto-évaluation du risque',
    ar: 'التقييم الذاتي للمخاطر',
  },
  questions: [
    riskQuestion(
      1, 1,
      'Avez-vous eu des rapports sexuels non protégés au cours des 12 derniers mois ?',
      'هل مارست علاقات جنسية غير محمية خلال الـ 12 شهراً الماضية؟',
    ),
    riskQuestion(
      2, 1,
      'Avez-vous eu plusieurs partenaires sexuels au cours des 12 derniers mois ?',
      'هل كان لديك عدة شركاء جنسيين خلال الـ 12 شهراً الماضية؟',
    ),
    // Injection equipment weighs double: one unit of exposure here matters more.
    riskQuestion(
      3, 2,
      "Avez-vous déjà partagé du matériel d'injection (seringues, aiguilles) ?",
      'هل سبق لك مشاركة معدات الحقن (إبر، محاقن)؟',
    ),
    riskQuestion(
      4, 1,
      'Avez-vous présenté des symptômes compatibles avec une IST récemment ?',
      'هل ظهرت لديك مؤخراً أعراض قد تتوافق مع عدوى منقولة جنسياً؟',
    ),
    riskQuestion(
      5, 1,
      'Avez-vous réalisé un dépistage au cours des 12 derniers mois ?',
      'هل أجريت فحصاً خلال الـ 12 شهراً الماضية؟',
    ),

    // Classification questions: weight 0, options carry `sets_*` instead of a
    // score.
    {
      question_id: id(106),
      weight: 0,
      text: { fr: 'Qui êtes-vous ?', ar: 'من أنت؟' },
      options: [
        { option_id: id(1061), score: 0, sets_user_type: 'youth', label: { fr: 'Jeune', ar: 'شاب/شابة' } },
        { option_id: id(1062), score: 0, sets_user_type: 'key_population', label: { fr: 'Population clé', ar: 'فئة مستهدفة' } },
        { option_id: id(1063), score: 0, sets_user_type: 'migrant', label: { fr: 'Migrant', ar: 'مهاجر' } },
        { option_id: id(1064), score: 0, sets_user_type: 'general_public', label: { fr: 'Grand public', ar: 'العموم' } },
      ],
    },
    {
      question_id: id(107),
      weight: 0,
      text: { fr: 'Quelle est votre situation familiale ?', ar: 'ما هو وضعك العائلي؟' },
      options: [
        { option_id: id(1071), score: 0, sets_family_situation: 'single', label: { fr: 'Célibataire', ar: 'أعزب / عزباء' } },
        { option_id: id(1072), score: 0, sets_family_situation: 'married', label: { fr: 'Marié(e)', ar: 'متزوج / متزوجة' } },
      ],
    },
  ],

  // Highest weighted total each band still covers. Weighted maximum is
  // 2 * (1 + 1 + 2 + 1 + 1) = 12; anything above the MEDIUM bound is HIGH.
  bands: [
    { level: 'LOW', max_total: 3 },
    { level: 'MEDIUM', max_total: 7 },
    { level: 'HIGH', max_total: Infinity },
  ],

  // Presentation text per band, in the profile language.
  orientation: {
    LOW: {
      fr: "D'après vos réponses, votre niveau de risque semble faible. Continuez les bonnes pratiques de prévention.",
      ar: 'وفق إجاباتك، يبدو مستوى المخاطر منخفضاً. واصِل ممارسات الوقاية الجيدة.',
    },
    MEDIUM: {
      fr: "D'après vos réponses, un risque modéré est possible. Un dépistage peut vous rassurer et vous orienter.",
      ar: 'وفق إجاباتك، قد يكون المخاطر متوسطاً. يمكن أن يطمئنك الفحص ويوجهك.',
    },
    HIGH: {
      fr: "D'après vos réponses, un risque plus élevé est possible. Nous vous encourageons à vous faire dépister dans un centre.",
      ar: 'وفق إجاباتك، قد يكون المخاطر مرتفعاً. نشجعك على إجراء فحص في مركز مختص.',
    },
  },
};

module.exports = { quiz };
