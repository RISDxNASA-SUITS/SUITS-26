package SUITS2026Backend.db

import org.jetbrains.exposed.sql.Database
import java.io.File

object DbFactory {
    private var initialized = false

    private fun resolveDbPath(): String {
        val userDir = File(System.getProperty("user.dir"))
        val direct = File(userDir, "sample.db")
        if (direct.exists() || userDir.name.equals("JavaBackend", ignoreCase = true)) {
            return direct.absolutePath
        }

        val javaBackendChild = File(userDir, "JavaBackend\\sample.db")
        if (javaBackendChild.exists()) {
            return javaBackendChild.absolutePath
        }

        return direct.absolutePath
    }

    fun init() {
        if (initialized) return
        Database.connect("jdbc:sqlite:${resolveDbPath()}", "org.sqlite.JDBC")
        initialized = true
    }
}
