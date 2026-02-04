import { ArrowLeft, CheckCircle, Clock, Lock, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import AuditTrailView from "../../components/audit/AuditTrailView";
import { useAuth } from "../../contexts/AuthContext";
import auditHubService from "../../services/auditHubService";

/**
 * Sign-Off Workflow Page
 * Multi-stage approval process: PREPARED → REVIEWED → LOCKED
 * Digital signatures for audit trail
 */

export default function SignOffWorkflow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { datasetId } = useParams();

  const [dataset, setDataset] = useState(null);
  const [signOffs, setSignOffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState({});
  const [comments, setComments] = useState({});
  const [showCommentModal, setShowCommentModal] = useState(null);

  // Guard: Redirect if no company context
  useEffect(() => {
    if (!user?.companyId) {
      navigate("/select-company");
      return;
    }
  }, [user?.companyId, navigate]);

  // Load dataset and sign-offs
  useEffect(() => {
    if (!user?.companyId || !datasetId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [datasetData, signOffData] = await Promise.all([
          auditHubService.getDatasetById(user.companyId, datasetId),
          auditHubService.getSignOffs(user.companyId, datasetId),
        ]);

        setDataset(datasetData);
        setSignOffs(signOffData);
      } catch (err) {
        toast.error(`Failed to load sign-off data: ${err.message}`);
        navigate("/audit-hub");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.companyId, datasetId, navigate]);

  // Check if user can sign-off at this stage
  const canUserSignOff = (stage) => {
    const rolePermissions = {
      PREPARED: ["ACCOUNTANT", "SENIOR_ACCOUNTANT", "FINANCE_MANAGER"],
      REVIEWED: ["SENIOR_ACCOUNTANT", "FINANCE_MANAGER"],
      LOCKED: ["FINANCE_MANAGER"],
    };

    return rolePermissions[stage]?.includes(user?.role);
  };

  // Get the current stage based on existing sign-offs
  const getCurrentStage = () => {
    if (signOffs.find((s) => s.stage === "LOCKED")) return "LOCKED";
    if (signOffs.find((s) => s.stage === "REVIEWED")) return "REVIEWED";
    if (signOffs.find((s) => s.stage === "PREPARED")) return "PREPARED";
    return "PENDING";
  };

  // Handle sign-off action
  const handleSignOff = async (stage) => {
    const commentText = comments[stage] || "";

    if (!commentText.trim()) {
      toast.error("Please add a comment before signing off");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [stage]: true }));
    try {
      const newSignOff = await auditHubService.signOff(user.companyId, datasetId, stage, commentText);

      setSignOffs((prev) => [...prev, newSignOff]);
      setComments((prev) => ({ ...prev, [stage]: "" }));
      setShowCommentModal(null);

      toast.success(`✓ Signed off as "${stage}"`);

      // Refresh sign-offs
      const updated = await auditHubService.getSignOffs(user.companyId, datasetId);
      setSignOffs(updated);
    } catch (err) {
      toast.error(`Sign-off failed: ${err.message}`);
    } finally {
      setSubmitting((prev) => ({ ...prev, [stage]: false }));
    }
  };

  if (!user?.companyId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto animate-spin" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading sign-off workflow...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            type="button"
            onClick={() => navigate("/audit-hub")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Periods
          </button>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-red-600 dark:text-red-400">Dataset not found</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStage = getCurrentStage();
  const stages = [
    {
      name: "PREPARED",
      label: "Prepared",
      icon: CheckCircle,
      description: "Initial verification",
    },
    {
      name: "REVIEWED",
      label: "Reviewed",
      icon: CheckCircle,
      description: "Senior review",
    },
    {
      name: "LOCKED",
      label: "Locked",
      icon: Lock,
      description: "Final approval",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            type="button"
            onClick={() => navigate("/audit-hub")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Periods
          </button>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sign-Off Workflow</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Multi-stage approval for period closing</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sign-Off Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Approval Timeline</h2>

              {/* Timeline */}
              <div className="space-y-8">
                {stages.map((stage, idx) => {
                  const Icon = stage.icon;
                  const signOff = signOffs.find((s) => s.stage === stage.name);
                  const isCompleted = !!signOff;
                  const isPending = currentStage === "PENDING" && idx === 0;
                  const isNext = currentStage === stages[idx - 1]?.name;
                  const canSign = canUserSignOff(stage.name);

                  return (
                    <div key={stage.name}>
                      <div className="flex gap-4">
                        {/* Timeline Marker */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : isPending || isNext
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {idx < stages.length - 1 && (
                            <div
                              className={`w-1 h-12 mt-2 ${
                                isCompleted ? "bg-green-300" : "bg-slate-200 dark:bg-slate-700"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{stage.label}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{stage.description}</p>
                          </div>

                          {/* Sign-Off Info or Form */}
                          {isCompleted ? (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Signed by {signOff.user_name}
                                  </p>
                                  <p className="text-xs text-green-800 dark:text-green-200">
                                    {signOff.user_role} • {new Date(signOff.signed_at).toLocaleString()}
                                  </p>
                                </div>
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              </div>
                              {signOff.comments && (
                                <p className="text-sm text-green-800 dark:text-green-200 mt-3 p-2 bg-white dark:bg-slate-900 rounded border border-green-100 dark:border-green-800">
                                  &ldquo;{signOff.comments}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (isPending || isNext) && canSign ? (
                            <div className="space-y-3">
                              {showCommentModal === stage.name ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                                  <textarea
                                    value={comments[stage.name] || ""}
                                    onChange={(e) =>
                                      setComments((prev) => ({
                                        ...prev,
                                        [stage.name]: e.target.value,
                                      }))
                                    }
                                    placeholder="Add comments for this sign-off..."
                                    className="w-full h-24 p-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                                  />
                                  <div className="flex gap-2 mt-3">
                                    <button
                                      type="button"
                                      onClick={() => handleSignOff(stage.name)}
                                      disabled={submitting[stage.name] || !comments[stage.name]?.trim()}
                                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                      {submitting[stage.name] ? "Submitting..." : "Sign Off"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowCommentModal(null)}
                                      className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowCommentModal(stage.name)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Add Sign-Off
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Status & Info */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Workflow Status</h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Current Stage</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                    {currentStage === "PENDING" ? "Not Started" : currentStage}
                  </p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Your Role</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">{user?.role || "N/A"}</p>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">Signatures</p>
                  <p className="text-sm text-slate-900 dark:text-white mt-1">{signOffs.length} of 3 complete</p>
                </div>
              </div>
            </div>

            {/* Locked Indicator */}
            {currentStage === "LOCKED" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Period Locked</h4>
                    <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                      This period is now locked. No further modifications allowed.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="mt-8">
          <AuditTrailView datasetId={datasetId} signOffs={signOffs} />
        </div>
      </div>
    </div>
  );
}
