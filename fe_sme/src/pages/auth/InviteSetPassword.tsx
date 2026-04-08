import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Card, Alert, Input } from "antd";
import BaseButton from "@/components/button";
import { apiInviteSetPassword } from "@/api/identity/identity.api";

const passwordStrength = (pw: string): 1 | 2 | 3 | 4 => {
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return 4;
  if (pw.length >= 10) return 3;
  if (pw.length >= 8) return 2;
  return 1;
};

const InviteSetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await apiInviteSetPassword(token!, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to set password. The link may have expired. Please contact your HR team.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-ink">SME Onboard</h1>
          <p className="mt-1 text-sm text-muted">Activate your account</p>
        </div>

        {!token ? (
          <Card className="space-y-4 p-6">
            <Alert
              type="error"
              showIcon
              message="Invalid invite link"
              description="The invite link is missing or invalid. Please contact your HR team for a new invite."
              className="rounded-xl"
            />
            <Link to="/login">
              <BaseButton type="primary" className="w-full">
                Go to login
              </BaseButton>
            </Link>
          </Card>
        ) : done ? (
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
                Your password has been set. Log in to get started.
              </p>
            </div>
            <Link to="/login">
              <BaseButton type="primary" className="w-full">
                Go to login
              </BaseButton>
            </Link>
          </Card>
        ) : (
          <Card className="space-y-5 p-6">
            <div>
              <h2 className="text-lg font-semibold">Set your password</h2>
              <p className="mt-1 text-sm text-muted">
                Choose a strong password to activate your account.
              </p>
            </div>

            {error && (
              <Alert
                type="error"
                showIcon
                message={error}
                className="rounded-xl"
              />
            )}

            <label className="grid gap-1 text-sm">
              <span className="font-medium">New password</span>
              <Input.Password
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {password.length > 0 && (
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength = passwordStrength(password);
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
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
            </label>

            <BaseButton
              type="primary"
              className="w-full"
              onClick={handleSubmit}
              loading={saving}
              disabled={saving}>
              {saving ? "Activating..." : "Activate account"}
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
      </div>
    </div>
  );
};

export default InviteSetPassword;
