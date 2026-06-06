// frontend/components/database/DatabaseClient.tsx
"use client";

import { useState, useCallback } from "react";
import {
  Database,
  Terminal,
  Play,
  Table as TableIcon,
  Plus,
  RefreshCw,
  Search,
  DatabaseZap,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { SqlTable, SqlQueryResult } from "@/lib/api/sql-client";

interface Props {
  projectId: string;
  dbSchema: string;
  initialTables: SqlTable[];
  initialTable: string | null;
  initialResult: SqlQueryResult | null;
}

export function DatabaseClient({
  projectId,
  dbSchema,
  initialTables,
  initialTable,
  initialResult,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tables] = useState<SqlTable[]>(initialTables);
  const [activeTable, setActiveTable] = useState<string | null>(initialTable);
  const [query, setQuery] = useState(
    initialTable
      ? `SELECT *\nFROM "${initialTable}"\nLIMIT 50;`
      : "SELECT * FROM your_table LIMIT 50;",
  );
  const [filter, setFilter] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SqlQueryResult | null>(initialResult);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleSelectTable = useCallback(
    async (tableName: string) => {
      setActiveTable(tableName);
      setQuery(`SELECT *\nFROM "${tableName}"\nLIMIT 50;`);
      setQueryError(null);
      setResult(null);
      setSelectedRows(new Set());
      setIsLoadingTable(true);

      try {
        const res = await fetch(`/api/internal/sql/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            dbSchema,
            query: `SELECT * FROM "${tableName}" ORDER BY created_at DESC NULLS LAST LIMIT 50`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setQueryError(data?.error ?? "Failed to load table");
        } else {
          setResult(data.data);
        }
      } catch {
        setQueryError("Cannot reach backend");
      } finally {
        setIsLoadingTable(false);
      }
    },
    [projectId, dbSchema],
  );

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setQueryError(null);
    setResult(null);
    setSelectedRows(new Set());

    try {
      const res = await fetch(`/api/internal/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dbSchema, query }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQueryError(data?.error ?? "Query failed");
      } else {
        setResult(data.data);
      }
    } catch {
      setQueryError("Cannot reach backend");
    } finally {
      setIsRunning(false);
    }
  }, [query, projectId, dbSchema]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const toggleRow = (i: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    const rows = result?.rows ?? [];
    setSelectedRows((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)),
    );
  };

  const rows = result?.rows ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const header = columns.join(",");
    const body = rows
      .map((row) =>
        columns.map((col) => JSON.stringify(row[col] ?? "")).join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTable ?? "query"}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSidebarOpen((o) => !o)}
                >
                  {sidebarOpen ? (
                    <PanelLeftClose className="h-4 w-4" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-5" />

            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm hidden sm:inline">
                SQL Database
              </span>
            </div>

            {activeTable && (
              <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">
                  {activeTable}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => activeTable && handleSelectTable(activeTable)}
                  disabled={!activeTable}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reload table</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleExportCSV}
                  disabled={rows.length === 0}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export CSV</TooltipContent>
            </Tooltip>

            <Button size="sm" className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Table</span>
            </Button>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside
            className={cn(
              "flex flex-col border-r bg-muted/20 transition-all duration-200 overflow-hidden shrink-0",
              sidebarOpen ? "w-56" : "w-0",
            )}
          >
            <div className="p-3 flex flex-col gap-3 min-w-[224px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Filter tables…"
                  className="pl-8 h-8 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-1.5 px-1">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tables
                </span>
                <Badge
                  variant="secondary"
                  className="ml-auto text-[10px] px-1.5 py-0"
                >
                  {filteredTables.length}
                </Badge>
              </div>

              <ScrollArea className="h-[calc(100vh-11rem)]">
                <nav className="space-y-0.5 pr-1">
                  {filteredTables.length === 0 && !filter && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No tables yet. Create your first table.
                    </p>
                  )}
                  {filteredTables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => handleSelectTable(table.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-md transition-colors group",
                        activeTable === table.name
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground/80",
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <TableIcon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            activeTable === table.name
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="truncate font-mono text-xs">
                          {table.name}
                        </span>
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 ml-1">
                        {table.rows > 999
                          ? `${(table.rows / 1000).toFixed(1)}k`
                          : table.rows}
                      </span>
                    </button>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main workspace */}
          <main className="flex-1 flex flex-col overflow-hidden min-w-0">
            <ResizablePanelGroup orientation="vertical" className="flex-1">
              {/* Query Editor Panel */}
              <ResizablePanel defaultSize={30} minSize={10} maxSize={60}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Query Editor
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => navigator.clipboard.writeText(query)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Copy query</TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      className="w-full h-full resize-none p-4 font-mono text-sm bg-background outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="SELECT * FROM your_table LIMIT 50;"
                      spellCheck={false}
                    />
                  </div>

                  <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono px-1.5 py-0"
                      >
                        SQL
                      </Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Press{" "}
                        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">
                          ⌘ Enter
                        </kbd>{" "}
                        to run
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={handleRunQuery}
                      disabled={isRunning || !query.trim()}
                    >
                      {isRunning ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                      {isRunning ? "Running…" : "Run Query"}
                    </Button>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Results Panel */}
              <ResizablePanel defaultSize={70} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Results
                      </span>
                      {result && (
                        <>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {result.total.toLocaleString()} rows
                          </Badge>
                          {columns.length > 0 && (
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              · {columns.length} columns
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {selectedRows.size > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {selectedRows.size} selected
                        </span>
                      </div>
                    )}
                  </div>

                  <ScrollArea className="flex-1">
                    {queryError ? (
                      <div className="p-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="font-mono text-xs whitespace-pre-wrap">
                            {queryError}
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : isLoadingTable ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-sm">Loading table…</p>
                      </div>
                    ) : result === null ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <DatabaseZap className="h-8 w-8 opacity-20" />
                        <p className="text-sm">
                          {activeTable
                            ? "Select a table or run a query"
                            : "Select a table from the sidebar or write a query"}
                        </p>
                      </div>
                    ) : rows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <DatabaseZap className="h-8 w-8 opacity-20" />
                        <p className="text-sm">No rows returned</p>
                      </div>
                    ) : (
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableHead className="w-10">
                                <input
                                  type="checkbox"
                                  className="rounded border-border"
                                  checked={selectedRows.size === rows.length}
                                  onChange={toggleAll}
                                />
                              </TableHead>
                              {columns.map((col) => (
                                <TableHead
                                  key={col}
                                  className="font-mono text-xs text-muted-foreground font-semibold whitespace-nowrap"
                                >
                                  {col}
                                </TableHead>
                              ))}
                              <TableHead className="w-10" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row, i) => (
                              <TableRow
                                key={i}
                                className={cn(
                                  "group cursor-pointer",
                                  selectedRows.has(i) && "bg-primary/5",
                                )}
                                onClick={() => toggleRow(i)}
                              >
                                <TableCell
                                  className="w-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border-border"
                                    checked={selectedRows.has(i)}
                                    onChange={() => toggleRow(i)}
                                  />
                                </TableCell>
                                {columns.map((col) => (
                                  <TableCell
                                    key={col}
                                    className="text-sm font-mono whitespace-nowrap max-w-[240px] truncate"
                                    title={String(row[col] ?? "")}
                                  >
                                    <CellValue value={row[col]} />
                                  </TableCell>
                                ))}
                                <TableCell
                                  className="w-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-36"
                                    >
                                      <DropdownMenuItem className="text-xs gap-2">
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit row
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-xs gap-2"
                                        onClick={() =>
                                          navigator.clipboard.writeText(
                                            JSON.stringify(row, null, 2),
                                          )
                                        }
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy JSON
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive">
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete row
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ScrollArea>

                  {result && rows.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground shrink-0">
                      <span>
                        Showing {rows.length.toLocaleString()} of{" "}
                        {result.total.toLocaleString()} rows
                      </span>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Cell value renderer ─────────────────────────────────────────────────────

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <span className="text-muted-foreground/50 italic text-xs">null</span>
    );
  }
  if (typeof value === "boolean") {
    return (
      <span
        className={cn(
          "text-xs font-medium",
          value ? "text-emerald-600" : "text-rose-500",
        )}
      >
        {String(value)}
      </span>
    );
  }
  if (typeof value === "object") {
    return (
      <span className="text-violet-600 dark:text-violet-400 text-xs">
        {JSON.stringify(value)}
      </span>
    );
  }
  const str = String(value);
  return <span className={str.length > 80 ? "text-xs" : ""}>{str}</span>;
}
