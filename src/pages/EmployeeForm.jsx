import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PhoneInput from "../components/shared/PhoneInput";
import { employeeService } from "../services/employeeService";

const TABS = ["Personal", "Employment", "Bank Details"];
const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"];

const EmployeeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [activeTab, setActiveTab] = useState("Personal");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    // Personal
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employeeCode: "",
    // Employment
    departmentId: "",
    designationId: "",
    costCenterId: "",
    managerId: "",
    dateOfJoining: "",
    employmentType: "FULL_TIME",
    // Bank Details
    bankName: "",
    bankAccountNumber: "",
    bankIban: "",
    bankAccountName: "",
  });

  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await employeeService.getById(id);
      const emp = response.data?.data || response.data;
      if (emp) {
        setForm({
          firstName: emp.firstName || "",
          lastName: emp.lastName || "",
          email: emp.email || "",
          phone: emp.phone || "",
          employeeCode: emp.employeeCode || "",
          departmentId: emp.departmentId || "",
          designationId: emp.designationId || "",
          costCenterId: emp.costCenterId || "",
          managerId: emp.managerId || "",
          dateOfJoining: emp.dateOfJoining || "",
          employmentType: emp.employmentType || "FULL_TIME",
          bankName: emp.bankName || "",
          bankAccountNumber: emp.bankAccountNumber || "",
          bankIban: emp.bankIban || "",
          bankAccountName: emp.bankAccountName || "",
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await employeeService.update(id, form);
      } else {
        await employeeService.create(form);
      }
      navigate("/app/employees");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading employee...</div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? "Edit Employee" : "New Employee"}
        </h1>
        <button
          type="button"
          onClick={() => navigate("/app/employees")}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          Back to List
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 font-bold">
            x
          </button>
        </div>
      )}

      <div className="mb-6 border-b dark:border-gray-700">
        <div className="flex gap-4">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {activeTab === "Personal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Employee Code
                <input
                  type="text"
                  value={form.employeeCode}
                  onChange={(e) => handleChange("employeeCode", e.target.value)}
                  required
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                First Name
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  required
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Last Name
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <PhoneInput
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={(phone) => handleChange("phone", phone)}
              />
            </div>
          </div>
        )}

        {activeTab === "Employment" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Department ID
                <input
                  type="text"
                  value={form.departmentId}
                  onChange={(e) => handleChange("departmentId", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Designation ID
                <input
                  type="text"
                  value={form.designationId}
                  onChange={(e) => handleChange("designationId", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Cost Center ID
                <input
                  type="text"
                  value={form.costCenterId}
                  onChange={(e) => handleChange("costCenterId", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Manager ID
                <input
                  type="text"
                  value={form.managerId}
                  onChange={(e) => handleChange("managerId", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Date of Joining
                <input
                  type="date"
                  value={form.dateOfJoining}
                  onChange={(e) => handleChange("dateOfJoining", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Employment Type
                <select
                  value={form.employmentType}
                  onChange={(e) => handleChange("employmentType", e.target.value)}
                  className={inputClass}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {activeTab === "Bank Details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Bank Name
                <input
                  type="text"
                  value={form.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Account Number
                <input
                  type="text"
                  value={form.bankAccountNumber}
                  onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                IBAN
                <input
                  type="text"
                  value={form.bankIban}
                  onChange={(e) => handleChange("bankIban", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Account Name
                <input
                  type="text"
                  value={form.bankAccountName}
                  onChange={(e) => handleChange("bankAccountName", e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : isEdit ? "Update Employee" : "Create Employee"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/app/employees")}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;
