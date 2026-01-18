"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Filter, RefreshCw } from "lucide-react";

interface EmailSearchProps {
  onSearch: (query: string) => void;
  onFilter?: () => void;
  onRefresh?: () => void;
  placeholder?: string;
}

export function EmailSearch({ 
  onSearch, 
  onFilter, 
  onRefresh,
  placeholder = "Search emails..." 
}: EmailSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-2xl">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="w-full rounded-full placeholder:text-xs bg-gray-100 border-none"
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onFilter}
        className="rounded-full border-none shadow-none text-gray-500"
      >
        <Filter className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRefresh}
        className="rounded-full border-none shadow-none text-gray-500"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
