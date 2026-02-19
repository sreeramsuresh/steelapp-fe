/**
 * VAT Service - Re-export from vatReturnService
 *
 * All VAT operations have been consolidated into vatReturnService.js.
 * This file re-exports for backward compatibility with existing callers.
 */

import vatReturnService from "./vatReturnService.js";

export const vatService = vatReturnService;

export default vatReturnService;
