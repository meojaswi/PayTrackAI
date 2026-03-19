import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Debtors", to: "/debtors" },
  { label: "Messages", to: "/messages" },
  { label: "Payments", to: "/payments" },
  { label: "Import Excel", to: "/import" },
  { label: "Settings", to: "/settings" },
];

function AppLayout() {
  return (
    <div className="app-shell app-shell--two-column">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">P</div>
          <div>
            <p className="eyebrow">Collections Suite</p>
            <h1>PayTrackAI</h1>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item nav-link ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-title">Today&apos;s target</p>
          <strong>Rs 95,000</strong>
          <span>7 debtors need immediate action</span>
        </div>
      </aside>

      <div className="content-shell">
        <Outlet />
      </div>
    </div>
  );
}

export default AppLayout;
