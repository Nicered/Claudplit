"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Database,
  Table,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface TableInfo {
  name: string;
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
}

interface TableData {
  columns: ColumnInfo[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  pageSize: number;
}

interface DatabasePanelProps {
  projectId: string;
}

export function DatabasePanel({ projectId }: DatabasePanelProps) {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [queryMode, setQueryMode] = useState(false);
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<Record<string, unknown>[] | null>(null);

  const pageSize = 50;

  // Fetch tables
  const fetchTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<TableInfo[]>(`/projects/${projectId}/database/tables`);
      setTables(result);
      if (result.length > 0 && !selectedTable) {
        setSelectedTable(result[0].name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tables");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedTable]);

  // Fetch table data
  const fetchTableData = useCallback(async () => {
    if (!selectedTable) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<TableData>(
        `/projects/${projectId}/database/tables/${selectedTable}/data?page=${page}&pageSize=${pageSize}`
      );
      setTableData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load table data");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedTable, page]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (selectedTable) {
      setPage(1);
      fetchTableData();
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
    }
  }, [page, fetchTableData]);

  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setQueryMode(false);
    setQueryResult(null);
  };

  const handleDeleteRow = async (row: Record<string, unknown>) => {
    if (!selectedTable || !tableData) return;

    const primaryKeyCol = tableData.columns.find((c) => c.primaryKey);
    if (!primaryKeyCol) {
      setError("No primary key found for this table");
      return;
    }

    if (!confirm("Are you sure you want to delete this row?")) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}/database/tables/${selectedTable}/rows`, {
        primaryKey: primaryKeyCol.name,
        primaryKeyValue: row[primaryKeyCol.name],
      });
      await fetchTableData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete row");
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.post<Record<string, unknown>[]>(
        `/projects/${projectId}/database/query`,
        { query }
      );
      setQueryResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query execution failed");
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = tableData ? Math.ceil(tableData.total / pageSize) : 0;

  if (isLoading && tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading database...
      </div>
    );
  }

  if (error && tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTables} className="mt-2">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant={queryMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => setQueryMode(!queryMode)}
            className="h-8"
          >
            SQL
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTables}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Query Mode */}
      {queryMode && (
        <div className="border-b p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="SELECT * FROM users LIMIT 10"
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.metaKey) {
                  handleExecuteQuery();
                }
              }}
            />
            <Button onClick={handleExecuteQuery} disabled={isLoading} size="sm">
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Cmd+Enter to execute
          </p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Table List Sidebar */}
        <div className="w-48 border-r overflow-auto">
          <div className="p-2 space-y-1">
            {tables.map((table) => (
              <button
                key={table.name}
                onClick={() => handleSelectTable(table.name)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedTable === table.name
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Table className="h-4 w-4 shrink-0" />
                  <span className="truncate">{table.name}</span>
                </span>
                <span className="text-xs text-muted-foreground">{table.rowCount}</span>
              </button>
            ))}
            {tables.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No tables found
              </p>
            )}
          </div>
        </div>

        {/* Data Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {queryMode && queryResult ? (
            // Query Results
            <div className="flex-1 overflow-auto">
              {queryResult.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {Object.keys(queryResult[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left font-medium text-muted-foreground border-b"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="px-3 py-2 font-mono">
                            {value === null ? (
                              <span className="text-muted-foreground">NULL</span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Query returned no results
                </div>
              )}
            </div>
          ) : tableData ? (
            // Table Data
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {tableData.columns.map((col) => (
                        <th
                          key={col.name}
                          className="px-3 py-2 text-left font-medium text-muted-foreground border-b"
                        >
                          <div className="flex items-center gap-1">
                            {col.name}
                            {col.primaryKey && (
                              <span className="text-xs text-primary">PK</span>
                            )}
                          </div>
                          <span className="text-xs font-normal">{col.type}</span>
                        </th>
                      ))}
                      <th className="w-10 border-b"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        {tableData.columns.map((col) => (
                          <td key={col.name} className="px-3 py-2 font-mono">
                            {row[col.name] === null ? (
                              <span className="text-muted-foreground">NULL</span>
                            ) : (
                              String(row[col.name])
                            )}
                          </td>
                        ))}
                        <td className="px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRow(row)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  {tableData.total} rows total
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {page} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a table to view data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
