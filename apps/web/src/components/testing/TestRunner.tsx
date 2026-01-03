"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play,
  Square,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

interface TestStep {
  action: "navigate" | "click" | "fill" | "waitFor" | "screenshot" | "assert";
  selector?: string;
  url?: string;
  value?: string;
  name?: string;
}

interface TestScenario {
  id: string;
  name: string;
  steps: TestStep[];
  createdAt: number;
}

interface StepResult {
  step: TestStep;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
}

interface TestResult {
  scenarioId: string;
  scenarioName: string;
  status: "passed" | "failed" | "running";
  startTime: number;
  endTime?: number;
  steps: StepResult[];
  error?: string;
}

interface TestRunnerProps {
  projectId: string;
}

const ACTION_LABELS: Record<TestStep["action"], string> = {
  navigate: "Navigate to URL",
  click: "Click element",
  fill: "Fill input",
  waitFor: "Wait for element",
  screenshot: "Take screenshot",
  assert: "Assert visible",
};

export function TestRunner({ projectId }: TestRunnerProps) {
  const [scenarios, setScenarios] = useState<TestScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<TestScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState<TestStep[]>([]);

  // Fetch scenarios
  const fetchScenarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get<TestScenario[]>(
        `/projects/${projectId}/testing/scenarios`
      );
      setScenarios(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load scenarios");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSelectScenario = (scenario: TestScenario) => {
    setSelectedScenario(scenario);
    setLastResult(null);
    setIsEditing(false);
  };

  const handleNewScenario = () => {
    setSelectedScenario(null);
    setIsEditing(true);
    setEditName("New Test");
    setEditSteps([{ action: "navigate", url: "/" }]);
  };

  const handleEditScenario = () => {
    if (!selectedScenario) return;
    setIsEditing(true);
    setEditName(selectedScenario.name);
    setEditSteps([...selectedScenario.steps]);
  };

  const handleSaveScenario = async () => {
    if (!editName.trim() || editSteps.length === 0) {
      setError("Name and at least one step are required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (selectedScenario) {
        await api.put(
          `/projects/${projectId}/testing/scenarios/${selectedScenario.id}`,
          { name: editName, steps: editSteps }
        );
      } else {
        await api.post(`/projects/${projectId}/testing/scenarios`, {
          name: editName,
          steps: editSteps,
        });
      }
      await fetchScenarios();
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save scenario");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteScenario = async () => {
    if (!selectedScenario) return;
    if (!confirm("Delete this test scenario?")) return;

    try {
      await api.delete(
        `/projects/${projectId}/testing/scenarios/${selectedScenario.id}`
      );
      setSelectedScenario(null);
      await fetchScenarios();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete scenario");
    }
  };

  const handleRunTest = async () => {
    if (!selectedScenario) return;

    setIsRunning(true);
    setError(null);
    setLastResult(null);
    try {
      const result = await api.post<TestResult>(
        `/projects/${projectId}/testing/scenarios/${selectedScenario.id}/run`
      );
      setLastResult(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test execution failed");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddStep = () => {
    setEditSteps([...editSteps, { action: "click", selector: "" }]);
  };

  const handleUpdateStep = (index: number, updates: Partial<TestStep>) => {
    const newSteps = [...editSteps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setEditSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    setEditSteps(editSteps.filter((_, i) => i !== index));
  };

  if (isLoading && scenarios.length === 0) {
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
        <h3 className="font-medium flex items-center gap-2">
          <FlaskConical className="h-4 w-4" />
          Browser Testing
        </h3>
        <Button variant="outline" size="sm" onClick={handleNewScenario}>
          <Plus className="h-4 w-4 mr-1" />
          New Test
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Scenario List */}
        <div className="w-56 border-r overflow-auto">
          <div className="p-2 space-y-1">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleSelectScenario(scenario)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedScenario?.id === scenario.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span className="truncate">{scenario.name}</span>
              </button>
            ))}
            {scenarios.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-2">
                No test scenarios yet
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {isEditing ? (
            // Edit Mode
            <div className="p-4 space-y-4">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Test name"
                className="font-medium"
              />

              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">Steps</div>
                {editSteps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 border rounded-lg">
                    <select
                      value={step.action}
                      onChange={(e) =>
                        handleUpdateStep(i, { action: e.target.value as TestStep["action"] })
                      }
                      className="h-9 px-2 border rounded-md bg-background text-sm"
                    >
                      {Object.entries(ACTION_LABELS).map(([action, label]) => (
                        <option key={action} value={action}>
                          {label}
                        </option>
                      ))}
                    </select>

                    {step.action === "navigate" && (
                      <Input
                        value={step.url || ""}
                        onChange={(e) => handleUpdateStep(i, { url: e.target.value })}
                        placeholder="/path or full URL"
                        className="flex-1"
                      />
                    )}

                    {(step.action === "click" ||
                      step.action === "waitFor" ||
                      step.action === "assert") && (
                      <Input
                        value={step.selector || ""}
                        onChange={(e) => handleUpdateStep(i, { selector: e.target.value })}
                        placeholder="CSS selector"
                        className="flex-1 font-mono text-sm"
                      />
                    )}

                    {step.action === "fill" && (
                      <>
                        <Input
                          value={step.selector || ""}
                          onChange={(e) => handleUpdateStep(i, { selector: e.target.value })}
                          placeholder="CSS selector"
                          className="flex-1 font-mono text-sm"
                        />
                        <Input
                          value={step.value || ""}
                          onChange={(e) => handleUpdateStep(i, { value: e.target.value })}
                          placeholder="Value"
                          className="flex-1"
                        />
                      </>
                    )}

                    {step.action === "screenshot" && (
                      <Input
                        value={step.name || ""}
                        onChange={(e) => handleUpdateStep(i, { name: e.target.value })}
                        placeholder="Screenshot name"
                        className="flex-1"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStep(i)}
                      className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button variant="outline" size="sm" onClick={handleAddStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveScenario} disabled={isLoading}>
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : selectedScenario ? (
            // View Mode
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">{selectedScenario.name}</h4>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditScenario}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteScenario}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleRunTest}
                    disabled={isRunning}
                    size="sm"
                  >
                    {isRunning ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Run Test
                  </Button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {selectedScenario.steps.length} steps
                </div>
                {selectedScenario.steps.map((step, i) => {
                  const stepResult = lastResult?.steps[i];
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 border rounded-lg ${
                        stepResult?.status === "passed"
                          ? "border-green-500/50 bg-green-500/5"
                          : stepResult?.status === "failed"
                            ? "border-red-500/50 bg-red-500/5"
                            : ""
                      }`}
                    >
                      {stepResult ? (
                        stepResult.status === "passed" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : stepResult.status === "failed" ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2" />
                      )}
                      <div className="flex-1">
                        <span className="font-medium">{ACTION_LABELS[step.action]}</span>
                        {step.selector && (
                          <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                            {step.selector}
                          </code>
                        )}
                        {step.url && (
                          <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                            {step.url}
                          </code>
                        )}
                        {step.value && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            = "{step.value}"
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Result */}
              {lastResult && (
                <div
                  className={`p-4 rounded-lg ${
                    lastResult.status === "passed"
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {lastResult.status === "passed" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                    <span className="font-medium">
                      Test {lastResult.status === "passed" ? "Passed" : "Failed"}
                    </span>
                  </div>
                  {lastResult.error && (
                    <p className="mt-2 text-sm">{lastResult.error}</p>
                  )}
                  {lastResult.endTime && lastResult.startTime && (
                    <p className="mt-1 text-sm opacity-70">
                      Duration: {lastResult.endTime - lastResult.startTime}ms
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a test or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
