import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import {
  fetchMessagesDashboard,
  generateMessageDraft,
  saveMessageDraft,
  generateReminder,
} from "../lib/api";

const initialComposerState = {
  debtorId: "",
  tone: "Polite",
  language: "English",
  channel: "WhatsApp",
};

function MessagesPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [debtors, setDebtors] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [composerState, setComposerState] = useState(initialComposerState);
  const [draftData, setDraftData] = useState(null);
  const [retrievedDebtors, setRetrievedDebtors] = useState([]);
  const [retrievedMessages, setRetrievedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadMessagesDashboard() {
    try {
      const data = await fetchMessagesDashboard();
      setCampaigns(data.campaigns || []);
      setDebtors(data.debtors || []);
      setRecentMessages(data.recentMessages || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to load message dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMessagesDashboard();
  }, []);

  useEffect(() => {
    if (!composerState.debtorId && debtors.length) {
      const debtor = debtors[0];
      setComposerState((current) => ({
        ...current,
        debtorId: debtor.id,
        language: debtor.language || "English",
      }));
    }
  }, [debtors, composerState.debtorId]);

  function handleComposerChange(event) {
    const { name, value } = event.target;
    setComposerState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleGenerateDraft() {
    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await generateMessageDraft(composerState);
      setDraftData(data.draft);
      setRetrievedDebtors(data.retrievedDebtors || []);
      setRetrievedMessages(data.recentMessages || []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to generate draft.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateAIReminder() {
    const debtor = debtors.find((d) => d.id === composerState.debtorId);
    if (!debtor) return;

    setIsGenerating(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await generateReminder({
        name: debtor.name,
        amount: debtor.pendingAmount || 0,
        days: debtor.daysOverdue || 0,
        language: composerState.language.toLowerCase(),
        tone: composerState.tone.toLowerCase(),
      });

      setDraftData({
        content: result.message,
        tone: result.tone,
        language: result.language,
        channel: composerState.channel,
      });
    } catch (error) {
      setErrorMessage(error.message || "Unable to generate AI reminder.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDraftChange(event) {
    const { value } = event.target;
    setDraftData((current) =>
      current ? { ...current, content: value } : current
    );
  }

  async function handleSaveDraft() {
    if (!draftData) return;

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await saveMessageDraft(draftData);
      setSuccessMessage(data.message || "Draft saved successfully.");
      await loadMessagesDashboard();
    } catch (error) {
      setErrorMessage(error.message || "Unable to save draft.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <TopBar title="Messages" eyebrow="Campaign control" />

      {isLoading ? (
        <p className="muted-text">Loading message workspace...</p>
      ) : null}
      {errorMessage ? (
        <p className="feedback-message error">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="feedback-message success">{successMessage}</p>
      ) : null}

      <section className="cards-grid cards-grid--three">
        {campaigns.map((campaign) => (
          <article key={campaign.title} className="panel message-card">
            <p className="eyebrow">{campaign.channel}</p>
            <h3>{campaign.title}</h3>
            <p className="muted-text">{campaign.audience}</p>
            <div className="meta-row">
              <span className="filter-chip">{campaign.language}</span>
              <span className="status-badge due-today">{campaign.status}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Draft Studio</p>
            <h3>Retrieval-based reminder composer</h3>
          </div>
        </div>

        <div className="composer-grid">
          <div className="drawer-card composer-card">
            <h4>Inputs</h4>
            <p>Select a debtor and generate a context-aware reminder draft.</p>

            <div className="message-form-grid">
              <select
                name="debtorId"
                value={composerState.debtorId}
                onChange={handleComposerChange}
                className="form-input"
              >
                <option value="">Select debtor</option>
                {debtors.map((debtor) => (
                  <option key={debtor.id} value={debtor.id}>
                    {debtor.name} - {debtor.pendingAmountFormatted}
                  </option>
                ))}
              </select>

              <select
                name="tone"
                value={composerState.tone}
                onChange={handleComposerChange}
                className="form-input"
              >
                <option value="Polite">Polite</option>
                <option value="Firm">Firm</option>
                <option value="Urgent">Urgent</option>
              </select>

              <select
                name="language"
                value={composerState.language}
                onChange={handleComposerChange}
                className="form-input"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Mixed">Mixed</option>
              </select>

              <select
                name="channel"
                value={composerState.channel}
                onChange={handleComposerChange}
                className="form-input"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Call Follow-up">Call Follow-up</option>
              </select>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="primary-button"
                onClick={handleGenerateDraft}
                disabled={isGenerating || !composerState.debtorId}
              >
                {isGenerating ? "Generating..." : "Generate Draft"}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={handleGenerateAIReminder}
                disabled={isGenerating || !composerState.debtorId}
              >
                {isGenerating ? "Generating..." : "Generate AI Reminder"}
              </button>
            </div>
          </div>

          <div className="drawer-card composer-card">
            <h4>Generated draft</h4>
            <textarea
              className="draft-textarea"
              value={draftData?.content || ""}
              onChange={handleDraftChange}
              placeholder="Generate a draft to start editing."
            />

            <div className="draft-controls">
              <span>{draftData?.tone || "Tone"}</span>
              <span>{draftData?.language || "Language"}</span>
              <span>{draftData?.channel || "Channel"}</span>
            </div>

            <div className="form-actions-row">
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveDraft}
                disabled={isSaving || !draftData}
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="cards-grid cards-grid--two">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">RAG Context</p>
              <h3>Retrieved debtors</h3>
            </div>
          </div>

          <div className="context-list">
            {retrievedDebtors.map((debtor) => (
              <div key={debtor.id} className="context-item">
                <strong>{debtor.name}</strong>
                <span>
                  {debtor.status} • {debtor.language} •{" "}
                  {debtor.pendingAmountFormatted}
                </span>
              </div>
            ))}
            {!retrievedDebtors.length ? (
              <p className="muted-text">
                Generate a draft to see retrieved debtor context.
              </p>
            ) : null}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent Drafts</p>
              <h3>Saved message history</h3>
            </div>
          </div>

          <div className="context-list">
            {(retrievedMessages.length
              ? retrievedMessages
              : recentMessages
            ).map((message) => (
              <div key={message.id} className="context-item">
                <strong>{message.debtorName}</strong>
                <span>
                  {message.channel} • {message.language} • {message.status}
                </span>
              </div>
            ))}
            {!recentMessages.length && !retrievedMessages.length ? (
              <p className="muted-text">No saved drafts yet.</p>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

export default MessagesPage;
