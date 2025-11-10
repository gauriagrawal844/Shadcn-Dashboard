"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpRight, ArrowDownRight, Save } from "lucide-react";
import { useRouter } from "next/navigation";

// Custom Icon that visually represents the mini-chart in the image
// This component now chooses between the 'Trending Up' path (default) and the 'Trending Down' path
const TrendChartIcon = ({ className, isPositive }) => {
  // Icon path for trending up (based on Lucide's trending-up path)
  const TrendingUpPath = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  );

  // Icon path for trending down (based on Lucide's trending-down path, ensuring the downturn is clearly visible)
  const TrendingDownPath = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
      <polyline points="17 18 23 18 23 12"></polyline>
    </svg>
  );

  return isPositive ? TrendingUpPath : TrendingDownPath;
};

// Helper to format numbers for display
const formatNumber = (num, heading, isChangePercent = false) => {
  if (num === null || num === undefined) return "0";

  // For change percentages in all cards (including Total Revenue)
  if (isChangePercent) {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(num) + "%"
    );
  }

  // For Total Revenue card's main value
  if (heading === "Total Revenue") {
    return new Intl.NumberFormat("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num).replace(/^/, "$");
  }

  // For other cards' main values
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
};

export default function UpdateCardsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [cards, setCards] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});

  // Fetch all cards
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
      } finally {
        setIsLoading(false);
      }
    }
    fetchCards();
  }, []);

  // Handle changes in any input field
  const handleChange = (id, field, value) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id === id) {
          if (field === "currentValue") {
            const isStartingEdit = card.isEditingCurrent !== true;
            return {
              ...card,
              currentValue: value,
              previousValue: isStartingEdit
                ? card.currentValue
                : card.previousValue,
              isEditingCurrent: true,
            };
          }
          return { ...card, [field]: value };
        }
        return card;
      })
    );
  };

  // Save updated card
  const handleSave = async (card, index) => {
    setIsSaving((prev) => ({ ...prev, [card.id]: true }));

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
          id: card.id,
          heading: card.heading,
          currentValue: Number(card.currentValue) || 0,
          previousValue: Number(card.previousValue) || 0,
          description: card.description || "",
          note: card.note || "",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Failed to update ${card.heading}`);

      setSaveStatus((prev) => ({
        ...prev,
        [card.id]: { success: true, message: `${card.heading} updated successfully!` },
      }));

      // Reset edit flag after save
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, isEditingCurrent: false } : c
        )
      );

      // Clear message after 3s
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [card.id]: null }));
      }, 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus((prev) => ({
        ...prev,
        [card.id]: { success: false, message: err.message },
      }));
    } finally {
      setIsSaving((prev) => ({ ...prev, [card.id]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Update Cards</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>

      {cards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => {
            const isPositive =
              card.previousValue !== 0 &&
              card.currentValue - card.previousValue >= 0;
            const changePercent = card.previousValue
              ? ((card.currentValue - card.previousValue) / card.previousValue) * 100
              : 0;

            return (
              <div
                key={card.id}
                className="w-full p-6 bg-gradient-to-br from-white to-gray-100 rounded-xl border border-gray-200 shadow-sm"
              >
                {/* Title + Change badge */}
                <div className="flex justify-between items-center pb-2">
                  <span className="text-base text-gray-500 font-medium">
                    {card.heading}
                  </span>
                  <div className="flex items-center space-x-1 bg-transparent text-gray-800 text-sm font-medium px-2 py-1 rounded-full border border-gray-300">
                    <TrendChartIcon className={`w-4 h-4 ${isPositive ? 'text-green-500' : 'text-red-500'}`} isPositive={isPositive} />
                    <span className="text-xs">
                      {changePercent > 0 ? "+" : ""}
                      {formatNumber(changePercent, card.heading, true)}
                    </span>
                  </div>
                </div>

                {/* Main value */}
                <div className="mt-4 text-3xl font-medium text-gray-900">
                  {formatNumber(card.currentValue, card.heading)}
                </div>

                {/* Editable fields */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Update Value
                    </label>
                    <Input
                      type="number"
                      value={card.currentValue}
                      onChange={(e) =>
                        handleChange(card.id, "currentValue", e.target.value)
                      }
                      className="w-full"
                      placeholder="Enter new value"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Description
                    </label>
                    <Input
                      value={card.description || ""}
                      onChange={(e) =>
                        handleChange(card.id, "description", e.target.value)
                      }
                      className="w-full"
                      placeholder="Enter description"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">
                      Note
                    </label>
                    <Input
                      value={card.note || ""}
                      onChange={(e) =>
                        handleChange(card.id, "note", e.target.value)
                      }
                      className="w-full"
                      placeholder="Add a note"
                    />
                  </div>

                  {/* Save button */}
                  <div className="mt-4">
                    <Button
                      onClick={() => handleSave(card)}
                      className="w-full flex items-center justify-center gap-2"
                      disabled={isSaving[card.id]}
                    >
                      {isSaving[card.id] ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>

                    {saveStatus[card.id] && (
                      <p
                        className={`mt-2 text-sm text-center ${
                          saveStatus[card.id].success
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {saveStatus[card.id].message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <p className="text-sm text-gray-600">No cards available.</p>
        </div>
      )}
    </div>
  );
}
