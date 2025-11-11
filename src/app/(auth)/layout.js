'use client';

export default function AuthLayout({ children }) {
  // This layout doesn't include the dashboard sidebar or navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
