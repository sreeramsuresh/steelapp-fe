import toast from "react-hot-toast";
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import { notificationService } from "../notificationService.js";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn((msg, _opts) => ({ id: "1", type: "success", message: msg })),
    error: vi.fn((msg, _opts) => ({ id: "2", type: "error", message: msg })),
    loading: vi.fn((msg, _opts) => ({ id: "3", type: "loading", message: msg })),
    promise: vi.fn((p, _msgs, _opts) => p),
    custom: vi.fn((_jsx, _opts) => ({ id: "4", type: "custom" })),
    dismiss: vi.fn((_id) => undefined),
    remove: vi.fn((_id) => undefined),
  },
}));

describe("notificationService", () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe("Theme Configuration", () => {
    test("should set theme to dark mode", () => {
      notificationService.setTheme(true);
      assert.ok(notificationService.isDarkMode).toBe(true);
    });

    test("should set theme to light mode", () => {
      notificationService.setTheme(false);
      assert.ok(notificationService.isDarkMode).toBe(false);
    });
  });

  describe("Success Notifications", () => {
    test("should show success toast with correct styling", () => {
      const result = notificationService.success("Operation completed!");

      assert.ok(toast.success).toHaveBeenCalledWith(
        "Operation completed!",
        Object.keys({
          duration: 4000,
          position: "top-right",
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
      assert.ok(result.type).toBe("success");
    });

    test("should support custom options", () => {
      notificationService.success("Custom message", { duration: 2000 });

      assert.ok(toast.success).toHaveBeenCalledWith("Custom message", Object.keys({ duration: 2000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should use apiSuccess helper", () => {
      notificationService.apiSuccess("Save");

      assert.ok(toast.success).toHaveBeenCalledWith("Save completed successfully!", );
    });

    test("should use formSuccess helper", () => {
      notificationService.formSuccess("Contact Form");

      assert.ok(toast.success).toHaveBeenCalledWith("Contact Form saved successfully!", );
    });

    test("should use createSuccess helper", () => {
      notificationService.createSuccess("Invoice");

      assert.ok(toast.success).toHaveBeenCalledWith("Invoice created successfully!", );
    });

    test("should use updateSuccess helper", () => {
      notificationService.updateSuccess("Customer");

      assert.ok(toast.success).toHaveBeenCalledWith("Customer updated successfully!", );
    });

    test("should use deleteSuccess helper", () => {
      notificationService.deleteSuccess("Product");

      assert.ok(toast.success).toHaveBeenCalledWith("Product deleted successfully!", );
    });
  });

  describe("Error Notifications", () => {
    test("should show error toast with longer duration", () => {
      const result = notificationService.error("Something went wrong!");

      assert.ok(toast.error).toHaveBeenCalledWith(
        "Something went wrong!",
        Object.keys({
          duration: 6000, // Longer than success
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
      assert.ok(result.type).toBe("error");
    });

    test("should support custom error options", () => {
      notificationService.error("Custom error", { duration: 8000 });

      assert.ok(toast.error).toHaveBeenCalledWith("Custom error", Object.keys({ duration: 8000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should use apiError helper with error object", () => {
      const error = {
        response: { data: { message: "Server error" } },
      };

      notificationService.apiError("Upload", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Server error", );
    });

    test("should use apiError helper with fallback message", () => {
      const error = new Error("Network error");

      notificationService.apiError("Delete", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Network error", );
    });

    test("should use formError helper", () => {
      const error = new Error("Validation failed");

      notificationService.formError("Profile", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Validation failed", );
    });

    test("should use deleteError helper", () => {
      const error = {
        response: { data: { error: "Item in use" } },
      };

      notificationService.deleteError("Department", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Item in use", );
    });

    test("should use updateError helper", () => {
      const error = new Error("Update failed");

      notificationService.updateError("Settings", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Update failed", );
    });

    test("should use createError helper", () => {
      const error = new Error("Create failed");

      notificationService.createError("Account", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Create failed", );
    });
  });

  describe("Warning Notifications", () => {
    test("should show warning toast", () => {
      notificationService.warning("Please review this carefully");

      assert.ok(toast).toHaveBeenCalledWith(
        "Please review this carefully",
        Object.keys({
          icon: "⚠️",
          iconTheme: {
            primary: "#f59e0b", // amber-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should support custom warning options", () => {
      notificationService.warning("Warning message", { duration: 5000 });

      assert.ok(toast).toHaveBeenCalledWith("Warning message", Object.keys({ duration: 5000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Info Notifications", () => {
    test("should show info toast", () => {
      notificationService.info("Processing your request...");

      assert.ok(toast).toHaveBeenCalledWith(
        "Processing your request...",
        Object.keys({
          icon: "ℹ️",
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined')
      );
    });

    test("should support custom info options", () => {
      notificationService.info("Info message", { position: "bottom-center" });

      assert.ok(toast).toHaveBeenCalledWith("Info message", Object.keys({ position: "bottom-center" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Loading Notifications", () => {
    test("should show loading state", () => {
      const result = notificationService.loading("Loading data...");

      assert.ok(toast.loading).toHaveBeenCalledWith("Loading data...", );
      assert.ok(result.type).toBe("loading");
    });

    test("should support custom loading options", () => {
      notificationService.loading("Processing...", { duration: 10000 });

      assert.ok(toast.loading).toHaveBeenCalledWith("Processing...", Object.keys({ duration: 10000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Promise Notifications", () => {
    test("should handle promise notifications", async () => {
      const testPromise = Promise.resolve("Success");
      const messages = {
        loading: "Loading...",
        success: "Done!",
        error: "Failed!",
      };

      await notificationService.promise(testPromise, messages);

      assert.ok(toast.promise).toHaveBeenCalledWith(testPromise, messages, );
    });

    test("should handle rejected promises", async () => {
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

      assert.ok(toast.promise).toHaveBeenCalled();
    });
  });

  describe("Custom Notifications", () => {
    test("should render custom JSX", () => {
      const customJsx = "<div>Custom notification</div>";

      notificationService.custom(customJsx);

      assert.ok(toast.custom).toHaveBeenCalledWith(customJsx, );
    });

    test("should support custom options", () => {
      const customJsx = "<div>Custom</div>";

      notificationService.custom(customJsx, { duration: 3000 });

      assert.ok(toast.custom).toHaveBeenCalledWith(customJsx, Object.keys({ duration: 3000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Toast Dismissal", () => {
    test("should dismiss specific toast", () => {
      notificationService.dismiss("toast-id-123");

      assert.ok(toast.dismiss).toHaveBeenCalledWith("toast-id-123");
    });

    test("should remove specific toast", () => {
      notificationService.remove("toast-id-456");

      assert.ok(toast.remove).toHaveBeenCalledWith("toast-id-456");
    });
  });

  describe("Dark Mode Theming", () => {
    test("should apply dark mode styles when enabled", () => {
      notificationService.setTheme(true);
      notificationService.success("Dark mode message");

      assert.ok(toast.success).toHaveBeenCalledWith(
        "Dark mode message",
        Object.keys({
          style: expect.objectContaining({
            background: "#1f2937", // gray-800
            color: "#f9fafb", // gray-50
            border: expect.stringContaining("#374151").every(k => typeof arguments[0][k] !== 'undefined'), // gray-700
          }),
        })
      );
    });

    test("should apply light mode styles when disabled", () => {
      notificationService.setTheme(false);
      notificationService.success("Light mode message");

      assert.ok(toast.success).toHaveBeenCalledWith(
        "Light mode message",
        Object.keys({
          style: expect.objectContaining({
            background: "#ffffff",
            color: "#111827", // gray-900
            border: expect.stringContaining("#e5e7eb").every(k => typeof arguments[0][k] !== 'undefined'), // gray-200
          }),
        })
      );
    });
  });

  describe("Notification Styling", () => {
    test("should apply consistent styling across all notifications", () => {
      notificationService.success("Styled message");

      const callArgs = toast.success.mock.calls[0];
      const options = callArgs[1];

      assert.ok(options).toHaveProperty("position");
      assert.ok(options).toHaveProperty("style");
      assert.ok(options).toHaveProperty("duration");
      assert.ok(options).toHaveProperty("fontSize", "0.875rem");
    });

    test("should use border-radius for rounded corners", () => {
      notificationService.info("Rounded notification");

      const callArgs = toast.mock.calls[0];
      const options = callArgs[1];

      assert.ok(options.style).toHaveProperty("borderRadius", "0.75rem");
    });

    test("should use box-shadow for elevation", () => {
      notificationService.success("Shadow notification");

      const callArgs = toast.success.mock.calls[0];
      const options = callArgs[1];

      assert.ok(options.style).toHaveProperty("boxShadow");
    });
  });

  describe("Multi-notification Handling", () => {
    test("should show multiple notifications sequentially", () => {
      notificationService.info("First notification");
      notificationService.success("Second notification");
      notificationService.error("Third notification");

      assert.ok(toast).toHaveBeenCalledTimes(1);
      assert.ok(toast.success).toHaveBeenCalledTimes(1);
      assert.ok(toast.error).toHaveBeenCalledTimes(1);
    });

    test("should maintain notification queue position", () => {
      notificationService.success("First");
      notificationService.success("Second");
      notificationService.success("Third");

      assert.ok(toast.success).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Message Extraction", () => {
    test("should extract error from response.data.message", () => {
      const error = {
        response: {
          data: { message: "Custom error message" },
        },
      };

      notificationService.apiError("Operation", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Custom error message", );
    });

    test("should fallback to error.message", () => {
      const error = new Error("Fallback message");

      notificationService.apiError("Operation", error);

      assert.ok(toast.error).toHaveBeenCalledWith("Fallback message", );
    });

    test("should use default message if no error details available", () => {
      notificationService.apiError("Operation");

      assert.ok(toast.error).toHaveBeenCalledWith("Operation failed", );
    });
  });

  describe("Singleton Instance", () => {
    test("should maintain state across calls", () => {
      notificationService.setTheme(true);
      notificationService.success("Message");
      notificationService.error("Another message");

      assert.ok(notificationService.isDarkMode).toBe(true);
    });
  });
});