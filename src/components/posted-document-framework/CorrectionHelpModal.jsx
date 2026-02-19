import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import DocumentWorkflowGuide from "./DocumentWorkflowGuide";

const CorrectionHelpModal = ({ open, onOpenChange, config, onNavigate }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config?.title || "Correction Guide"}</DialogTitle>
          <DialogDescription>{config?.subtitle || "Learn how to correct posted documents"}</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <DocumentWorkflowGuide mode="modal" config={config} onNavigate={onNavigate} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CorrectionHelpModal;
