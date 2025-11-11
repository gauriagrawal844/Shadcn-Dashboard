"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Pencil,
  Trash2
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const API_BASE_URL = "/api/entries";
const GET_TABLE_DATA_URL = API_BASE_URL;
const CREATE_TABLE_ENTRY_URL = API_BASE_URL;

const DragHandle = ({ listeners, attributes }) => (
  <div
    className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing"
    {...attributes}
    {...listeners}
  >
    <GripVertical className="h-4 w-4 mr-4 text-gray-400" />
  </div>
);

const SortableRow = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : "auto",
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="h-12 border-b border-[#E5E7EB] hover:bg-[#F9FAFB]"
    >
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          return React.cloneElement(child, {
            children: (
              <div className="flex items-center">
                <DragHandle listeners={listeners} attributes={attributes} />
                {child.props.children}
              </div>
            ),
          });
        }
        return child;
      })}
    </TableRow>
  );
};

export default function DocumentSectionsPage() {
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    header: "",
    type: "",
    status: "In Process",
    target: "",
    limit: "",
    reviewer: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(GET_TABLE_DATA_URL);
      if (!response.ok) throw new Error("Failed to fetch data");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (data?.length > 0) setItems([...data]);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const totalPages = Math.ceil(items.length / rowsPerPage);
  const paginatedData = items.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const toggleRow = (id) => {
    const newSet = new Set(selectedRows);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedRows(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === paginatedData.length) setSelectedRows(new Set());
    else setSelectedRows(new Set(paginatedData.map((i) => i.id)));
  };

  const handleEdit = (entry) => {
    if (!entry || !entry.id) {
      console.error("Invalid entry data:", entry);
      return;
    }

    setFormData({
      id: entry.id,
      header: entry.header || "",
      type: entry.type || "",
      status: entry.status || "In Process",
      target: entry.target ? entry.target.toString() : "",
      limit: entry.limit ? entry.limit.toString() : "",
      reviewer: entry.reviewer || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const entryId = Number(id);
    if (!entryId || isNaN(entryId)) {
      alert("Error: Invalid entry ID");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch("/api/entries", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entryId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete entry");
      }

      // ✅ Update table instantly
      setData((prev) => prev.filter((item) => item.id !== entryId));
      setItems((prev) => prev.filter((item) => item.id !== entryId));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ FIXED handleSubmit — updates UI immediately after edit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isUpdate = !!formData.id;
    const url = "/api/entries";
    const method = isUpdate ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          target: Number(formData.target),
          limit: Number(formData.limit)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message =
          result?.error || result?.message || "Failed to save entry";
        throw new Error(message);
      }

      if (isUpdate) {
        // Update entry instantly in local state with the returned data
        const updatedEntry = result.updatedEntry || result;
        setData(prev => prev.map(item => 
          item.id === formData.id ? { ...item, ...updatedEntry } : item
        ));
        setItems(prev => prev.map(item => 
          item.id === formData.id ? { ...item, ...updatedEntry } : item
        ));
      } else {
        // For new entries, refetch to ensure we have the latest data
        await fetchData();
      }

      // Close dialog and reset form
      setIsDialogOpen(false);
      setFormData({
        id: "",
        header: "",
        type: "",
        status: "In Process",
        target: "",
        limit: "",
        reviewer: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(`Error: ${error.message || "Unexpected error"}`);
    }
  };

  const StatusBadge = ({ status }) => {
    const baseClasses =
      "inline-flex items-center px-2 py-1 text-xs font-medium rounded-xl bg-gray-50 border border-gray-200 text-[#6B7280]";
    return <div className={baseClasses}>{status}</div>;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center h-10">
          <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-blue-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-white mt-10">
      {/* Header */}
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
                <DialogTitle>{formData.id ? 'Update Entry' : 'Add New Entry'}</DialogTitle>
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
                    {formData.id ? 'Update Entry' : 'Add Entry'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

    
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
             <TableHeader className="bg-[#F9FAFB]">
            <TableRow className="h-10 hover:bg-transparent border-t-0 border-b border-[#E5E7EB]">
         
            
              {/* Checkbox Column - Removed border-r */}
              <TableHead className="w-4 text-right">
                <Checkbox
                  checked={selectedRows.size > 0 && selectedRows.size === paginatedData.length}
                  onCheckedChange={toggleSelectAll}
                  className="h-4 w-4   rounded border-[#D1D5DB] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
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
              <SortableContext
                items={paginatedData.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {paginatedData.map((item) => (
                  <SortableRow key={item.id} id={item.id}>
                    {/* <TableCell className="text-center p-0 text-[#9CA3AF]">
                      <GripVertical className="h-4 w-4 mx-auto" />
                    </TableCell> */}
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedRows.has(item.id)}
                        onCheckedChange={() => toggleRow(item.id)}
                        className="h-4 w-4 rounded border-[#D1D5DB] text-[#3B82F6] focus:ring-0 focus:ring-offset-0 data-[state=checked]:bg-[#3B82F6] data-[state=checked]:border-[#3B82F6]"
                      />
                    </TableCell>
                    <TableCell>{item.header}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 text-sm rounded-xl bg-gray-50 border border-gray-200 text-[#6B7280]">
                        {item.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-center">{item.target}</TableCell>
                    <TableCell className="text-center">{item.limit}</TableCell>
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
                    <TableCell className="text-right pr-4">
                      <DropdownMenu
                        open={dropdownOpenId === item.id}
                        onOpenChange={(open) => setDropdownOpenId(open ? item.id : null)}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpenId(dropdownOpenId === item.id ? null : item.id);
                            }}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          onInteractOutside={() => setDropdownOpenId(null)}
                        >
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              handleEdit(item);
                              setDropdownOpenId(null);
                            }}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              handleDelete(item.id);
                              setDropdownOpenId(null);
                            }}
                            className="flex items-center space-x-2 cursor-pointer text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </SortableRow>
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Fixed Pagination Footer (Not draggable) */}
      <div className="flex items-center justify-between px-4 py-2 bg-white text-md">
        <div className="text-[#6B7280] text-md">
          {selectedRows.size} of {data.length} row(s) selected.
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-black font-semibold text-md">Rows per page</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(v) => setRowsPerPage(Number(v))}
            >
              <SelectTrigger className="h-9 w-[80px] font-medium border-[#D1D5DB] bg-white text-md text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-4 text-black font-semibold">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                <ChevronsLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                <ChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
