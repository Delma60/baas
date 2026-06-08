// frontend/components/database/AddTableDialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Braces,
  Key,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  default: string;
  foreignKey: {
    enabled: boolean;
    table: string;
    column: string;
    onDelete: string;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  dbSchema: string;
  existingTables: string[]; // ← pass current table list so FK picker is populated
  onCreated: (tableName: string) => void;
}

const COLUMN_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "integer", label: "Integer", icon: Hash },
  { value: "float", label: "Float", icon: Hash },
  { value: "boolean", label: "Boolean", icon: ToggleLeft },
  { value: "timestamp", label: "Timestamp", icon: Calendar },
  { value: "jsonb", label: "JSON", icon: Braces },
  { value: "uuid", label: "UUID", icon: Key },
];

const ON_DELETE_OPTIONS = [
  { value: "NO ACTION", label: "No action" },
  { value: "CASCADE", label: "Cascade delete" },
  { value: "SET NULL", label: "Set null" },
  { value: "RESTRICT", label: "Restrict" },
];

const TYPE_COLORS: Record<string, string> = {
  text: "text-amber-500",
  integer: "text-blue-500",
  float: "text-blue-400",
  boolean: "text-emerald-500",
  timestamp: "text-violet-500",
  jsonb: "text-orange-500",
  uuid: "text-pink-500",
};

function generateId() {
  return Math.random().toString(36).slice(2, 8);
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "");
}

function makeCol(): ColumnDef {
  return {
    id: generateId(),
    name: "",
    type: "text",
    nullable: true,
    default: "",
    foreignKey: {
      enabled: false,
      table: "",
      column: "id",
      onDelete: "NO ACTION",
    },
  };
}

export function AddTableDialog({
  open,
  onClose,
  projectId,
  dbSchema,
  existingTables,
  onCreated,
}: Props) {
  const [tableName, setTableName] = React.useState("");
  const [tableNameError, setTableNameError] = React.useState("");
  const [enableRealtime, setEnableRealtime] = React.useState(false);
  const [columns, setColumns] = React.useState<ColumnDef[]>([
    { ...makeCol(), name: "title", nullable: false },
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTableName("");
      setTableNameError("");
      setError("");
      setColumns([{ ...makeCol(), name: "title", nullable: false }]);
      setEnableRealtime(false);
    }
  }, [open]);

  const validateName = (val: string) => {
    const c = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!c) return "Table name is required";
    if (!/^[a-z_]/.test(c)) return "Must start with a letter or underscore";
    if (c.startsWith("_")) return "Names starting with _ are reserved";
    return "";
  };

  const handleNameChange = (val: string) => {
    setTableName(val);
    setTableNameError(validateName(val));
  };

  const updateCol = (id: string, patch: Partial<ColumnDef>) =>
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );

  const updateFk = (id: string, patch: Partial<ColumnDef["foreignKey"]>) =>
    setColumns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, foreignKey: { ...c.foreignKey, ...patch } } : c,
      ),
    );

  const handleSubmit = async () => {
    const nameErr = validateName(tableName);
    if (nameErr) {
      setTableNameError(nameErr);
      return;
    }
    for (const col of columns) {
      if (!col.name.trim()) {
        setError("All columns must have a name.");
        return;
      }
      if (col.foreignKey.enabled && !col.foreignKey.table) {
        setError(
          `Column "${col.name}" has a foreign key enabled but no table selected.`,
        );
        return;
      }
    }

    setIsLoading(true);
    setError("");
    const cleanName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    try {
      const res = await fetch("/api/internal/sql/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          dbSchema,
          table: cleanName,
          columns: columns.map((c) => ({
            name: slugify(c.name),
            type: c.type,
            nullable: c.nullable,
            default: c.default || null,
            foreign_key: c.foreignKey.enabled
              ? {
                  table: c.foreignKey.table,
                  column: c.foreignKey.column,
                  on_delete: c.foreignKey.onDelete,
                }
              : null,
          })),
          enable_realtime: enableRealtime,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Failed (HTTP ${res.status})`);
        return;
      }
      onCreated(cleanName);
      onClose();
    } catch {
      setError("Cannot reach backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const cleanedName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            Create new table
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            id, created_at, and updated_at are added automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">
          {/* Table name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Table name</Label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. posts"
                value={tableName}
                onChange={(e) => handleNameChange(e.target.value)}
                className={cn(
                  "h-9 text-sm font-mono",
                  tableNameError && "border-destructive",
                )}
                autoFocus
              />
              {cleanedName && !tableNameError && (
                <Badge
                  variant="outline"
                  className="shrink-0 font-mono text-[11px] text-muted-foreground"
                >
                  {cleanedName}
                </Badge>
              )}
            </div>
            {tableNameError && (
              <p className="text-[11px] text-destructive">{tableNameError}</p>
            )}
          </div>

          {/* System columns preview */}
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-1.5">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Auto-added columns
            </p>
            {[
              {
                name: "id",
                type: "text",
                note: "PRIMARY KEY · gen_random_uuid()",
              },
              { name: "created_at", type: "timestamp", note: "DEFAULT NOW()" },
              {
                name: "updated_at",
                type: "timestamp",
                note: "DEFAULT NOW() · auto-updated",
              },
            ].map((c) => (
              <div key={c.name} className="flex items-center gap-3 text-[12px]">
                <code className="font-mono text-foreground/60 w-24 shrink-0">
                  {c.name}
                </code>
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 font-mono"
                >
                  {c.type}
                </Badge>
                <span className="text-muted-foreground text-[11px]">
                  {c.note}
                </span>
              </div>
            ))}
          </div>

          {/* User columns */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Columns</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setColumns((prev) => [...prev, makeCol()])}
              >
                <Plus className="h-3 w-3" /> Add column
              </Button>
            </div>

            <div className="space-y-3">
              {columns.map((col) => {
                const TypeIcon =
                  COLUMN_TYPES.find((t) => t.value === col.type)?.icon ?? Type;
                return (
                  <div
                    key={col.id}
                    className="rounded-lg border border-border bg-muted/10 p-3 space-y-2"
                  >
                    {/* Row 1: name / type / nullable / delete */}
                    <div className="grid grid-cols-[1fr_140px_60px_32px] gap-2 items-center">
                      <Input
                        placeholder="column_name"
                        value={col.name}
                        onChange={(e) =>
                          updateCol(col.id, { name: e.target.value })
                        }
                        className="h-8 text-xs font-mono"
                      />
                      <Select
                        value={col.type}
                        onValueChange={(v) =>
                          updateCol(col.id, { type: v ?? "" })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMN_TYPES.map((t) => (
                            <SelectItem
                              key={t.value}
                              value={t.value}
                              className="text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                <t.icon
                                  className={cn(
                                    "h-3 w-3",
                                    TYPE_COLORS[t.value],
                                  )}
                                />
                                {t.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] text-muted-foreground">
                          Null
                        </span>
                        <Switch
                          checked={col.nullable}
                          onCheckedChange={(v) =>
                            updateCol(col.id, { nullable: v })
                          }
                          className="scale-75"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setColumns((prev) =>
                            prev?.filter((c) => c.id !== col.id),
                          )
                        }
                        disabled={columns.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* FK toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateFk(col.id, { enabled: !col.foreignKey.enabled })
                        }
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-md border transition-colors",
                          col.foreignKey.enabled
                            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                            : "border-border text-muted-foreground hover:border-foreground/30",
                        )}
                      >
                        <Link2 className="h-3 w-3" />
                        Foreign key
                      </button>

                      {col.foreignKey.enabled && (
                        <span className="text-[11px] text-muted-foreground">
                          → {col.foreignKey.table || "pick a table"}
                          {col.foreignKey.table && `.${col.foreignKey.column}`}
                        </span>
                      )}
                    </div>

                    {/* FK details */}
                    {col.foreignKey.enabled && (
                      <div className="grid grid-cols-3 gap-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-medium">
                            References table
                          </p>
                          <Select
                            value={col.foreignKey.table}
                            onValueChange={(v) =>
                              updateFk(col.id, { table: v ?? "" })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select table…" />
                            </SelectTrigger>
                            <SelectContent>
                              {existingTables
                                ?.filter(
                                  (t) =>
                                    t !== cleanedName && !t.startsWith("_"),
                                )
                                .map((t) => (
                                  <SelectItem
                                    key={t}
                                    value={t}
                                    className="text-xs font-mono"
                                  >
                                    {t}
                                  </SelectItem>
                                ))}
                              {existingTables?.filter((t) => !t.startsWith("_"))
                                .length === 0 && (
                                <div className="px-2 py-2 text-xs text-muted-foreground">
                                  No other tables yet
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-medium">
                            References column
                          </p>
                          <Input
                            value={col.foreignKey.column}
                            onChange={(e) =>
                              updateFk(col.id, { column: e.target.value })
                            }
                            className="h-8 text-xs font-mono"
                            placeholder="id"
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground font-medium">
                            On delete
                          </p>
                          <Select
                            value={col.foreignKey.onDelete}
                            onValueChange={(v) =>
                              updateFk(col.id, { onDelete: v ?? "" })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ON_DELETE_OPTIONS.map((o) => (
                                <SelectItem
                                  key={o.value}
                                  value={o.value}
                                  className="text-xs"
                                >
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Realtime */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-3">
            <div>
              <p className="text-[13px] font-medium">Enable Realtime</p>
              <p className="text-[11px] text-muted-foreground">
                Broadcast INSERT / UPDATE / DELETE via pg_notify
              </p>
            </div>
            <Switch
              checked={enableRealtime}
              onCheckedChange={setEnableRealtime}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isLoading || !!tableNameError || !tableName}
            className="gap-1.5 bg-brand hover:bg-brand-hover text-white border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> Create table
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
