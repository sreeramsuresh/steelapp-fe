import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { payrollRunService } from "../services/payrollRunService";
import { formatBusinessDate } from "../utils/timezone";

const STATUS_BADGES = {
  DRAFT: "bg-gray-100 text-gray-800",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  COMPUTED: "bg-blue-100 text-blue-800",
  SUBMITTED: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  POSTED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PayrollRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [runRes, entriesRes, summaryRes] = await Promise.all([
        payrollRunService.getById(id),
        payrollRunService.getEntries(id),
        payrollRunService.getSummary(id),
      ]);
      setRun(runRes.data?.data || runRes.data);
      setEntries(entriesRes.data?.data || entriesRes.data || []);
      setSummary(summaryRes.data?.data || summaryRes.data || {});
    } catch (err) {
      setError(err.message || "Failed to load payroll run");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action) => {
    try {
      if (action === "cancel") {
        const reason = window.prompt("Reason for cancellation:");
        if (!reason) return;
        await payrollRunService.cancel(id, reason);
      } else if (action === "compute") {
        await payrollRunService.compute(id);
      } else if (action === "submit") {
        await payrollRunService.submit(id);
      } else if (action === "approve") {
        await payrollRunService.approve(id);
      } else if (action === "processPayment") {
        await payrollRunService.processPayment(id);
      }
      fetchData();
    } catch (err) {
      setError(err.message || `Failed to ${action}`);
    }
  };

  const toggleExpand = async (entryId) => {
    if (expandedEntry === entryId) {
      setExpandedEntry(null);
      setEntryDetail(null);
      return;
    }
    try {
      const res = await payrollRunService.getEntry(id, entryId);
      setEntryDetail(res.data?.data || res.data);
      setExpandedEntry(entryId);
    } catch (err) {
      setError(err.message || "Failed to load entry detail");
    }
  };

  const actionButtons = () => {
    if (!run) return null;
    const btns = [];
    switch (run.status) {
      case "DRAFT":
        btns.push({ label: "Compute", action: "compute", cls: "bg-blue-600 hover:bg-blue-700 text-white" });
        btns.push({ label: "Cancel", action: "cancel", cls: "bg-red-600 hover:bg-red-700 text-white" });
        break;
      case "COMPUTED":
        btns.push({ label: "Submit", action: "submit", cls: "bg-purple-600 hover:bg-purple-700 text-white" });
        btns.push({ label: "Cancel", action: "cancel", cls: "bg-red-600 hover:bg-red-700 text-white" });
        break;
      case "SUBMITTED":
        btns.push({ label: "Approve", action: "approve", cls: "bg-green-600 hover:bg-green-700 text-white" });
        btns.push({ label: "Cancel", action: "cancel", cls: "bg-red-600 hover:bg-red-700 text-white" });
        break;
      case "APPROVED":
        btns.push({
          label: "Process Payment",
          action: "processPayment",
          cls: "bg-emerald-600 hover:bg-emerald-700 text-white",
        });
        break;
      default:
        break;
    }
    return btns.map((b) => (
      <button
        key={b.action}
        type="button"
        onClick={() => handleAction(b.action)}
        className={`px-3 py-1.5 text-sm rounded-lg ${b.cls}`}
      >
        {b.label}
      </button>
    ));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!run) {
    return <div className="p-6 text-center text-gray-500">Payroll run not found</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate("/app/payroll-runs")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{run.runNumber || `Payroll Run #${run.id}`}</h1>
          <p className="text-sm text-gray-500">
            {run.month
              ? `${new Date(2000, run.month - 1).toLocaleString("default", { month: "long" })} ${run.year}`
              : ""}{" "}
            {run.periodStart && `| ${formatBusinessDate(run.periodStart)} - ${formatBusinessDate(run.periodEnd)}`}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGES[run.status] || "bg-gray-100"}`}>
          {run.status}
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Employees</p>
          <p className="text-2xl font-bold">{summary?.employeeCount ?? run.employeeCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Gross</p>
          <p className="text-2xl font-bold">{Number(summary?.totalGross ?? run.totalGross ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Deductions</p>
          <p className="text-2xl font-bold">{Number(summary?.totalDeductions ?? 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-gray-500">Total Net</p>
          <p className="text-2xl font-bold text-teal-700">
            {Number(summary?.totalNet ?? run.totalNet ?? 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-3 mb-6">{actionButtons()}</div>

      {/* Entries table */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-8" />
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Earnings</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No entries
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(entry.id)}>
                    <td className="px-4 py-3">
                      {expandedEntry === entry.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {entry.employeeName || `Employee #${entry.employeeId}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.departmentName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {Number(entry.grossPay ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {Number(entry.totalEarnings ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">
                      {Number(entry.totalDeductions ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">
                      {Number(entry.netPay ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.paymentStatus || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/payroll-runs/${id}/payslip/${entry.id}`);
                        }}
                        className="text-teal-600 hover:underline text-xs"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                  {expandedEntry === entry.id && entryDetail && (
                    <tr>
                      <td colSpan={9} className="px-8 py-3 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4">
                          {entryDetail.components?.length > 0 && (
                            <>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Earnings</h4>
                                {entryDetail.components
                                  .filter((c) => c.componentType === "EARNING")
                                  .map((c) => (
                                    <div key={c.componentName} className="flex justify-between text-sm py-0.5">
                                      <span>{c.componentName}</span>
                                      <span>{Number(c.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Deductions</h4>
                                {entryDetail.components
                                  .filter((c) => c.componentType === "DEDUCTION")
                                  .map((c) => (
                                    <div key={c.componentName} className="flex justify-between text-sm py-0.5">
                                      <span>{c.componentName}</span>
                                      <span>{Number(c.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollRunDetail;
