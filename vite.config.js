import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Open Chrome with remote debugging enabled (port 9222 for DevTools MCP)
    open: {
      app: {
        name: 'chrome',
        arguments: ['--remote-debugging-port=9222'],
      },
    },
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // Proxy API calls to backend to avoid CORS/CORB and HTML responses
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Also proxy static uploads to serve images from same origin
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - separate large libraries for better caching
          if (id.includes('node_modules')) {
            // React ecosystem - core runtime (kept together for compatibility)
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // React Router - separate chunk for routing
            if (id.includes('react-router')) {
              return 'vendor-router';
            }

            // PDF generation libraries - lazy loaded, separate chunk
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }

            // Chart libraries - heavy, lazy loaded where possible
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            // ECharts - separate from recharts
            if (id.includes('echarts')) {
              return 'vendor-echarts';
            }

            // MUI and Emotion - heavy UI framework
            if (id.includes('@mui/') || id.includes('@emotion/')) {
              return 'vendor-mui';
            }

            // Lucide icons - separate for tree-shaking benefits
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }

            // Date utilities
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }

            // HTTP client
            if (id.includes('axios')) {
              return 'vendor-http';
            }

            // Excel export
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }

            // Validation
            if (id.includes('zod')) {
              return 'vendor-validation';
            }

            // Other smaller vendor dependencies
            return 'vendor';
          }

          // API/Services layer - shared across app, load early
          if (id.includes('/services/axiosApi') || id.includes('/services/api.js')) {
            return 'services-core';
          }
          if (id.includes('/services/')) {
            return 'services';
          }

          // Dashboard widget chunks - code split by category
          if (id.includes('/dashboard/widgets/financial/')) {
            return 'dashboard-financial';
          }
          if (id.includes('/dashboard/widgets/inventory/')) {
            return 'dashboard-inventory';
          }
          if (id.includes('/dashboard/widgets/product/')) {
            return 'dashboard-product';
          }
          if (id.includes('/dashboard/widgets/customer/')) {
            return 'dashboard-customer';
          }
          if (id.includes('/dashboard/widgets/sales-agent/')) {
            return 'dashboard-sales';
          }
          if (id.includes('/dashboard/widgets/vat/')) {
            return 'dashboard-vat';
          }
          if (id.includes('/dashboard/widgets/BaseWidget')) {
            return 'dashboard-base';
          }
          if (id.includes('/dashboard/charts/')) {
            return 'dashboard-charts';
          }

          // Feature chunks - lazy load heavy pages
          if (id.includes('/pages/InvoiceForm') || id.includes('/pages/InvoiceList')) {
            return 'feature-invoices';
          }
          if (id.includes('/pages/QuotationForm') || id.includes('/pages/QuotationList')) {
            return 'feature-quotations';
          }
          if (id.includes('/pages/PurchaseOrder')) {
            return 'feature-purchase-orders';
          }
          if (id.includes('/pages/DeliveryNote')) {
            return 'feature-delivery-notes';
          }
          if (id.includes('/pages/CreditNote')) {
            return 'feature-credit-notes';
          }
          if (id.includes('/pages/Import') || id.includes('/pages/Export')) {
            return 'feature-import-export';
          }
          if (id.includes('/pages/Stock') || id.includes('/stock-movement/')) {
            return 'feature-stock';
          }
          if (id.includes('/pages/Report') || id.includes('/pages/ProfitAnalysis') || id.includes('/pages/PriceHistory')) {
            return 'feature-reports';
          }

          // Marketing pages - separate chunk for public site
          if (id.includes('/marketing/')) {
            return 'marketing';
          }

          // Mock services - only for development
          if (id.includes('/mock/')) {
            return 'mock-services';
          }
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable minification
    minify: 'esbuild',
    // Keep chunk size warning at reasonable level
    chunkSizeWarningLimit: 500,
    // Enable source maps for debugging (can disable in production)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    // Exclude heavy libraries from pre-bundling to allow proper chunking
    exclude: ['jspdf', 'html2canvas', 'xlsx'],
  },
  // base: "https://github.com/sreeramsuresh/steelapprnp.git",
});
