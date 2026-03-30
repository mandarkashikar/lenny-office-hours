# Lenny's Office Hours Data Pipeline Report

- Total podcast episodes processed: 291
- Total newsletter posts scanned: 349
- Unique podcast guests found: 291

## Guests found with 3+ episodes
- None found in this archive (all podcast guest names are unique entries).

## Topic coverage summary (podcasts)
- metrics-and-success: 68 episodes
- engineering-collaboration: 41 episodes
- prioritization: 34 episodes
- roadmapping: 4 episodes
- product-discovery: 2 episodes
- customer-interviewing: 1 episodes
- killing-features: 0 episodes

## Core guest + topic coverage
- Teresa Torres:
  - Good coverage: product-discovery, customer-interviewing
  - Sparse coverage: None
- Marty Cagan:
  - Good coverage: product-discovery, engineering-collaboration
  - Sparse coverage: None
- Shreyas Doshi:
  - Good coverage: prioritization, engineering-collaboration
  - Sparse coverage: None
- Claire Vo:
  - Good coverage: prioritization, engineering-collaboration
  - Sparse coverage: None
- Lenny Rachitsky:
  - Good coverage: product-discovery, prioritization, roadmapping, engineering-collaboration, metrics-and-success, killing-features
  - Sparse coverage: None

## Gaps / issues
- No podcast guest appears 3+ times, so repeat-guest depth is limited in the podcast dataset.
- One synthetic/test-looking Claire Vo podcast entry exists (`19ebe4cd49f9-claire-vo-openclaw.md`) and was included where relevant.
- Lenny Rachitsky context is sourced from newsletters (author corpus), not podcast guest entries.
- Topic assignment is heuristic (title/description/tags keyword matching), intended for RAG indexing rather than perfect taxonomy.