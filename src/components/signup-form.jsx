"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/components/ui/input";

export function SignupForm(props) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");
  const router = useRouter();

  // ✅ handle input change properly
  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "email") {
      setEmailVerified(false);
      setOtp("");
      setOtpSent(false);
      setVerifyMsg("");
    }
  };

  const validate = () => {
    if (!form.name || !form.email) return "Name & email are required";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      return "Phone must be 10 digits if provided";
    return null;
  };

  const sendSignupOtp = async () => {
    setErr("");
    setVerifyMsg("");
    if (!form.email) return setErr("Enter email first");
    setVerifying(true);
    try {
      const res = await fetch("/api/send-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setVerifyMsg("OTP sent to your email");
    } catch (e) {
      setErr(e.message);
    } finally {
      setVerifying(false);
    }
  };

  const verifySignupOtp = async () => {
    setErr("");
    setVerifyMsg("");
    if (!otp) return setErr("Enter OTP to verify email");
    try {
      const res = await fetch("/api/verify-signup-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify OTP");
      setEmailVerified(true);
      setVerifyMsg("Email verified successfully");
    } catch (e) {
      setErr(e.message);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    const v = validate();
    if (v) return setErr(v);
    if (!emailVerified) return setErr("Verify your email first");

    setLoading(true);
    try {
      // First, create the user account
      const signupRes = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: 'include' // Important for cookies
      });
      
      const data = await signupRes.json();
      
      if (!signupRes.ok) {
        throw new Error(data.error || "Signup failed");
      }
      
      // Store the token in localStorage for client-side auth
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            {/* Name */}
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                value={form.name}
                onChange={onChange}
                required
              />
            </Field>

            {/* Email + OTP */}
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={sendSignupOtp}
                  disabled={emailVerified || verifying}
                  className="shrink-0"
                >
                  {verifying ? "Sending..." : emailVerified ? "Verified" : "Verify Email"}
                </Button>
              </div>

              {otpSent && !emailVerified && (
                <div className="mt-2 flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={verifySignupOtp}>
                    Verify OTP
                  </Button>
                </div>
              )}
              {verifyMsg && (
                <p className="text-green-600 text-sm mt-1">{verifyMsg}</p>
              )}
            </Field>

            {/* Phone */}
            <Field>
              <FieldLabel htmlFor="phone">Phone (Optional)</FieldLabel>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="9999999999"
                value={form.phone}
                onChange={onChange}
              />
            </Field>

            {/* Error message */}
            {err && <p className="text-red-600 text-sm mt-2">{err}</p>}

            {/* Buttons */}
            <Field>
              <div className="space-y-3 mt-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <p className="text-center text-sm">
                  Already have an account?{" "}
                  <a href="/login" className="text-gray-600 underline">
                    Sign in
                  </a>
                </p>
              </div>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
