import TopBar from "../components/TopBar";
import { settingsGroups } from "../data/appData";

function SettingsPage() {
  return (
    <div className="page-stack">
      <TopBar title="Settings" eyebrow="Business preferences" />

      <section className="cards-grid cards-grid--three">
        {settingsGroups.map((group) => (
          <article key={group.title} className="panel">
            <p className="eyebrow">Configuration</p>
            <h3>{group.title}</h3>
            <ul className="simple-list">
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

export default SettingsPage;
