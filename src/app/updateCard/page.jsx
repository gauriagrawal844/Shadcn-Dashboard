"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ManageCardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cards, setCards] = useState([]);
  const [data, setData] = useState({
    heading: "",
    currentValue: "",
    previousValue: "",
    description: "",
    note: "",
  });

  // Fetch all cards on mount
  useEffect(() => {
    async function fetchCards() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/cards", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const allCards = await res.json();
          setCards(allCards);
        }
      } catch (err) {
        console.error("Error fetching cards:", err);
      }
    }
    fetchCards();
  }, []);

  // Auto-fill when heading selected
  useEffect(() => {
    if (data.heading && cards.length > 0) {
      const selected = cards.find((c) => c.heading === data.heading);
      if (selected) {
        setData({
          heading: selected.heading,
          currentValue: selected.currentValue || "",
          previousValue: selected.previousValue || "",
          description: selected.description || "",
          note: selected.note || "",
        });
      }
    }
  }, [data.heading, cards]);

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
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          heading: data.heading,
          currentValue: Number(data.currentValue) || 0,
          previousValue: Number(data.previousValue) || 0,
          description: data.description,
          note: data.note,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update card");

      alert(json.message || "Card updated successfully!");
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
            {cards.map((card) => (
              <option key={card.id} value={card.heading}>
                {card.heading}
              </option>
            ))}
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

