export type Topic = {
  id: string;
  title: string;
  description: string;
};

export type Guest = {
  id: string;
  name: string;
  bio: string;
  color: string;
  initials: string;
  avatar: string;
  context: string;
  story: string;
  topicIds: string[];
};

export const TOPICS: Topic[] = [
  { id: 'product-discovery', title: 'Product Discovery', description: 'What to build, why, and for whom.' },
  { id: 'customer-interviewing', title: 'Customer Interviewing', description: 'How to ask better questions and learn faster.' },
  { id: 'prioritization', title: 'Prioritization', description: 'How to choose what matters now.' },
  { id: 'roadmapping', title: 'Roadmapping', description: 'How to align teams without fake certainty.' },
  { id: 'engineering-collaboration', title: 'Working with Engineering', description: 'Build trust and ship better together.' },
  { id: 'metrics-and-success', title: 'Metrics & Success', description: 'Measure what matters, not what is easy.' },
  { id: 'killing-features', title: 'Killing Features', description: 'How to cut scope and say no with confidence.' },
];

export const GUESTS: Guest[] = [
  {
    id: 'teresa',
    name: 'Teresa Torres',
    bio: 'Continuous Discovery Habits, Product Talk',
    color: '#8b5cf6',
    initials: 'TT',
    avatar: '🟣',
    context: 'Product Talk · Author of Continuous Discovery Habits',
    story: 'I coach teams on continuous discovery and have taught discovery skills to thousands of PMs.',
    topicIds: ['product-discovery', 'customer-interviewing', 'prioritization', 'roadmapping'],
  },
  {
    id: 'marty',
    name: 'Marty Cagan',
    bio: 'SVPG, author of Inspired',
    color: '#f97316',
    initials: 'MC',
    avatar: '🟠',
    context: 'SVPG · Author of Inspired, Empowered, Transformed',
    story: 'I led product at eBay and Netscape and now coach product teams globally through SVPG.',
    topicIds: ['product-discovery', 'prioritization', 'roadmapping', 'engineering-collaboration', 'killing-features'],
  },
  {
    id: 'shreyas',
    name: 'Shreyas Doshi',
    bio: 'Ex-Stripe, Coda, Google PM leader',
    color: '#14b8a6',
    initials: 'SD',
    avatar: '🟢',
    context: 'Advisor · Ex-Stripe, Twitter, Google, Yahoo',
    story: 'I advise founders and write about product leadership, career leverage, and decision quality.',
    topicIds: ['product-discovery', 'prioritization', 'metrics-and-success', 'killing-features'],
  },
  {
    id: 'claire',
    name: 'Claire Vo',
    bio: 'CPO at Brex, ex-Optimizely',
    color: '#22c55e',
    initials: 'CV',
    avatar: '🔵',
    context: 'Founder of ChatPRD · 3x CPTO (LaunchDarkly, Color, Optimizely)',
    story: 'I’ve built both as a startup founder and as a product+engineering leader at scale.',
    topicIds: ['product-discovery', 'engineering-collaboration', 'metrics-and-success', 'roadmapping'],
  },
  {
    id: 'jeff',
    name: 'Jeff Weinstein',
    bio: 'Product leader, ex-Stripe',
    color: '#f59e0b',
    initials: 'JW',
    avatar: '🟡',
    context: 'Ex-Stripe product leader',
    story: 'I’ve built products at Stripe where prioritization, metrics, and cross-functional execution had to be brutally clear.',
    topicIds: ['prioritization', 'engineering-collaboration', 'metrics-and-success'],
  },
  {
    id: 'gibson',
    name: 'Gibson Biddle',
    bio: 'Ex-Netflix VP Product',
    color: '#ef4444',
    initials: 'GB',
    avatar: '🔴',
    context: 'Ex-Netflix VP Product',
    story: 'At Netflix, we had to make hard strategic bets with clarity, conviction, and constant roadmap tradeoffs.',
    topicIds: ['prioritization', 'roadmapping'],
  },
  {
    id: 'asha',
    name: 'Asha Sharma',
    bio: 'Product leader, ex-Microsoft / Instacart',
    color: '#ec4899',
    initials: 'AS',
    avatar: '🩷',
    context: 'Product leader focused on scaling teams and execution',
    story: 'I’ve worked on scaling product teams where prioritization and engineering collaboration decide whether strategy survives contact with reality.',
    topicIds: ['prioritization', 'engineering-collaboration'],
  },
  {
    id: 'mikek',
    name: 'Mike Krieger',
    bio: 'Instagram co-founder, CTO at Anthropic',
    color: '#06b6d4',
    initials: 'MK',
    avatar: '🔵',
    context: 'Instagram co-founder · Anthropic CTO',
    story: 'From Instagram to Anthropic, I’ve seen how product and engineering velocity depend on crisp priorities and strong technical collaboration.',
    topicIds: ['prioritization', 'engineering-collaboration'],
  },
  {
    id: 'lenny',
    name: 'Lenny Rachitsky',
    bio: 'Moderator',
    color: '#9ca3af',
    initials: 'LR',
    avatar: '⚪️',
    context: 'Lenny’s Newsletter & Podcast · Moderator',
    story: 'I synthesize lessons from top operators and surface practical patterns with sharp follow-ups.',
    topicIds: TOPICS.map((t) => t.id),
  },
];

export const getTopicById = (id: string) => TOPICS.find((t) => t.id === id) ?? TOPICS[0];
export const guestsForTopic = (topicId: string) => GUESTS.filter((g) => g.topicIds.includes(topicId));
