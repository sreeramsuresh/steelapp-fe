import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeAdvanceService } from "../services/employeeAdvanceService";

const ADVANCE_TYPES = ["SALARY_ADVANCE", "PETTY_CASH", "TRAVEL_ADVANCE"];

const EmployeeAdvanceForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    employeeId: "",
    advanceType: "SALARY_ADVANCE",
    amount: "",
    advanceDate: new Date().toISOString().slice(0, 10),
    deductionPerMonth: "",
    narration: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...form,
        employeeId: Number(form.employeeId),
        amount: Number(form.amount),
        deductionPerMonth: form.deductionPerMonth ? Number(form.deductionPerMonth) : null,
      };
      await employeeAdvanceService.create(payload);
      navigate("/app/employee-advances");
    } catch (err) {
      setError(err.message || "Failed to create advance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("/app/employee-advances")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">New Employee Advance</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
            <input
              type="number"
              required
              value={form.employeeId}
              onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Enter employee ID"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Advance Type
            <select
              value={form.advanceType}
              onChange={(e) => setForm((f) => ({ ...f, advanceType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {ADVANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
              <input
                type="number"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advance Date
              <input
                type="date"
                required
                value={form.advanceDate}
                onChange={(e) => setForm((f) => ({ ...f, advanceDate: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deduction Per Month
            <input
              type="number"
              step="0.01"
              value={form.deductionPerMonth}
              onChange={(e) => setForm((f) => ({ ...f, deductionPerMonth: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Monthly deduction amount (optional)"
            />
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Narration
            <textarea
              value={form.narration}
              onChange={(e) => setForm((f) => ({ ...f, narration: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="Purpose of advance..."
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate("/app/employee-advances")}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? "Creating..." : "Create Advance"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeAdvanceForm;
