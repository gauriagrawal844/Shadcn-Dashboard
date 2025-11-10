"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Placeholder import
import { Button } from "@/components/ui/button"; // Placeholder import
import { Checkbox } from "@/components/ui/checkbox"; // Placeholder import
import { Input } from "@/components/ui/input"; // Placeholder import
import { Label } from "@/components/ui/label"; // Placeholder import
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Placeholder import
// Replaced X with a more comprehensive set of Lucide icons for the table and pagination
import { Plus, GripVertical, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreVertical } from "lucide-react"; 

const API_BASE_URL = '/api/entries';
const GET_TABLE_DATA_URL = API_BASE_URL;
const CREATE_TABLE_ENTRY_URL = API_BASE_URL;

export default function DocumentSectionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    header: '',
    type: '',
    status: 'In Process',
    target: '',
    limit: '',
    reviewer: ''
  });

  // Fetch data from API
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(GET_TABLE_DATA_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
      // In a real app, you might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Ensure data is an array before calling slice
  const totalPages = Math.ceil((data?.length || 0) / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = Array.isArray(data) ? data.slice(startIndex, startIndex + rowsPerPage) : [];

  const toggleRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    // Only select/deselect rows on the current page
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = paginatedData.map(item => item.id);
      setSelectedRows(new Set(allIds));
    }
  };

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  const firstPage = () => setCurrentPage(1);
  const prevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
  const lastPage = () => setCurrentPage(totalPages);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.header || !formData.type || !formData.target || !formData.limit) {
      console.error('Please fill in all required fields.');
      return;
    }

    try {
      const response = await fetch(CREATE_TABLE_ENTRY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          target: Number(formData.target),
          limit: Number(formData.limit),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create entry');
      }

      const newEntry = await response.json();
      
      // Update local state with the new entry
      setData(prev => [newEntry, ...prev]);
      
      // Reset form
      setFormData({
        header: '',
        type: '',
        status: 'In Process',
        target: '',
        limit: '',
        reviewer: ''
      });

      setIsDialogOpen(false);
      
      await fetchData();
      
      console.log('Entry added successfully:', newEntry);
    } catch (error) {
      console.error('Error creating entry:', error);
    }
  };


  const StatusBadge = ({ status }) => {
    const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium rounded-xl bg-gray-50 border border-gray-200 text-[#6B7280]";
    
    return (
      <div className={baseClasses}>
        {status}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center h-10">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-blue-200 rounded animate-pulse"></div>
        </div>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="h-10 bg-[#F9FAFB] border-b border-[#E5E7EB]"></div>
          {Array(rowsPerPage).fill(0).map((_, i) => (
            <div key={i} className="flex items-center h-12 border-b border-[#E5E7EB] px-4">
              <div className="h-4 w-4 mr-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/6 ml-8 bg-gray-200 rounded"></div>
              <div className="h-4 w-1/5 ml-auto bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E7EB] bg-white h-12">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="flex space-x-2">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white mt-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Document Sections</h2>
        <div className="flex items-center space-x-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm text-sm font-medium h-10 px-4 py-2">
                <Plus className="mr-2 h-4 w-4" /> Add New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="header">Header</Label>
                  <Input
                    id="header"
                    name="header"
                    value={formData.header}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="w-full h-10 border-[#D1D5DB] text-sm text-[#111827]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In Process">In Process</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target</Label>
                    <Input
                      id="target"
                      name="target"
                      type="number"
                      value={formData.target}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Limit</Label>
                    <Input
                      id="limit"
                      name="limit"
                      type="number"
                      value={formData.limit}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewer">Reviewer (Optional)</Label>
                  <Input
                    id="reviewer"
                    name="reviewer"
                    value={formData.reviewer}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="h-9 px-4 py-2 text-sm font-medium border-gray-300 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="h-9 px-4 py-2 text-sm font-medium">
                    Add Entry
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F9FAFB]">
            <TableRow className="h-10 hover:bg-transparent border-t-0 border-b border-[#E5E7EB]">
              {/* Drag Handle Column - Removed border-r */}
              <TableHead className="w-[32px]"></TableHead>
              
              {/* Checkbox Column - Removed border-r */}
              <TableHead className="w-[52px] pl-4">
                <Checkbox
                  checked={selectedRows.size > 0 && selectedRows.size === paginatedData.length}
                  onCheckedChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-[#D1D5DB] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                />
              </TableHead>

              {/* Header Columns - Updated text color to black (text-[#111827]) and font weight to semi-bold (font-semibold) */}
              <TableHead className="font-semibold text-black text-lg  leading-4 tracking-wider px-3 py-4">Header</TableHead>
              <TableHead className="font-semibold text-black text-lg leading-4 tracking-wider px-3 py-4">Section Type</TableHead>
              <TableHead className="font-semibold text-black text-lg  leading-4 tracking-wider px-3 py-4">Status</TableHead>
              <TableHead className="font-semibold text-black text-lg  leading-4 tracking-wider px-3 py-4 text-center">Target</TableHead>
              <TableHead className="font-semibold text-black text-lg  leading-4 tracking-wider px-3 py-4 text-center">Limit</TableHead>
              <TableHead className="font-semibold text-black text-lg  leading-4 tracking-wider px-3 py-4">Reviewer</TableHead>
              
              {/* Context Menu Column (Actions) */}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.map((item) => (
              <TableRow key={item.id} className="h-12 border-b border-[#E5E7EB] hover:bg-[#F9FAFB] group">
                {/* Drag Handle Cell (6 dots) */}
                <TableCell className="text-center p-0 w-[32px] text-[#9CA3AF]">
                  <GripVertical className="h-4 w-4 mx-auto" />
                </TableCell>
                
                {/* Checkbox Cell - Removed border-r */}
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedRows.has(item.id)}
                    onCheckedChange={() => toggleRow(item.id)}
                    className="h-4 w-4 rounded border-[#D1D5DB] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                  />
                </TableCell>
                
                {/* Data Cells - Removed border-r */}
                <TableCell className="font-medium text-[#111827] text-m leading-5 px-3">
                  {item.header}
                </TableCell>
                
                {/* Section Type Cell - Updated to rounded-xl */}
                <TableCell className="text-sm leading-5 px-3">
                  <span className="inline-flex items-center px-2 py-1 text-m font-medium rounded-xl bg-gray-50 border border-gray-200 text-[#6B7280]">
                    {item.type}
                  </span>
                </TableCell>

                {/* Status Cell - Using the updated StatusBadge component (neutral color, rounded-xl) */}
                <TableCell className="px-3">
                  <StatusBadge status={item.status} />
                </TableCell>
                
                <TableCell className="text-[#111827] text-m leading-5 px-3 text-center">
                  {item.target}
                </TableCell>
                <TableCell className="text-[#111827] text-m leading-5 px-3 text-center">
                  {item.limit}
                </TableCell>
                <TableCell className="px-3">
                  {item.reviewer ? (
                    <span className="text-[#111827] text-m leading-5">{item.reviewer}</span>
                  ) : (
                    <Select>
                      <SelectTrigger className="h-8 w-[180px] bg-white border-[#D1D5DB] hover:border-[#9CA3AF] focus:ring-0 focus:ring-offset-0 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#93C5FD] rounded-md text-sm text-[#9CA3AF]">
                        <SelectValue placeholder="Assign reviewer" />
                      </SelectTrigger>
                      <SelectContent className="border-[#E5E7EB] shadow-sm">
                        <SelectItem value="eddie" className="text-m text-[#111827] hover:bg-[#F9FAFB} focus:bg-[#F9FAFB]">Eddie Lake</SelectItem>
                        <SelectItem value="jamik" className="text-m text-[#111827] hover:bg-[#F9FAFB] focus:bg-[#F9FAFB]">Jamik Tashpulatov</SelectItem>
                        <SelectItem value="alex" className="text-m text-[#111827] hover:bg-[#F9FAFB] focus:bg-[#F9FAFB]">Alex Carter</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                {/* Context Menu Cell (Three vertical dots) */}
                <TableCell className="w-10 text-center text-[#9CA3AF] hover:text-[#111827] cursor-pointer">
                    <MoreVertical className="h-4 w-4 mx-auto" />
                </TableCell>
              </TableRow>
            ))}
            {/* If no data, show empty state */}
            {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-gray-800">
                        No entries found. Click "Add New Entry" to begin.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        
      </div>
        {/* PIXEL-PERFECT PAGINATION FOOTER */}
        <div className="flex items-center justify-between px-4 py-3 text-m ">
            {/* Left Side: Selection Count */}
            <div className="text-[#6B7280] flex items-center h-8">
                {selectedRows.size} of {data.length} row(s) selected.
            </div>

            {/* Right Side: Rows Per Page, Page Info, and Navigation */}
            <div className="flex items-center space-x-8">
                {/* Rows Per Page Selector */}
                <div className="flex items-center space-x-3">
                    <span className="text-black font-semibold text-lg">Rows per page</span>
                    <Select
                        value={String(rowsPerPage)}
                        onValueChange={handleRowsPerPageChange}
                    >
                        <SelectTrigger className="h-9 w-[80px] font-medium border-[#D1D5DB] bg-white text-lg text-black focus:ring-0 focus:ring-offset-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-[#E5E7EB] shadow-sm">
                            {[5, 10, 20, 50].map((size) => (
                                <SelectItem
                                    key={size}
                                    value={String(size)}
                                    className="text-m text-[#111827] hover:bg-[#F9FAFB] focus:bg-[#F9FAFB]"
                                >
                                    {size}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Page Info and Buttons */}
                <div className="flex items-center space-x-9 text-black font-semibold">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center space-x-2.5">
                        
                        {/* First Page Button */}
                        <button
                            onClick={firstPage}
                            disabled={currentPage === 1}
                            className={`h-10 w-10 inline-flex items-center justify-center border border-[#D1D5DB] rounded-md transition-colors ${
                                currentPage === 1 
                                ? 'text-[#6B7280] bg-white cursor-not-allowed' 
                                : 'text-black bg-white hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                            }`}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        
                        {/* Previous Page Button */}
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 1}
                            className={`h-10 w-10 inline-flex items-center justify-center border border-[#D1D5DB] rounded-md transition-colors ${
                                currentPage === 1 
                                ? 'text-[#6B7280] bg-white cursor-not-allowed' 
                                : 'text-black bg-white hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                            }`}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        {/* Next Page Button */}
                        <button
                            onClick={nextPage}
                            disabled={currentPage === totalPages}
                            className={`h-10 w-10 inline-flex items-center justify-center border border-[#D1D5DB] rounded-md transition-colors ${
                                currentPage === totalPages 
                                ? 'text-[#6B7280] bg-white cursor-not-allowed' 
                                : 'text-black bg-white hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                            }`}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        
                        {/* Last Page Button */}
                        <button
                            onClick={lastPage}
                            disabled={currentPage === totalPages}
                            className={`h-10 w-10 inline-flex items-center justify-center border border-[#D1D5DB] rounded-md transition-colors ${
                                currentPage === totalPages 
                                ? 'text-[#6B7280] bg-white cursor-not-allowed' 
                                : 'text-black bg-white hover:bg-[#F3F4F6] active:bg-[#E5E7EB]'
                            }`}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}