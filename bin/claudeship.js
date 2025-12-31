#!/usr/bin/env node

/**
 * ClaudeShip CLI
 * AI-Powered App Builder using Claude Code
 */

const { spawn, execSync } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.join(__dirname, "..");
const VERSION = require("../package.json").version;

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "") {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logError(message) {
  console.error(`${COLORS.red}Error: ${message}${COLORS.reset}`);
}

function logSuccess(message) {
  console.log(`${COLORS.green}${message}${COLORS.reset}`);
}

function logInfo(message) {
  console.log(`${COLORS.cyan}${message}${COLORS.reset}`);
}

function showBanner() {
  console.log(`
${COLORS.cyan}${COLORS.bold}
   _____ _                 _      _____ _     _
  / ____| |               | |    / ____| |   (_)
 | |    | | __ _ _   _  __| | ___| (___ | |__  _ _ __
 | |    | |/ _\` | | | |/ _\` |/ _ \\\\___ \\| '_ \\| | '_ \\
 | |____| | (_| | |_| | (_| |  __/____) | | | | | |_) |
  \\_____|_|\\__,_|\\__,_|\\__,_|\\___|_____/|_| |_|_| .__/
                                                | |
                                                |_|
${COLORS.reset}
  ${COLORS.dim}AI-Powered App Builder using Claude Code${COLORS.reset}
  ${COLORS.dim}Version ${VERSION}${COLORS.reset}
`);
}

function showHelp() {
  showBanner();
  console.log(`
${COLORS.bold}Usage:${COLORS.reset}
  claudeship [command] [options]

${COLORS.bold}Commands:${COLORS.reset}
  start         Start ClaudeShip (default)
  doctor        Check system requirements
  help          Show this help message

${COLORS.bold}Options:${COLORS.reset}
  -p, --port    Web app port (default: 13000)
  -s, --server  API server port (default: 14000)
  -v, --version Show version
  -h, --help    Show help

${COLORS.bold}Examples:${COLORS.reset}
  ${COLORS.dim}# Start ClaudeShip${COLORS.reset}
  npx claudeship

  ${COLORS.dim}# Start with custom ports${COLORS.reset}
  npx claudeship start --port 3000 --server 4000

  ${COLORS.dim}# Check requirements${COLORS.reset}
  npx claudeship doctor

${COLORS.bold}Requirements:${COLORS.reset}
  - Node.js >= 20
  - pnpm >= 9
  - Claude Code CLI (https://claude.ai/code)
`);
}

function showVersion() {
  console.log(`claudeship v${VERSION}`);
}

/**
 * Check if a command exists
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
function getVersion(command, args = ["--version"]) {
  try {
    return execSync(`${command} ${args.join(" ")}`, { encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

/**
 * Check system requirements
 */
async function doctor() {
  showBanner();
  log("\nChecking system requirements...\n", COLORS.bold);

  let allGood = true;

  // Check Node.js
  const nodeVersion = getVersion("node");
  if (nodeVersion) {
    const major = parseInt(nodeVersion.replace("v", "").split(".")[0]);
    if (major >= 20) {
      logSuccess(`  ✓ Node.js ${nodeVersion}`);
    } else {
      logError(`  ✗ Node.js ${nodeVersion} (requires >= 20)`);
      allGood = false;
    }
  } else {
    logError("  ✗ Node.js not found");
    allGood = false;
  }

  // Check pnpm
  const pnpmVersion = getVersion("pnpm");
  if (pnpmVersion) {
    logSuccess(`  ✓ pnpm ${pnpmVersion}`);
  } else {
    logError("  ✗ pnpm not found");
    log("    Install: npm install -g pnpm", COLORS.dim);
    allGood = false;
  }

  // Check Claude CLI
  const claudeVersion = getVersion("claude", ["-v"]);
  if (claudeVersion) {
    logSuccess(`  ✓ Claude CLI ${claudeVersion}`);
  } else {
    logError("  ✗ Claude Code CLI not found");
    log("    Install: https://claude.ai/code", COLORS.dim);
    allGood = false;
  }

  console.log();

  if (allGood) {
    logSuccess("All requirements met! You can run: npx claudeship start");
  } else {
    logError("Some requirements are missing. Please install them first.");
    process.exit(1);
  }

  return allGood;
}

/**
 * Find an available port
 */
async function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

/**
 * Install dependencies if needed
 */
async function ensureDependencies() {
  const nodeModulesPath = path.join(ROOT_DIR, "node_modules");

  if (!fs.existsSync(nodeModulesPath)) {
    logInfo("Installing dependencies (first run)...");
    try {
      execSync("pnpm install", { cwd: ROOT_DIR, stdio: "inherit" });
      logSuccess("Dependencies installed!");
    } catch (error) {
      logError("Failed to install dependencies");
      process.exit(1);
    }
  }
}

/**
 * Start ClaudeShip
 */
async function start(options = {}) {
  showBanner();

  // Check requirements first
  const nodeVersion = getVersion("node");
  const pnpmExists = commandExists("pnpm");
  const claudeExists = commandExists("claude");

  if (!nodeVersion || !pnpmExists || !claudeExists) {
    logError("Missing requirements. Run 'npx claudeship doctor' to check.");
    process.exit(1);
  }

  // Install dependencies if needed
  await ensureDependencies();

  // Find available ports
  const preferredServerPort = options.server || 14000;
  const preferredWebPort = options.port || 13000;

  const serverPort = await findAvailablePort(preferredServerPort);
  const webPort = await findAvailablePort(
    serverPort === preferredWebPort ? preferredWebPort + 1 : preferredWebPort
  );

  console.log(`
${COLORS.bold}Starting ClaudeShip...${COLORS.reset}

  ${COLORS.green}Web App:${COLORS.reset}     http://localhost:${webPort}
  ${COLORS.blue}API Server:${COLORS.reset}  http://localhost:${serverPort}

  ${COLORS.dim}Press Ctrl+C to stop${COLORS.reset}
`);

  const apiUrl = `http://localhost:${serverPort}/api`;

  // Start backend
  const serverProc = spawn("pnpm", ["--filter", "@claudeship/server", "dev"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(serverPort),
      CORS_ORIGIN: `http://localhost:${webPort}`,
    },
    shell: true,
    stdio: "pipe",
  });

  serverProc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${COLORS.blue}[server]${COLORS.reset} ${line}`);
      }
    });
  });

  serverProc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${COLORS.blue}[server]${COLORS.reset} ${COLORS.red}${line}${COLORS.reset}`);
      }
    });
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Start frontend
  const webProc = spawn("pnpm", ["--filter", "@claudeship/web", "dev"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(webPort),
      NEXT_PUBLIC_API_URL: apiUrl,
    },
    shell: true,
    stdio: "pipe",
  });

  webProc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${COLORS.green}[web]${COLORS.reset}    ${line}`);
      }
    });
  });

  webProc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${COLORS.green}[web]${COLORS.reset}    ${COLORS.red}${line}${COLORS.reset}`);
      }
    });
  });

  // Handle shutdown
  const cleanup = () => {
    console.log(`\n${COLORS.yellow}Shutting down...${COLORS.reset}`);
    serverProc.kill("SIGTERM");
    webProc.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = {};
  let command = "start";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help" || arg === "help") {
      return { command: "help" };
    }

    if (arg === "-v" || arg === "--version") {
      return { command: "version" };
    }

    if (arg === "doctor") {
      return { command: "doctor" };
    }

    if (arg === "start") {
      command = "start";
      continue;
    }

    if ((arg === "-p" || arg === "--port") && args[i + 1]) {
      options.port = parseInt(args[++i]);
    }

    if ((arg === "-s" || arg === "--server") && args[i + 1]) {
      options.server = parseInt(args[++i]);
    }
  }

  return { command, options };
}

/**
 * Main entry point
 */
async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  switch (command) {
    case "help":
      showHelp();
      break;
    case "version":
      showVersion();
      break;
    case "doctor":
      await doctor();
      break;
    case "start":
    default:
      await start(options);
      break;
  }
}

main().catch((error) => {
  logError(error.message);
  process.exit(1);
});
