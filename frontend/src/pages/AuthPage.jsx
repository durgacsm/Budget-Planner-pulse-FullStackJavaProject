
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { USE_MOCK } from '../api';

const FLOATERS = [
  { e: '🍜', x: 8, y: 18, d: 0 },
  { e: '💸', x: 82, y: 12, d: 1.2 },
  { e: '🏠', x: 14, y: 72, d: 2.1 },
  { e: '📈', x: 88, y: 64, d: 0.6 },
  { e: '🎯', x: 48, y: 88, d: 1.7 },
  { e: '🚕', x: 70, y: 38, d: 2.6 },
];

export default function AuthPage() {
  const { login, register, demo } = useAuth();

  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isReg = mode === 'register';

  const validate = () => {
    if (isReg && name.trim().length < 2) {
      return 'Please enter your name';
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return 'Enter a valid email address';
    }

    // Your Spring Boot backend requires at least 8 characters.
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }

    return '';
  };

  const submit = async (e) => {
    e.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setBusy(true);

    try {
      if (isReg) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }

      // AuthContext saves the token and updates the user.
      // App.jsx handles navigation based on the updated user.
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const runDemo = async () => {
    setError('');
    setBusy(true);

    try {
      await demo();
    } catch (err) {
      setError(err?.message || 'Demo login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="aurora" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>

      {FLOATERS.map((f) => (
        <span
          key={f.e}
          className="floater"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            animationDelay: `${f.d}s`,
          }}
        >
          {f.e}
        </span>
      ))}

      <div className="auth-grid">
        <section className="auth-hero">
          <span className="logo big">
            <svg
              viewBox="0 0 64 64"
              width="34"
              height="34"
              aria-hidden="true"
            >
              <path
                d="M8 38h10l7-18 9 28 7-20 4 10h11"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <h1>
            Feel your money's <span className="grad">pulse</span>.
          </h1>

          <p>
            Know exactly what's safe to spend today, watch goals fill up,
            and turn every rupee into a decision you feel good about.
          </p>

          <ul className="hero-points">
            <li><b>Safe-to-spend</b> daily allowance</li>
            <li><b>Money Health</b> score out of 100</li>
            <li><b>What-if</b> savings simulator</li>
          </ul>
        </section>

        <form className="auth-card glass" onSubmit={submit} noValidate>
          <div className="segmented">
            <span className={`seg-thumb ${isReg ? 'right' : ''}`} />

            <button
              type="button"
              className={!isReg ? 'on' : ''}
              disabled={busy}
              onClick={() => {
                setMode('login');
                setError('');
              }}
            >
              Sign in
            </button>

            <button
              type="button"
              className={isReg ? 'on' : ''}
              disabled={busy}
              onClick={() => {
                setMode('register');
                setError('');
              }}
            >
              Create account
            </button>
          </div>

          <h2>{isReg ? 'Start your journey' : 'Welcome back'}</h2>

          {isReg && (
            <label className="input-icon">
              <User size={18} />
              <input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </label>
          )}

          <label className="input-icon">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="input-icon">
            <Lock size={18} />
            <input
              type={show ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isReg ? 'new-password' : 'current-password'}
              required
            />

            <button
              type="button"
              className="eye"
              onClick={() => setShow((current) => !current)}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>

          {error && (
            <p className="form-error shake" role="alert" key={error}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy}
          >
            {busy
              ? 'One moment…'
              : isReg
                ? 'Create account'
                : 'Sign in'}
          </button>

          {USE_MOCK && (
            <>
              <div className="or">
                <span>or</span>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={runDemo}
                disabled={busy}
              >
                <Sparkles size={18} />
                Explore with demo data
              </button>

              <p className="hint">
                Demo login: demo@example.com / demo1234
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
