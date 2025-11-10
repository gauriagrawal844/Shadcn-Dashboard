'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function ChartDataPage() {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newData, setNewData] = useState({
    date: '',
    desktop: '',
    mobile: ''
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      const response = await fetch('/api/visitors');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setChartData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewData(prev => ({
      ...prev,
      [name]: name === 'date' ? value : value === '' ? '' : Number(value)
    }));
  };

  const addDataPoint = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!newData.date || newData.desktop === '' || newData.mobile === '') {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newData),
      });

      if (!response.ok) throw new Error('Failed to save data');
      
      // Refresh data
      await fetchData();
      
      // Reset form
      setNewData({ date: '', desktop: '', mobile: '' });
      
      toast.success('Data point saved successfully!');
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('Failed to save data');
    }
  };

  const removeDataPoint = async (id) => {
    try {
      const response = await fetch(`/api/visitors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete data');
      
      // Refresh data
      await fetchData();
      
      toast.success('Data point removed');
    } catch (error) {
      console.error('Error removing data:', error);
      toast.error('Failed to remove data');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manage Chart Data</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add New Data Point</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addDataPoint} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  name="date"
                  value={newData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Desktop Value</label>
                <Input
                  type="number"
                  name="desktop"
                  value={newData.desktop}
                  onChange={handleInputChange}
                  placeholder="Enter desktop value"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mobile Value</label>
                <Input
                  type="number"
                  name="mobile"
                  value={newData.mobile}
                  onChange={handleInputChange}
                  placeholder="Enter mobile value"
                  required
                />
              </div>
            </div>
            <div>
              <Button type="submit" className="mt-2">
                Add Data Point
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Desktop</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((data) => (
                    <tr key={data.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(data.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{data.desktop}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{data.mobile}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDataPoint(data.id)}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
