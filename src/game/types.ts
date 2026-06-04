// Framework-free types shared by the game engine and the React layer.
//
// The playfield is a fixed 100×100 unit square. Every position and size is
// expressed in those units, so the React layer can render them directly as
// percentages and the board scales fluidly to any pixel size.

/** The ball: a position and a velocity (units per tick). */
export interface Ball {
  x: number
  y: number
  vx: number
  vy: number
}

/** A single brick. Axis-aligned, top-left origin. */
export interface Brick {
  x: number
  y: number
  w: number
  h: number
  alive: boolean
}

/**
 * Lifecycle of a single game:
 *  - `idle`    — board is set up, ball resting on the paddle, waiting to start.
 *  - `running` — the ball is in play.
 *  - `over`    — the ball was missed with no lives left.
 *  - `won`     — every brick has been cleared.
 */
export type GameStatus = 'idle' | 'running' | 'over' | 'won'
