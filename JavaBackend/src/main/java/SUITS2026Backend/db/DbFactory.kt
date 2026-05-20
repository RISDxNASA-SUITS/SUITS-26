package SUITS2026Backend.db

import org.jetbrains.exposed.sql.Database

object DbFactory {
    private var initialized = false

    fun init() {
        if (initialized) return
        Database.connect("jdbc:sqlite:sample.db", "org.sqlite.JDBC")
        initialized = true
    }
}
