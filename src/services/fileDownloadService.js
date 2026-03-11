/**
 * File Download Service
 *
 * Central helper for all binary file downloads (PDF, Excel, CSV, etc.).
 * Handles: axios request, blob detection, content-type validation,
 * filename extraction, download trigger, URL cleanup, error normalization.
 */

// Binary MIME types that should be returned as blobs
const BINARY_MIME_PREFIXES = [
  "application/pdf",
  "application/octet-stream",
  "application/vnd.",
  "application/zip",
  "application/gzip",
  "text/csv",
  "image/",
];

function isBinaryContentType(contentType) {
  if (!contentType) return false;
  const ct = contentType.toLowerCase();
  return BINARY_MIME_PREFIXES.some((prefix) => ct.startsWith(prefix));
}

/**
 * Extract filename from Content-Disposition header.
 * @param {string|null} header - Content-Disposition header value
 * @returns {string|null}
 */
function extractFilenameFromHeader(header) {
  if (!header) return null;
  // Try RFC 5987 UTF-8 filename first: filename*=UTF-8''encoded-name
  const utf8Match = header.match(/filename\*=(?:UTF-8''|utf-8'')([^;\s]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1]);
  // Try standard: filename="name" or filename=name
  const stdMatch = header.match(/filename="?([^";\s]+)"?/i);
  if (stdMatch) return stdMatch[1];
  return null;
}

/**
 * Validate that the response is actually binary content.
 * Throws if server returned JSON/HTML error instead of expected binary.
 */
async function validateBinaryResponse(blob, expectedType) {
  if (!blob || !(blob instanceof Blob)) {
    throw new Error("Invalid response from server — expected binary data");
  }

  const contentType = blob.type || "";

  // If server returned JSON, it's likely an error response
  if (contentType.includes("application/json")) {
    let errorMessage = "Server returned an error instead of the expected file";
    try {
      const text = await blob.text();
      const errorData = JSON.parse(text);
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Could not parse error — use default message
    }
    throw new Error(errorMessage);
  }

  // If server returned HTML, it's likely an error page
  if (contentType.includes("text/html") && expectedType !== "text/html") {
    throw new Error("Server returned an HTML error page instead of the expected file");
  }

  // Size sanity check for PDFs
  if (expectedType === "application/pdf" && blob.size < 100) {
    throw new Error(`Downloaded PDF is suspiciously small (${blob.size} bytes)`);
  }
}

// Use the app's configured axios instance to benefit from interceptors (auth, CORS, etc.)
// Imported lazily to avoid circular dependency with axiosApi.js.
// We import the raw axios instance (default export), not apiService, to skip response unwrapping.
let _apiPromise = null;

function getApi() {
  if (!_apiPromise) {
    _apiPromise = import("./axiosApi.js").then((m) => m.default);
  }
  return _apiPromise;
}

/**
 * Fetch a binary blob from the API.
 *
 * @param {string} url - API endpoint
 * @param {Object} [options]
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.params] - Query parameters
 * @param {Object} [options.data] - Request body (for POST)
 * @param {number} [options.timeout=60000] - Request timeout in ms
 * @param {string} [options.expectedType] - Expected MIME type for validation
 * @returns {Promise<{blob: Blob, filename: string|null, contentType: string}>}
 */
export async function fetchBlob(url, options = {}) {
  const { method = "GET", params, data, timeout = 60000, expectedType } = options;
  const api = await getApi();

  const response = await api.request({
    method,
    url,
    params,
    data,
    responseType: "blob",
    timeout,
  });

  const blob = response.data;
  const contentType = response.headers?.["content-type"] || blob?.type || "";
  const filename = extractFilenameFromHeader(response.headers?.["content-disposition"]);

  await validateBinaryResponse(blob, expectedType || contentType);

  return { blob, filename, contentType };
}

/**
 * Download a file from the API and trigger browser download.
 *
 * @param {string} url - API endpoint
 * @param {string} fallbackFilename - Filename to use if server doesn't provide one
 * @param {Object} [options]
 * @param {string} [options.method='GET'] - HTTP method
 * @param {Object} [options.params] - Query parameters
 * @param {Object} [options.data] - Request body (for POST)
 * @param {number} [options.timeout=60000] - Request timeout in ms
 * @param {string} [options.expectedType] - Expected MIME type for validation
 */
export async function downloadFile(url, fallbackFilename, options = {}) {
  const { blob, filename } = await fetchBlob(url, options);

  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename || fallbackFilename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Open a file in a new browser tab (for print/preview).
 *
 * @param {string} url - API endpoint
 * @param {Object} [options] - Same as downloadFile options
 * @returns {Promise<Window|null>} The opened window
 */
export async function previewFile(url, options = {}) {
  const { blob } = await fetchBlob(url, options);

  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, "_blank");

  // Clean up after 60s — window may still be open, but the blob data
  // has been loaded by then
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);

  return win;
}

/**
 * Download a local blob (e.g. CSV generated in-memory).
 * Does NOT make an API call.
 *
 * @param {Blob|string} content - Blob or string content
 * @param {string} filename - Download filename
 * @param {string} [mimeType='text/csv;charset=utf-8'] - MIME type if content is string
 */
export function downloadLocalBlob(content, filename, mimeType = "text/csv;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  fetchBlob,
  downloadFile,
  previewFile,
  downloadLocalBlob,
  // Exported for testing
  _extractFilenameFromHeader: extractFilenameFromHeader,
  _isBinaryContentType: isBinaryContentType,
  _validateBinaryResponse: validateBinaryResponse,
};
