import { Link } from "react-router-dom";

function LoginPage() {
  return (
    <div className="login-shell">
      <section className="login-panel login-panel--brand">
        <p className="eyebrow">Debt collection workspace</p>
        <h1>PayTrackAI</h1>
        <p className="login-copy">
          A focused recovery dashboard for debt reminders, message drafts, and
          payment tracking.
        </p>

        <div className="login-feature-list">
          <div className="login-feature">
            <strong>Smart follow-ups</strong>
            <span>Prioritize overdue debtors in one daily queue.</span>
          </div>
          <div className="login-feature">
            <strong>Bilingual drafts</strong>
            <span>Create Hindi and English reminders in the same workflow.</span>
          </div>
          <div className="login-feature">
            <strong>Debt visibility</strong>
            <span>Track pending amounts, payments, and message history.</span>
          </div>
        </div>
      </section>

      <section className="login-panel login-panel--form">
        <div>
          <p className="eyebrow">Sign in</p>
          <h2>Welcome back</h2>
          <p className="muted-text">Use this demo login to enter the dashboard.</p>
        </div>

        <form className="login-form">
          <label>
            Email
            <input type="email" placeholder="owner@business.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Enter password" />
          </label>

          <Link className="primary-button login-link" to="/dashboard">
            Login to dashboard
          </Link>
        </form>
      </section>
    </div>
  );
}

export default LoginPage;
