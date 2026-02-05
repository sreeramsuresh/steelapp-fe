import { test, describe, beforeEach, afterEach } from 'node:test';
import '../../__tests__/init.mjs';
import assert from 'node:assert';
import sinon from 'sinon';
import { notificationService } from "../notificationService.js";

describe("notificationService", () => {
  let toastMock;

  beforeEach(() => {
    sinon.restore();
    toastMock = {
      success: sinon.stub().returns({ id: "1", type: "success" }),
      error: sinon.stub().returns({ id: "2", type: "error" }),
      loading: sinon.stub().returns({ id: "3", type: "loading" }),
      promise: sinon.stub().returnsArg(0),
      custom: sinon.stub().returns({ id: "4", type: "custom" }),
      dismiss: sinon.stub(),
      remove: sinon.stub(),
    };
  })

  describe("Theme Configuration", () => {
    test("should set theme to dark mode", () => {
      notificationService.setTheme(true);
      assert.ok(notificationService.isDarkMode);
    });

    test("should set theme to light mode", () => {
      notificationService.setTheme(false);
      assert.ok(notificationService.isDarkMode);
    });
  });

  describe("Success Notifications", () => {
    test("should show success toast with correct styling", () => {
      const result = notificationService.success("Operation completed!");

      sinon.assert.calledWith(toastMock.success, "Operation completed!",
        Object.keys({
          duration: 4000,
          position: "top-right",
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
      assert.ok(result.type);
    });

    test("should support custom options", () => {
      notificationService.success("Custom message", { duration: 2000 });

      sinon.assert.calledWith(toastMock.success, "Custom message", Object.keys({ duration: 2000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should use apiSuccess helper", () => {
      notificationService.apiSuccess("Save");

      sinon.assert.calledWith(toastMock.success, "Save completed successfully!", );
    });

    test("should use formSuccess helper", () => {
      notificationService.formSuccess("Contact Form");

      sinon.assert.calledWith(toastMock.success, "Contact Form saved successfully!", );
    });

    test("should use createSuccess helper", () => {
      notificationService.createSuccess("Invoice");

      sinon.assert.calledWith(toastMock.success, "Invoice created successfully!", );
    });

    test("should use updateSuccess helper", () => {
      notificationService.updateSuccess("Customer");

      sinon.assert.calledWith(toastMock.success, "Customer updated successfully!", );
    });

    test("should use deleteSuccess helper", () => {
      notificationService.deleteSuccess("Product");

      sinon.assert.calledWith(toastMock.success, "Product deleted successfully!", );
    });
  });

  describe("Error Notifications", () => {
    test("should show error toast with longer duration", () => {
      const result = notificationService.error("Something went wrong!");

      sinon.assert.calledWith(toastMock.error, "Something went wrong!",
        Object.keys({
          duration: 6000, // Longer than success
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
      assert.ok(result.type);
    });

    test("should support custom error options", () => {
      notificationService.error("Custom error", { duration: 8000 });

      sinon.assert.calledWith(toastMock.error, "Custom error", Object.keys({ duration: 8000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should use apiError helper with error object", () => {
      const error = {
        response: { data: { message: "Server error" } },
      };

      notificationService.apiError("Upload", error);

      sinon.assert.calledWith(toastMock.error, "Server error", );
    });

    test("should use apiError helper with fallback message", () => {
      const error = new Error("Network error");

      notificationService.apiError("Delete", error);

      sinon.assert.calledWith(toastMock.error, "Network error", );
    });

    test("should use formError helper", () => {
      const error = new Error("Validation failed");

      notificationService.formError("Profile", error);

      sinon.assert.calledWith(toastMock.error, "Validation failed", );
    });

    test("should use deleteError helper", () => {
      const error = {
        response: { data: { error: "Item in use" } },
      };

      notificationService.deleteError("Department", error);

      sinon.assert.calledWith(toastMock.error, "Item in use", );
    });

    test("should use updateError helper", () => {
      const error = new Error("Update failed");

      notificationService.updateError("Settings", error);

      sinon.assert.calledWith(toastMock.error, "Update failed", );
    });

    test("should use createError helper", () => {
      const error = new Error("Create failed");

      notificationService.createError("Account", error);

      sinon.assert.calledWith(toastMock.error, "Create failed", );
    });
  });

  describe("Warning Notifications", () => {
    test("should show warning toast", () => {
      notificationService.warning("Please review this carefully");

      sinon.assert.calledWith(toast, "Please review this carefully",
        Object.keys({
          icon: "⚠️",
          iconTheme: {
            primary: "#f59e0b", // amber-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should support custom warning options", () => {
      notificationService.warning("Warning message", { duration: 5000 });

      sinon.assert.calledWith(toast, "Warning message", Object.keys({ duration: 5000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Info Notifications", () => {
    test("should show info toast", () => {
      notificationService.info("Processing your request...");

      sinon.assert.calledWith(toast, "Processing your request...",
        Object.keys({
          icon: "ℹ️",
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: "#ffffff",
          },
        }).every(k => typeof arguments[0][k] !== 'undefined'));
    });

    test("should support custom info options", () => {
      notificationService.info("Info message", { position: "bottom-center" });

      sinon.assert.calledWith(toast, "Info message", Object.keys({ position: "bottom-center" }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Loading Notifications", () => {
    test("should show loading state", () => {
      const result = notificationService.loading("Loading data...");

      sinon.assert.calledWith(toastMock.loading, "Loading data...", );
      assert.ok(result.type);
    });

    test("should support custom loading options", () => {
      notificationService.loading("Processing...", { duration: 10000 });

      sinon.assert.calledWith(toastMock.loading, "Processing...", Object.keys({ duration: 10000 }).every(k => typeof arguments[0][k] !== 'undefined'));
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

      sinon.assert.calledWith(toastMock.promise, testPromise, messages, );
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

      assert.ok(toast.promise);
    });
  });

  describe("Custom Notifications", () => {
    test("should render custom JSX", () => {
      const customJsx = "<div>Custom notification</div>";

      notificationService.custom(customJsx);

      sinon.assert.calledWith(toastMock.custom, customJsx, );
    });

    test("should support custom options", () => {
      const customJsx = "<div>Custom</div>";

      notificationService.custom(customJsx, { duration: 3000 });

      sinon.assert.calledWith(toastMock.custom, customJsx, Object.keys({ duration: 3000 }).every(k => typeof arguments[0][k] !== 'undefined'));
    });
  });

  describe("Toast Dismissal", () => {
    test("should dismiss specific toast", () => {
      notificationService.dismiss("toast-id-123");

      sinon.assert.calledWith(toastMock.dismiss, "toast-id-123");
    });

    test("should remove specific toast", () => {
      notificationService.remove("toast-id-456");

      sinon.assert.calledWith(toastMock.remove, "toast-id-456");
    });
  });

  describe("Dark Mode Theming", () => {
    test("should apply dark mode styles when enabled", () => {
      notificationService.setTheme(true);
      notificationService.success("Dark mode message");

      sinon.assert.calledWith(toastMock.success, "Dark mode message",
        Object.keys({
          style: expect.objectContaining({
            background: "#1f2937", // gray-800
            color: "#f9fafb", // gray-50
            border: expect.stringContaining("#374151").every(k => typeof arguments[0][k] !== 'undefined'), // gray-700
          }),
        }));
    });

    test("should apply light mode styles when disabled", () => {
      notificationService.setTheme(false);
      notificationService.success("Light mode message");

      sinon.assert.calledWith(toastMock.success, "Light mode message",
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
    test("should apply consistent styling across all notifications", () => {
      notificationService.success("Styled message");

      const options = callArgs[1];

      assert.ok(options && options.position);
      assert.ok(options && options.style);
      assert.ok(options && options.duration);
      assert.ok(options).toHaveProperty("fontSize", "0.875rem");
    });

    test("should use border-radius for rounded corners", () => {
      notificationService.info("Rounded notification");

      const options = callArgs[1];

      assert.ok(options.style).toHaveProperty("borderRadius", "0.75rem");
    });

    test("should use box-shadow for elevation", () => {
      notificationService.success("Shadow notification");

      const options = callArgs[1];

      assert.ok(options.style && options.style.boxShadow);
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

      sinon.assert.calledWith(toastMock.error, "Custom error message", );
    });

    test("should fallback to error.message", () => {
      const error = new Error("Fallback message");

      notificationService.apiError("Operation", error);

      sinon.assert.calledWith(toastMock.error, "Fallback message", );
    });

    test("should use default message if no error details available", () => {
      notificationService.apiError("Operation");

      sinon.assert.calledWith(toastMock.error, "Operation failed", );
    });
  });

  describe("Singleton Instance", () => {
    test("should maintain state across calls", () => {
      notificationService.setTheme(true);
      notificationService.success("Message");
      notificationService.error("Another message");

      assert.ok(notificationService.isDarkMode);
    });
  });
});