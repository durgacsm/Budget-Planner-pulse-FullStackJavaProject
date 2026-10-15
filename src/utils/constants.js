export const EXPENSE_CATEGORIES = [
  { name: 'Groceries', emoji: '🛒', color: '#5CF2C0', words: ['dmart', 'grocery', 'groceries', 'bigbasket', 'zepto', 'blinkit', 'vegetables', 'milk'] },
  { name: 'Food & Dining', emoji: '🍜', color: '#FF7A59', words: ['swiggy', 'zomato', 'food', 'lunch', 'dinner', 'cafe', 'coffee', 'restaurant', 'biryani', 'pizza'] },
  { name: 'Transport', emoji: '🚕', color: '#8B7CFF', words: ['uber', 'ola', 'rapido', 'fuel', 'petrol', 'diesel', 'metro', 'bus', 'auto', 'cab', 'train'] },
  { name: 'Rent & Housing', emoji: '🏠', color: '#FFD166', words: ['rent', 'maintenance', 'housing', 'society'] },
  { name: 'Bills & Utilities', emoji: '💡', color: '#4CC9F0', words: ['electricity', 'water', 'wifi', 'internet', 'recharge', 'bill', 'gas', 'broadband'] },
  { name: 'Health', emoji: '💊', color: '#F72585', words: ['doctor', 'medicine', 'pharmacy', 'hospital', 'gym', 'health'] },
  { name: 'Shopping', emoji: '🛍️', color: '#B5179E', words: ['amazon', 'flipkart', 'myntra', 'shopping', 'clothes', 'shoes'] },
  { name: 'Entertainment', emoji: '🎬', color: '#F9844A', words: ['movie', 'netflix', 'spotify', 'game', 'concert', 'hotstar', 'prime'] },
  { name: 'Education', emoji: '📚', color: '#43AA8B', words: ['course', 'book', 'books', 'fees', 'tuition', 'udemy'] },
  { name: 'Travel', emoji: '✈️', color: '#577590', words: ['flight', 'hotel', 'trip', 'travel', 'booking', 'irctc'] },
  { name: 'Other', emoji: '✨', color: '#9AA5B1', words: [] },
];

export const INCOME_CATEGORIES = [
  { name: 'Salary', emoji: '💼', color: '#5CF2C0', words: ['salary', 'payroll', 'wage'] },
  { name: 'Freelance', emoji: '💻', color: '#4CC9F0', words: ['freelance', 'client', 'project', 'gig'] },
  { name: 'Investments', emoji: '📈', color: '#FFD166', words: ['dividend', 'interest', 'returns', 'mutual', 'stocks'] },
  { name: 'Gift', emoji: '🎁', color: '#F72585', words: ['gift', 'bonus', 'cashback'] },
  { name: 'Other Income', emoji: '💰', color: '#9AA5B1', words: [] },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const catMeta = (name) =>
  ALL_CATEGORIES.find((c) => c.name === name) || { name, emoji: '✨', color: '#9AA5B1', words: [] };

export const categoriesFor = (type) => (type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES);

// Turns "swiggy 450 food" or "+50000 salary" into a transaction draft.
export const parseQuickAdd = (text) => {
  const m = text.match(/(\d[\d,]*(?:\.\d+)?)/);
  if (!m) return null;
  const amount = Number(m[1].replace(/,/g, ''));
  if (!amount) return null;
  const rest = text.replace(m[0], ' ').replace(/[+₹]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = rest.toLowerCase();
  const wantsIncome = text.trim().startsWith('+') || INCOME_CATEGORIES.some((c) => c.words.some((w) => lower.includes(w)));
  const type = wantsIncome ? 'INCOME' : 'EXPENSE';
  const pool = categoriesFor(type);
  const hit =
    pool.find((c) => lower.includes(c.name.toLowerCase())) ||
    pool.find((c) => c.words.some((w) => lower.includes(w))) ||
    pool[pool.length - 1];
  return {
    type,
    amount,
    category: hit.name,
    description: rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : hit.name,
  };
};
