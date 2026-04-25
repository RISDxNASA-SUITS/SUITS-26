import { useMemo, useState } from "react"
import { commsData } from "../data/dashboardData"
import starsIcon from "../../../assets/dashboard/stars.svg"

export function CommsHistory() {
  const [query, setQuery] = useState("")
  const [activeTag, setActiveTag] = useState(commsData.tags[0] ?? "")

  const normalizeText = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const filteredEntries = useMemo(() => {
    const value = normalizeText(query)
    if (!value) return commsData.entries

    return [...commsData.entries].sort((left, right) => {
      const leftMatch = normalizeText(left.message).includes(value) ? 1 : 0
      const rightMatch = normalizeText(right.message).includes(value) ? 1 : 0
      return rightMatch - leftMatch
    })
  }, [query])

  return (
    <section className="comms-panel comms-figma">
      <header className="comms-head">
        <h2 className="comms-title">COMMS HISTORY</h2>
        <form className="comms-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder=""
            aria-label="Search communications"
          />
          <button type="submit" className="comms-search-icon" aria-label="Search">
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <line x1="10.3" y1="10.3" x2="14.2" y2="14.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </form>
        <div className="comms-tags">
          {commsData.tags.map((tag, index) => (
            <button
              key={tag}
              type="button"
              className={`comms-tag ${activeTag === tag ? "active" : ""} ${index === 0 ? "tag-pr" : "tag-ev"}`}
              aria-pressed={activeTag === tag}
              onClick={() => setActiveTag(tag)}
            >
              <span>{tag}</span>
              {index > 0 ? <img className="comms-chip-icon" src={starsIcon} alt="" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      </header>

      <div className="comms-body">
        {filteredEntries.map((entry, index) => (
          <div key={`${entry.message}-${entry.time}`} className={`comms-row ${index === 0 ? "figma-first" : "figma-second"}`}>
            <p>{entry.message}</p>
            <time>{entry.time}</time>
          </div>
        ))}
      </div>
    </section>
  )
}
