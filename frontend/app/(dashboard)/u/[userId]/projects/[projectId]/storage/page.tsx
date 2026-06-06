import { HardDrive, Upload, Folder, File, MoreVertical, Trash2, Search, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export default async function StoragePage({ params }: { params: Promise<{ userId: string; projectId: string }> }) {
  const { projectId } = await params;

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] bg-background">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-amber-500" /> Cloud Storage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your project files and assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Folder className="mr-2 h-4 w-4" /> New Folder
          </Button>
          <Button size="sm" className="gap-2">
            <Upload className="h-4 w-4" /> Upload File
          </Button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 p-6 overflow-hidden flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search files..." className="pl-8" />
          </div>
          <div className="text-sm text-muted-foreground font-mono">/root/assets/images</div>
        </div>

        {/* File Table */}
        <Card className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "logo.png", size: "24 KB", type: "Image", date: "2026-06-05" },
                { name: "config.json", size: "1 KB", type: "JSON", date: "2026-06-04" },
                { name: "docs/", size: "-", type: "Folder", date: "2026-06-01" },
              ].map((file, i) => (
                <TableRow key={i} className="group">
                  <TableCell className="flex items-center gap-2 font-medium">
                    {file.type === "Folder" ? <Folder className="h-4 w-4 text-amber-500" /> : <File className="h-4 w-4 text-blue-500" />}
                    {file.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{file.size}</TableCell>
                  <TableCell className="text-muted-foreground">{file.type}</TableCell>
                  <TableCell className="text-muted-foreground">{file.date}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}