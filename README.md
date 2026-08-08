# Arkanora 🧱

An embeddable React + TypeScript breakout game. Slide the paddle with your
**mouse** (or the **arrow keys** / **A,D**), keep the ball alive, and smash
every brick. Miss the ball and you lose a life.

Every fourth brick drops a **gold capsule**. Catch it and every ball on the
board splits into three — the fastest way to clear a wall, if you're willing to
chase the capsule instead of the ball. You only lose a life when the _last_
ball leaves the board.

Built with **Vite** and tested with **Vitest** + **React Testing Library**.

## Quick start

```bash
npm install
npm run dev        # demo site at http://localhost:5173
npm test           # run the test suite
npm run build      # build the demo site for deployment
npm run build:lib  # build the embeddable component library
```

## Embedding the component

```tsx
import { Arkanora } from '@norarcasey/arkanora'
import '@norarcasey/arkanora/style.css'

export function App() {
  return <Arkanora />
}
```

`react` / `react-dom` are peer dependencies you already have.

### Props

| Prop             | Type             | Default      | Description                                          |
| ---------------- | ---------------- | ------------ | ---------------------------------------------------- |
| `rows`           | `number`         | `5`          | Number of brick rows.                                |
| `cols`           | `number`         | `9`          | Number of brick columns.                             |
| `lives`          | `number`         | `3`          | Lives before the game is over.                       |
| `speed`          | `number`         | `16`         | Milliseconds between physics ticks (lower = faster). |
| `powerUps`       | `boolean`        | `true`       | Drop multiball capsules from broken bricks.          |
| `powerUpEvery`   | `number`         | `4`          | Bricks to break per capsule dropped.                 |
| `enableKeyboard` | `boolean`        | `true`       | Steer the paddle with the arrow keys / A,D.          |
| `title`          | `string \| null` | `"Arkanora"` | Heading above the board; pass `null` to hide it.     |
| `className`      | `string`         | —            | Extra class on the root element.                     |

### Headless engine

The game logic lives in a framework-free hook if you want to build your own UI:

```tsx
import { useArkanora } from '@norarcasey/arkanora'

const game = useArkanora({ rows: 6, cols: 10 })
// game.balls, game.bricks, game.powerUps, game.paddleX
// game.score, game.lives, game.status
// game.start(), game.reset(), game.movePaddle(x), game.nudgePaddle(dx)
```

`game.balls` is never empty — the last ball leaving the board is what costs a
life. (`game.ball` still returns the first of them, but it's deprecated.)
Capsule drops are deterministic rather than random — one every `powerUpEvery`
bricks — so the engine stays a pure, replayable reducer.

The playfield is a fixed 100×100 unit square; positions and sizes are in those
units so the board scales to any pixel size.

## Roadmap

Paddle, balls, bricks, lives, win/lose, and the multiball capsule. Planned
flavor — multi-hit bricks, more power-ups (wide paddle, slow ball), and per-row
scoring.

Rendering is currently DOM-based, which is fine at this scale; a `<canvas>`
renderer is the natural next step if we add particle effects or smooth trails
(the engine is already decoupled from the view, so it'd be a Board-only swap).

## License

MIT © Nora Casey
