function TopBar({ title, eyebrow, actionLabel = "Hindi | English" }) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>

      <div className="topbar-actions">
        <label className="search-box" htmlFor="global-search">
          <span>Search</span>
          <input
            id="global-search"
            type="text"
            placeholder="Name, phone, message, or payment"
          />
        </label>

        <button type="button" className="ghost-button">
          {actionLabel}
        </button>

        <button type="button" className="profile-pill">
          RK
        </button>
      </div>
    </header>
  );
}

export default TopBar;
