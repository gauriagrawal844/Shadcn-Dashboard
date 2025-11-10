"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ManageCardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    heading: "",
    currentValue: "",
    previousValue: "",
    description: "",
    note: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");

      const res = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          currentValue: Number(data.currentValue) || 0,
          previousValue: Number(data.previousValue) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save card");

      alert(json.message);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Card</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Select Card *</label>
          <select
            name="heading"
            value={data.heading}
            onChange={handleChange}
            required
            className="w-full border rounded-md p-2"
          >
            <option value="">Select a card</option>
            <option value="Total Revenue">Total Revenue (Card 1)</option>
            <option value="New Customers">New Customers (Card 2)</option>
            <option value="Active Accounts">Active Accounts (Card 3)</option>
            <option value="Growth Rate">Growth Rate (Card 4)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Current Value</label>
          <Input
            name="currentValue"
            value={data.currentValue}
            onChange={handleChange}
            placeholder="e.g. 1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Previous Value</label>
          <Input
            name="previousValue"
            value={data.previousValue}
            onChange={handleChange}
            placeholder="e.g. 800"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input
            name="description"
            value={data.description}
            onChange={handleChange}
            placeholder="Short description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note</label>
          <Input
            name="note"
            value={data.note}
            onChange={handleChange}
            placeholder="Any notes"
          />
        </div>

        <Button type="submit" className="w-full mt-4" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Card"}
        </Button>
      </form>
    </div>
  );
}
