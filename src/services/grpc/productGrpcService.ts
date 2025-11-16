/**
 * Product gRPC Service - Frontend Wrapper
 *
 * Type-safe product operations using gRPC-Web
 */

import { ProductServiceClient } from '../../grpc/generated/ProductServiceClientPb';
import {
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsRequest,
  SearchProductsRequest,
  UpdateInventoryRequest,
  Product
} from '../../grpc/generated/product_pb';
import { IdRequest, PageRequest } from '../../grpc/generated/common_pb';

const client = new ProductServiceClient('http://localhost:8080');

function getAuthMetadata() {
  const token = localStorage.getItem('token');
  return {
    authorization: `Bearer ${token}`
  };
}

function handleGrpcError(error: any): never {
  console.error('gRPC error:', error);

  if (error.code) {
    switch (error.code) {
      case 16: // UNAUTHENTICATED
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      case 7: // PERMISSION_DENIED
        throw new Error('You don\'t have permission to perform this action.');
      case 5: // NOT_FOUND
        throw new Error('Product not found.');
      case 9: // FAILED_PRECONDITION
        throw new Error(error.message || 'Precondition failed.');
      default:
        throw new Error(error.message || 'An error occurred.');
    }
  }

  throw new Error(error.message || 'Network error. Please try again.');
}

export const productGrpcService = {
  /**
   * Create a new product
   */
  async createProduct(data: {
    name: string;
    sku?: string;
    category: string;
    commodity?: string;
    grade?: string;
    finish?: string;
    size?: string;
    thickness?: string;
    unit?: string;
    costPrice?: number;
    sellingPrice?: number;
    reorderLevel?: number;
    notes?: string;
  }): Promise<Product.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new CreateProductRequest();

      request.setName(data.name);
      request.setCategory(data.category);

      if (data.sku) request.setSku(data.sku);
      if (data.commodity) request.setCommodity(data.commodity);
      if (data.grade) request.setGrade(data.grade);
      if (data.finish) request.setFinish(data.finish);
      if (data.size) request.setSize(data.size);
      if (data.thickness) request.setThickness(data.thickness);
      if (data.unit) request.setUnit(data.unit);
      if (data.costPrice) request.setCostPrice(data.costPrice);
      if (data.sellingPrice) request.setSellingPrice(data.sellingPrice);
      if (data.reorderLevel) request.setReorderLevel(data.reorderLevel);
      if (data.notes) request.setNotes(data.notes);

      client.createProduct(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Get product by ID
   */
  async getProduct(id: number): Promise<Product.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.getProduct(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * List products with pagination
   */
  async listProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    lowStockOnly?: boolean;
  } = {}): Promise<{ products: Product.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new ListProductsRequest();

      const pageRequest = new PageRequest();
      pageRequest.setPage(params.page || 1);
      pageRequest.setLimit(params.limit || 50);
      request.setPage(pageRequest);

      if (params.category) request.setCategory(params.category);
      if (params.status) request.setStatus(params.status);
      if (params.lowStockOnly) request.setLowStockOnly(true);

      client.listProducts(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            products: result.productsList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  },

  /**
   * Update product
   */
  async updateProduct(id: number, data: {
    name?: string;
    sku?: string;
    category?: string;
    commodity?: string;
    grade?: string;
    finish?: string;
    size?: string;
    thickness?: string;
    unit?: string;
    costPrice?: number;
    sellingPrice?: number;
    reorderLevel?: number;
    notes?: string;
  }): Promise<Product.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new UpdateProductRequest();
      request.setId(id);

      const productData = new CreateProductRequest();
      if (data.name) productData.setName(data.name);
      if (data.category) productData.setCategory(data.category);
      if (data.sku) productData.setSku(data.sku);
      if (data.commodity) productData.setCommodity(data.commodity);
      if (data.grade) productData.setGrade(data.grade);
      if (data.finish) productData.setFinish(data.finish);
      if (data.size) productData.setSize(data.size);
      if (data.thickness) productData.setThickness(data.thickness);
      if (data.unit) productData.setUnit(data.unit);
      if (data.costPrice) productData.setCostPrice(data.costPrice);
      if (data.sellingPrice) productData.setSellingPrice(data.sellingPrice);
      if (data.reorderLevel) productData.setReorderLevel(data.reorderLevel);
      if (data.notes) productData.setNotes(data.notes);

      request.setProduct(productData);

      client.updateProduct(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  },

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new IdRequest();
      request.setId(id);

      client.deleteProduct(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Search products
   */
  async searchProducts(query: string, page: number = 1, limit: number = 50): Promise<{ products: Product.AsObject[]; pageInfo: any }> {
    return new Promise((resolve, reject) => {
      const request = new SearchProductsRequest();
      request.setQuery(query);

      const pageRequest = new PageRequest();
      pageRequest.setPage(page);
      pageRequest.setLimit(limit);
      request.setPage(pageRequest);

      client.searchProducts(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          const result = response!.toObject();
          resolve({
            products: result.productsList,
            pageInfo: result.pageInfo
          });
        }
      });
    });
  },

  /**
   * Update inventory (stock in/out)
   */
  async updateInventory(data: {
    productId: number;
    quantityChange: number;
    reason?: string;
    reference?: string;
  }): Promise<Product.AsObject> {
    return new Promise((resolve, reject) => {
      const request = new UpdateInventoryRequest();

      request.setProductId(data.productId);
      request.setQuantityChange(data.quantityChange);
      if (data.reason) request.setReason(data.reason);
      if (data.reference) request.setReference(data.reference);

      client.updateInventory(request, getAuthMetadata(), (err, response) => {
        if (err) {
          reject(handleGrpcError(err));
        } else {
          resolve(response!.toObject());
        }
      });
    });
  }
};
