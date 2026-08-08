# Changelog

All notable changes to this project are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-08

### Added

- **Multiball power-up.** Every fourth brick broken drops a gold capsule; catch
  it with the paddle and every ball on the board splits into three (capped at
  eight). The first level was a slow single-ball grind — this gives the player
  something to chase and a way to clear a wall fast, at the risk of abandoning
  the ball to go get it.
- `powerUps` and `powerUpEvery` props / hook options to tune or disable drops.
  Capsules drop on a fixed cadence rather than at random, so the engine stays a
  pure, replayable reducer.

### Changed

- The engine now tracks `balls: Ball[]` instead of a single ball, and a life is
  only lost when the _last_ ball leaves the board. `ArkanoraApi.ball` still
  returns the first ball and is deprecated; custom renderers should map over
  `balls` and `powerUps`.

## [0.1.1] - 2026-08-07

### Fixed

- The component now carries its own dark surface instead of relying on the
  embedding page to provide one. The score and lives readouts sit in a header
  above the board, so on a light host they were accent cyan on white at 1.56:1,
  well under the 4.5:1 WCAG AA minimum. They now sit on the game's own
  background at roughly 12:1, and the component looks the same on any host.

## [0.1.0] - 2026-06-04

### Added

- Initial release of Arkanora — an embeddable React + TypeScript breakout game.
- `<Arkanora />` component: a fluid 100×100-unit playfield with a paddle steered
  by the mouse or the arrow keys / A,D, continuous ball physics with
  angle-control bounces off the paddle, a rainbow brick wall, lives, and a
  start / game-over overlay. Lose a life on a miss; win by clearing every brick.
- `useArkanora()` hook owning the whole game as a single pure-reducer physics
  engine — StrictMode-safe and correct when several ticks fire between renders.
- Framework-free types and a Vitest + React Testing Library suite, including a
  StrictMode regression test for the reducer and deterministic brick-break and
  win tests.
- Vite library build emitting ESM + bundled type declarations, with `react` and
  `react-dom` kept external as peer dependencies.
- ESLint + Prettier with no-type-assertion and no-non-null-assertion rules, and
  a CI workflow (lint, format, typecheck, test, build) on Node 20.x / 22.x.
- Trusted Publishing release pipeline (GitHub Release → OIDC publish with
  provenance), idempotent so a release for an already-published version is a
  no-op instead of a failure.

[0.2.0]: https://www.npmjs.com/package/@norarcasey/arkanora/v/0.2.0
[0.1.1]: https://www.npmjs.com/package/@norarcasey/arkanora/v/0.1.1
[0.1.0]: https://www.npmjs.com/package/@norarcasey/arkanora/v/0.1.0
