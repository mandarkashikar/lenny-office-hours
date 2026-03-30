type GuestMessageMap = Record<string, string[]>;

export const OPENERS: Record<string, GuestMessageMap> = {
  'product-discovery': {
    teresa: [
      'The goal of discovery is to identify opportunities worth pursuing, not to validate solutions you already love.',
      'Run weekly customer touchpoints. Small and consistent beats occasional big research sprints.',
    ],
    marty: [
      'Discovery is a team sport. PM, design, and engineering should discover together.',
      'If discovery happens before delivery as a separate phase, you are likely doing theater.',
    ],
    shreyas: [
      'Most discovery is theater because teams seek confirmation, not truth.',
      'You need intellectual honesty: kill your own idea when evidence says so.',
    ],
    claire: [
      'Ship to learn. Fast, reversible decisions beat perfection.',
      'I care less about the ritual and more about velocity of learning.',
    ],
    lenny: ['Strong takes. Mandar, what part of your current discovery process feels most performative?'],
  },
};

export const SUMMARY_ACTIONS: Record<string, string[]> = {
  'product-discovery': [
    'Schedule one customer conversation this week (non-negotiable).',
    'Write your top 3 assumptions and rank by risk.',
    'Kill one weak idea before Friday and document why.',
  ],
};
