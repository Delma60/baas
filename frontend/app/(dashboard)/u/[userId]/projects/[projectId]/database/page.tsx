"use client";

import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
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

const TABLES = [
  { name: "users", rows: 1284 },
  { name: "profiles", rows: 1240 },
  { name: "projects", rows: 87 },
  { name: "audit_logs", rows: 45302 },
  { name: "sessions", rows: 3891 },
  { name: "api_keys", rows: 214 },
];

const MOCK_ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: `550e8400-e29b-41d4-a716-44665544000${i}`,
  email: `user${i + 1}@example.com`,
  name: `User ${i + 1}`,
  role: i === 0 ? "admin" : i % 3 === 0 ? "editor" : "member",
  created_at: `2026-0${(i % 6) + 1}-${String((i % 28) + 1).padStart(2, "0")}`,
  status: i % 4 === 0 ? "inactive" : "active",
}));

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  member: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
};

export default function DatabasePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTable, setActiveTable] = useState("users");
  const [query, setQuery] = useState(
    "SELECT id, email, name, role, status, created_at\nFROM users\nWHERE status = 'active'\nORDER BY created_at DESC\nLIMIT 50;"
  );
  const [filter, setFilter] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const filteredTables = TABLES.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleRunQuery = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 800);
  };

  const toggleRow = (i: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.size === MOCK_ROWS.length
        ? new Set()
        : new Set(MOCK_ROWS.map((_, i) => i))
    );
  };

  return (
    <TooltipProvider >
      <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger >
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

            {/* Breadcrumb */}
            <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">
                {activeTable}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reload schema</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger >
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export results</TooltipContent>
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
              sidebarOpen ? "w-56" : "w-0"
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
                  {filteredTables.map((table) => (
                    <button
                      key={table.name}
                      onClick={() => setActiveTable(table.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-md transition-colors group",
                        activeTable === table.name
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent hover:text-accent-foreground text-foreground/80"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <TableIcon
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            activeTable === table.name
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        />
                        <span className="truncate font-mono text-xs">
                          {table.name}
                        </span>
                      </span>
                      <span className="text-[10px] tabular-nums text-muted-foreground shrink-0 ml-1">
                        {table.rows.toLocaleString()}
                      </span>
                    </button>
                  ))}

                  {filteredTables.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No tables found
                    </p>
                  )}
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
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger >
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
                  </div>

                  <div className="relative flex-1">
                    <textarea
                      className="w-full h-full resize-none p-4 font-mono text-sm bg-background outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="SELECT * FROM users;"
                      spellCheck={false}
                    />
                    {/* Line numbers gutter hint */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-muted/20 border-r pointer-events-none hidden lg:block" />
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
              <ResizablePanel defaultSize={50} minSize={20} maxSize={100}>
                <div className="flex flex-col h-full">
                  {/* Results toolbar */}
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">
                        Results
                      </span>
                      {hasRun && (
                        <>
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 shrink-0"
                          >
                            {MOCK_ROWS.length} rows
                          </Badge>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">
                            · 42 ms
                          </span>
                        </>
                      )}
                    </div>
                    {selectedRows.size > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {selectedRows.size} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Table */}
                  <ScrollArea className="flex-1">
                    {!hasRun ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <DatabaseZap className="h-8 w-8 opacity-20" />
                        <p className="text-sm">Run a query to see results</p>
                      </div>
                    ) : (
                      <div className="min-w-[600px]">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              <TableHead className="w-10">
                                <input
                                  type="checkbox"
                                  className="rounded border-border"
                                  checked={
                                    selectedRows.size === MOCK_ROWS.length
                                  }
                                  onChange={toggleAll}
                                />
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold">
                                id
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold">
                                email
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold hidden sm:table-cell">
                                name
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold hidden md:table-cell">
                                role
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold hidden lg:table-cell">
                                status
                              </TableHead>
                              <TableHead className="font-mono text-xs text-muted-foreground font-semibold hidden lg:table-cell">
                                created_at
                              </TableHead>
                              <TableHead className="w-10" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {MOCK_ROWS.map((row, i) => (
                              <TableRow
                                key={i}
                                className={cn(
                                  "group cursor-pointer",
                                  selectedRows.has(i) && "bg-primary/5"
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
                                <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px]">
                                  <span className="truncate block">
                                    {row.id.slice(0, 8)}…
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {row.email}
                                </TableCell>
                                <TableCell className="text-sm hidden sm:table-cell">
                                  {row.name}
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                                      ROLE_COLORS[row.role]
                                    )}
                                  >
                                    {row.role}
                                  </span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                                      STATUS_COLORS[row.status]
                                    )}
                                  >
                                    {row.status}
                                  </span>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground font-mono hidden lg:table-cell">
                                  {row.created_at}
                                </TableCell>
                                <TableCell
                                  className="w-10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenu>
                                    <DropdownMenuTrigger >
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36">
                                      <DropdownMenuItem className="text-xs gap-2">
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit row
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-xs gap-2">
                                        <Copy className="h-3.5 w-3.5" />
                                        Copy ID
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

                  {/* Footer */}
                  {hasRun && (
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground shrink-0">
                      <span>
                        Showing {MOCK_ROWS.length} of {MOCK_ROWS.length} rows
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          disabled
                        >
                          ← Prev
                        </Button>
                        <span className="tabular-nums">Page 1</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          disabled
                        >
                          Next →
                        </Button>
                      </div>
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