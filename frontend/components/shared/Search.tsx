// frontend/components/shared/Search.tsx
"use client";

import * as React from "react";
import { Search as SearchIcon, X, Loader2 } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

interface SearchProps {
  placeholder?: string;
  paramName?: string;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
  defaultValue?: string;
  size?: "sm" | "md" | "lg";
}

export function Search({
  placeholder = "Search…",
  paramName = "search",
  className,
  inputClassName,
  debounceMs = 300,
  onSearch,
  defaultValue = "",
  size = "md",
}: SearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = React.useState(
    defaultValue || searchParams.get(paramName) || "",
  );
  const debounceRef = React.useRef<NodeJS.Timeout>();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setValue(newVal);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        if (onSearch) {
          onSearch(newVal);
          return;
        }
        // URL-based search
        startTransition(() => {
          const params = new URLSearchParams(searchParams.toString());
          if (newVal) {
            params.set(paramName, newVal);
            params.delete("page"); // reset pagination
          } else {
            params.delete(paramName);
          }
          router.replace(`${pathname}?${params.toString()}`);
        });
      }, debounceMs);
    },
    [onSearch, paramName, pathname, searchParams, debounceMs, router],
  );

  const handleClear = useCallback(() => {
    setValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (onSearch) {
      onSearch("");
      return;
    }
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(paramName);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [onSearch, paramName, pathname, searchParams, router]);

  const sizeClasses = {
    sm: "h-7 text-xs px-2.5",
    md: "h-9 text-sm px-3",
    lg: "h-10 text-sm px-4",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="pointer-events-none absolute left-2.5 flex items-center">
        {isPending ? (
          <Loader2
            className={cn(iconSize[size], "animate-spin text-text-muted")}
          />
        ) : (
          <SearchIcon className={cn(iconSize[size], "text-text-muted")} />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border bg-background text-text-primary placeholder:text-text-muted transition-colors",
          "focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand",
          sizeClasses[size],
          "pl-8",
          value && "pr-7",
          inputClassName,
        )}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-2 flex items-center text-text-muted hover:text-text-primary transition-colors"
          aria-label="Clear search"
        >
          <X className={iconSize[size]} />
        </button>
      )}
    </div>
  );
}

// Hook version for controlled usage outside URL params
export function useSearch(initialValue = "", debounceMs = 300) {
  const [inputValue, setInputValue] = React.useState(initialValue);
  const [debouncedValue, setDebouncedValue] = React.useState(initialValue);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [inputValue, debounceMs]);

  return { inputValue, setInputValue, debouncedValue };
}
