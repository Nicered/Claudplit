"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Save,
  FileText,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface EnvVariable {
  key: string;
  value: string;
}

interface EnvFile {
  path: string;
  variables: EnvVariable[];
}

interface EnvPanelProps {
  projectId: string;
}

// Keys that should be masked by default
const SENSITIVE_KEYS = [
  "SECRET",
  "PASSWORD",
  "KEY",
  "TOKEN",
  "API_KEY",
  "PRIVATE",
  "CREDENTIAL",
];

function isSensitiveKey(key: string): boolean {
  const upperKey = key.toUpperCase();
  return SENSITIVE_KEYS.some((sensitive) => upperKey.includes(sensitive));
}

export function EnvPanel({ projectId }: EnvPanelProps) {
  const [envFiles, setEnvFiles] = useState<EnvFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [visibleValues, setVisibleValues] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch env files list
  const fetchEnvFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const files = await api.get<EnvFile[]>(`/projects/${projectId}/env`);
      setEnvFiles(files);
      if (files.length > 0 && !selectedFile) {
        setSelectedFile(files[0].path);
        setVariables(files[0].variables);
      }
    } catch (e) {
      setError("Failed to load environment files");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedFile]);

  // Fetch specific env file
  const fetchEnvFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const file = await api.get<EnvFile>(
        `/projects/${projectId}/env/file?path=${encodeURIComponent(filePath)}`
      );
      setVariables(file.variables);
      setHasChanges(false);
    } catch (e) {
      setError(`Failed to load ${filePath}`);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEnvFiles();
  }, [fetchEnvFiles]);

  useEffect(() => {
    if (selectedFile) {
      fetchEnvFile(selectedFile);
    }
  }, [selectedFile, fetchEnvFile]);

  const handleSelectFile = (filePath: string) => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Discard them?")) {
        return;
      }
    }
    setSelectedFile(filePath);
    setVisibleValues(new Set());
  };

  const handleAddVariable = () => {
    setVariables([...variables, { key: "", value: "" }]);
    setHasChanges(true);
  };

  const handleUpdateVariable = (index: number, field: "key" | "value", value: string) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setVariables(newVariables);
    setHasChanges(true);
  };

  const handleDeleteVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    setVariables(newVariables);
    setHasChanges(true);
  };

  const handleToggleVisibility = (key: string) => {
    const newVisible = new Set(visibleValues);
    if (newVisible.has(key)) {
      newVisible.delete(key);
    } else {
      newVisible.add(key);
    }
    setVisibleValues(newVisible);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    // Validate: no empty keys
    const emptyKeys = variables.filter((v) => !v.key.trim());
    if (emptyKeys.length > 0) {
      setError("Variable names cannot be empty");
      return;
    }

    // Validate: no duplicate keys
    const keys = variables.map((v) => v.key.trim());
    const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);
    if (duplicates.length > 0) {
      setError(`Duplicate variable name: ${duplicates[0]}`);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await api.put(
        `/projects/${projectId}/env/file?path=${encodeURIComponent(selectedFile)}`,
        { variables }
      );
      setHasChanges(false);
    } catch (e) {
      setError("Failed to save environment variables");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEnvFile = async () => {
    const fileName = prompt("Enter .env file name (e.g., .env.local):");
    if (!fileName) return;

    if (!fileName.startsWith(".env")) {
      setError("File name must start with .env");
      return;
    }

    try {
      await api.post(
        `/projects/${projectId}/env/file?path=${encodeURIComponent(fileName)}`,
        { variables: [] }
      );
      await fetchEnvFiles();
      setSelectedFile(fileName);
    } catch (e) {
      setError("Failed to create environment file");
    }
  };

  if (isLoading && envFiles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-medium">Environment Variables</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateEnvFile}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            New File
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="h-8"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
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

      <div className="flex flex-1 overflow-hidden">
        {/* File List Sidebar */}
        <div className="w-48 border-r overflow-auto">
          <div className="p-2 space-y-1">
            {envFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleSelectFile(file.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedFile === file.path
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
            {envFiles.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No .env files found
              </p>
            )}
          </div>
        </div>

        {/* Variables Editor */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            <div className="p-4 space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <div>Key</div>
                <div>Value</div>
                <div className="w-16"></div>
              </div>

              {/* Variables */}
              {variables.map((variable, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center"
                >
                  <Input
                    value={variable.key}
                    onChange={(e) => handleUpdateVariable(index, "key", e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="font-mono text-sm"
                  />
                  <div className="relative">
                    <Input
                      type={
                        isSensitiveKey(variable.key) && !visibleValues.has(variable.key)
                          ? "password"
                          : "text"
                      }
                      value={variable.value}
                      onChange={(e) => handleUpdateVariable(index, "value", e.target.value)}
                      placeholder="value"
                      className="font-mono text-sm pr-10"
                    />
                    {isSensitiveKey(variable.key) && (
                      <button
                        onClick={() => handleToggleVisibility(variable.key)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {visibleValues.has(variable.key) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVariable(index)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Add Variable Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddVariable}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Variable
              </Button>

              {/* Tip */}
              {variables.some((v) => v.key.startsWith("NEXT_PUBLIC_")) && (
                <p className="text-xs text-muted-foreground mt-4">
                  Variables starting with NEXT_PUBLIC_ will be exposed to the browser.
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p>Select a file or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
