import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HashVerificationBadge from "../HashVerificationBadge";

// Mock react-hot-toast
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn() },
}));

describe("HashVerificationBadge", () => {
  it("renders verified state by default", () => {
    render(<HashVerificationBadge hash="abc123" />);
    expect(screen.getByText(/Data Integrity Verified/)).toBeInTheDocument();
  });

  it("renders unverified state when verified=false", () => {
    render(<HashVerificationBadge hash="abc123" verified={false} />);
    expect(screen.getByText(/Data Integrity Issue/)).toBeInTheDocument();
  });

  it("shows the hash value", () => {
    render(<HashVerificationBadge hash="sha256-test-hash-value" />);
    expect(screen.getByText("sha256-test-hash-value")).toBeInTheDocument();
  });

  it("shows copy button when hash is provided", () => {
    render(<HashVerificationBadge hash="abc123" />);
    expect(screen.getByTitle("Copy hash to clipboard")).toBeInTheDocument();
  });

  it("shows correct description for verified hash", () => {
    render(<HashVerificationBadge hash="abc" />);
    expect(screen.getByText(/SHA-256 hash matches/)).toBeInTheDocument();
  });

  it("shows correct description for unverified hash", () => {
    render(<HashVerificationBadge hash="abc" verified={false} />);
    expect(screen.getByText(/Hash mismatch detected/)).toBeInTheDocument();
  });
});
