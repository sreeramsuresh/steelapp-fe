import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  uploadAndExtractPDF,
  getConfidenceColor,
} from '../services/supplierQuotationService';
import { suppliersAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Supplier Quotation Upload Page
 * Handles PDF upload and extraction preview
 */
export function SupplierQuotationUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [supplierId, setSupplierId] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Load suppliers for dropdown
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoadingSuppliers(true);
        const response = await suppliersAPI.getAll();
        setSuppliers(response?.suppliers || []);
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    };
    loadSuppliers();
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setExtractionResult(null);
      setError(null);
    } else {
      toast.error('Please upload a PDF file');
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setExtractionResult(null);
      setError(null);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setExtractionResult(null);

      const result = await uploadAndExtractPDF(file, {
        supplierId: supplierId || undefined,
      });

      setExtractionResult(result);

      if (result.success) {
        toast.success('PDF extracted successfully');
      } else {
        toast.warning('Extraction completed with warnings');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload and extract PDF');
      toast.error('Failed to process PDF');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setExtractionResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (amount, currency = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Supplier Quotation PDF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Supplier Selection */}
          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier (Optional)</Label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              disabled={loadingSuppliers || uploading}
            >
              <option value="">Auto-detect from PDF</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500">
              Select a supplier to use their extraction template, or leave blank
              for auto-detection
            </p>
          </div>

          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <FileText className="h-12 w-12 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-gray-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">
                  Drag and drop a PDF file here, or click to select
                </p>
                <p className="text-sm text-gray-400">Maximum file size: 25MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/app/supplier-quotations')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Extract Data
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Result */}
      {extractionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {extractionResult.extractionDetails?.confidence >= 70 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
              Extraction Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Confidence & Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Confidence</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full bg-${getConfidenceColor(extractionResult.extractionDetails?.confidence)}-500`}
                  />
                  <span className="font-medium text-lg">
                    {Math.round(
                      extractionResult.extractionDetails?.confidence || 0,
                    )}
                    %
                  </span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">PDF Type</p>
                <p className="font-medium mt-1 capitalize">
                  {extractionResult.extractionDetails?.pdfType || 'Unknown'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium mt-1 capitalize">
                  {extractionResult.extractionDetails?.extractionMethod?.replace(
                    '_',
                    ' ',
                  ) || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Items Extracted</p>
                <p className="font-medium mt-1">
                  {extractionResult.extractionDetails?.itemsExtracted || 0}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {extractionResult.extractionDetails?.warnings?.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800 mb-2">Warnings</p>
                <ul className="list-disc list-inside text-sm text-yellow-700">
                  {extractionResult.extractionDetails.warnings.map(
                    (warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ),
                  )}
                </ul>
              </div>
            )}

            {/* Quotation Summary */}
            {extractionResult.quotation && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Extracted Quotation</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reference</p>
                    <p className="font-medium">
                      {extractionResult.quotation.internalReference}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Supplier Reference</p>
                    <p className="font-medium">
                      {extractionResult.quotation.supplierReference || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Supplier</p>
                    <p className="font-medium">
                      {extractionResult.quotation.supplierName || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quote Date</p>
                    <p className="font-medium">
                      {extractionResult.quotation.quoteDate || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Validity</p>
                    <p className="font-medium">
                      {extractionResult.quotation.validityDate || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(
                        extractionResult.quotation.total,
                        extractionResult.quotation.currency,
                      )}
                    </p>
                  </div>
                </div>

                {/* Line Items Preview */}
                {extractionResult.quotation.items?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">
                      Line Items ({extractionResult.quotation.items.length})
                    </p>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Description</th>
                            <th className="px-3 py-2 text-left">Grade</th>
                            <th className="px-3 py-2 text-right">Qty</th>
                            <th className="px-3 py-2 text-right">Unit Price</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extractionResult.quotation.items
                            .slice(0, 5)
                            .map((item, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-3 py-2">
                                  {item.description?.substring(0, 50) || '-'}
                                  {item.description?.length > 50 ? '...' : ''}
                                </td>
                                <td className="px-3 py-2">
                                  {item.grade || '-'}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {item.quantity} {item.unit}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {formatCurrency(item.amount)}
                                </td>
                              </tr>
                            ))}
                          {extractionResult.quotation.items.length > 5 && (
                            <tr className="border-t bg-gray-50">
                              <td
                                colSpan="5"
                                className="px-3 py-2 text-center text-gray-500"
                              >
                                +{extractionResult.quotation.items.length - 5}{' '}
                                more items
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={clearFile}>
                Upload Another
              </Button>
              {extractionResult.quotation && (
                <>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/supplier-quotations/${extractionResult.quotation.id}/edit`,
                      )
                    }
                  >
                    Review & Edit
                  </Button>
                  <Button
                    onClick={() =>
                      navigate(
                        `/supplier-quotations/${extractionResult.quotation.id}`,
                      )
                    }
                    className="flex items-center gap-2"
                  >
                    View Quotation
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SupplierQuotationUpload;
