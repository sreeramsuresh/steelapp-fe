import { useRef, useState } from "react";
import { FaCheck, FaDownload, FaExclamationTriangle, FaFile, FaTimes, FaUpload } from "react-icons/fa";
import { useNotifications } from "../contexts/NotificationCenterContext";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/axiosApi";

const ProductUpload = ({ isOpen, onClose, onUploadComplete }) => {
  const { isDarkMode } = useTheme();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const cardClasses = `rounded-xl border transition-all duration-300 ${
    isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
  }`;

  const textPrimary = isDarkMode ? "text-white" : "text-[#212121]";
  const textSecondary = isDarkMode ? "text-[#B0BEC5]" : "text-[#666666]";
  const textMuted = isDarkMode ? "text-[#78909C]" : "text-[#BDBDBD]";

  const handleFileSelect = (file) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      addNotification({
        title: "Invalid File Type",
        message: "Please upload Excel (.xlsx, .xls) or CSV files only.",
        type: "error",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addNotification({
        title: "File Too Large",
        message: "Maximum allowed size is 10MB.",
        type: "error",
      });
      return;
    }

    setSelectedFile(file);
    setUploadResults(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/products/upload/template", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products_upload_template.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      addNotification({
        title: "Template Downloaded",
        message: "Template downloaded successfully",
        type: "success",
      });
    } catch (error) {
      // Bug #28 fix: Add error context to download failure notification
      const errorMessage = error?.message || "Unknown error occurred";
      addNotification({
        title: "Download Failed",
        message: `Failed to download template: ${errorMessage}`,
        type: "error",
      });
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      addNotification({
        title: "No File Selected",
        message: "Please select a file to upload",
        type: "error",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64 to avoid antivirus blocking multipart uploads
      // Use FileReader instead of spread operator (which crashes on files > 65KB)
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // reader.result is "data:<mime>;base64,<data>" - extract just the base64 part
          const result = reader.result;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(selectedFile);
      });

      const response = await api.post("/products/upload?sync=1", {
        filename: selectedFile.name,
        data: base64,
      });

      setUploadResults(response.data.results);

      if (response.data.results.successful.length > 0) {
        addNotification({
          title: "Upload Successful",
          message: response.data.message,
          type: "success",
        });
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        addNotification({
          title: "Upload Warning",
          message: "No products were imported successfully",
          type: "warning",
        });
      }
    } catch (error) {
      addNotification({
        title: "Upload Failed",
        message: error.response?.data?.error || "Upload failed",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const closeModal = () => {
    resetUpload();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${cardClasses}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
        >
          <h2 className={`text-xl font-semibold ${textPrimary}`}>Upload Products</h2>
          <button
            type="button"
            onClick={closeModal}
            className={`${textMuted} hover:${textSecondary} transition-colors`}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Download Template Section */}
          <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#2C3E50]" : "bg-[#F5F5F5]"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-medium ${textPrimary}`}>Step 1: Download Template</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  Download the sample Excel template to see the required format for products
                </p>
              </div>
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-4 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <FaDownload className="w-4 h-4" />
                Download Template
              </button>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <h3 className={`font-medium ${textPrimary} mb-3`}>Step 2: Upload Your File</h3>

            {!selectedFile ? (
              <section
                aria-label="File upload drop zone"
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-[#008B8B] bg-[#008B8B]/10"
                    : isDarkMode
                      ? "border-[#37474F] hover:border-[#008B8B]"
                      : "border-[#E0E0E0] hover:border-[#008B8B]"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <FaUpload className={`w-12 h-12 mx-auto mb-4 ${textMuted}`} />
                <p className={`text-lg ${textPrimary} mb-2`}>
                  Drag and drop your file here, or{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-[#008B8B] hover:text-[#4DB6AC] underline cursor-pointer"
                  >
                    browse
                  </button>
                </p>
                <p className={`text-sm ${textSecondary}`}>Supports Excel (.xlsx, .xls) and CSV files up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInputChange}
                />
              </section>
            ) : (
              <div className={`border rounded-lg p-4 ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaFile className={`w-8 h-8 ${textSecondary}`} />
                    <div>
                      <p className={`font-medium ${textPrimary}`}>{selectedFile.name}</p>
                      <p className={`text-sm ${textSecondary}`}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={resetUpload}
                    className={`${textMuted} hover:${textSecondary} transition-colors`}
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Results */}
          {uploadResults && (
            <div className="space-y-4">
              <h3 className={`font-medium ${textPrimary}`}>Upload Results</h3>

              {/* Summary */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#1B5E20]" : "bg-[#E8F5E8]"}`}>
                  <div className="flex items-center gap-2">
                    <FaCheck className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${textPrimary}`}>Successful</span>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${textPrimary}`}>{uploadResults.successful.length}</p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#BF360C]" : "bg-[#FFEBEE]"}`}>
                  <div className="flex items-center gap-2">
                    <FaExclamationTriangle className="w-5 h-5 text-red-500" />
                    <span className={`font-medium ${textPrimary}`}>Failed</span>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${textPrimary}`}>{uploadResults.failed.length}</p>
                </div>

                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-[#263238]" : "bg-[#F5F5F5]"}`}>
                  <div className="flex items-center gap-2">
                    <FaFile className="w-5 h-5 text-blue-500" />
                    <span className={`font-medium ${textPrimary}`}>Total</span>
                  </div>
                  <p className={`text-2xl font-bold mt-1 ${textPrimary}`}>{uploadResults.total}</p>
                </div>
              </div>

              {/* Failed Records */}
              {uploadResults.failed.length > 0 && (
                <div>
                  <h4 className={`font-medium ${textPrimary} mb-2`}>Failed Records</h4>
                  <div
                    className={`max-h-60 overflow-y-auto border rounded-lg ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
                  >
                    {uploadResults.failed.map((failed, index) => (
                      <div
                        key={failed.id || failed.name || `failed-${index}`}
                        className={`p-3 border-b last:border-b-0 ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-medium ${textPrimary}`}>
                              Row {failed.row}: {failed.data.name || failed.data.productName || "Unknown Product"}
                            </p>
                            <p className={`text-sm text-red-500 mt-1`}>{failed.error}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 p-6 border-t ${isDarkMode ? "border-[#37474F]" : "border-[#E0E0E0]"}`}>
          <button
            type="button"
            onClick={closeModal}
            className={`px-6 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "border-[#37474F] text-[#B0BEC5] hover:bg-[#37474F]"
                : "border-[#E0E0E0] text-[#666666] hover:bg-[#F5F5F5]"
            }`}
          >
            Close
          </button>

          {selectedFile && !uploadResults && (
            <button
              type="button"
              onClick={uploadFile}
              disabled={uploading}
              className="px-6 py-2 bg-gradient-to-r from-[#008B8B] to-[#00695C] text-white rounded-lg hover:from-[#4DB6AC] hover:to-[#008B8B] transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
            >
              <FaUpload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload Products"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductUpload;
