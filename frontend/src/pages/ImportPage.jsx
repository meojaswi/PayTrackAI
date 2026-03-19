import { useEffect, useRef, useState } from "react";
import TopBar from "../components/TopBar";
import { fetchImportSummary, uploadDebtorSheet } from "../lib/api";

function ImportPage() {
  const fileInputRef = useRef(null);
  const [importStats, setImportStats] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const data = await fetchImportSummary();

        if (isMounted) {
          setImportStats(data.stats || []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || "Unable to load import stats.");
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFileName(file.name);
    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await uploadDebtorSheet(file);
      const refreshedSummary = await fetchImportSummary();

      setImportStats(refreshedSummary.stats || []);
      setSuccessMessage(
        `${data.summary.insertedCount} inserted, ${data.summary.updatedCount} updated, ${data.summary.missingPhoneNumbers} missing-phone rows skipped, ${data.summary.duplicatePhonesInFile} duplicate rows skipped.`,
      );
    } catch (error) {
      setErrorMessage(error.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="page-stack">
      <TopBar title="Import Excel" eyebrow="Bring your debtor sheet in" />

      <section className="cards-grid">
        {importStats.map((item) => (
          <article key={item.label} className="panel stat-panel">
            <p className="eyebrow">{item.label}</p>
            <h3>{item.value}</h3>
          </article>
        ))}
      </section>

      <section className="panel import-panel">
        <div>
          <p className="eyebrow">Upload zone</p>
          <h3>Drop your .xlsx or .csv file here</h3>
          <p className="muted-text">
            We will validate column names, detect duplicate debtors, and prepare
            the records for import.
          </p>
        </div>

        <div className="upload-box">
          <p>Drag and drop file</p>
          <span>or browse from your computer</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden-file-input"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Choose File
          </button>
          {selectedFileName ? (
            <span className="file-name">Selected: {selectedFileName}</span>
          ) : null}
          {isUploading ? (
            <p className="feedback-message">Uploading and syncing debtors...</p>
          ) : null}
          {successMessage ? (
            <p className="feedback-message success">{successMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="feedback-message error">{errorMessage}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default ImportPage;
