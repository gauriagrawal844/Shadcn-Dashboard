"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

const VALID_HEADINGS = [
  "Total Revenue",
  "New Customers",
  "Active Accounts",
  "Growth Rate"
];

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

  // Check if we're in the browser before accessing localStorage
  const [isClient, setIsClient] = useState(false);
  const [usedHeadings, setUsedHeadings] = useState([]);
  const [isLoadingHeadings, setIsLoadingHeadings] = useState(true);

  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch('/api/cards', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const cards = await response.json();
          // Extract used headings from the user's cards
          const used = cards.map(card => card.heading);
          setUsedHeadings(used);
        }
      } catch (error) {
        console.error('Error fetching user cards:', error);
      } finally {
        setIsLoadingHeadings(false);
        setIsClient(true);
      }
    };

    fetchUserCards();
  }, [router]);

  // Get available headings that haven't been used yet
  const availableHeadings = VALID_HEADINGS.filter(
    heading => !usedHeadings.includes(heading)
  );

  // If the current selection is no longer available, clear it
  useEffect(() => {
    if (data.heading && !availableHeadings.includes(data.heading)) {
      setData(prev => ({ ...prev, heading: '' }));
    }
  }, [availableHeadings, data.heading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Only access localStorage when in the browser
      if (typeof window === 'undefined') {
        throw new Error("Cannot access localStorage on server");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Validate required fields
      if (!data.heading) {
        throw new Error("Please select a card type");
      }

      const response = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          currentValue: Number(data.currentValue) || 0,
          previousValue: Number(data.previousValue) || 0,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to save card");
      }

      toast.success("Card created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating card:", error);
      toast.error(error.message || "Failed to create card");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create Card</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Card Type
          </label>
          {isLoadingHeadings ? (
            <div className="w-full p-2 border rounded-md bg-gray-100 animate-pulse">
              Loading available card types...
            </div>
          ) : availableHeadings.length === 0 ? (
            <div className="p-4 text-center text-gray-500 bg-yellow-50 rounded-md">
              You've already created all available card types.
            </div>
          ) : (
            <select
              name="heading"
              value={data.heading}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
              disabled={availableHeadings.length === 0}
            >
              <option value="">
                {availableHeadings.length === 0 
                  ? 'No card types available' 
                  : 'Select a card type'}
              </option>
              {availableHeadings.map(heading => (
                <option key={heading} value={heading}>
                  {heading}
                </option>
              ))}
            </select>
          )}
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
