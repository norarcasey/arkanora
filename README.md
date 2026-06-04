# Arkanora 🧱

An embeddable React + TypeScript breakout game. Slide the paddle with your
**mouse** (or the **arrow keys** / **A,D**), keep the ball alive, and smash
every brick. Miss the ball and you lose a life.

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
| `enableKeyboard` | `boolean`        | `true`       | Steer the paddle with the arrow keys / A,D.          |
| `title`          | `string \| null` | `"Arkanora"` | Heading above the board; pass `null` to hide it.     |
| `className`      | `string`         | —            | Extra class on the root element.                     |

### Headless engine

The game logic lives in a framework-free hook if you want to build your own UI:

```tsx
import { useArkanora } from '@norarcasey/arkanora'

const game = useArkanora({ rows: 6, cols: 10 })
// game.ball, game.bricks, game.paddleX, game.score, game.lives, game.status
// game.start(), game.reset(), game.movePaddle(x), game.nudgePaddle(dx)
```

The playfield is a fixed 100×100 unit square; positions and sizes are in those
units so the board scales to any pixel size.

## Roadmap

This is the MVP: paddle, ball, bricks, lives, win/lose. Planned flavor —
multi-hit bricks, power-ups (multiball, wide paddle), and per-row scoring.

Rendering is currently DOM-based, which is fine at this scale; a `<canvas>`
renderer is the natural next step if we add particle effects or smooth trails
(the engine is already decoupled from the view, so it'd be a Board-only swap).

## License

MIT © Nora Casey
