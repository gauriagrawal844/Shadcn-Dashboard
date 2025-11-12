"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, Plus, Table, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import ChartAreaInteractive from "@/components/chart";
import TableInfo from "@/components/table-info";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

export default function DashboardPage() {
  const router = useRouter();
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  
  // Always show 4 card slots, empty or filled
  const cardSlots = Array(4).fill(null).map((_, index) => ({
    ...(cards[index] || { id: `empty-${index}`, isEmpty: true })
  }));

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
    console.log('Fetching cards...');
    if (!await checkAuth()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.push('/login');
        return;
      }

      // Get user ID from token (client-side decoding)
      const decoded = jwtDecode(token);
      if (!decoded?.id) {
        console.error('Invalid token: Missing user ID');
        throw new Error('Invalid token: Missing user ID');
      }
      
      console.log('Fetching cards for user ID:', decoded.id);
      const response = await fetch(`/api/cards?userId=${decoded.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Error response from API:', error);
        throw new Error(error.message || 'Failed to fetch cards');
      }

      const data = await response.json();
      console.log('Fetched cards data:', data);
      
      if (Array.isArray(data)) {
        // Ensure we only keep the first 4 cards if there are somehow more
        const validCards = data.slice(0, 4);
        console.log('Setting cards state with:', validCards);
        setCards(validCards);
      } else {
        console.log('Invalid cards data, setting empty array');
        setCards([]);
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

  // Memoize fetchCards to prevent unnecessary re-renders
  const memoizedFetchCards = useCallback(() => {
    console.log('Fetching cards...');
    fetchCards();
  }, []);
  
  // Debug: Log cards state changes
  useEffect(() => {
    console.log('Current cards state:', cards);
    console.log('Cards count:', cards.length);
    console.log('Should show button:', cards.length < 4);
  }, [cards]);

  useEffect(() => {
    const init = async () => {
      console.log('Initial cards fetch');
      await fetchCards();
    };
    
    init();
    
    // Set up an interval to refresh cards periodically
    const intervalId = setInterval(() => {
      console.log('Refreshing cards...');
      fetchCards();
    }, 30000); // Refresh every 30 seconds
    
    // Clean up the interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [memoizedFetchCards]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cardSlots.map((card, index) => {
            if (card.isEmpty) {
              return (
                <div 
                  key={card.id} 
                  className="w-full p-6 bg-white rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push('/createCard')}
                >
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-3">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-sm font-medium text-gray-500">Add Card</h3>
                    <p className="mt-1 text-xs text-gray-400">Click to create a new card</p>
                  </div>
                </div>
              );
            }

            const isPositive = card.changePercent >= 0;
            
            return (
              <div
                key={card.id}
                className="w-full p-6 bg-white rounded-xl border border-gray-200  bg-gradient-to-br from-white to-gray-100 "
              >
                {/* 1. Top Row: Title and Change Badge */}
                <div className="flex justify-between items-center pb-2">
                  {/* Title (Total Revenue) */}
                  <span className="text-base text-gray-500 font-medium">
                    {card.heading}
                  </span>

                  {/* Change Badge */}
                  <div className="flex items-center space-x-1 bg-transparent text-gray-500 text-sm font-medium px-2 py-1 rounded-full border border-gray-300">
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
        
      </div>
      {/* External components were commented out due to resolution issues */}
      <ChartAreaInteractive />
      <TableInfo />
    </div>

  );
}