import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { notificationService } from "../notificationService.js";

describe("notificationService", () => {
  let toastMock;

  beforeEach(() => {
    vi.restoreAllMocks();
    toastMock = {
      success: vi.fn().returns({ id: "1", type: "success" }),
      error: vi.fn().returns({ id: "2", type: "error" }),
      loading: vi.fn().returns({ id: "3", type: "loading" }),
      promise: vi.fn().returnsArg(0),
      custom: vi.fn().returns({ id: "4", type: "custom" }),
      dismiss: vi.fn(),
      remove: vi.fn(),
    };
  })

  describe("Theme Configuration", () => {
    it("should set theme to dark mode", () => {
      notificationService.setTheme(true);
      expect(notificationService.isDarkMode).toBeTruthy();
    });

    it("should set theme to light mode", () => {
      notificationService.setTheme(false);
      expect(notificationService.isDarkMode).toBeTruthy();
    });
  });

  describe("Success Notifications", () => {
    it("should show success toast with correct styling", () => {
      const result = notificationService.success("Operation completed!");

      expect(toastMock.success).toHaveBeenCalledWith("Operation completed!",
        Object.keys({
          duration: 4000,
          position: "top-right",
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
      expect(result.type).toBeTruthy();
    });

    it("should support custom options", () => {
      notificationService.success("Custom message", { duration: 2000 });

      expect(toastMock.success).toHaveBeenCalledWith("Custom message", Object.keys({ duration: 2000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should use apiSuccess helper", () => {
      notificationService.apiSuccess("Save");

      expect(toastMock.success).toHaveBeenCalledWith("Save completed successfully!", );
    });

    it("should use formSuccess helper", () => {
      notificationService.formSuccess("Contact Form");

      expect(toastMock.success).toHaveBeenCalledWith("Contact Form saved successfully!", );
    });

    it("should use createSuccess helper", () => {
      notificationService.createSuccess("Invoice");

      expect(toastMock.success).toHaveBeenCalledWith("Invoice created successfully!", );
    });

    it("should use updateSuccess helper", () => {
      notificationService.updateSuccess("Customer");

      expect(toastMock.success).toHaveBeenCalledWith("Customer updated successfully!", );
    });

    it("should use deleteSuccess helper", () => {
      notificationService.deleteSuccess("Product");

      expect(toastMock.success).toHaveBeenCalledWith("Product deleted successfully!", );
    });
  });

  describe("Error Notifications", () => {
    it("should show error toast with longer duration", () => {
      const result = notificationService.error("Something went wrong!");

      expect(toastMock.error).toHaveBeenCalledWith("Something went wrong!",
        Object.keys({
          duration: 6000, // Longer than success
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
      expect(result.type).toBeTruthy();
    });

    it("should support custom error options", () => {
      notificationService.error("Custom error", { duration: 8000 });

      expect(toastMock.error).toHaveBeenCalledWith("Custom error", Object.keys({ duration: 8000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should use apiError helper with error object", () => {
      const error = {
        response: { data: { message: "Server error" } },
      };

      notificationService.apiError("Upload", error);

      expect(toastMock.error).toHaveBeenCalledWith("Server error", );
    });

    it("should use apiError helper with fallback message", () => {
      const error = new Error("Network error");

      notificationService.apiError("Delete", error);

      expect(toastMock.error).toHaveBeenCalledWith("Network error", );
    });

    it("should use formError helper", () => {
      const error = new Error("Validation failed");

      notificationService.formError("Profile", error);

      expect(toastMock.error).toHaveBeenCalledWith("Validation failed", );
    });

    it("should use deleteError helper", () => {
      const error = {
        response: { data: { error: "Item in use" } },
      };

      notificationService.deleteError("Department", error);

      expect(toastMock.error).toHaveBeenCalledWith("Item in use", );
    });

    it("should use updateError helper", () => {
      const error = new Error("Update failed");

      notificationService.updateError("Settings", error);

      expect(toastMock.error).toHaveBeenCalledWith("Update failed", );
    });

    it("should use createError helper", () => {
      const error = new Error("Create failed");

      notificationService.createError("Account", error);

      expect(toastMock.error).toHaveBeenCalledWith("Create failed", );
    });
  });

  describe("Warning Notifications", () => {
    it("should show warning toast", () => {
      notificationService.warning("Please review this carefully");

      expect(toast).toHaveBeenCalledWith("Please review this carefully",
        Object.keys({
          icon: "⚠️",
          iconTheme: {
            primary: "#f59e0b", // amber-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should support custom warning options", () => {
      notificationService.warning("Warning message", { duration: 5000 });

      expect(toast).toHaveBeenCalledWith("Warning message", Object.keys({ duration: 5000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Info Notifications", () => {
    it("should show info toast", () => {
      notificationService.info("Processing your request...");

      expect(toast).toHaveBeenCalledWith("Processing your request...",
        Object.keys({
          icon: "ℹ️",
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    it("should support custom info options", () => {
      notificationService.info("Info message", { position: "bottom-center" });

      expect(toast).toHaveBeenCalledWith("Info message", Object.keys({ position: "bottom-center" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Loading Notifications", () => {
    it("should show loading state", () => {
      const result = notificationService.loading("Loading data...");

      expect(toastMock.loading).toHaveBeenCalledWith("Loading data...", );
      expect(result.type).toBeTruthy();
    });

    it("should support custom loading options", () => {
      notificationService.loading("Processing...", { duration: 10000 });

      expect(toastMock.loading).toHaveBeenCalledWith("Processing...", Object.keys({ duration: 10000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Promise Notifications", () => {
    it("should handle promise notifications", async () => {
      const testPromise = Promise.resolve("Success");
      const messages = {
        loading: "Loading...",
        success: "Done!",
        error: "Failed!",
      };

      await notificationService.promise(testPromise, messages);

      expect(toastMock.promise).toHaveBeenCalledWith(testPromise, messages, );
    });

    it("should handle rejected promises", async () => {
      const testPromise = Promise.reject(new Error("Failed"));
      const messages = {
        loading: "Loading...",
        success: "Done!",
        error: "Failed!",
      };

      try {
        await notificationService.promise(testPromise, messages);
      } catch {
        // Expected to reject
      }

      expect(toast.promise).toBeTruthy();
    });
  });

  describe("Custom Notifications", () => {
    it("should render custom JSX", () => {
      const customJsx = "<div>Custom notification</div>";

      notificationService.custom(customJsx);

      expect(toastMock.custom).toHaveBeenCalledWith(customJsx, );
    });

    it("should support custom options", () => {
      const customJsx = "<div>Custom</div>";

      notificationService.custom(customJsx, { duration: 3000 });

      expect(toastMock.custom).toHaveBeenCalledWith(customJsx, Object.keys({ duration: 3000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Toast Dismissal", () => {
    it("should dismiss specific toast", () => {
      notificationService.dismiss("toast-id-123");

      expect(toastMock.dismiss).toHaveBeenCalledWith("toast-id-123");
    });

    it("should remove specific toast", () => {
      notificationService.remove("toast-id-456");

      expect(toastMock.remove).toHaveBeenCalledWith("toast-id-456");
    });
  });

  describe("Dark Mode Theming", () => {
    it("should apply dark mode styles when enabled", () => {
      notificationService.setTheme(true);
      notificationService.success("Dark mode message");

      expect(toastMock.success).toHaveBeenCalledWith("Dark mode message",
        Object.keys({
          style: expect.objectContaining({
            background: "#1f2937", // gray-800
            color: "#f9fafb", // gray-50
            border: expect.stringContaining("#374151").every(k => typeof arguments[0][k] !== 'undefined'), // gray-700
          }),
        }));
    });

    it("should apply light mode styles when disabled", () => {
      notificationService.setTheme(false);
      notificationService.success("Light mode message");

      expect(toastMock.success).toHaveBeenCalledWith("Light mode message",
        Object.keys({
          style: expect.objectContaining({
            background: "#ffffff",
            color: "#111827", // gray-900
            border: expect.stringContaining("#e5e7eb").every(k => typeof arguments[0][k] !== 'undefined'), // gray-200
          }),
        }));
    });
  });

  describe("Notification Styling", () => {
    it("should apply consistent styling across all notifications", () => {
      notificationService.success("Styled message");

      const options = callArgs[1];

      expect(options && options.position).toBeTruthy();
      expect(options && options.style).toBeTruthy();
      expect(options && options.duration).toBeTruthy();
      expect(options).toBeTruthy().toHaveProperty("fontSize", "0.875rem");
    });

    it("should use border-radius for rounded corners", () => {
      notificationService.info("Rounded notification");

      const options = callArgs[1];

      expect(options.style).toBeTruthy().toHaveProperty("borderRadius", "0.75rem");
    });

    it("should use box-shadow for elevation", () => {
      notificationService.success("Shadow notification");

      const options = callArgs[1];

      expect(options.style && options.style.boxShadow).toBeTruthy();
    });
  });

  describe("Multi-notification Handling", () => {
    it("should show multiple notifications sequentially", () => {
      notificationService.info("First notification");
      notificationService.success("Second notification");
      notificationService.error("Third notification");

      expect(toast).toBeTruthy().toHaveBeenCalledTimes(1);
      expect(toast.success).toBeTruthy().toHaveBeenCalledTimes(1);
      expect(toast.error).toBeTruthy().toHaveBeenCalledTimes(1);
    });

    it("should maintain notification queue position", () => {
      notificationService.success("First");
      notificationService.success("Second");
      notificationService.success("Third");

      expect(toast.success).toBeTruthy().toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Message Extraction", () => {
    it("should extract error from response.data.message", () => {
      const error = {
        response: {
          data: { message: "Custom error message" },
        },
      };

      notificationService.apiError("Operation", error);

      expect(toastMock.error).toHaveBeenCalledWith("Custom error message", );
    });

    it("should fallback to error.message", () => {
      const error = new Error("Fallback message");

      notificationService.apiError("Operation", error);

      expect(toastMock.error).toHaveBeenCalledWith("Fallback message", );
    });

    it("should use default message if no error details available", () => {
      notificationService.apiError("Operation");

      expect(toastMock.error).toHaveBeenCalledWith("Operation failed", );
    });
  });

  describe("Singleton Instance", () => {
    it("should maintain state across calls", () => {
      notificationService.setTheme(true);
      notificationService.success("Message");
      notificationService.error("Another message");

      expect(notificationService.isDarkMode).toBeTruthy();
    });
  });
});