import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import { fetchDashboardData } from "../lib/api";

const quickFilters = [
  "All",
  "Due Today",
  "Overdue",
  "High Amount",
  "Promised",
  "No Response",
  "Hindi",
  "English",
];

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    summaryCards: [],
    followupQueue: [],
    alerts: [],
    debtors: [],
    debtorProfile: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchDashboardData();

        if (isMounted) {
          setDashboardData(data);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Unable to load dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const {
    summaryCards = [],
    followupQueue = [],
    alerts = [],
    debtors = [],
    debtorProfile,
  } = dashboardData;

  return (
    <div className="page-with-drawer">
      <main className="dashboard">
        <TopBar title="Debt Recovery Dashboard" eyebrow="Welcome back" />

        {isLoading ? <p className="muted-text">Loading dashboard...</p> : null}
        {!isLoading && errorMessage ? (
          <p className="feedback-message error">{errorMessage}</p>
        ) : null}

        <section className="summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`summary-card ${card.theme}`}>
              <p>{card.label}</p>
              <h3>{card.value}</h3>
              <span>{card.note}</span>
            </article>
          ))}
        </section>

        <section className="hero-grid">
          <article className="panel followup-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Priority Queue</p>
                <h3>Today&apos;s Follow-ups</h3>
              </div>
              <button type="button" className="text-button">
                View all
              </button>
            </div>

            <div className="followup-list">
              {followupQueue.map((item) => (
                <div key={item.name} className="followup-item">
                  <div>
                    <h4>{item.name}</h4>
                    <p>{item.amount}</p>
                    <span>
                      {item.overdue} • Last contact {item.lastContact}
                    </span>
                  </div>

                  <div className="followup-actions">
                    <span className={`priority-badge ${item.priority.toLowerCase()}`}>
                      {item.priority}
                    </span>
                    <button type="button" className="primary-button small">
                      Generate
                    </button>
                  </div>
                </div>
              ))}
              {!followupQueue.length && !isLoading ? (
                <p className="muted-text">No follow-ups available yet.</p>
              ) : null}
            </div>
          </article>

          <article className="panel alert-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Attention Needed</p>
                <h3>Alerts & Promises</h3>
              </div>
            </div>

            <ul className="alert-list">
              {alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>

            <button type="button" className="primary-button wide">
              Import Excel Sheet
            </button>
          </article>
        </section>

        <section className="panel debtors-panel">
          <div className="panel-header debtors-header">
            <div>
              <p className="eyebrow">Operations</p>
              <h3>Debtors Overview</h3>
            </div>

            <div className="filter-row">
              {quickFilters.map((filter, index) => (
                <button
                  key={filter}
                  type="button"
                  className={`filter-chip ${index === 0 ? "active" : ""}`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Debtor</th>
                  <th>Phone</th>
                  <th>Pending</th>
                  <th>Due Date</th>
                  <th>Overdue</th>
                  <th>Last Contact</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {debtors.map((debtor) => (
                  <tr key={debtor.id || debtor.phone}>
                    <td>{debtor.name}</td>
                    <td>{debtor.phone}</td>
                    <td>{debtor.amount}</td>
                    <td>{debtor.dueDate}</td>
                    <td>{debtor.overdue} days</td>
                    <td>{debtor.lastContact}</td>
                    <td>{debtor.language}</td>
                    <td>
                      <span className={`status-badge ${slugify(debtor.status)}`}>
                        {debtor.status}
                      </span>
                    </td>
                    <td>{debtor.followupDate}</td>
                    <td>
                      <button type="button" className="text-button compact">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {!debtors.length && !isLoading ? (
                  <tr>
                    <td colSpan="10" className="muted-text">
                      No debtor records found. Import an Excel file to populate the dashboard.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <aside className="detail-drawer">
        <div className="drawer-card">
          <p className="eyebrow">Selected Debtor</p>
          <h3>{debtorProfile?.name || "No debtor selected"}</h3>
          <span>{debtorProfile?.owner || "-"}</span>

          <div className="profile-metrics">
            <div>
              <p>Pending</p>
              <strong>{debtorProfile?.amount || "-"}</strong>
            </div>
            <div>
              <p>Due Date</p>
              <strong>{debtorProfile?.dueDate || "-"}</strong>
            </div>
          </div>
        </div>

        <div className="drawer-card">
          <h4>Contact Snapshot</h4>
          <p>{debtorProfile?.phone || "-"}</p>
          <p>Preferred language: {debtorProfile?.language || "-"}</p>
          <p>Last payment: {debtorProfile?.lastPayment || "-"}</p>
        </div>

        <div className="drawer-card">
          <h4>Internal Notes</h4>
          <p>{debtorProfile?.notes || "-"}</p>
        </div>

        <div className="drawer-card">
          <h4>Recent Timeline</h4>
          <ul className="timeline-list">
            {(debtorProfile?.messages || []).map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>

        <div className="drawer-card highlight">
          <div className="panel-header">
            <div>
              <p className="eyebrow">AI Draft</p>
              <h4>Reminder Preview</h4>
            </div>
          </div>

          <div className="draft-controls">
            <span>Polite</span>
            <span>Hindi</span>
            <span>WhatsApp</span>
          </div>

          <p className="draft-text">{debtorProfile?.suggestion || "-"}</p>

          <div className="drawer-actions">
            <button type="button" className="primary-button">
              Generate Message
            </button>
            <button type="button" className="ghost-button wide">
              Send Reminder
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function slugify(value) {
  return value.toLowerCase().replace(/\s+/g, "-");
}

export default DashboardPage;
