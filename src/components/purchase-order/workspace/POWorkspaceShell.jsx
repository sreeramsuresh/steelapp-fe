import { Loader2 } from "lucide-react";
import { Outlet, useParams } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import HorizontalWorkflowStepper from "./HorizontalWorkflowStepper";
import { useWorkspace, WorkspaceProvider } from "./WorkspaceContext";
import WorkspaceHeader from "./WorkspaceHeader";

function ShellContent() {
  const { isDarkMode } = useTheme();
  const { loading, error } = useWorkspace();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className={`text-center p-6 rounded-xl border ${isDarkMode ? "bg-red-900/20 border-red-800 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}
        >
          <p className="font-medium">Failed to load workspace</p>
          <p className="text-sm mt-1 opacity-75">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <WorkspaceHeader />
      <HorizontalWorkflowStepper />
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
}

export default function POWorkspaceShell() {
  const { poId } = useParams();

  return (
    <WorkspaceProvider poId={poId}>
      <ShellContent />
    </WorkspaceProvider>
  );
}
