// chatbotSeed.js — the published scripted chatbot (contract v3.5.0).
//
// SERVER-SIDE configuration: `published` and the unreachable draft step below
// are internal. routes/chatbot.js projects this onto the public shape through a
// whitelist, and only returns the steps reachable from `start_step_id`.
//
// The tree shows every shape the contract allows: a main menu that other steps
// return to (a cycle), a terminal `message` step (no choices), `action` steps
// (terminal, one per action_type) and an action with no text to display.
// choice_id is unique within the scenario only.

const t = (fr, ar) => ({ fr, ar });

const message = (step_id, step_key, text, choices) => ({
  step_id, step_key, step_type: 'message', message: text, action_type: null, choices,
});

const action = (step_id, step_key, action_type, text) => ({
  step_id, step_key, step_type: 'action', message: text, action_type, choices: [],
});

const choice = (choice_id, label, next_step_id) => ({ choice_id, label, next_step_id });

const menu = (choice_id) => choice(choice_id, t('Autre sujet', 'موضوع آخر'), 10);

const scenario = {
  scenario_id: 3,
  published: true,
  title: t('Assistant dépistage', 'مساعد الكشف'),
  start_step_id: 10,
  steps: [
    message(10, 'main_menu',
      t('Bonjour ! Je peux vous orienter sur le dépistage. Que souhaitez-vous savoir ?',
        'مرحباً! يمكنني توجيهك بخصوص الكشف. ماذا تريد أن تعرف؟'),
      [
        choice(100, t("Qu'est-ce que le dépistage ?", 'ما هو الكشف؟'), 11),
        choice(101, t('Anonymat et confidentialité', 'السرية وعدم الكشف عن الهوية'), 12),
        choice(102, t('Trouver un centre', 'العثور على مركز'), 13),
        choice(103, t('Évaluer mon risque', 'تقييم خطري'), 14),
      ]),
    message(11, 'screening_info',
      t('Le dépistage permet de détecter certaines infections tôt, sans jugement. Il est gratuit dans les centres partenaires.',
        'يتيح الكشف اكتشاف بعض العدوى مبكراً ودون أحكام مسبقة. وهو مجاني في المراكز الشريكة.'),
      [
        choice(110, t('Est-ce vraiment gratuit ?', 'هل هو مجاني حقاً؟'), 15),
        choice(111, t('Trouver un centre', 'العثور على مركز'), 13),
        choice(112, t('Anonymat et confidentialité', 'السرية وعدم الكشف عن الهوية'), 12),
        menu(113),
      ]),
    message(12, 'anonymity_info',
      t("Oui : le dépistage est anonyme et confidentiel. Aucune pièce d'identité n'est exigée pour être reçu.",
        'نعم: الكشف مجهول وسري. لا يُطلب أي وثيقة هوية لاستقبالك.'),
      [
        choice(120, t('Trouver un centre', 'العثور على مركز'), 13),
        choice(121, t("Qu'est-ce que le dépistage ?", 'ما هو الكشف؟'), 11),
        menu(122),
      ]),
    action(13, 'find_center', 'open_centers',
      t('Je vous ouvre la liste des centres de dépistage.', 'سأفتح لك قائمة مراكز الكشف.')),
    // No text to display: the app navigates straight away.
    action(14, 'assess_risk', 'open_self_assessment', null),
    message(15, 'free_of_charge',
      t('Oui. Dans les centres partenaires, le dépistage est gratuit et ne demande aucun justificatif.',
        'نعم. في المراكز الشريكة، الكشف مجاني ولا يتطلب أي وثيقة.'),
      []),
    // A draft nobody links to: it must never reach the wire.
    message(99, 'draft_unlinked',
      t('Brouillon non publié.', 'مسودة غير منشورة.'),
      [choice(990, t('Retour', 'رجوع'), 10)]),
  ],
};

module.exports = { scenario };
