// frontend/components/database/DatabaseClient.tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  X,
  Save,
  Eraser,
  AlertCircle,
  Check,
  Columns,
  ChevronDown,
  Link2,
  Info,
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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { SqlTable, SqlQueryResult, SqlColumn } from "@/lib/api/sql-client";
import { AddTableDialog } from "./AddTableDialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  dbSchema: string;
  initialTables: SqlTable[];
  initialTable: string | null;
  initialResult: SqlQueryResult | null;
}

const SYSTEM_COLS = ["id", "created_at", "updated_at"];

const COLUMN_TYPES = [
  { value: "text", label: "Text" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Float" },
  { value: "boolean", label: "Boolean" },
  { value: "timestamp", label: "Timestamp" },
  { value: "jsonb", label: "JSON" },
  { value: "uuid", label: "UUID" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function castValue(value: string, dataType: string): unknown {
  if (value === "") return null;
  const t = dataType.toLowerCase();
  if (t.includes("int") || t.includes("serial")) return parseInt(value, 10);
  if (t.includes("float") || t.includes("double") || t.includes("numeric") || t.includes("real"))
    return parseFloat(value);
  if (t.includes("bool")) return value === "true";
  if (t.includes("json")) {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ─── Row Form Dialog ──────────────────────────────────────────────────────────

interface RowFormDialogProps {
  open: boolean;
  onClose: () => void;
  mode: "insert" | "edit";
  projectId: string;
  dbSchema: string;
  table: string;
  columns: SqlColumn[];
  foreignKeys?: ForeignKey[];
  existingRow?: Record<string, unknown>;
  onSaved: (row: Record<string, unknown>, isNew: boolean) => void;
}

interface ForeignKey {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  on_delete: string;
}

function RowFormDialog({
  open,
  onClose,
  mode,
  projectId,
  dbSchema,
  table,
  columns,
  foreignKeys = [],
  existingRow,
  onSaved,
}: RowFormDialogProps) {
  const editableCols = columns.filter(
    (c) => !SYSTEM_COLS.includes(c.column_name)
  );

  const [fields, setFields] = useState<Record<string, string>>(() =>
    buildFields(editableCols, existingRow)
  );
  const [fkOptions, setFkOptions] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [fkLoading, setFkLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset fields whenever the dialog opens or the target row changes
  useEffect(() => {
    if (open) {
      setFields(buildFields(editableCols, existingRow));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existingRow?.id]);

  // Load FK reference rows
  useEffect(() => {
    if (!open || foreignKeys.length === 0) return;
    for (const fk of foreignKeys) {
      const col = fk.from_column;
      if (fkOptions[col] !== undefined) continue;
      setFkLoading((p) => ({ ...p, [col]: true }));
      fetch(`/api/internal/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          dbSchema,
          query: `SELECT * FROM "${fk.to_table}" ORDER BY created_at DESC NULLS LAST LIMIT 100`,
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          const rows: Record<string, unknown>[] = data.data?.rows ?? [];
          const labelCol =
            rows[0]
              ? (["name", "title", "email", "slug", "label"].find(
                  (k) => k in rows[0]
                ) ?? fk.to_column)
              : fk.to_column;
          setFkOptions((p) => ({
            ...p,
            [col]: rows.map((r) => ({
              value: String(r[fk.to_column] ?? ""),
              label:
                r[labelCol] != null
                  ? `${r[labelCol]} (${r[fk.to_column]})`
                  : String(r[fk.to_column] ?? ""),
            })),
          }));
        })
        .catch(() => setFkOptions((p) => ({ ...p, [col]: [] })))
        .finally(() => setFkLoading((p) => ({ ...p, [col]: false })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, foreignKeys]);

  const getFkForColumn = (colName: string) =>
    foreignKeys.find((fk) => fk.from_column === colName);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Validate rowId for edit mode
    if (mode === "edit" && !existingRow?.id) {
      setError(
        "This row has no 'id' column — edit is only supported for rows with a primary key named 'id'."
      );
      setLoading(false);
      return;
    }

    // Build data payload — skip unchanged values in edit mode
    const data: Record<string, unknown> = {};
    for (const col of editableCols) {
      const raw = fields[col.column_name] ?? "";
      const originalRaw = toDisplayString(existingRow?.[col.column_name]);

      // In edit mode, only send changed fields
      if (mode === "edit" && raw === originalRaw) continue;

      data[col.column_name] = castValue(raw, col.data_type);
    }

    if (mode === "edit" && Object.keys(data).length === 0) {
      setError("No fields were changed.");
      setLoading(false);
      return;
    }

    const endpoint = "/api/internal/sql/rows";
    const body =
      mode === "insert"
        ? { projectId, table, dbSchema, data }
        : { projectId, table, dbSchema, rowId: existingRow!.id, data };

    try {
      const res = await fetch(endpoint, {
        method: mode === "insert" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result?.error ?? result?.detail ?? "Operation failed");
        return;
      }
      onSaved(result.data, mode === "insert");
      onClose();
    } catch {
      setError("Network error — backend unreachable");
    } finally {
      setLoading(false);
    }
  };

  const rowId = existingRow?.id;
  const noIdWarning =
    mode === "edit" && !rowId ? (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          This row has no <code className="font-mono">id</code> column — it cannot be updated via the dashboard. Run an UPDATE query in the editor instead.
        </span>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "insert" ? "Insert row" : "Edit row"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {mode === "insert"
              ? `Add a new row to "${table}". id, created_at, updated_at are auto-set.`
              : `Edit row in "${table}". Only changed fields will be sent.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-1">
          <div className="space-y-3 py-2">
            {noIdWarning}

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* System column preview in edit mode */}
            {mode === "edit" && existingRow && (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Read-only (system columns)
                </p>
                {SYSTEM_COLS.filter((c) => existingRow[c] != null).map((col) => (
                  <div key={col} className="flex items-center gap-3 text-[11.5px]">
                    <span className="w-24 font-mono text-muted-foreground shrink-0">
                      {col}
                    </span>
                    <span className="font-mono text-foreground/70 truncate">
                      {toDisplayString(existingRow[col])}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {editableCols.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No editable columns (only auto-managed system columns exist).
              </p>
            )}

            {editableCols.map((col) => {
              const fk = getFkForColumn(col.column_name);
              const options = fk ? (fkOptions[col.column_name] ?? []) : [];
              const isLoadingFk = fk ? (fkLoading[col.column_name] ?? false) : false;
              const currentVal = fields[col.column_name] ?? "";
              const originalVal = toDisplayString(existingRow?.[col.column_name]);
              const isDirty = mode === "edit" && currentVal !== originalVal;

              return (
                <div key={col.column_name} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">
                      {col.column_name}
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1.5 font-mono"
                    >
                      {col.data_type}
                    </Badge>
                    {fk && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        <Link2 className="h-3 w-3" />→ {fk.to_table}.{fk.to_column}
                      </span>
                    )}
                    {col.is_nullable === "YES" && (
                      <span className="text-[10px] text-muted-foreground">
                        nullable
                      </span>
                    )}
                    {isDirty && (
                      <Badge className="text-[9px] h-3.5 px-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                        changed
                      </Badge>
                    )}
                  </div>

                  {fk ? (
                    <div className="space-y-1">
                      <Select
                        value={currentVal}
                        onValueChange={(v) =>
                          setFields((f) => ({ ...f, [col.column_name]: v }))
                        }
                        disabled={isLoadingFk}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue
                            placeholder={
                              isLoadingFk ? "Loading…" : `Select ${fk.to_table}…`
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {col.is_nullable === "YES" && (
                            <SelectItem value="" className="text-xs text-muted-foreground italic">
                              — null —
                            </SelectItem>
                          )}
                          {options.length === 0 && !isLoadingFk && (
                            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                              No records in {fk.to_table} yet
                            </div>
                          )}
                          {options.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="text-xs font-mono"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : col.data_type.includes("bool") ? (
                    <select
                      value={currentVal}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, [col.column_name]: e.target.value }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">— null —</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <Input
                      value={currentVal}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, [col.column_name]: e.target.value }))
                      }
                      placeholder={
                        col.column_default
                          ? `default: ${col.column_default}`
                          : col.column_name
                      }
                      className={cn(
                        "h-9 text-sm font-mono",
                        isDirty && "border-amber-300 dark:border-amber-700"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={loading || editableCols.length === 0 || (mode === "edit" && !rowId)}
            className="gap-1.5 bg-brand hover:bg-brand-hover text-white border-0"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : mode === "insert" ? (
              <Plus className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {loading
              ? mode === "insert" ? "Inserting…" : "Saving…"
              : mode === "insert" ? "Insert row" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildFields(
  editableCols: SqlColumn[],
  existingRow?: Record<string, unknown>
): Record<string, string> {
  const init: Record<string, string> = {};
  for (const col of editableCols) {
    init[col.column_name] = toDisplayString(existingRow?.[col.column_name]);
  }
  return init;
}

// ─── Add Column Dialog ────────────────────────────────────────────────────────

function AddColumnDialog({
  open,
  onClose,
  projectId,
  dbSchema,
  table,
  existingTables = [],
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  dbSchema: string;
  table: string;
  existingTables?: string[];
  onAdded: (col: SqlColumn) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [nullable, setNullable] = useState(true);
  const [defaultVal, setDefaultVal] = useState("");
  const [fkEnabled, setFkEnabled] = useState(false);
  const [fkTable, setFkTable] = useState("");
  const [fkColumn, setFkColumn] = useState("id");
  const [fkOnDelete, setFkOnDelete] = useState("NO ACTION");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(""); setType("text"); setNullable(true); setDefaultVal("");
    setFkEnabled(false); setFkTable(""); setFkColumn("id"); setFkOnDelete("NO ACTION");
    setError(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) { setError("Column name is required"); return; }
    if (fkEnabled && !fkTable) { setError("Select a referenced table"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/internal/sql/tables/${table}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, dbSchema, table,
          column: {
            name: name.trim(), type, nullable,
            default: defaultVal || null,
            foreign_key: fkEnabled ? { table: fkTable, column: fkColumn, on_delete: fkOnDelete } : null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Failed to add column"); return; }
      onAdded({ column_name: name.trim(), data_type: type, is_nullable: nullable ? "YES" : "NO", column_default: defaultVal || null });
      reset(); onClose();
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const ON_DELETE_OPTIONS = [
    { value: "NO ACTION", label: "No action" },
    { value: "CASCADE", label: "Cascade delete" },
    { value: "SET NULL", label: "Set null" },
    { value: "RESTRICT", label: "Restrict" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add column</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new column to &quot;{table}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Column name</Label>
            <Input placeholder="e.g. description" value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm font-mono" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COLUMN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-sm">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Default value <span className="text-muted-foreground">(optional)</span></Label>
            <Input placeholder="e.g. 0, 'draft', NOW()" value={defaultVal} onChange={(e) => setDefaultVal(e.target.value)} className="h-9 text-sm font-mono" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <span className="text-sm font-medium">Allow NULL</span>
            <Switch checked={nullable} onCheckedChange={setNullable} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">Foreign key</span>
            </div>
            <Switch checked={fkEnabled} onCheckedChange={setFkEnabled} />
          </div>
          {fkEnabled && (
            <div className="space-y-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">References table</Label>
                <Select value={fkTable} onValueChange={setFkTable}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select table…" /></SelectTrigger>
                  <SelectContent>
                    {existingTables.filter((t) => !t.startsWith("_") && t !== table).map((t) => (
                      <SelectItem key={t} value={t} className="text-xs font-mono">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Column</Label>
                  <Input value={fkColumn} onChange={(e) => setFkColumn(e.target.value)} className="h-8 text-xs font-mono" placeholder="id" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">On delete</Label>
                  <Select value={fkOnDelete} onValueChange={setFkOnDelete}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ON_DELETE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={loading || !name.trim()} className="gap-1.5 bg-brand hover:bg-brand-hover text-white border-0">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Add column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = "Confirm", variant = "destructive", loading,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; description: string; confirmLabel?: string;
  variant?: "destructive" | "default"; loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button size="sm" variant={variant === "destructive" ? "destructive" : "default"} onClick={onConfirm} disabled={loading} className="gap-1.5">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cell value renderer ──────────────────────────────────────────────────────

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground/50 italic text-xs">null</span>;
  if (typeof value === "boolean")
    return <span className={cn("text-xs font-medium", value ? "text-emerald-600" : "text-rose-500")}>{String(value)}</span>;
  if (typeof value === "object")
    return <span className="text-violet-600 dark:text-violet-400 text-xs">{JSON.stringify(value)}</span>;
  const str = String(value);
  return <span className={str.length > 80 ? "text-xs" : ""}>{str}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DatabaseClient({
  projectId, dbSchema, initialTables, initialTable, initialResult,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tables, setTables] = useState<SqlTable[]>(initialTables);
  const [activeTable, setActiveTable] = useState<string | null>(initialTable);
  const [columns, setColumns] = useState<SqlColumn[]>([]);
  const [foreignKeys, setForeignKeys] = useState<ForeignKey[]>([]);
  const [query, setQuery] = useState(
    initialTable ? `SELECT *\nFROM "${initialTable}"\nLIMIT 50;` : "SELECT * FROM your_table LIMIT 50;"
  );
  const [filter, setFilter] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SqlQueryResult | null>(initialResult);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [isRefreshingTables, setIsRefreshingTables] = useState(false);
  const [addTableOpen, setAddTableOpen] = useState(false);

  // CRUD
  const [insertOpen, setInsertOpen] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [crudError, setCrudError] = useState<string | null>(null);
  const [crudSuccess, setCrudSuccess] = useState<string | null>(null);

  // Column management
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [droppingColumn, setDroppingColumn] = useState<string | null>(null);

  // Table-level confirms
  const [dropTableTarget, setDropTableTarget] = useState<string | null>(null);
  const [emptyTableTarget, setEmptyTableTarget] = useState<string | null>(null);
  const [dropTableLoading, setDropTableLoading] = useState(false);
  const [emptyTableLoading, setEmptyTableLoading] = useState(false);

  const filteredTables = tables.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Flash success then clear
  const showSuccess = (msg: string) => {
    setCrudSuccess(msg);
    setTimeout(() => setCrudSuccess(null), 3000);
  };

  // ── Data fetching ──────────────────────────────────────────────────────────

  const refreshTableList = useCallback(async () => {
    setIsRefreshingTables(true);
    try {
      const res = await fetch(`/api/internal/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, dbSchema,
          query: `SELECT table_name FROM information_schema.tables WHERE table_schema = '${dbSchema}' AND table_type = 'BASE TABLE' AND table_name NOT LIKE '\\_%' ORDER BY table_name`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.rows) {
        setTables(data.data.rows.map((r: { table_name: string }) => ({ name: r.table_name, rows: 0 })));
      }
    } catch { /* non-fatal */ }
    finally { setIsRefreshingTables(false); }
  }, [projectId, dbSchema]);

  const fetchColumns = useCallback(async (tableName: string) => {
    try {
      const [colRes, fkRes] = await Promise.all([
        fetch(`/api/internal/sql/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId, dbSchema,
            query: `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = '${dbSchema}' AND table_name = '${tableName}' ORDER BY ordinal_position`,
          }),
        }),
        fetch(`/api/internal/sql/relationships?projectId=${projectId}&db_schema=${encodeURIComponent(dbSchema)}`)
          .catch(() => null),
      ]);
      const colData = await colRes.json();
      if (colRes.ok && colData.data?.rows) setColumns(colData.data.rows as SqlColumn[]);

      if (fkRes && fkRes.ok) {
        const fkData = await fkRes.json();
        const allFks = fkData.data?.relationships ?? [];
        setForeignKeys(allFks.filter((fk: ForeignKey) => fk.from_table === tableName));
      }
    } catch { setColumns([]); setForeignKeys([]); }
  }, [projectId, dbSchema]);

  const handleSelectTable = useCallback(async (tableName: string) => {
    setActiveTable(tableName);
    setQuery(`SELECT *\nFROM "${tableName}"\nLIMIT 50;`);
    setQueryError(null); setCrudError(null); setCrudSuccess(null);
    setResult(null); setSelectedRows(new Set());
    setIsLoadingTable(true);

    await fetchColumns(tableName);

    try {
      const res = await fetch(`/api/internal/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId, dbSchema,
          query: `SELECT * FROM "${tableName}" ORDER BY created_at DESC NULLS LAST LIMIT 50`,
        }),
      });
      const data = await res.json();
      if (!res.ok) setQueryError(data?.error ?? "Failed to load table");
      else setResult(data.data);
    } catch { setQueryError("Cannot reach backend"); }
    finally { setIsLoadingTable(false); }
  }, [projectId, dbSchema, fetchColumns]);

  const handleRunQuery = useCallback(async () => {
    if (!query.trim()) return;
    setIsRunning(true); setQueryError(null); setCrudError(null); setCrudSuccess(null);
    setResult(null); setSelectedRows(new Set());
    try {
      const res = await fetch(`/api/internal/sql/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dbSchema, query }),
      });
      const data = await res.json();
      if (!res.ok) setQueryError(data?.error ?? "Query failed");
      else setResult(data.data);
    } catch { setQueryError("Cannot reach backend"); }
    finally { setIsRunning(false); }
  }, [query, projectId, dbSchema]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunQuery();
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleRowSaved = (row: Record<string, unknown>, isNew: boolean) => {
    setResult((prev) => {
      if (!prev) return { rows: [row], total: 1 };
      if (isNew) return { ...prev, rows: [row, ...prev.rows], total: prev.total + 1 };
      return { ...prev, rows: prev.rows.map((r) => (r.id === row.id ? row : r)) };
    });
    showSuccess(isNew ? "Row inserted successfully" : "Row updated successfully");
  };

  const handleDeleteRow = async (row: Record<string, unknown>) => {
    const id = row.id;
    if (!id || !activeTable) {
      setCrudError("Cannot delete: this row has no 'id' column.");
      return;
    }
    setDeletingId(String(id));
    setCrudError(null);
    try {
      const res = await fetch("/api/internal/sql/rows", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, table: activeTable, dbSchema, rowId: id }),
      });
      const data = await res.json();
      if (!res.ok) { setCrudError(data?.error ?? "Delete failed"); return; }
      setResult((prev) => {
        if (!prev) return prev;
        return { ...prev, rows: prev.rows.filter((r) => r.id !== id), total: prev.total - 1 };
      });
      showSuccess("Row deleted");
    } catch { setCrudError("Network error"); }
    finally { setDeletingId(null); }
  };

  const handleDeleteSelected = async () => {
    if (!activeTable || selectedRows.size === 0) return;
    const rows = result?.rows ?? [];
    const toDelete = [...selectedRows].map((i) => rows[i]).filter(Boolean);
    for (const row of toDelete) await handleDeleteRow(row);
    setSelectedRows(new Set());
  };

  // ── Table-level operations ─────────────────────────────────────────────────

  const handleDropTable = async (tableName: string) => {
    setDropTableLoading(true);
    try {
      const res = await fetch(`/api/internal/sql/tables/${encodeURIComponent(tableName)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dbSchema }),
      });
      if (res.ok) {
        setTables((prev) => prev.filter((t) => t.name !== tableName));
        if (activeTable === tableName) {
          setActiveTable(null); setResult(null); setColumns([]);
          setQuery("SELECT * FROM your_table LIMIT 50;");
        }
      }
    } catch { /* non-fatal */ }
    finally { setDropTableLoading(false); setDropTableTarget(null); }
  };

  const handleEmptyTable = async (tableName: string) => {
    setEmptyTableLoading(true);
    try {
      const res = await fetch(`/api/internal/sql/tables/${encodeURIComponent(tableName)}/truncate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, dbSchema }),
      });
      if (res.ok) {
        setResult((prev) => (prev ? { ...prev, rows: [], total: 0 } : null));
        showSuccess("Table emptied");
      } else {
        const data = await res.json().catch(() => ({}));
        setCrudError(data?.error ?? "Failed to empty table");
      }
    } catch { setCrudError("Network error"); }
    finally { setEmptyTableLoading(false); setEmptyTableTarget(null); }
  };

  const handleDropColumn = async (colName: string) => {
    if (!activeTable) return;
    setDroppingColumn(colName);
    try {
      const res = await fetch(
        `/api/internal/sql/tables/${encodeURIComponent(activeTable)}/columns/${encodeURIComponent(colName)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, dbSchema }),
        }
      );
      if (res.ok) {
        setColumns((prev) => prev.filter((c) => c.column_name !== colName));
        if (result) {
          setResult((prev) =>
            prev ? { ...prev, rows: prev.rows.map((r) => { const nr = { ...r }; delete nr[colName]; return nr; }) } : prev
          );
        }
        showSuccess(`Column "${colName}" dropped`);
      }
    } catch { /* non-fatal */ }
    finally { setDroppingColumn(null); }
  };

  // ── misc ───────────────────────────────────────────────────────────────────

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
      prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i))
    );
  };

  const handleExportCSV = () => {
    if (rows.length === 0) return;
    const header = cols.join(",");
    const body = rows
      .map((row) => cols.map((col) => JSON.stringify(row[col] ?? "")).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTable ?? "query"}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTableCreated = async (tableName: string) => {
    setTables((prev) => [...prev, { name: tableName, rows: 0 }]);
    await handleSelectTable(tableName);
  };

  const canCRUD = !!activeTable;
  const rows = result?.rows ?? [];

  const cols = (() => {
    const schemaNames = columns.map((c) => c.column_name);
    const rowKeys = rows.length > 0 ? Object.keys(rows[0]) : schemaNames;
    const allKeys = new Set(rowKeys);
    const id = allKeys.has("id") ? ["id"] : [];
    const timestamps = SYSTEM_COLS.filter((c) => c !== "id" && allKeys.has(c));
    const userCols =
      schemaNames.length > 0
        ? schemaNames.filter((c) => !SYSTEM_COLS.includes(c) && allKeys.has(c))
        : rowKeys.filter((c) => !SYSTEM_COLS.includes(c));
    return [...id, ...userCols, ...timestamps];
  })();

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-background text-foreground">
        {/* ── Top Bar ── */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSidebarOpen((o) => !o)}>
                  {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm hidden sm:inline">SQL Database</span>
            </div>
            {activeTable && (
              <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-md">{activeTable}</span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-1">
                  {result?.total ?? 0} rows
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canCRUD && (
              <>
                {/* Columns manager */}
                <DropdownMenu open={columnsOpen} onOpenChange={setColumnsOpen}>
                  <DropdownMenuTrigger render={<span />}>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                      <Columns className="h-3.5 w-3.5" />Columns<ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="px-2 py-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Table columns</div>
                    <DropdownMenuSeparator />
                    <ScrollArea className="max-h-48">
                      {columns.map((col) => (
                        <div key={col.column_name} className="flex items-center justify-between px-2 py-1.5 group">
                          <div className="flex items-center gap-2 min-w-0">
                            <code className="text-xs font-mono text-foreground truncate">{col.column_name}</code>
                            <Badge variant="outline" className="text-[9px] h-4 px-1 font-mono shrink-0">{col.data_type}</Badge>
                          </div>
                          {!SYSTEM_COLS.includes(col.column_name) && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDropColumn(col.column_name)}
                              disabled={droppingColumn === col.column_name}
                            >
                              {droppingColumn === col.column_name ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-xs gap-2 cursor-pointer" onClick={() => { setColumnsOpen(false); setAddColumnOpen(true); }}>
                      <Plus className="h-3.5 w-3.5" /> Add column
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={() => setInsertOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />Insert row
                </Button>
              </>
            )}

            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => activeTable && handleSelectTable(activeTable)} disabled={!activeTable}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Reload table</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExportCSV} disabled={rows.length === 0}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Export CSV</TooltipContent>
            </Tooltip>

            <Button size="sm" className="h-8 gap-1.5 bg-brand hover:bg-brand-hover text-white border-0" onClick={() => setAddTableOpen(true)}>
              <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">New Table</span>
            </Button>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <aside className={cn("flex flex-col border-r bg-muted/20 transition-all duration-200 overflow-hidden shrink-0", sidebarOpen ? "w-56" : "w-0")}>
            <div className="p-3 flex flex-col gap-3 min-w-[224px] h-full">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input placeholder="Filter tables…" className="pl-8 h-8 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)} />
              </div>
              <div className="flex items-center gap-1.5 px-1">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tables</span>
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{filteredTables.length}</Badge>
                <Tooltip>
                  <TooltipTrigger render={<span />}>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground" onClick={refreshTableList} disabled={isRefreshingTables}>
                      <RefreshCw className={cn("h-3 w-3", isRefreshingTables && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh tables</TooltipContent>
                </Tooltip>
              </div>
              <ScrollArea className="flex-1">
                <nav className="space-y-0.5 pr-1">
                  {filteredTables.length === 0 && !filter && (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <TableIcon className="h-6 w-6 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No tables yet.</p>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setAddTableOpen(true)}>
                        <Plus className="h-3 w-3" /> Create table
                      </Button>
                    </div>
                  )}
                  {filteredTables.map((table) => (
                    <div
                      key={table.name}
                      className={cn("group flex items-center justify-between px-2 py-1 rounded-md transition-colors",
                        activeTable === table.name ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground/80"
                      )}
                    >
                      <button onClick={() => handleSelectTable(table.name)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                        <TableIcon className={cn("h-3.5 w-3.5 shrink-0", activeTable === table.name ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate font-mono text-xs font-medium">{table.name}</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<span />}>
                          <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => handleSelectTable(table.name)}>
                            <TableIcon className="h-3.5 w-3.5" /> Browse rows
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => { handleSelectTable(table.name); setTimeout(() => setInsertOpen(true), 300); }}>
                            <Plus className="h-3.5 w-3.5" /> Insert row
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => { handleSelectTable(table.name); setTimeout(() => setAddColumnOpen(true), 300); }}>
                            <Columns className="h-3.5 w-3.5" /> Add column
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs gap-2 text-amber-600 focus:text-amber-600 dark:text-amber-400" onClick={() => setEmptyTableTarget(table.name)}>
                            <Eraser className="h-3.5 w-3.5" /> Empty table
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => setDropTableTarget(table.name)}>
                            <Trash2 className="h-3.5 w-3.5" /> Drop table
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </nav>
              </ScrollArea>
            </div>
          </aside>

          {/* Main workspace */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
              {/* Query Editor */}
              <ResizablePanel defaultSize="30%" minSize="15%" maxSize="85%">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Query Editor</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger render={<span />}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(query)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Copy query</TooltipContent>
                    </Tooltip>
                  </div>
                  <textarea
                    className="flex-1 resize-none p-4 font-mono text-sm bg-background outline-none placeholder:text-muted-foreground/50 leading-relaxed"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`SELECT * FROM your_table LIMIT 50;\n\n-- Press ⌘ Enter to run`}
                    spellCheck={false}
                  />
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">SQL</Badge>
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] font-mono">⌘ Enter</kbd> to run
                      </span>
                    </div>
                    <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={handleRunQuery} disabled={isRunning || !query.trim()}>
                      {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                      {isRunning ? "Running…" : "Run Query"}
                    </Button>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Results */}
              <ResizablePanel defaultSize="70%" minSize="15%">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium text-muted-foreground shrink-0">Results</span>
                      {result && (
                        <>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                            {result.total.toLocaleString()} rows
                          </Badge>
                          {cols.length > 0 && (
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">· {cols.length} columns</span>
                          )}
                        </>
                      )}
                    </div>

                    {selectedRows.size > 0 && canCRUD && (
                      <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5 shrink-0" onClick={handleDeleteSelected}>
                        <Trash2 className="h-3.5 w-3.5" />Delete {selectedRows.size} selected
                      </Button>
                    )}

                    {canCRUD && result && result.total > 0 && selectedRows.size === 0 && (
                      <Tooltip>
                        <TooltipTrigger render={<span />}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 shrink-0" onClick={() => setEmptyTableTarget(activeTable!)}>
                            <Eraser className="h-3.5 w-3.5" /> Empty table
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Truncate all rows from this table</TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Success / error banners */}
                  {crudSuccess && (
                    <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5 shrink-0" />{crudSuccess}
                    </div>
                  )}

                  {crudError && (
                    <div className="mx-4 mt-3">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs flex items-center justify-between">
                          {crudError}
                          <Button variant="ghost" size="icon" className="h-5 w-5 ml-2 shrink-0" onClick={() => setCrudError(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <ScrollArea className="flex-1">
                    {queryError ? (
                      <div className="p-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="font-mono text-xs whitespace-pre-wrap">{queryError}</AlertDescription>
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
                        <p className="text-sm">{tables.length === 0 ? "Create a table to get started" : "Select a table or run a query"}</p>
                        {tables.length === 0 && (
                          <Button size="sm" className="gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0" onClick={() => setAddTableOpen(true)}>
                            <Plus className="h-3.5 w-3.5" /> New Table
                          </Button>
                        )}
                      </div>
                    ) : rows.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <DatabaseZap className="h-8 w-8 opacity-20" />
                        <p className="text-sm">No rows yet</p>
                        {canCRUD && (
                          <Button size="sm" className="gap-1.5 text-xs bg-brand hover:bg-brand-hover text-white border-0" onClick={() => setInsertOpen(true)}>
                            <Plus className="h-3.5 w-3.5" /> Insert first row
                          </Button>
                        )}
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
                                  checked={selectedRows.size === rows.length && rows.length > 0}
                                  onChange={toggleAll}
                                />
                              </TableHead>
                              {cols.map((col) => (
                                <TableHead key={col} className="font-mono text-xs text-muted-foreground font-semibold whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    {col}
                                    {SYSTEM_COLS.includes(col) && (
                                      <Badge variant="outline" className="text-[8px] h-3 px-1 ml-1 text-muted-foreground">auto</Badge>
                                    )}
                                  </div>
                                </TableHead>
                              ))}
                              {canCRUD && <TableHead className="w-10" />}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rows.map((row, i) => (
                              <TableRow
                                key={i}
                                className={cn(
                                  "group cursor-pointer",
                                  selectedRows.has(i) && "bg-primary/5",
                                  deletingId === String(row.id) && "opacity-50"
                                )}
                                onClick={() => toggleRow(i)}
                              >
                                <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    className="rounded border-border"
                                    checked={selectedRows.has(i)}
                                    onChange={() => toggleRow(i)}
                                  />
                                </TableCell>
                                {cols.map((col) => (
                                  <TableCell key={col} className="text-sm font-mono whitespace-nowrap max-w-[240px] truncate" title={String(row[col] ?? "")}>
                                    <CellValue value={row[col]} />
                                  </TableCell>
                                ))}
                                {canCRUD && (
                                  <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger render={<span />}>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                          {deletingId === String(row.id)
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <MoreHorizontal className="h-3.5 w-3.5" />}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-36">
                                        <DropdownMenuItem
                                          className="text-xs gap-2"
                                          onClick={() => {
                                            setCrudError(null);
                                            setCrudSuccess(null);
                                            setEditRow(row);
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" /> Edit row
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-xs gap-2" onClick={() => navigator.clipboard.writeText(JSON.stringify(row, null, 2))}>
                                          <Copy className="h-3.5 w-3.5" /> Copy JSON
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => handleDeleteRow(row)}>
                                          <Trash2 className="h-3.5 w-3.5" /> Delete row
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </ScrollArea>

                  {result && rows.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground shrink-0">
                      <span>Showing {rows.length.toLocaleString()} of {result.total.toLocaleString()} rows</span>
                      {canCRUD && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 text-muted-foreground" onClick={() => setInsertOpen(true)}>
                          <Plus className="h-3 w-3" /> Insert row
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>

        {/* ── Dialogs ── */}
        <AddTableDialog
          open={addTableOpen}
          onClose={() => setAddTableOpen(false)}
          projectId={projectId}
          dbSchema={dbSchema}
          onCreated={handleTableCreated}
          existingTables={tables.map((t) => t.name)}
        />

        {addColumnOpen && activeTable && (
          <AddColumnDialog
            open={addColumnOpen}
            onClose={() => setAddColumnOpen(false)}
            projectId={projectId}
            dbSchema={dbSchema}
            table={activeTable}
            onAdded={(col) => setColumns((prev) => [...prev, col])}
            existingTables={tables.map((t) => t.name)}
          />
        )}

        {insertOpen && activeTable && (
          <RowFormDialog
            open={insertOpen}
            onClose={() => setInsertOpen(false)}
            mode="insert"
            projectId={projectId}
            dbSchema={dbSchema}
            table={activeTable}
            columns={columns}
            foreignKeys={foreignKeys}
            onSaved={(row) => handleRowSaved(row, true)}
          />
        )}

        {editRow !== null && activeTable && (
          <RowFormDialog
            open={editRow !== null}
            onClose={() => setEditRow(null)}
            mode="edit"
            projectId={projectId}
            dbSchema={dbSchema}
            table={activeTable}
            columns={columns}
            foreignKeys={foreignKeys}
            existingRow={editRow}
            onSaved={(row) => handleRowSaved(row, false)}
          />
        )}

        <ConfirmDialog
          open={!!dropTableTarget}
          onClose={() => setDropTableTarget(null)}
          onConfirm={() => dropTableTarget && handleDropTable(dropTableTarget)}
          title={`Drop table "${dropTableTarget}"?`}
          description="This will permanently delete the table and all its data. This cannot be undone."
          confirmLabel="Drop table"
          variant="destructive"
          loading={dropTableLoading}
        />

        <ConfirmDialog
          open={!!emptyTableTarget}
          onClose={() => setEmptyTableTarget(null)}
          onConfirm={() => emptyTableTarget && handleEmptyTable(emptyTableTarget)}
          title={`Empty table "${emptyTableTarget}"?`}
          description="This will delete all rows but keep the table structure and columns. This cannot be undone."
          confirmLabel="Empty table"
          variant="destructive"
          loading={emptyTableLoading}
        />
      </div>
    </TooltipProvider>
  );
}