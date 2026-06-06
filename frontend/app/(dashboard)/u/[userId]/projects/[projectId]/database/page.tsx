import { 
  Database, 
  Terminal, 
  Play, 
  Table as TableIcon, 
  Plus, 
  RefreshCw,
  Search,
  ChevronDown
} from "lucide-react";

// shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface Props {
  params: Promise<{ userId: string; projectId: string }>;
}

export default async function DatabasePage({ params }: Props) {
  const { projectId } = await params;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SQL Database</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your relational data for <span className="font-mono bg-muted px-1 rounded">{projectId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> New Table
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ── Left Sidebar ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tables..." className="pl-9" />
          </div>
          
          <Card className="p-2">
            <nav className="space-y-0.5">
              {["users", "organizations", "projects", "audit_logs"].map((table) => (
                <button
                  key={table}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <TableIcon className="h-4 w-4 text-muted-foreground" /> 
                  {table}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* ── Main Area ── */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Query Editor Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4 space-y-0 bg-muted/30">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Terminal className="h-4 w-4" /> SQL Query Editor
              </CardTitle>
              <Button size="sm" className="h-8">
                <Play className="mr-1.5 h-3.5 w-3.5" /> Run Query
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <textarea 
                className="w-full h-32 p-4 font-mono text-sm bg-transparent outline-none focus:ring-0 resize-none"
                placeholder="SELECT * FROM users LIMIT 10;"
              />
            </CardContent>
          </Card>

          {/* Results Table Card */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>id</TableHead>
                  <TableHead>email</TableHead>
                  <TableHead>name</TableHead>
                  <TableHead>created_at</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">uuid-{i}</TableCell>
                    <TableCell>user{i}@example.com</TableCell>
                    <TableCell>Test User {i}</TableCell>
                    <TableCell className="text-muted-foreground">2026-06-06</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t text-center text-xs text-muted-foreground">
              Showing 3 rows
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}