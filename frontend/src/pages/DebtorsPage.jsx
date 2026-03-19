import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import {
  createDebtor,
  deleteDebtor,
  fetchDebtors,
  updateDebtor,
} from "../lib/api";

const initialFormState = {
  name: "",
  phone: "",
  pendingAmount: "",
  status: "New",
  language: "Unknown",
  followupDate: "",
};

function formatDisplayDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function DebtorsPage() {
  const [debtors, setDebtors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [formState, setFormState] = useState(initialFormState);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadDebtors() {
    try {
      const data = await fetchDebtors();
      setDebtors(data.debtors || []);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to load debtors.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDebtors();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormState(initialFormState);
    setEditingId("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingId) {
        await updateDebtor(editingId, formState);
        setSuccessMessage("Debtor updated successfully.");
      } else {
        await createDebtor(formState);
        setSuccessMessage("Debtor created successfully.");
      }

      resetForm();
      await loadDebtors();
    } catch (error) {
      setErrorMessage(error.message || "Unable to save debtor.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(debtor) {
    setEditingId(debtor.id);
    setFormState({
      name: debtor.name || "",
      phone: debtor.phone || "",
      pendingAmount: debtor.pendingAmount || "",
      status: debtor.status || "New",
      language: debtor.language || "Unknown",
      followupDate: toDateInputValue(debtor.followupDate),
    });
    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleDelete(debtor) {
    const confirmed = window.confirm(`Delete ${debtor.name}?`);

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteDebtor(debtor.id);
      setSuccessMessage("Debtor deleted successfully.");

      if (editingId === debtor.id) {
        resetForm();
      }

      await loadDebtors();
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete debtor.");
    }
  }

  return (
    <div className="page-stack">
      <TopBar title="Debtors" eyebrow="Manage accounts" />

      <section className="panel page-hero">
        <div>
          <p className="eyebrow">Portfolio View</p>
          <h3>Track every pending account in one place</h3>
          <p className="muted-text">
            Add, update, and remove debtor records while keeping the collection
            view synced with MongoDB.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={resetForm}>
          {editingId ? "Create New Debtor" : "Reset Form"}
        </button>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">CRUD Form</p>
            <h3>{editingId ? "Edit Debtor" : "Add New Debtor"}</h3>
          </div>
        </div>

        <form className="debtor-form-grid" onSubmit={handleSubmit}>
          <input
            name="name"
            value={formState.name}
            onChange={handleInputChange}
            placeholder="Name"
            className="form-input"
            required
          />
          <input
            name="phone"
            value={formState.phone}
            onChange={handleInputChange}
            placeholder="Phone"
            className="form-input"
            required
          />
          <input
            name="pendingAmount"
            value={formState.pendingAmount}
            onChange={handleInputChange}
            placeholder="Pending Amount"
            className="form-input"
          />
          <input
            name="status"
            value={formState.status}
            onChange={handleInputChange}
            placeholder="Status"
            className="form-input"
          />
          <input
            name="language"
            value={formState.language}
            onChange={handleInputChange}
            placeholder="Language"
            className="form-input"
          />
          <input
            name="followupDate"
            type="date"
            value={formState.followupDate}
            onChange={handleInputChange}
            className="form-input"
          />
          <div className="form-actions-row">
            <button type="submit" className="primary-button" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Update Debtor" : "Create Debtor"}
            </button>
            {editingId ? (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        {successMessage ? <p className="feedback-message success">{successMessage}</p> : null}
        {errorMessage ? <p className="feedback-message error">{errorMessage}</p> : null}
      </section>

      <section className="panel">
        {isLoading ? <p className="muted-text">Loading debtors...</p> : null}
        {!isLoading && !errorMessage && debtors.length === 0 ? (
          <p className="muted-text">
            No debtor records yet. Upload an Excel sheet or create one manually here.
          </p>
        ) : null}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Pending</th>
                <th>Status</th>
                <th>Language</th>
                <th>Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {debtors.map((debtor) => (
                <tr key={debtor.id || debtor.phone}>
                  <td>{debtor.name}</td>
                  <td>{debtor.phone}</td>
                  <td>{debtor.pendingAmountFormatted}</td>
                  <td>
                    <span
                      className={`status-badge ${debtor.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {debtor.status}
                    </span>
                  </td>
                  <td>{debtor.language}</td>
                  <td>{formatDisplayDate(debtor.followupDate)}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="text-button compact"
                        onClick={() => handleEdit(debtor)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-button compact danger-text"
                        onClick={() => handleDelete(debtor)}
                      >
                        Delete
                      </button>
                    </div>
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

export default DebtorsPage;
