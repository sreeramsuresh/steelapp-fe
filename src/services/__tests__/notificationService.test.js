import toast from "react-hot-toast";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { notificationService } from "../notificationService.js";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn((msg, opts) => ({ id: "1", type: "success", message: msg })),
    error: vi.fn((msg, opts) => ({ id: "2", type: "error", message: msg })),
    loading: vi.fn((msg, opts) => ({ id: "3", type: "loading", message: msg })),
    promise: vi.fn((p, msgs, opts) => p),
    custom: vi.fn((jsx, opts) => ({ id: "4", type: "custom" })),
    dismiss: vi.fn((id) => undefined),
    remove: vi.fn((id) => undefined),
  },
}));

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Theme Configuration", () => {
    it("should set theme to dark mode", () => {
      notificationService.setTheme(true);
      expect(notificationService.isDarkMode).toBe(true);
    });

    it("should set theme to light mode", () => {
      notificationService.setTheme(false);
      expect(notificationService.isDarkMode).toBe(false);
    });
  });

  describe("Success Notifications", () => {
    it("should show success toast with correct styling", () => {
      const result = notificationService.success("Operation completed!");

      expect(toast.success).toHaveBeenCalledWith(
        "Operation completed!",
        expect.objectContaining({
          duration: 4000,
          position: "top-right",
          iconTheme: {
            primary: "#10b981", // green-500
            secondary: "#ffffff",
          },
        })
      );
      expect(result.type).toBe("success");
    });

    it("should support custom options", () => {
      notificationService.success("Custom message", { duration: 2000 });

      expect(toast.success).toHaveBeenCalledWith("Custom message", expect.objectContaining({ duration: 2000 }));
    });

    it("should use apiSuccess helper", () => {
      notificationService.apiSuccess("Save");

      expect(toast.success).toHaveBeenCalledWith("Save completed successfully!", expect.any(Object));
    });

    it("should use formSuccess helper", () => {
      notificationService.formSuccess("Contact Form");

      expect(toast.success).toHaveBeenCalledWith("Contact Form saved successfully!", expect.any(Object));
    });

    it("should use createSuccess helper", () => {
      notificationService.createSuccess("Invoice");

      expect(toast.success).toHaveBeenCalledWith("Invoice created successfully!", expect.any(Object));
    });

    it("should use updateSuccess helper", () => {
      notificationService.updateSuccess("Customer");

      expect(toast.success).toHaveBeenCalledWith("Customer updated successfully!", expect.any(Object));
    });

    it("should use deleteSuccess helper", () => {
      notificationService.deleteSuccess("Product");

      expect(toast.success).toHaveBeenCalledWith("Product deleted successfully!", expect.any(Object));
    });
  });

  describe("Error Notifications", () => {
    it("should show error toast with longer duration", () => {
      const result = notificationService.error("Something went wrong!");

      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong!",
        expect.objectContaining({
          duration: 6000, // Longer than success
          iconTheme: {
            primary: "#ef4444", // red-500
            secondary: "#ffffff",
          },
        })
      );
      expect(result.type).toBe("error");
    });

    it("should support custom error options", () => {
      notificationService.error("Custom error", { duration: 8000 });

      expect(toast.error).toHaveBeenCalledWith("Custom error", expect.objectContaining({ duration: 8000 }));
    });

    it("should use apiError helper with error object", () => {
      const error = {
        response: { data: { message: "Server error" } },
      };

      notificationService.apiError("Upload", error);

      expect(toast.error).toHaveBeenCalledWith("Server error", expect.any(Object));
    });

    it("should use apiError helper with fallback message", () => {
      const error = new Error("Network error");

      notificationService.apiError("Delete", error);

      expect(toast.error).toHaveBeenCalledWith("Network error", expect.any(Object));
    });

    it("should use formError helper", () => {
      const error = new Error("Validation failed");

      notificationService.formError("Profile", error);

      expect(toast.error).toHaveBeenCalledWith("Validation failed", expect.any(Object));
    });

    it("should use deleteError helper", () => {
      const error = {
        response: { data: { error: "Item in use" } },
      };

      notificationService.deleteError("Department", error);

      expect(toast.error).toHaveBeenCalledWith("Item in use", expect.any(Object));
    });

    it("should use updateError helper", () => {
      const error = new Error("Update failed");

      notificationService.updateError("Settings", error);

      expect(toast.error).toHaveBeenCalledWith("Update failed", expect.any(Object));
    });

    it("should use createError helper", () => {
      const error = new Error("Create failed");

      notificationService.createError("Account", error);

      expect(toast.error).toHaveBeenCalledWith("Create failed", expect.any(Object));
    });
  });

  describe("Warning Notifications", () => {
    it("should show warning toast", () => {
      notificationService.warning("Please review this carefully");

      expect(toast).toHaveBeenCalledWith(
        "Please review this carefully",
        expect.objectContaining({
          icon: "⚠️",
          iconTheme: {
            primary: "#f59e0b", // amber-500
            secondary: "#ffffff",
          },
        })
      );
    });

    it("should support custom warning options", () => {
      notificationService.warning("Warning message", { duration: 5000 });

      expect(toast).toHaveBeenCalledWith("Warning message", expect.objectContaining({ duration: 5000 }));
    });
  });

  describe("Info Notifications", () => {
    it("should show info toast", () => {
      notificationService.info("Processing your request...");

      expect(toast).toHaveBeenCalledWith(
        "Processing your request...",
        expect.objectContaining({
          icon: "ℹ️",
          iconTheme: {
            primary: "#3b82f6", // blue-500
            secondary: "#ffffff",
          },
        })
      );
    });

    it("should support custom info options", () => {
      notificationService.info("Info message", { position: "bottom-center" });

      expect(toast).toHaveBeenCalledWith("Info message", expect.objectContaining({ position: "bottom-center" }));
    });
  });

  describe("Loading Notifications", () => {
    it("should show loading state", () => {
      const result = notificationService.loading("Loading data...");

      expect(toast.loading).toHaveBeenCalledWith("Loading data...", expect.any(Object));
      expect(result.type).toBe("loading");
    });

    it("should support custom loading options", () => {
      notificationService.loading("Processing...", { duration: 10000 });

      expect(toast.loading).toHaveBeenCalledWith("Processing...", expect.objectContaining({ duration: 10000 }));
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

      expect(toast.promise).toHaveBeenCalledWith(testPromise, messages, expect.any(Object));
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

      expect(toast.promise).toHaveBeenCalled();
    });
  });

  describe("Custom Notifications", () => {
    it("should render custom JSX", () => {
      const customJsx = "<div>Custom notification</div>";

      notificationService.custom(customJsx);

      expect(toast.custom).toHaveBeenCalledWith(customJsx, expect.any(Object));
    });

    it("should support custom options", () => {
      const customJsx = "<div>Custom</div>";

      notificationService.custom(customJsx, { duration: 3000 });

      expect(toast.custom).toHaveBeenCalledWith(customJsx, expect.objectContaining({ duration: 3000 }));
    });
  });

  describe("Toast Dismissal", () => {
    it("should dismiss specific toast", () => {
      notificationService.dismiss("toast-id-123");

      expect(toast.dismiss).toHaveBeenCalledWith("toast-id-123");
    });

    it("should remove specific toast", () => {
      notificationService.remove("toast-id-456");

      expect(toast.remove).toHaveBeenCalledWith("toast-id-456");
    });
  });

  describe("Dark Mode Theming", () => {
    it("should apply dark mode styles when enabled", () => {
      notificationService.setTheme(true);
      notificationService.success("Dark mode message");

      expect(toast.success).toHaveBeenCalledWith(
        "Dark mode message",
        expect.objectContaining({
          style: expect.objectContaining({
            background: "#1f2937", // gray-800
            color: "#f9fafb", // gray-50
            border: expect.stringContaining("#374151"), // gray-700
          }),
        })
      );
    });

    it("should apply light mode styles when disabled", () => {
      notificationService.setTheme(false);
      notificationService.success("Light mode message");

      expect(toast.success).toHaveBeenCalledWith(
        "Light mode message",
        expect.objectContaining({
          style: expect.objectContaining({
            background: "#ffffff",
            color: "#111827", // gray-900
            border: expect.stringContaining("#e5e7eb"), // gray-200
          }),
        })
      );
    });
  });

  describe("Notification Styling", () => {
    it("should apply consistent styling across all notifications", () => {
      notificationService.success("Styled message");

      const callArgs = toast.success.mock.calls[0];
      const options = callArgs[1];

      expect(options).toHaveProperty("position");
      expect(options).toHaveProperty("style");
      expect(options).toHaveProperty("duration");
      expect(options).toHaveProperty("fontSize", "0.875rem");
    });

    it("should use border-radius for rounded corners", () => {
      notificationService.info("Rounded notification");

      const callArgs = toast.mock.calls[0];
      const options = callArgs[1];

      expect(options.style).toHaveProperty("borderRadius", "0.75rem");
    });

    it("should use box-shadow for elevation", () => {
      notificationService.success("Shadow notification");

      const callArgs = toast.success.mock.calls[0];
      const options = callArgs[1];

      expect(options.style).toHaveProperty("boxShadow");
    });
  });

  describe("Multi-notification Handling", () => {
    it("should show multiple notifications sequentially", () => {
      notificationService.info("First notification");
      notificationService.success("Second notification");
      notificationService.error("Third notification");

      expect(toast).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
    });

    it("should maintain notification queue position", () => {
      notificationService.success("First");
      notificationService.success("Second");
      notificationService.success("Third");

      expect(toast.success).toHaveBeenCalledTimes(3);
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

      expect(toast.error).toHaveBeenCalledWith("Custom error message", expect.any(Object));
    });

    it("should fallback to error.message", () => {
      const error = new Error("Fallback message");

      notificationService.apiError("Operation", error);

      expect(toast.error).toHaveBeenCalledWith("Fallback message", expect.any(Object));
    });

    it("should use default message if no error details available", () => {
      notificationService.apiError("Operation");

      expect(toast.error).toHaveBeenCalledWith("Operation failed", expect.any(Object));
    });
  });

  describe("Singleton Instance", () => {
    it("should maintain state across calls", () => {
      notificationService.setTheme(true);
      notificationService.success("Message");
      notificationService.error("Another message");

      expect(notificationService.isDarkMode).toBe(true);
    });
  });
});
