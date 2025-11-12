"use client";

import * as React from "react";
import { useRouter } from 'next/navigation';
import {
    AreaChart,
    Area,
    XAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChartAreaInteractive() {
    const router = useRouter();
    const [timeRange, setTimeRange] = React.useState("90d");
    const [userData, setUserData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/visitors', {
                    credentials: 'include' // Important for sending cookies with the request
                });
                
                if (response.status === 401) {
                    // Handle unauthorized (user not logged in)
                    setUserData([]);
                    return;
                }
                
                if (!response.ok) {
                    throw new Error('Failed to fetch chart data');
                }
                
                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
                toast.error('Failed to load chart data');
                setUserData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/visitors', {
                    credentials: 'include' // Important for sending cookies with the request
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                }
            } catch (error) {
                console.error('Error refreshing chart data:', error);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    

    // Format the data for the chart
    const formatChartData = (data) => {
      return data.map(item => ({
        date: new Date(item.date).toISOString().split('T')[0], // Ensure consistent date format
        desktop: Number(item.desktop),
        mobile: Number(item.mobile)
      }));
    };

    // Format and sort the data
    const formattedData = userData.length ? formatChartData(userData) : [];
    formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const rangeMap = { "90d": 90, "30d": 30, "7d": 7 };
    const filteredData = formattedData.slice(-rangeMap[timeRange]);

    // Format date based on time range
    const formatMonth = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid date
            
            return date.toLocaleString("en-US", { 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return dateString; // Return original string if there's an error
        }
    };


        // Compute Y axis break-points (ticks)
    const yValues = filteredData.flatMap((d) => [
      Number(d.desktop) || 0, 
      Number(d.mobile) || 0
    ]);
    
    const maxValue = yValues.length > 0 ? Math.max(...yValues, 0) : 100;
    const minValue = yValues.length > 0 ? Math.min(...yValues, 0) : 0;

    // Always start from 0 for visitor counts
    const minTick = 0;
    const desiredTicks = 5;
    
    // Calculate nice steps for the Y axis
    const range = maxValue - minTick;
    const step = range / (desiredTicks - 1);
    
    // Round to nearest 10, 50, 100, etc. for cleaner ticks
    const power = Math.pow(10, Math.floor(Math.log10(step)));
    const roundedStep = Math.ceil(step / power) * power;
    
    const maxTick = Math.ceil(maxValue / roundedStep) * roundedStep;
    const ticks = [];
    
    for (let v = minTick; v <= maxTick + roundedStep; v += roundedStep) {
        ticks.push(v);
    }

    const hasData = filteredData.length > 0;

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between py-5 px-6">
                <div className="mb-3">
                    <CardTitle className="text-xl font-medium mb-2">Total Visitors</CardTitle>
                    <p className="text-lg text-gray-500 font-normal">
                        {hasData 
                            ? timeRange === "90d"
                                ? "Total for the last 3 months"
                                : timeRange === "30d"
                                ? "Total for the last 30 days"
                                : "Total for the last 7 days"
                            : "No data available"}
                    </p>
                </div>

                {hasData && (
                    <div className="flex items-center mt-3 sm:mt-0 border border-gray-300 rounded-md overflow-hidden">
                        {[
                            { label: "Last 3 months", value: "90d" },
                            { label: "Last 30 days", value: "30d" },
                            { label: "Last 7 days", value: "7d" },
                        ].map((option, index) => (
                            <Button
                                key={option.value}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "text-lg font-medium px-4 py-2 h-auto rounded-none transition-all duration-150 border-0",
                                    timeRange === option.value
                                        ? "bg-gray-100 text-black"
                                        : "bg-white hover:bg-gray-50 text-black",
                                    index !== 2 && "border-r border-gray-300"
                                )}
                                onClick={() => setTimeRange(option.value)}
                            >
                                {option.label}
                            </Button>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="h-[320px] relative flex items-center justify-center">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart 
                            data={filteredData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray=""
                                horizontal={true}
                                vertical={false}
                                stroke="#eae9e9ff"
                                z-index={-1}
                            />
                        <defs>
                            <linearGradient id="colorDesktop" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#000" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#000" stopOpacity={0.04} />
                            </linearGradient>
                            <linearGradient id="colorMobile" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#555" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#555" stopOpacity={0.04} />
                            </linearGradient>
                            </defs>

                            <XAxis
                                dataKey="date"
                                tickFormatter={formatMonth}
                                tick={{ fontSize: 10, fill: "#666" }}
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                minTickGap={1}
                                tickMargin={5}
                                height={40}
                                ticks={
                                    timeRange === '90d' 
                                        ? filteredData.filter((_, i) => i % 6 === 0).map(d => d.date)
                                        : timeRange === '30d'
                                            ? filteredData.filter((_, i) => i % 2 === 1).map(d => d.date)
                                            : filteredData.map(d => d.date)
                                }
                                padding={{ left: 15, right: 15 }}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                                <p className="text-sm font-medium text-gray-700 mb-2">
                                                    {new Date(label).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric"
                                                    })}
                                                </p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-black mr-2"></div>
                                                        <span className="text-sm text-gray-600">Desktop: </span>
                                                        <span className="text-sm font-medium ml-1">{payload[0].value}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                                        <span className="text-sm text-gray-600">Mobile: </span>
                                                        <span className="text-sm font-medium ml-1">{payload[1].value}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />

                            <Area
                                type="monotone"
                                dataKey="desktop"
                                stroke="#000"
                                fill="url(#colorDesktop)"
                                name="Desktop"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="mobile"
                                stroke="#555"
                                fill="url(#colorMobile)"
                                name="Mobile"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center p-4">
                        <p className="text-gray-500 mb-4">No data available. Start adding data points to see the chart.</p>
                        <Button 
                            variant="outline"
                            className="bg-black text-white hover:bg-gray-800"
                            onClick={() => {
                                router.push('/chart-data');
                            }}
                        >
                            Add Data Points
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
