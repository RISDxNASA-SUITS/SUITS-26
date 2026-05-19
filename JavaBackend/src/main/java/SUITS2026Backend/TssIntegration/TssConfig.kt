package SUITS2026Backend.TssIntegration

/**
 * TSS connection settings. Call [init] once at startup before any UDP traffic.
 *
 * Host precedence: CLI argument, then `TSS_HOST`, then `127.0.0.1`.
 */
object TssConfig {
    var host: String = "127.0.0.1"
        private set

    val port: Int
        get() = (System.getenv("TSS_UDP_PORT") ?: System.getenv("PORT") ?: "14141").toInt()

    val socketTimeoutMs: Int
        get() = (System.getenv("TSS_TIMEOUT_MS") ?: "1500").toInt()

    /** Poll interval for the live telemetry WebSocket broadcaster (ms). */
    val telemetryPollIntervalMs: Long
        get() = (System.getenv("TELEMETRY_POLL_INTERVAL_MS") ?: "1000").toLong()

    @JvmStatic
    fun init(cliHost: String?) {
        host = cliHost?.trim()?.takeIf { it.isNotEmpty() }
            ?: System.getenv("TSS_HOST")?.trim()?.takeIf { it.isNotEmpty() }
            ?: "127.0.0.1"
        println("TSS target: $host:$port (timeout ${socketTimeoutMs}ms, poll ${telemetryPollIntervalMs}ms)")
    }
}
