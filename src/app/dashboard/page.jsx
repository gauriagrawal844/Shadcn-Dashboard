"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Plus, Table, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ChartAreaInteractive from "@/components/chart";
import TableInfo from "@/components/table-info";
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check authentication status
  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return false;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (!response.ok || !data.isAuthenticated) {
        localStorage.removeItem('token');
        router.push('/login');
        return false;
      }

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
      return false;
    }
  };

  const fetchCards = async () => {
    if (!await checkAuth()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch("/api/cards", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // If unauthorized, redirect to login
          router.push('/login');
          return;
        }
        throw new Error("Failed to fetch cards");
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        setCards(data);
      }
    } catch (error) {
      console.error("Error fetching cards:", error);
      setError(error.message);
      toast.error(error.message || 'Failed to load dashboard data');

      // If it's an auth error, redirect to login
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (isAuth) {
        await fetchCards();
      }
    };

    init();
  }, [router]);

  const formatNumber = (num, heading, isChangePercent = false) => {
    if (num === null || num === undefined) return '0';

    // For change percentages in all cards (including Total Revenue)
    if (isChangePercent) {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(num) + '%';
    }

    // For Total Revenue card's main value
    if (heading === 'Total Revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num).replace(/^/, '$');
    }

    // For Growth Rate card - format as percentage with 1 decimal place
    if (heading === 'Growth Rate') {
      return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(num) + '%';
    }

    // For other cards' main values
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  };

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

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dashboard data...</p>
          <div className="bg-white rounded-xl p-6 shadow-xl animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
          </div>
          
        </div>
      </div>

    );
  }

  if (error) {
    return (
      <div className="min-h-screen  flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading dashboard</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCards}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-10xl mb-8">

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cards.map((card) => {
              const isPositive = card.changePercent >= 0;

              return (
                // Custom Card UI: Soft gradient, strong shadow, and rounded corners
                <div
                  key={card.id}
                  className="w-full p-6 bg-gradient-to-br from-white to-gray-100 rounded-xl border-1 border-gray-300 cursor-pointer"
                >

                  {/* 1. Top Row: Title and Change Badge */}
                  <div className="flex justify-between items-center pb-2">
                    {/* Title (Total Revenue) */}
                    <span className="text-base text-gray-500 font-medium">
                      {card.heading}
                    </span>

                    {/* Change Badge (+12.5%) - Uses static gray colors and border */}
                    <div className={`flex items-center space-x-1 bg-transparent text-gray-800 text-sm font-medium px-2 py-1 rounded-full border border-gray-300`}>
                      {/* TrendChartIcon handles the up/down orientation */}
                      <TrendChartIcon className="w-4 h-4" isPositive={isPositive} />
                      <span className="text-xs">
                        {card.changePercent > 0 ? '+' : ''}
                        {formatNumber(card.changePercent, card.heading, true)}
                      </span>
                    </div>
                  </div>

                  {/* 2. Main Value Content */}
                  <div className="mt-4">
                    {/* Value ($1,250.00) - Large, extra-bold font for prominence */}
                    <span className="text-4xl font-medium text-gray-900 leading-none">
                      {formatNumber(card.currentValue, card.heading)}
                    </span>
                  </div>

                  {/* 3. Description / Trending Text */}
                  {card.description && (
                    <div className="mt-8 flex items-center space-x-1">
                      {/* Trending up this month - bold text */}
                      <span className="text-base font-semibold text-gray-800">
                        {card.description}
                      </span>
                      {/* Icon for trending indicator is now correctly oriented based on isPositive */}
                      <TrendChartIcon className="w-4 h-4 text-gray-800" isPositive={isPositive} />
                    </div>
                  )}

                  {/* 4. Secondary Context Text / Note */}
                  {card.note && (
                    <div className="mt-1">
                      {/* Visitors for the last 6 months - smaller, gray text */}
                      <span className="text-sm text-gray-500">
                        {card.note}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cards yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new card.</p>
          </div>
        )}
      </div>
      {/* External components were commented out due to resolution issues */}
      <ChartAreaInteractive />
      <TableInfo />
    </div>

  );
}