/**
 * gRPC Services - Central Export
 *
 * Type-safe, validated API calls using Google's gRPC architecture
 * No manual validation needed - Protocol Buffers handle everything!
 */

export { invoiceGrpcService } from './invoiceGrpcService';
export { customerGrpcService } from './customerGrpcService';
export { productGrpcService } from './productGrpcService';

// Re-export for convenience
export default {
  invoice: require('./invoiceGrpcService').invoiceGrpcService,
  customer: require('./customerGrpcService').customerGrpcService,
  product: require('./productGrpcService').productGrpcService
};
