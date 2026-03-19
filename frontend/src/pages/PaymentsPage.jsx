import TopBar from "../components/TopBar";
import { payments } from "../data/appData";

function PaymentsPage() {
  return (
    <div className="page-stack">
      <TopBar title="Payments" eyebrow="Collection history" />

      <section className="cards-grid">
        <article className="panel stat-panel">
          <p className="eyebrow">Received Today</p>
          <h3>Rs 33,000</h3>
          <p className="muted-text">Across 3 debtor accounts</p>
        </article>
        <article className="panel stat-panel">
          <p className="eyebrow">Pending Verification</p>
          <h3>Rs 12,500</h3>
          <p className="muted-text">2 payments waiting for confirmation</p>
        </article>
        <article className="panel stat-panel">
          <p className="eyebrow">Collection Rate</p>
          <h3>68%</h3>
          <p className="muted-text">Improved from last week</p>
        </article>
      </section>

      <section className="panel">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Debtor</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={`${payment.debtor}-${payment.date}`}>
                  <td>{payment.debtor}</td>
                  <td>{payment.amount}</td>
                  <td>{payment.date}</td>
                  <td>{payment.mode}</td>
                  <td>
                    <span className="status-badge partial-payment">
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default PaymentsPage;
