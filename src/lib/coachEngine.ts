import { db } from './db';
import type { CoachMessage, UserBook } from './db';

// Curated coaching prompts by book genre/category
const CATEGORY_PROMPTS = {
  fiction: [
    "Which character's choice or action felt most surprising or challenging to you in today's reading?",
    "How does the setting or atmosphere mirror the emotional tone of the story today?",
    "What do you predict will unfold next based on the subtle clues left by the author?",
    "If you could speak to the main character right now, what warning or advice would you offer them?"
  ],
  nonfiction: [
    "What is the single most important concept from today's reading that you want to remember next week?",
    "How does the author support their primary claim? Did their evidence convince you?",
    "Can you explain this concept in one sentence to someone who has never read the book?",
    "What question does this text raise that you feel remains unanswered?"
  ],
  selfhelp: [
    "What is one tiny, practical change you can make in your routine tomorrow inspired by this chapter?",
    "Did today's insights challenge any habits or patterns you currently have? How so?",
    "In your own words, what is the core method the author recommends for self-improvement here?",
    "How would you grade your current mastery of this concept in your daily life?"
  ],
  philosophy: [
    "How does the author's argument challenge your existing assumptions about truth or morality?",
    "What counter-arguments could someone make against the philosophical stance shared in this passage?",
    "How does this philosophical idea apply to a contemporary problem in modern society?",
    "Do you feel this concept leads to greater freedom or greater responsibility?"
  ],
  history: [
    "What parallels do you see between the historical events described here and current events today?",
    "How did the social or cultural context of the time influence the choices made by the key figures?",
    "Does the author present a balanced account of this historical period, or do you detect a specific bias?",
    "How does this period of history change your understanding of how modern institutions were formed?"
  ],
  biography: [
    "What core values or traits defined this person's choices in the face of adversity today?",
    "Do you find this person's actions admirable, or did they make choices you struggle to agree with?",
    "How did this person's environment shape their eventual path and impact?",
    "What lessons from their life story feel most applicable to your own career or personal growth?"
  ],
  academic: [
    "How does this research or study connect with other concepts you've read about recently?",
    "In your own words, describe the methodology or logical framework the author uses.",
    "What real-world application could benefit from the findings outlined in this section?",
    "What are the major limitations or gaps in the arguments presented here?"
  ]
};

// Generic fallback prompts
const GENERAL_PROMPTS = [
  "How can you apply this lesson or idea to your own personal goals or challenges today?",
  "What challenged or surprised you most in today's reading session?",
  "Can you think of a real-life analogy or example that illustrates the author's point?",
  "How does this reading session connect with what you learned from your previous books?",
  "What is the main takeaway you would share with a friend from today's reading?"
];

/**
 * Cleanly categorizes books based on title/tags/metadata
 */
function determineCategory(book: UserBook | null, storyGenre?: string): keyof typeof CATEGORY_PROMPTS {
  const text = ((book?.title || '') + ' ' + (storyGenre || '')).toLowerCase();
  
  if (text.includes('philosophy') || text.includes('meditations') || text.includes('seneca') || text.includes('marcus')) return 'philosophy';
  if (text.includes('habit') || text.includes('atomic') || text.includes('improving') || text.includes('self') || text.includes('growth')) return 'selfhelp';
  if (text.includes('history') || text.includes('empire') || text.includes('war') || text.includes('ancient')) return 'history';
  if (text.includes('biography') || text.includes('life') || text.includes('story') || text.includes('autobiography')) return 'biography';
  if (text.includes('academic') || text.includes('study') || text.includes('research') || text.includes('theory') || text.includes('science')) return 'academic';
  if (text.includes('fiction') || text.includes('novel') || text.includes('story') || text.includes('tale') || text.includes('hare') || text.includes('tortoise')) return 'fiction';
  
  return 'nonfiction';
}

/**
 * Extracts potential keywords representing user interests
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'and', 'this', 'that', 'with', 'about', 'from', 'read', 'book', 'pages', 'chapter']);
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4 && !commonWords.has(word))
    .slice(0, 3);
}

export const coachEngine = {
  /**
   * Process a user reflection and trigger an AI coach conversational reply
   */
  async processReflection(
    userId: string,
    reflectionText: string,
    bookId?: string | null
  ): Promise<{ message: CoachMessage; xpAwarded: number }> {
    // 1. Fetch user data & memory
    const coachProfile = await db.getCoachProfile(userId);
    const allBooks = await db.getUserBooks(userId);
    const activeBook = bookId ? allBooks.find(b => b.id === bookId) || null : null;
    
    // Find active reading content name
    const bookTitle = activeBook ? activeBook.title : 'your reading session';
    const category = determineCategory(activeBook);
    
    // 2. Analyze user's text reflection
    const reflectionLength = reflectionText.trim().split(/\s+/).length;
    const isThoughtful = reflectionLength >= 8;
    const detectedKeywords = extractKeywords(reflectionText);
    
    // 3. Update memory profile
    if (detectedKeywords.length > 0) {
      coachProfile.reading_interests = Array.from(new Set([...coachProfile.reading_interests, ...detectedKeywords])).slice(0, 10);
    }
    
    // Track recurring insights or themes discussed
    if (reflectionText.toLowerCase().includes('habit') || reflectionText.toLowerCase().includes('focus')) {
      coachProfile.favorite_themes = Array.from(new Set([...coachProfile.favorite_themes, 'habit formation'])).slice(0, 5);
    }
    if (reflectionText.toLowerCase().includes('challeng') || reflectionText.toLowerCase().includes('difficult')) {
      coachProfile.recurring_insights = Array.from(new Set([...coachProfile.recurring_insights, 'overcoming challenges'])).slice(0, 5);
    }
    
    coachProfile.last_active_at = new Date().toISOString();
    await db.saveCoachProfile(coachProfile);
    
    // 4. Generate intelligent conversational response
    let reply = "";
    
    // Praise naturally, avoid excessive exclamation
    if (reflectionLength < 4) {
      reply = `Thank you for sharing that quick thought on "${bookTitle}". Sometimes even a brief reaction highlights what truly connected with you. `;
    } else {
      reply = `That is a thoughtful observation on "${bookTitle}". Focusing on these specific takeaways really helps lock in comprehension. `;
    }
    
    // Comprehension feedback: relate reflection keywords to concept explanation
    if (detectedKeywords.length > 0) {
      const keywordQuote = detectedKeywords[0];
      reply += `It's interesting that you highlighted "${keywordQuote}"—this shows you are actively analyzing the core arguments. `;
    }
    
    // Occasional memory recall (1 in 3 chance if recurring insights exist)
    if (coachProfile.recurring_insights.length > 0 && Math.random() > 0.6) {
      const pastInsight = coachProfile.recurring_insights[0];
      reply += `Previously, you mentioned reflecting on "${pastInsight}". Do you feel the concepts you read today reinforce or change that perspective? `;
    } else {
      // Pick a category-specific follow-up question
      const prompts = CATEGORY_PROMPTS[category] || GENERAL_PROMPTS;
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      reply += `To take this further: ${randomPrompt}`;
    }
    
    // Streak Milestones context helper
    const streak = await db.getStreak(userId);
    if (streak && streak.current_streak > 0 && streak.current_streak % 5 === 0) {
      reply += ` Keep up this fantastic momentum—you're on a strong ${streak.current_streak}-day reading streak!`;
    }
    
    // 5. Calculate XP Bonus integration (+10 XP bonus for thoughtful dialog engagement)
    const xpAwarded = isThoughtful ? 10 : 0;
    if (xpAwarded > 0) {
      await db.addXP(userId, xpAwarded, 'coach-reflection-bonus');
    }
    
    // 6. Save message record to DB
    const coachMsg: CoachMessage = {
      id: Math.random().toString(),
      user_id: userId,
      book_id: bookId || null,
      sender: 'coach',
      content: reply,
      created_at: new Date().toISOString()
    };
    
    await db.saveCoachMessage(coachMsg);
    
    return {
      message: coachMsg,
      xpAwarded
    };
  }
};
