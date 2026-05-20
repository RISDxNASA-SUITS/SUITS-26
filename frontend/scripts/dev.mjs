import { spawn } from "node:child_process"
import net from "node:net"
import process from "node:process"
import readline from "node:readline/promises"

const TELEMETRY_PATH = "/telemetry/live"

function fail(message) {
  console.error(message)
  process.exit(1)
}

function formatHost(host) {
  return net.isIP(host) === 6 ? `[${host}]` : host
}

function validatePort(rawPort) {
  const port = Number.parseInt(rawPort, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return null
  }
  return String(port)
}

async function promptForHubTarget() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  try {
    const host = (await rl.question("Java Hub IP address: ")).trim()
    if (!host) {
      fail("A Java Hub IP address is required.")
    }

    if (net.isIP(host) === 0) {
      fail(`Invalid IP address: ${host}`)
    }

    const port = validatePort((await rl.question("Java Hub port: ")).trim())
    if (!port) {
      fail("A valid Java Hub port is required.")
    }

    return { host, port }
  } finally {
    rl.close()
  }
}

async function verifyHubWebSocket(host, port) {
  const wsUrl = `ws://${formatHost(host)}:${port}${TELEMETRY_PATH}`

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl)
    const timeout = setTimeout(() => {
      socket.close()
      reject(new Error(`Timed out connecting to ${wsUrl}`))
    }, 5000)

    socket.addEventListener("open", () => {
      clearTimeout(timeout)
      socket.close()
      resolve()
    })

    socket.addEventListener("error", () => {
      clearTimeout(timeout)
      reject(new Error(`Unable to connect to ${wsUrl}`))
    })
  })
}

async function main() {
  const { host, port } = await promptForHubTarget()
  await verifyHubWebSocket(host, port)

  const child = spawn("vite", ["--host"], {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_HUB_TARGET: `http://${formatHost(host)}:${port}`,
    },
  })

  process.on("SIGINT", () => child.kill("SIGINT"))
  process.on("SIGTERM", () => child.kill("SIGTERM"))

  child.on("error", (error) => fail(`Failed to start Vite: ${error.message}`))
  child.on("exit", (code, signal) => {
    process.exit(signal ? 1 : code ?? 0)
  })
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error))
})