import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, Alert, Input } from "antd";
import BaseButton from "@/components/button";
import { apiLogin } from "@/api/identity/identity.api";
import { apiUpdateUser } from "@/api/identity/identity.api";
import type { LoginResponse } from "@/interface/identity";

type Step = "verify" | "set-password" | "done";

const InviteAccept = () => {
  const [step, setStep] = useState<Step>("verify");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string>("");

  // Step 1 state
  const [email, setEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Step 2 state
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ── Step 1: verify identity with temp creds ── */
  const handleVerify = async () => {
    if (!email || !tempPassword) {
      setVerifyError("Please enter your email and temporary password.");
      return;
    }
    setVerifyError(null);
    setVerifying(true);
    try {
      const res = (await apiLogin({
        email,
        password: tempPassword,
      })) as LoginResponse;
      // Store token in localStorage so subsequent gatewayRequest calls are authenticated
      localStorage.setItem("auth_token", res.accessToken);
      setSessionUserId(res.user.id);
      setSessionEmail(res.user.email);
      setFullName(res.user.fullName ?? "");
      setStep("set-password");
    } catch (err) {
      setVerifyError(
        err instanceof Error
          ? err.message
          : "Invalid email or temporary password. Please check and try again.",
      );
    } finally {
      setVerifying(false);
    }
  };

  /* ── Step 2: set new password ── */
  const handleSetPassword = async () => {
    setPwError(null);
    if (!newPassword || newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    if (!sessionUserId) {
      setPwError("Session expired — please refresh and start again.");
      return;
    }
    setSaving(true);
    try {
      await apiUpdateUser({
        userId: sessionUserId,
        fullName: fullName || undefined,
        newPassword,
      });
      // Clean up the temp token from localStorage — user must log in fresh
      localStorage.removeItem("auth_token");
      setStep("done");
    } catch (err) {
      setPwError(
        err instanceof Error
          ? err.message
          : "Failed to set password. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / brand */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">SME Onboard</h1>
          <p className="mt-1 text-sm text-muted">Activate your account</p>
        </div>

        {/* ── Step 1: Verify identity ── */}
        {step === "verify" && (
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold">
                Welcome — verify your identity
              </h2>
              <p className="mt-1 text-sm text-muted">
                Enter your work email and the temporary password provided by
                your HR team.
              </p>
            </div>

            {verifyError && (
              <Alert
                type="error"
                showIcon
                message={verifyError}
                className="rounded-xl"
              />
            )}

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Work email</span>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Temporary password</span>
              <Input.Password
                autoComplete="current-password"
                placeholder="Temporary password from HR"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
            </label>

            <BaseButton
              type="primary"
              className="w-full"
              onClick={handleVerify}
              loading={verifying}
              disabled={verifying}>
              {verifying ? "Verifying..." : "Continue"}
            </BaseButton>

            <p className="text-center text-xs text-muted">
              Already set up?{" "}
              <Link
                to="/login"
                className="font-medium text-ink hover:underline">
                Log in
              </Link>
            </p>
          </Card>
        )}

        {/* ── Step 2: Set new password ── */}
        {step === "set-password" && (
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold">Set your password</h2>
              <p className="mt-1 text-sm text-muted">
                Logged in as{" "}
                <span className="font-medium text-ink">{sessionEmail}</span>.
                Choose a strong password you'll remember.
              </p>
            </div>

            {pwError && (
              <Alert
                type="error"
                showIcon
                message={pwError}
                className="rounded-xl"
              />
            )}

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Full name</span>
              <Input
                placeholder="Nguyen Van A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">New password</span>
              <Input.Password
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {/* Strength indicator */}
              {newPassword.length > 0 && (
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength =
                      newPassword.length >= 12 &&
                      /[^a-zA-Z0-9]/.test(newPassword)
                        ? 4
                        : newPassword.length >= 10
                          ? 3
                          : newPassword.length >= 8
                            ? 2
                            : 1;
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= strength
                            ? strength === 4
                              ? "bg-green-500"
                              : strength === 3
                                ? "bg-blue-500"
                                : strength === 2
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                            : "bg-slate-100"
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Confirm new password</span>
              <Input.Password
                autoComplete="new-password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
              />
            </label>

            <BaseButton
              type="primary"
              className="w-full"
              onClick={handleSetPassword}
              loading={saving}
              disabled={saving}>
              {saving ? "Saving..." : "Activate account"}
            </BaseButton>
          </Card>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <Card className="space-y-4 p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-7 w-7 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Account activated!</h2>
              <p className="mt-1 text-sm text-muted">
                Your account is ready. Log in with your new password to get
                started.
              </p>
            </div>
            <Link to="/login">
              <BaseButton type="primary" className="w-full">
                Go to login
              </BaseButton>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InviteAccept;
