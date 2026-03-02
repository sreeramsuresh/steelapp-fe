import { ArrowLeft, Printer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { payrollRunService } from "../services/payrollRunService";

const PayslipView = () => {
  const { id, entryId } = useParams();
  const navigate = useNavigate();
  const [run, setRun] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [runRes, entryRes] = await Promise.all([
        payrollRunService.getById(id),
        payrollRunService.getEntry(id, entryId),
      ]);
      setRun(runRes.data?.data || runRes.data);
      setEntry(entryRes.data?.data || entryRes.data);
    } catch (err) {
      setError(err.message || "Failed to load payslip");
    } finally {
      setLoading(false);
    }
  }, [id, entryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrint = () => {
    window.print();
  };

  const earnings = entry?.components?.filter((c) => c.componentType === "EARNING") || [];
  const deductions = entry?.components?.filter((c) => c.componentType === "DEDUCTION") || [];
  const totalEarnings = earnings.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

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

  if (!entry) {
    return <div className="p-6 text-center text-gray-500">Payslip not found</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/app/payroll-runs/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Payslip</h1>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <Printer size={18} />
          Print
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg print:hidden">{error}</div>}

      <div className="bg-white rounded-lg shadow p-8 print:shadow-none">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">{run?.companyName || "ULTIMATE STEELS"}</h2>
          <p className="text-sm text-gray-500">Payslip</p>
          <p className="text-sm text-gray-500">
            {run?.month
              ? `${new Date(2000, run.month - 1).toLocaleString("default", { month: "long" })} ${run.year}`
              : ""}
          </p>
        </div>

        {/* Employee Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p>
              <span className="text-gray-500">Employee:</span>{" "}
              <span className="font-medium">{entry.employeeName || `#${entry.employeeId}`}</span>
            </p>
            <p>
              <span className="text-gray-500">Department:</span>{" "}
              <span className="font-medium">{entry.departmentName || "-"}</span>
            </p>
            <p>
              <span className="text-gray-500">Designation:</span>{" "}
              <span className="font-medium">{entry.designationName || "-"}</span>
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-gray-500">Employee ID:</span>{" "}
              <span className="font-medium">{entry.employeeCode || entry.employeeId}</span>
            </p>
            <p>
              <span className="text-gray-500">Period:</span>{" "}
              <span className="font-medium">
                {run?.periodStart
                  ? `${new Date(run.periodStart).toLocaleDateString()} - ${new Date(run.periodEnd).toLocaleDateString()}`
                  : "-"}
              </span>
            </p>
          </div>
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2 border-b pb-1">Earnings</h3>
            <table className="w-full text-sm">
              <tbody>
                {earnings.map((c) => (
                  <tr key={c.salaryComponentId || c.componentName}>
                    <td className="py-1 text-gray-600">{c.componentName}</td>
                    <td className="py-1 text-right">{Number(c.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t font-medium">
                  <td className="py-1">Total Earnings</td>
                  <td className="py-1 text-right">{totalEarnings.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase mb-2 border-b pb-1">Deductions</h3>
            <table className="w-full text-sm">
              <tbody>
                {deductions.map((c) => (
                  <tr key={c.salaryComponentId || c.componentName}>
                    <td className="py-1 text-gray-600">{c.componentName}</td>
                    <td className="py-1 text-right">{Number(c.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="border-t font-medium">
                  <td className="py-1">Total Deductions</td>
                  <td className="py-1 text-right">{totalDeductions.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Pay */}
        <div className="border-t-2 border-gray-900 pt-3 flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Net Pay</span>
          <span className="text-2xl font-bold text-teal-700">
            {Number(entry.netPay ?? totalEarnings - totalDeductions).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;
