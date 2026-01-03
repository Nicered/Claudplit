import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { ProjectService } from "../project/project.service";
import { PreviewService } from "../preview/preview.service";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import { Subject, Observable } from "rxjs";

export interface TestStep {
  action: "navigate" | "click" | "fill" | "waitFor" | "screenshot" | "assert";
  selector?: string;
  url?: string;
  value?: string;
  name?: string;
  expected?: string;
}

export interface TestScenario {
  id: string;
  name: string;
  steps: TestStep[];
  createdAt: number;
}

export interface TestResult {
  scenarioId: string;
  scenarioName: string;
  status: "passed" | "failed" | "running";
  startTime: number;
  endTime?: number;
  steps: StepResult[];
  error?: string;
  screenshots: string[];
}

export interface StepResult {
  step: TestStep;
  status: "passed" | "failed" | "skipped";
  duration: number;
  error?: string;
  screenshot?: string;
}

export interface TestEvent {
  type: "step" | "complete" | "error";
  scenarioId: string;
  data: StepResult | TestResult | { error: string };
}

@Injectable()
export class TestingService {
  private readonly logger = new Logger(TestingService.name);
  private scenarios: Map<string, Map<string, TestScenario>> = new Map(); // projectId -> scenarios
  private runningTests: Map<string, ChildProcess> = new Map(); // scenarioId -> process
  private testSubjects: Map<string, Subject<TestEvent>> = new Map(); // projectId -> subject

  constructor(
    private projectService: ProjectService,
    private previewService: PreviewService
  ) {}

  /**
   * Get all test scenarios for a project
   */
  async getScenarios(projectId: string): Promise<TestScenario[]> {
    const scenarios = this.scenarios.get(projectId);
    if (!scenarios) {
      return [];
    }
    return Array.from(scenarios.values());
  }

  /**
   * Get a specific test scenario
   */
  async getScenario(projectId: string, scenarioId: string): Promise<TestScenario> {
    const scenarios = this.scenarios.get(projectId);
    const scenario = scenarios?.get(scenarioId);
    if (!scenario) {
      throw new NotFoundException("Test scenario not found");
    }
    return scenario;
  }

  /**
   * Create a new test scenario
   */
  async createScenario(
    projectId: string,
    name: string,
    steps: TestStep[]
  ): Promise<TestScenario> {
    // Ensure project exists
    await this.projectService.findOne(projectId);

    const scenario: TestScenario = {
      id: `test-${Date.now()}`,
      name,
      steps,
      createdAt: Date.now(),
    };

    if (!this.scenarios.has(projectId)) {
      this.scenarios.set(projectId, new Map());
    }
    this.scenarios.get(projectId)!.set(scenario.id, scenario);

    return scenario;
  }

  /**
   * Update a test scenario
   */
  async updateScenario(
    projectId: string,
    scenarioId: string,
    name: string,
    steps: TestStep[]
  ): Promise<TestScenario> {
    const scenario = await this.getScenario(projectId, scenarioId);
    scenario.name = name;
    scenario.steps = steps;
    return scenario;
  }

  /**
   * Delete a test scenario
   */
  async deleteScenario(projectId: string, scenarioId: string): Promise<void> {
    const scenarios = this.scenarios.get(projectId);
    if (scenarios) {
      scenarios.delete(scenarioId);
    }
  }

  /**
   * Run a test scenario
   */
  async runScenario(projectId: string, scenarioId: string): Promise<TestResult> {
    const scenario = await this.getScenario(projectId, scenarioId);
    const project = await this.projectService.findOne(projectId);

    // Check if preview is running
    const status = await this.previewService.getStatus(projectId);
    if (status.status !== "running" || !status.url) {
      throw new BadRequestException("Preview must be running to execute tests");
    }

    const previewUrl = status.url;
    const projectPath = project.path;
    const screenshotsDir = path.join(projectPath, ".test-screenshots");

    // Create screenshots directory
    await fs.mkdir(screenshotsDir, { recursive: true });

    const result: TestResult = {
      scenarioId,
      scenarioName: scenario.name,
      status: "running",
      startTime: Date.now(),
      steps: [],
      screenshots: [],
    };

    // Generate Playwright test script
    const testScript = this.generatePlaywrightScript(scenario, previewUrl, screenshotsDir);
    const testFilePath = path.join(projectPath, ".test-runner.js");

    await fs.writeFile(testFilePath, testScript);

    // Run the test
    try {
      const output = await this.executePlaywright(testFilePath, projectPath);
      result.status = "passed";
      result.endTime = Date.now();

      // Parse output for step results
      result.steps = this.parseTestOutput(scenario.steps, output);

      // Collect screenshots
      try {
        const files = await fs.readdir(screenshotsDir);
        result.screenshots = files
          .filter((f) => f.endsWith(".png"))
          .map((f) => path.join(screenshotsDir, f));
      } catch {
        // No screenshots
      }
    } catch (error) {
      result.status = "failed";
      result.endTime = Date.now();
      result.error = error instanceof Error ? error.message : "Test failed";
    } finally {
      // Cleanup test file
      try {
        await fs.unlink(testFilePath);
      } catch {
        // Ignore
      }
    }

    // Emit result
    this.emitEvent(projectId, {
      type: "complete",
      scenarioId,
      data: result,
    });

    return result;
  }

  /**
   * Generate Playwright script from test steps
   */
  private generatePlaywrightScript(
    scenario: TestScenario,
    baseUrl: string,
    screenshotsDir: string
  ): string {
    const steps = scenario.steps
      .map((step, i) => {
        switch (step.action) {
          case "navigate":
            return `  await page.goto('${step.url || baseUrl}');
  console.log('STEP_PASSED:${i}');`;

          case "click":
            return `  await page.click('${step.selector}');
  console.log('STEP_PASSED:${i}');`;

          case "fill":
            return `  await page.fill('${step.selector}', '${step.value || ""}');
  console.log('STEP_PASSED:${i}');`;

          case "waitFor":
            return `  await page.waitForSelector('${step.selector}', { timeout: 10000 });
  console.log('STEP_PASSED:${i}');`;

          case "screenshot":
            const filename = `${step.name || `step-${i}`}.png`;
            return `  await page.screenshot({ path: '${screenshotsDir}/${filename}' });
  console.log('STEP_PASSED:${i}');`;

          case "assert":
            return `  const element = await page.locator('${step.selector}');
  await expect(element).toBeVisible();
  console.log('STEP_PASSED:${i}');`;

          default:
            return `  console.log('STEP_SKIPPED:${i}');`;
        }
      })
      .join("\n\n");

    return `
const { chromium, expect } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
${steps}
    console.log('TEST_PASSED');
  } catch (error) {
    console.error('TEST_FAILED:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
`;
  }

  /**
   * Execute Playwright test
   */
  private executePlaywright(testFilePath: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn("npx", ["playwright", "test", testFilePath, "--reporter=line"], {
        cwd,
        shell: true,
        env: { ...process.env },
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          // Try running with node directly as fallback
          const nodePoc = spawn("node", [testFilePath], {
            cwd,
            shell: true,
            env: { ...process.env },
          });

          let nodeStdout = "";
          let nodeStderr = "";

          nodePoc.stdout?.on("data", (data) => {
            nodeStdout += data.toString();
          });

          nodePoc.stderr?.on("data", (data) => {
            nodeStderr += data.toString();
          });

          nodePoc.on("close", (nodeCode) => {
            if (nodeCode === 0 || nodeStdout.includes("TEST_PASSED")) {
              resolve(nodeStdout);
            } else {
              reject(new Error(nodeStderr || stderr || "Test execution failed"));
            }
          });

          nodePoc.on("error", () => {
            reject(new Error(stderr || "Playwright not available"));
          });
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        if (!proc.killed) {
          proc.kill("SIGTERM");
          reject(new Error("Test execution timeout"));
        }
      }, 60000);
    });
  }

  /**
   * Parse test output for step results
   */
  private parseTestOutput(steps: TestStep[], output: string): StepResult[] {
    return steps.map((step, i) => {
      const passed = output.includes(`STEP_PASSED:${i}`);
      const skipped = output.includes(`STEP_SKIPPED:${i}`);

      return {
        step,
        status: skipped ? "skipped" : passed ? "passed" : "failed",
        duration: 0, // Would need timing info from output
      };
    });
  }

  /**
   * Get test event stream
   */
  getTestStream(projectId: string): Observable<TestEvent> {
    if (!this.testSubjects.has(projectId)) {
      this.testSubjects.set(projectId, new Subject<TestEvent>());
    }
    return this.testSubjects.get(projectId)!.asObservable();
  }

  /**
   * Emit test event
   */
  private emitEvent(projectId: string, event: TestEvent): void {
    const subject = this.testSubjects.get(projectId);
    if (subject) {
      subject.next(event);
    }
  }

  /**
   * Stop running test
   */
  stopTest(scenarioId: string): void {
    const proc = this.runningTests.get(scenarioId);
    if (proc) {
      proc.kill("SIGTERM");
      this.runningTests.delete(scenarioId);
    }
  }
}
