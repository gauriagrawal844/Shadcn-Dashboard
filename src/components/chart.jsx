"use client";

import * as React from "react";
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
    const [timeRange, setTimeRange] = React.useState("90d");
    const [userData, setUserData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user data from API
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/visitors');
                if (!response.ok) throw new Error('Failed to fetch chart data');
                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error('Error fetching chart data:', error);
                toast.error('Failed to load chart data');
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
                const response = await fetch('/api/visitors');
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

    

    // Default chart data
    const defaultData = [
        { date: "2024-04-01", desktop: 222, mobile: 150 },
        { date: "2024-04-02", desktop: 97, mobile: 180 },
        { date: "2024-04-03", desktop: 167, mobile: 120 },
        { date: "2024-04-04", desktop: 242, mobile: 260 },
        { date: "2024-04-05", desktop: 373, mobile: 290 },
        { date: "2024-04-06", desktop: 301, mobile: 340 },
        { date: "2024-04-07", desktop: 245, mobile: 180 },
        { date: "2024-04-08", desktop: 409, mobile: 320 },
        { date: "2024-04-09", desktop: 59, mobile: 110 },
        { date: "2024-04-10", desktop: 261, mobile: 190 },
        { date: "2024-04-11", desktop: 327, mobile: 350 },
        { date: "2024-04-12", desktop: 292, mobile: 210 },
        { date: "2024-04-13", desktop: 342, mobile: 380 },
        { date: "2024-04-14", desktop: 137, mobile: 220 },
        { date: "2024-04-15", desktop: 120, mobile: 170 },
        { date: "2024-04-16", desktop: 138, mobile: 190 },
        { date: "2024-04-17", desktop: 446, mobile: 360 },
        { date: "2024-04-18", desktop: 364, mobile: 410 },
        { date: "2024-04-19", desktop: 243, mobile: 180 },
        { date: "2024-04-20", desktop: 89, mobile: 150 },
        { date: "2024-04-21", desktop: 137, mobile: 200 },
        { date: "2024-04-22", desktop: 224, mobile: 170 },
        { date: "2024-04-23", desktop: 138, mobile: 230 },
        { date: "2024-04-24", desktop: 387, mobile: 290 },
        { date: "2024-04-25", desktop: 215, mobile: 250 },
        { date: "2024-04-26", desktop: 75, mobile: 130 },
        { date: "2024-04-27", desktop: 383, mobile: 420 },
        { date: "2024-04-28", desktop: 122, mobile: 180 },
        { date: "2024-04-29", desktop: 315, mobile: 240 },
        { date: "2024-04-30", desktop: 454, mobile: 380 },
        { date: "2024-05-01", desktop: 165, mobile: 220 },
        { date: "2024-05-02", desktop: 293, mobile: 310 },
        { date: "2024-05-03", desktop: 247, mobile: 190 },
        { date: "2024-05-04", desktop: 385, mobile: 420 },
        { date: "2024-05-05", desktop: 481, mobile: 390 },
        { date: "2024-05-06", desktop: 498, mobile: 520 },
        { date: "2024-05-07", desktop: 388, mobile: 300 },
        { date: "2024-05-08", desktop: 149, mobile: 210 },
        { date: "2024-05-09", desktop: 227, mobile: 180 },
        { date: "2024-05-10", desktop: 293, mobile: 330 },
        { date: "2024-05-11", desktop: 335, mobile: 270 },
        { date: "2024-05-12", desktop: 197, mobile: 240 },
        { date: "2024-05-13", desktop: 197, mobile: 160 },
        { date: "2024-05-14", desktop: 448, mobile: 490 },
        { date: "2024-05-15", desktop: 473, mobile: 380 },
        { date: "2024-05-16", desktop: 338, mobile: 400 },
        { date: "2024-05-17", desktop: 499, mobile: 420 },
        { date: "2024-05-18", desktop: 315, mobile: 350 },
        { date: "2024-05-19", desktop: 235, mobile: 180 },
        { date: "2024-05-20", desktop: 177, mobile: 230 },
        { date: "2024-05-21", desktop: 82, mobile: 140 },
        { date: "2024-05-22", desktop: 81, mobile: 120 },
        { date: "2024-05-23", desktop: 252, mobile: 290 },
        { date: "2024-05-24", desktop: 294, mobile: 220 },
        { date: "2024-05-25", desktop: 201, mobile: 250 },
        { date: "2024-05-26", desktop: 213, mobile: 170 },
        { date: "2024-05-27", desktop: 420, mobile: 460 },
        { date: "2024-05-28", desktop: 233, mobile: 190 },
        { date: "2024-05-29", desktop: 78, mobile: 130 },
        { date: "2024-05-30", desktop: 340, mobile: 280 },
        { date: "2024-05-31", desktop: 178, mobile: 230 },
        { date: "2024-06-01", desktop: 178, mobile: 200 },
        { date: "2024-06-02", desktop: 470, mobile: 410 },
        { date: "2024-06-03", desktop: 103, mobile: 160 },
        { date: "2024-06-04", desktop: 439, mobile: 380 },
        { date: "2024-06-05", desktop: 88, mobile: 140 },
        { date: "2024-06-06", desktop: 294, mobile: 250 },
        { date: "2024-06-07", desktop: 323, mobile: 370 },
        { date: "2024-06-08", desktop: 385, mobile: 320 },
        { date: "2024-06-09", desktop: 438, mobile: 480 },
        { date: "2024-06-10", desktop: 155, mobile: 200 },
        { date: "2024-06-11", desktop: 92, mobile: 150 },
        { date: "2024-06-12", desktop: 492, mobile: 420 },
        { date: "2024-06-13", desktop: 81, mobile: 130 },
        { date: "2024-06-14", desktop: 426, mobile: 380 },
        { date: "2024-06-15", desktop: 307, mobile: 350 },
        { date: "2024-06-16", desktop: 371, mobile: 310 },
        { date: "2024-06-17", desktop: 475, mobile: 520 },
        { date: "2024-06-18", desktop: 107, mobile: 170 },
        { date: "2024-06-19", desktop: 341, mobile: 290 },
        { date: "2024-06-20", desktop: 408, mobile: 450 },
        { date: "2024-06-21", desktop: 169, mobile: 210 },
        { date: "2024-06-22", desktop: 317, mobile: 270 },
        { date: "2024-06-23", desktop: 480, mobile: 530 },
        { date: "2024-06-24", desktop: 132, mobile: 180 },
        { date: "2024-06-25", desktop: 141, mobile: 190 },
        { date: "2024-06-26", desktop: 434, mobile: 380 },
        { date: "2024-06-27", desktop: 448, mobile: 490 },
        { date: "2024-06-28", desktop: 149, mobile: 200 },
        { date: "2024-06-29", desktop: 103, mobile: 160 },
        { date: "2024-06-30", desktop: 446, mobile: 400 },
    ];

    // Format the data for the chart
    const formatChartData = (data) => {
      return data.map(item => ({
        date: new Date(item.date).toISOString().split('T')[0], // Ensure consistent date format
        desktop: Number(item.desktop),
        mobile: Number(item.mobile)
      }));
    };

    // Use user data from API, fallback to default data if loading
    const combinedData = isLoading || !userData.length ? defaultData : formatChartData(userData);
    
    // Sort by date
    combinedData.sort((a, b) => new Date(a.date) - new Date(b.date));

    const rangeMap = { "90d": 90, "30d": 30, "7d": 7 };
    const filteredData = combinedData.slice(-rangeMap[timeRange]);

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

    return (
        <Card>
           <CardHeader className="flex flex-col sm:flex-row items-center justify-between py-5 px-6">
        <div className="mb-3">
          <CardTitle className="text-xl font-medium mb-2">Total Visitors</CardTitle>
          <p className="text-lg text-gray-500 font-normal">
            {timeRange === "90d"
              ? "Total for the last 3 months"
              : timeRange === "30d"
              ? "Total for the last 30 days"
              : "Total for the last 7 days"}
          </p>
        </div>

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
      </CardHeader>


            <CardContent className="h-[320px] relative">
               
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

                        {/* Removed CartesianGrid to hide grid lines */}
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatMonth}
                            tick={{ fontSize: 10, fill: "#666" }}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            minTickGap={1} // Reduce minimum gap between ticks
                            tickMargin={5} // Reduce margin to fit more labels
                            height={40} // Adjust height to fit horizontal labels
                            ticks={
                                timeRange === '90d' 
                                    ? filteredData.filter((_, i) => i % 6 === 0).map(d => d.date) // Every 3rd day for 90d
                                    : timeRange === '30d'
                                        ? filteredData.filter((_, i) => i % 2 === 1).map(d => d.date) // Every 2nd day for 30d
                                        : filteredData.map(d => d.date) // All days for 7d
                            }
                            padding={{ left: 15, right: 15 }} // Add padding to prevent edge labels from being cut off
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
            </CardContent>
        </Card>
    );
}
