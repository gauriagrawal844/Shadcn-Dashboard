"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function VerifyOtpPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const next = searchParams.get("next");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  // Handle resend OTP
  const handleResendOtp = async () => {
    setErr("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to resend OTP.");

      setSuccess("A new OTP has been sent to your email.");
    } catch (error) {
      console.error("Error resending OTP:", error);
      setErr(error.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Verify OTP
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!otp) return setErr("OTP required");
    if (otp.length !== 6) return setErr("Please enter a 6-digit OTP");

    setErr("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Store JWT token in both localStorage and ensure it's set in cookies
      if (data.token) {
        localStorage.setItem("token", data.token);
        // The token should also be set in an HTTP-only cookie by the API
      }

      setSuccess("✅ OTP verified successfully! Redirecting to your dashboard...");
      setRedirecting(true);

      // ⏳ Redirect after short delay (for UX)
      setTimeout(() => {
        const dest = next && next.startsWith("/") ? next : "/dashboard";
        router.push(dest);
      }, 2000);
    } catch (error) {
      console.error("Verification error:", error);
      setErr(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>We sent a 6-digit code to your email.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="otp">Verification code</FieldLabel>

                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={(val) => setOtp(val)}
                  required
                >
                  <InputOTPGroup className="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
                {success && <p className="text-green-600 text-sm mt-2">{success}</p>}

                <FieldDescription>Enter the 6-digit code sent to {email}.</FieldDescription>
              </Field>

              <FieldGroup className="mt-4">
                <Button
                  type="submit"
                  disabled={loading || redirecting}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className={`text-sm font-medium text-primary hover:underline focus:outline-none ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Sending..." : "Resend OTP"}
                  </button>
                </div>
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
  );
}
