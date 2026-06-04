import { useCallback, useEffect, useReducer } from 'react'
import type { Ball, Brick, GameStatus } from './types'

export interface UseArkanoraOptions {
  /** Number of brick rows. Default `5`. */
  rows?: number
  /** Number of brick columns. Default `9`. */
  cols?: number
  /** Lives before the game is over. Default `3`. */
  lives?: number
  /** Milliseconds between physics ticks; lower is smoother/faster. Default `16`. */
  speed?: number
}

export interface ArkanoraApi {
  /** Playfield width in units (always 100). */
  width: number
  /** Playfield height in units (always 100). */
  height: number
  ball: Ball
  ballRadius: number
  /** Center x of the paddle, in units. */
  paddleX: number
  paddleWidth: number
  paddleHeight: number
  /** The paddle's top edge, in units. */
  paddleY: number
  bricks: Brick[]
  status: GameStatus
  score: number
  lives: number
  /** Reset the board and serve the ball. */
  start: () => void
  /** Reset the board to `idle` without serving. */
  reset: () => void
  /** Move the paddle so its center sits at unit-x `x` (clamped to the walls). */
  movePaddle: (x: number) => void
  /** Nudge the paddle by `dx` units (clamped to the walls). */
  nudgePaddle: (dx: number) => void
}

// --- Playfield geometry (units) -------------------------------------------
const W = 100
const H = 100
const PADDLE_W = 18
const PADDLE_H = 2.6
const PADDLE_Y = 92
const BALL_R = 1.6
const BALL_SPEED = 1.25 // magnitude of the velocity vector, per tick
const SERVE_ANGLE = 0.35 // radians off vertical when served (~20°)
const MAX_BOUNCE = 1.05 // radians; widest deflection off the paddle edge (~60°)
const PADDLE_STEP = 6 // units per keyboard nudge
// --- Brick layout ---------------------------------------------------------
const BRICK_TOP = 10
const BRICK_H = 4
const ROW_GAP = 1.4
const COL_GAP = 1.4
const SIDE = 3

const DEFAULTS = { rows: 5, cols: 9, lives: 3, speed: 16 }

interface GameState {
  rows: number
  cols: number
  maxLives: number
  ball: Ball
  paddleX: number
  bricks: Brick[]
  status: GameStatus
  score: number
  lives: number
}

type GameAction =
  | { type: 'configure'; rows: number; cols: number; lives: number }
  | { type: 'reset' }
  | { type: 'start' }
  | { type: 'movePaddle'; x: number }
  | { type: 'nudgePaddle'; dx: number }
  | { type: 'tick' }

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function buildBricks(rows: number, cols: number): Brick[] {
  const brickW = (W - 2 * SIDE - COL_GAP * (cols - 1)) / cols
  const bricks: Brick[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: SIDE + c * (brickW + COL_GAP),
        y: BRICK_TOP + r * (BRICK_H + ROW_GAP),
        w: brickW,
        h: BRICK_H,
        alive: true,
      })
    }
  }
  return bricks
}

/** Ball resting on (and about to launch from) the paddle at center-x `x`. */
function serveBall(x: number): Ball {
  return {
    x,
    y: PADDLE_Y - BALL_R - 0.2,
    vx: BALL_SPEED * Math.sin(SERVE_ANGLE),
    vy: -BALL_SPEED * Math.cos(SERVE_ANGLE),
  }
}

function makeInitial(rows: number, cols: number, lives: number): GameState {
  return {
    rows,
    cols,
    maxLives: lives,
    ball: serveBall(W / 2),
    paddleX: W / 2,
    bricks: buildBricks(rows, cols),
    status: 'idle',
    score: 0,
    lives,
  }
}

// The whole game advances in one pure reducer: each tick computes the next
// state from the previous one in a single step. Keeping it pure means it stays
// correct when several ticks fire between renders and under StrictMode's
// double-invocation — both of which break a loop that juggles many setters.
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'configure':
      return makeInitial(action.rows, action.cols, action.lives)
    case 'reset':
      return makeInitial(state.rows, state.cols, state.maxLives)
    case 'start':
      return { ...makeInitial(state.rows, state.cols, state.maxLives), status: 'running' }
    case 'movePaddle':
      return { ...state, paddleX: clamp(action.x, PADDLE_W / 2, W - PADDLE_W / 2) }
    case 'nudgePaddle':
      return { ...state, paddleX: clamp(state.paddleX + action.dx, PADDLE_W / 2, W - PADDLE_W / 2) }
    case 'tick': {
      if (state.status !== 'running') return state

      const ball: Ball = {
        x: state.ball.x + state.ball.vx,
        y: state.ball.y + state.ball.vy,
        vx: state.ball.vx,
        vy: state.ball.vy,
      }

      // Side and top walls.
      if (ball.x - BALL_R < 0) {
        ball.x = BALL_R
        ball.vx = Math.abs(ball.vx)
      } else if (ball.x + BALL_R > W) {
        ball.x = W - BALL_R
        ball.vx = -Math.abs(ball.vx)
      }
      if (ball.y - BALL_R < 0) {
        ball.y = BALL_R
        ball.vy = Math.abs(ball.vy)
      }

      // Paddle: deflect with an angle that depends on where it was struck, so
      // the player can aim. Only when the ball is heading down into it.
      const halfW = PADDLE_W / 2
      if (
        ball.vy > 0 &&
        ball.y + BALL_R >= PADDLE_Y &&
        ball.y - BALL_R <= PADDLE_Y + PADDLE_H &&
        ball.x >= state.paddleX - halfW &&
        ball.x <= state.paddleX + halfW
      ) {
        const hit = clamp((ball.x - state.paddleX) / halfW, -1, 1)
        const angle = hit * MAX_BOUNCE
        ball.vx = BALL_SPEED * Math.sin(angle)
        ball.vy = -BALL_SPEED * Math.cos(angle)
        ball.y = PADDLE_Y - BALL_R
      }

      // Bricks: resolve at most one hit per tick. Reflect off whichever axis
      // the ball penetrated least — that's the face it actually struck.
      let bricks = state.bricks
      let score = state.score
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i]
        if (!b.alive) continue
        const hitX = ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w
        const hitY = ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h
        if (!hitX || !hitY) continue

        const overlapX = Math.min(ball.x + BALL_R, b.x + b.w) - Math.max(ball.x - BALL_R, b.x)
        const overlapY = Math.min(ball.y + BALL_R, b.y + b.h) - Math.max(ball.y - BALL_R, b.y)
        if (overlapX < overlapY) ball.vx = -ball.vx
        else ball.vy = -ball.vy

        bricks = bricks.map((other, j) => (j === i ? { ...other, alive: false } : other))
        score += 1
        break
      }

      // Missed the paddle and left the bottom of the board.
      if (ball.y - BALL_R > H) {
        const lives = state.lives - 1
        if (lives <= 0) {
          return { ...state, ball, bricks, score, lives: 0, status: 'over' }
        }
        return { ...state, bricks, score, lives, ball: serveBall(state.paddleX) }
      }

      if (bricks.every((b) => !b.alive)) {
        return { ...state, ball, bricks, score, status: 'won' }
      }

      return { ...state, ball, bricks, score }
    }
  }
}

export function useArkanora(options: UseArkanoraOptions = {}): ArkanoraApi {
  const rows = options.rows ?? DEFAULTS.rows
  const cols = options.cols ?? DEFAULTS.cols
  const lives = options.lives ?? DEFAULTS.lives
  const speed = options.speed ?? DEFAULTS.speed

  const [state, dispatch] = useReducer(reducer, undefined, () => makeInitial(rows, cols, lives))

  // Re-seed the board whenever its configuration changes.
  useEffect(() => {
    dispatch({ type: 'configure', rows, cols, lives })
  }, [rows, cols, lives])

  const start = useCallback(() => dispatch({ type: 'start' }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])
  const movePaddle = useCallback((x: number) => dispatch({ type: 'movePaddle', x }), [])
  const nudgePaddle = useCallback((dx: number) => dispatch({ type: 'nudgePaddle', dx }), [])

  // The game loop: tick on an interval only while running.
  useEffect(() => {
    if (state.status !== 'running') return
    const id = setInterval(() => dispatch({ type: 'tick' }), speed)
    return () => clearInterval(id)
  }, [state.status, speed])

  return {
    width: W,
    height: H,
    ball: state.ball,
    ballRadius: BALL_R,
    paddleX: state.paddleX,
    paddleWidth: PADDLE_W,
    paddleHeight: PADDLE_H,
    paddleY: PADDLE_Y,
    bricks: state.bricks,
    status: state.status,
    score: state.score,
    lives: state.lives,
    start,
    reset,
    movePaddle,
    nudgePaddle,
  }
}

export { PADDLE_STEP }
