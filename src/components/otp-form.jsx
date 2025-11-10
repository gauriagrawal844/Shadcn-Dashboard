"use client";
import { useState } from "react";
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
  const [isVerified, setIsVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    setErr("");
    setLoading(true);
    
    try {
      const res = await fetch("/api/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resend OTP");
      
      // Start cooldown timer (60 seconds)
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      
      setSuccess("New OTP has been sent to your email");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

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

      setIsVerified(true);
      setSuccess("OTP verified successfully! Redirecting...");
      
      // Store token and redirect after a short delay
      localStorage.setItem("token", data.token);
      setTimeout(() => {
        const dest = next && next.startsWith("/") ? next : "/dashboard";
        router.push(dest);
      }, 1500);
      
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card>
        <CardHeader>
          <CardTitle>
            Enter verification code
          </CardTitle>
          <CardDescription >
            We sent a 6-digit code to your email.
          </CardDescription>
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
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                {err && (
                  <p className="text-red-600 text-sm mt-1">{err}</p>
                )}

                <FieldDescription>
                  Enter the 6-digit code sent to {email}.
                </FieldDescription>
                {success && (
                  <p className="text-green-600 text-sm mt-2">{success}</p>
                )}
              </Field>

              <FieldGroup>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
               <FieldDescription className="text-center">
                  {resendCooldown > 0 ? (
                    <span>Resend OTP in {resendCooldown}s</span>
                  ) : (
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:underline focus:outline-none"
                      disabled={loading || isVerified}
                    >
                      Resend OTP
                    </button>
                  )}
                </FieldDescription> 
              </FieldGroup>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
  );
}
