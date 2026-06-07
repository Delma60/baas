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
  GripVertical,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Braces,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  default: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  dbSchema: string;
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

function slugifyColumn(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AddTableDialog({
  open,
  onClose,
  projectId,
  dbSchema,
  onCreated,
}: Props) {
  const [tableName, setTableName] = React.useState("");
  const [tableNameError, setTableNameError] = React.useState("");
  const [enableRealtime, setEnableRealtime] = React.useState(false);
  const [columns, setColumns] = React.useState<ColumnDef[]>([
    {
      id: generateId(),
      name: "title",
      type: "text",
      nullable: false,
      default: "",
    },
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setTableName("");
      setTableNameError("");
      setError("");
      setColumns([
        {
          id: generateId(),
          name: "title",
          type: "text",
          nullable: false,
          default: "",
        },
      ]);
      setEnableRealtime(false);
    }
  }, [open]);

  const validateTableName = (val: string) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (!cleaned) return "Table name is required";
    if (!/^[a-z_]/.test(cleaned))
      return "Must start with a letter or underscore";
    if (cleaned.startsWith("_")) return "Names starting with _ are reserved";
    return "";
  };

  const handleTableNameChange = (val: string) => {
    setTableName(val);
    setTableNameError(validateTableName(val));
  };

  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      { id: generateId(), name: "", type: "text", nullable: true, default: "" },
    ]);
  };

  const removeColumn = (id: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== id));
  };

  const updateColumn = (id: string, patch: Partial<ColumnDef>) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
  };

  const handleSubmit = async () => {
    const nameErr = validateTableName(tableName);
    if (nameErr) {
      setTableNameError(nameErr);
      return;
    }

    const cleanTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    // Validate columns
    for (const col of columns) {
      if (!col.name.trim()) {
        setError("All columns must have a name.");
        return;
      }
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/internal/sql/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          dbSchema,
          table: cleanTableName,
          columns: columns.map((c) => ({
            name: slugifyColumn(c.name),
            type: c.type,
            nullable: c.nullable,
            default: c.default || null,
          })),
          enable_realtime: enableRealtime,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? `Failed to create table (HTTP ${res.status})`);
        return;
      }

      onCreated(cleanTableName);
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
            Define the table name and columns. An{" "}
            <code className="font-mono">id</code>,{" "}
            <code className="font-mono">created_at</code>, and{" "}
            <code className="font-mono">updated_at</code> column are added
            automatically.
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
                onChange={(e) => handleTableNameChange(e.target.value)}
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

          {/* Auto-added system columns preview */}
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

          {/* User-defined columns */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Columns</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={addColumn}
              >
                <Plus className="h-3 w-3" />
                Add column
              </Button>
            </div>

            {/* Column header */}
            <div className="grid grid-cols-[1.5fr_1fr_80px_80px_32px] gap-2 px-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Name</span>
              <span>Type</span>
              <span>Default</span>
              <span className="text-center">Nullable</span>
              <span />
            </div>

            <div className="space-y-1.5">
              {columns.map((col) => {
                const TypeIcon =
                  COLUMN_TYPES.find((t) => t.value === col.type)?.icon ?? Type;
                return (
                  <div
                    key={col.id}
                    className="grid grid-cols-[1.5fr_1fr_80px_80px_32px] gap-2 items-center group"
                  >
                    {/* Name */}
                    <Input
                      placeholder="column_name"
                      value={col.name}
                      onChange={(e) =>
                        updateColumn(col.id, { name: e.target.value })
                      }
                      className="h-8 text-xs font-mono"
                    />

                    {/* Type */}
                    <Select
                      value={col.type}
                      onValueChange={(v) => updateColumn(col.id, { type: v })}
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
                                className={cn("h-3 w-3", TYPE_COLORS[t.value])}
                              />
                              {t.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Default */}
                    <Input
                      placeholder="none"
                      value={col.default}
                      onChange={(e) =>
                        updateColumn(col.id, { default: e.target.value })
                      }
                      className="h-8 text-xs font-mono"
                    />

                    {/* Nullable */}
                    <div className="flex justify-center">
                      <Switch
                        checked={col.nullable}
                        onCheckedChange={(v) =>
                          updateColumn(col.id, { nullable: v })
                        }
                        className="scale-75"
                      />
                    </div>

                    {/* Delete */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => removeColumn(col.id)}
                      disabled={columns.length === 1}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3.5 py-3">
            <div>
              <p className="text-[13px] font-medium text-foreground">
                Enable Realtime
              </p>
              <p className="text-[11px] text-muted-foreground">
                Broadcast INSERT / UPDATE / DELETE via pg_notify
              </p>
            </div>
            <Switch
              checked={enableRealtime}
              onCheckedChange={setEnableRealtime}
            />
          </div>

          {/* Error */}
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
