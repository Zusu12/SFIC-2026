/**
 * Gamification configuration for CodeToTelugu.
 * Defines XP awards, levels, and achievements.
 */

export const XP_REWARDS = {
  CODING_CHALLENGE: 20,
  OUTPUT_QUESTION: 10,
  BUG_FIX: 25,
  LEARNING_LESSON: 15,
  DAILY_CHALLENGE: 30,
};

export const LEVELS = [
  {
    level: 1,
    title: 'Python Beginner',
    teluguTitle: 'Praarambhaku (Beginner)',
    minXp: 0,
    maxXp: 49,
    description: 'Starting your Python learning journey with Telugu concepts.',
  },
  {
    level: 2,
    title: 'Logic Builder',
    teluguTitle: 'Logic Nirmatha',
    minXp: 50,
    maxXp: 119,
    description: 'Understanding conditional branching and simple calculations.',
  },
  {
    level: 3,
    title: 'Loop Master',
    teluguTitle: 'Loop Naipunyudu',
    minXp: 120,
    maxXp: 219,
    description: 'Mastering bounded loops and iterating through sequences.',
  },
  {
    level: 4,
    title: 'Function Expert',
    teluguTitle: 'Function Nipunudu',
    minXp: 220,
    maxXp: 349,
    description: 'Writing reusable Python functions with inputs and returns.',
  },
  {
    level: 5,
    title: 'Python Problem Solver',
    teluguTitle: 'Samasya Parishkarakudu',
    minXp: 350,
    maxXp: 519,
    description: 'Debugging tracebacks and solving real programming problems.',
  },
  {
    level: 6,
    title: 'Code Champion',
    teluguTitle: 'Coding Vijetha',
    minXp: 520,
    maxXp: 749,
    description: 'Demonstrating solid programming fluency across complex algorithms.',
  },
  {
    level: 7,
    title: 'Telugu Coding Pro',
    teluguTitle: 'Telugu Coding Pandithudu',
    minXp: 750,
    maxXp: Infinity,
    description: 'Elite programming mastery with bilingual expertise.',
  },
];

export const ACHIEVEMENTS = [
  {
    id: 'first_steps',
    title: 'First Steps',
    teluguTitle: 'Modati Adugu',
    description: 'Complete your first learning activity.',
    icon: 'Footprints',
    requiredCount: 1,
    metric: 'totalActivities',
  },
  {
    id: 'output_master',
    title: 'Output Master',
    teluguTitle: 'Output Nipunudu',
    description: 'Answer five output questions correctly.',
    icon: 'Terminal',
    requiredCount: 5,
    metric: 'outputQuestionsAnswered',
  },
  {
    id: 'bug_hunter',
    title: 'Bug Hunter',
    teluguTitle: 'Lopaala Vetakari',
    description: 'Fix five coding bugs.',
    icon: 'Bug',
    requiredCount: 5,
    metric: 'bugsFixed',
  },
  {
    id: 'seven_day_learner',
    title: 'Seven-Day Learner',
    teluguTitle: 'Edu Rojula Abhyasanam',
    description: 'Practise on seven separate days.',
    icon: 'Calendar',
    requiredCount: 7,
    metric: 'distinctActiveDays',
  },
  {
    id: 'challenge_champion',
    title: 'Challenge Champion',
    teluguTitle: 'Savalula Vijetha',
    description: 'Complete ten coding challenges.',
    icon: 'Trophy',
    requiredCount: 10,
    metric: 'challengesCompleted',
  },
];
