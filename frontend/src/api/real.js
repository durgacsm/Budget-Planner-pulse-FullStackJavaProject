
import client from './client';

// Every call to your Spring Boot backend lives here.
export const realApi = {
  // Login and save the JWT token and user information.
  async login(email, password) {
    const result = (
      await client.post('/auth/login', { email, password })
    ).data;

    if (!result?.token || !result?.user) {
      throw new Error(
        'Login response is missing the token or user information.'
      );
    }

    localStorage.setItem('bp_token', result.token);
    localStorage.setItem('bp_user', JSON.stringify(result.user));

    return result;
  },

  // Register a new user.
  async register(name, email, password) {
    const result = (
      await client.post('/auth/register', { name, email, password })
    ).data;

    if (!result?.token || !result?.user) {
      throw new Error(
        'Registration response is missing the token or user information.'
      );
    }

    localStorage.setItem('bp_token', result.token);
    localStorage.setItem('bp_user', JSON.stringify(result.user));

    return result;
  },

  async demoLogin() {
    throw new Error(
      'Demo mode is only available when VITE_USE_MOCK=true'
    );
  },

  // Transactions.
  async getTransactions(params = {}) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value != null && value !== '')
    );

    return (await client.get('/transactions', { params: clean })).data;
  },

  async createTransaction(body) {
    return (await client.post('/transactions', body)).data;
  },

  async updateTransaction(id, body) {
    return (await client.put(`/transactions/${id}`, body)).data;
  },

  async deleteTransaction(id) {
    await client.delete(`/transactions/${id}`);
  },

  // Budgets.
  async getBudgets(month) {
    const params = month ? { month } : {};
    return (await client.get('/budgets', { params })).data;
  },

  async saveBudget(body) {
    if (body?.id != null) {
      return (
        await client.put(`/budgets/${body.id}`, body)
      ).data;
    }

    return (await client.post('/budgets', body)).data;
  },

  async deleteBudget(id) {
    await client.delete(`/budgets/${id}`);
  },
};
