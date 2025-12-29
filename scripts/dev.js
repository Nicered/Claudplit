#!/usr/bin/env node

/**
 * Development server launcher with dynamic port allocation
 * Finds available ports and starts both frontend and backend servers
 */

const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");

/**
 * Find an available port starting from the given port
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
 * Start a process with the given command
 */
function startProcess(name, command, args, env, cwd) {
  const proc = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    shell: true,
    stdio: "pipe",
  });

  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`[${name}] ${line}`);
      }
    });
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`[${name}] ${line}`);
      }
    });
  });

  proc.on("close", (code) => {
    console.log(`[${name}] Process exited with code ${code}`);
  });

  return proc;
}

async function main() {
  console.log("Finding available ports...\n");

  // Find available ports (prefer 14000/13000, but use alternatives if busy)
  const serverPort = await findAvailablePort(14000);
  const webPort = await findAvailablePort(serverPort === 13000 ? 13001 : 13000);

  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║                   ClaudeShip Dev Server                    ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║  API Server:  http://localhost:${serverPort}                       ║`);
  console.log(`║  Web App:     http://localhost:${webPort}                        ║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const apiUrl = `http://localhost:${serverPort}/api`;

  // Start backend server
  const serverProc = startProcess(
    "server",
    "pnpm",
    ["--filter", "@claudeship/server", "dev"],
    {
      PORT: String(serverPort),
      CORS_ORIGIN: `http://localhost:${webPort}`,
    },
    ROOT_DIR
  );

  // Wait a bit for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Start frontend
  const webProc = startProcess(
    "web",
    "pnpm",
    ["--filter", "@claudeship/web", "dev"],
    {
      PORT: String(webPort),
      NEXT_PUBLIC_API_URL: apiUrl,
    },
    ROOT_DIR
  );

  // Handle shutdown
  const cleanup = () => {
    console.log("\nShutting down...");
    serverProc.kill("SIGTERM");
    webProc.kill("SIGTERM");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("Failed to start dev servers:", err);
  process.exit(1);
});
