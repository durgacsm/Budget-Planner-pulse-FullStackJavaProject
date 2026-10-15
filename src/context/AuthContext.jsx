
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api, USE_MOCK } from '../api';
import { TOKEN_KEY, USER_KEY } from '../api/client';

const AuthContext = createContext(null);

// Read the saved user safely.
const readUser = () => {
  try {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error('Could not read saved user information.');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() =>
    localStorage.getItem(TOKEN_KEY) ? readUser() : null
  );

  // Save the token and user after successful login or registration.
  const store = useCallback((result) => {
    if (!result?.token || !result?.user) {
      throw new Error(
        'Authentication response is missing the token or user information.'
      );
    }

    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));

    setUser(result.user);
  }, []);

  // Clear authentication information when logging out.
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Log out if the backend reports an unauthorized request.
  useEffect(() => {
    window.addEventListener('bp:unauthorized', logout);

    return () => {
      window.removeEventListener('bp:unauthorized', logout);
    };
  }, [logout]);

  // Login with the selected API.
  const login = useCallback(
    async (email, password) => {
      const result = await api.login(email, password);

      // Diagnostic output: never print the actual token or password.
      console.log('Login response received:', {
        hasToken: Boolean(result?.token),
        hasUser: Boolean(result?.user),
        usingMockApi: USE_MOCK,
      });

      store(result);
      return result;
    },
    [store]
  );

  // Register a new account.
  const register = useCallback(
    async (name, email, password) => {
      const result = await api.register(name, email, password);
      store(result);
      return result;
    },
    [store]
  );

  // Demo login is available only when mock mode is enabled.
  const demo = useCallback(async () => {
    const result = await api.demoLogin();
    store(result);
    return result;
  }, [store]);

  const value = useMemo(
    () => ({
      user,
      login,
      register,
      demo,
      logout,
    }),
    [user, login, register, demo, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider.'
    );
  }

  return context;
};
