# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|---------|
| Architecture, scope, design review | Viper | "How should we structure the game?", "review this approach" |
| Game engine, mechanics, all JS/Canvas code | Maverick | "implement shooting", "add enemy planes", "fix the flight model" |
| HTML structure, HUD, UI | Maverick | "add a score display", "build the HUD" |
| Bug reports, edge cases, balance review | Goose | "test the landing mechanic", "check bomb collision" |
| Session logs, decisions, memory | Scribe | automatic — never needs routing |
| Backlog, work queue monitoring | Ralph | "Ralph, go", "what's on the board?" |
| Multi-domain (game + testing + architecture) | Viper + Maverick + Goose in parallel | "build the combat system" |

## Rules

1. **Eager by default** — spawn all agents who could usefully start work in parallel.
2. **Scribe always runs** after substantial work, always background.
3. **Quick facts → coordinator answers directly.**
4. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel.
5. **Anticipate downstream work.** Spawn Goose to review while Maverick builds.
