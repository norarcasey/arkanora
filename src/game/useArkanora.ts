import { useCallback, useEffect, useReducer } from 'react'
import type { Ball, Brick, GameStatus, PowerUp } from './types'

export interface UseArkanoraOptions {
  /** Number of brick rows. Default `5`. */
  rows?: number
  /** Number of brick columns. Default `9`. */
  cols?: number
  /** Lives before the game is over. Default `3`. */
  lives?: number
  /** Milliseconds between physics ticks; lower is smoother/faster. Default `16`. */
  speed?: number
  /** Drop multiball capsules from broken bricks. Default `true`. */
  powerUps?: boolean
  /** Bricks to break per capsule dropped. Default `4`. */
  powerUpEvery?: number
}

export interface ArkanoraApi {
  /** Playfield width in units (always 100). */
  width: number
  /** Playfield height in units (always 100). */
  height: number
  /** Every ball in play. Never empty — a life is lost when the last one drops. */
  balls: Ball[]
  /** @deprecated The first ball in {@link balls}; use `balls` to see them all. */
  ball: Ball
  ballRadius: number
  /** Center x of the paddle, in units. */
  paddleX: number
  paddleWidth: number
  paddleHeight: number
  /** The paddle's top edge, in units. */
  paddleY: number
  bricks: Brick[]
  /** Capsules currently falling toward the paddle. */
  powerUps: PowerUp[]
  powerUpWidth: number
  powerUpHeight: number
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
// --- Power-ups ------------------------------------------------------------
const POWERUP_W = 7
const POWERUP_H = 2.6
// Roughly 70% of the ball's speed: fast enough that going for a capsule is a
// real option rather than a two-second commitment away from the ball.
const POWERUP_FALL = 0.9 // units per tick
const SPLIT_ANGLE = 0.42 // radians; how far the two new balls fan out (~24°)
const MAX_BALLS = 8 // past this the board is soup, not a game

const DEFAULTS = { rows: 5, cols: 9, lives: 3, speed: 16, powerUps: true, powerUpEvery: 4 }

interface GameState {
  rows: number
  cols: number
  maxLives: number
  powerUpEvery: number
  balls: Ball[]
  paddleX: number
  bricks: Brick[]
  powerUps: PowerUp[]
  /** Bricks broken this life, so capsules drop on a fixed cadence. */
  broken: number
  status: GameStatus
  score: number
  lives: number
}

interface Config {
  rows: number
  cols: number
  lives: number
  powerUpEvery: number
}

type GameAction =
  | ({ type: 'configure' } & Config)
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

/** The two extra balls a caught capsule fans out of an existing one. */
function split(ball: Ball): Ball[] {
  const speed = Math.hypot(ball.vx, ball.vy)
  const heading = Math.atan2(ball.vy, ball.vx)
  return [SPLIT_ANGLE, -SPLIT_ANGLE].map((offset) => ({
    x: ball.x,
    y: ball.y,
    vx: speed * Math.cos(heading + offset),
    vy: speed * Math.sin(heading + offset),
  }))
}

function makeInitial(config: Config): GameState {
  return {
    rows: config.rows,
    cols: config.cols,
    maxLives: config.lives,
    powerUpEvery: config.powerUpEvery,
    balls: [serveBall(W / 2)],
    paddleX: W / 2,
    bricks: buildBricks(config.rows, config.cols),
    powerUps: [],
    broken: 0,
    status: 'idle',
    score: 0,
    lives: config.lives,
  }
}

function configOf(state: GameState): Config {
  return {
    rows: state.rows,
    cols: state.cols,
    lives: state.maxLives,
    powerUpEvery: state.powerUpEvery,
  }
}

// The whole game advances in one pure reducer: each tick computes the next
// state from the previous one in a single step. Keeping it pure means it stays
// correct when several ticks fire between renders and under StrictMode's
// double-invocation — both of which break a loop that juggles many setters.
function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'configure':
      return makeInitial(action)
    case 'reset':
      return makeInitial(configOf(state))
    case 'start':
      return { ...makeInitial(configOf(state)), status: 'running' }
    case 'movePaddle':
      return { ...state, paddleX: clamp(action.x, PADDLE_W / 2, W - PADDLE_W / 2) }
    case 'nudgePaddle':
      return { ...state, paddleX: clamp(state.paddleX + action.dx, PADDLE_W / 2, W - PADDLE_W / 2) }
    case 'tick': {
      if (state.status !== 'running') return state

      const halfW = PADDLE_W / 2
      let bricks = state.bricks
      let bricksCopied = false
      let score = state.score
      let broken = state.broken
      let powerUps = state.powerUps
      const dropped: PowerUp[] = []

      const balls: Ball[] = []
      for (const previous of state.balls) {
        const ball: Ball = {
          x: previous.x + previous.vx,
          y: previous.y + previous.vy,
          vx: previous.vx,
          vy: previous.vy,
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

        // Bricks: resolve at most one hit per ball per tick. Reflect off
        // whichever axis the ball penetrated least — the face it truly struck.
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

          if (!bricksCopied) {
            bricks = bricks.slice()
            bricksCopied = true
          }
          bricks[i] = { ...b, alive: false }
          score += 1
          broken += 1

          // Capsules drop on a fixed cadence rather than at random: the engine
          // is a pure reducer, and a deterministic drop keeps it replayable.
          if (state.powerUpEvery > 0 && broken % state.powerUpEvery === 0) {
            dropped.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, kind: 'multiball' })
          }
          break
        }

        // Keep only the balls still on the board.
        if (ball.y - BALL_R <= H) balls.push(ball)
      }

      // Capsules fall, and are caught when they reach the paddle's band.
      if (powerUps.length > 0 || dropped.length > 0) {
        const next: PowerUp[] = []
        let caught = false
        for (const p of powerUps) {
          const y = p.y + POWERUP_FALL
          const overlapsPaddle =
            y + POWERUP_H >= PADDLE_Y &&
            y <= PADDLE_Y + PADDLE_H &&
            p.x + POWERUP_W / 2 >= state.paddleX - halfW &&
            p.x - POWERUP_W / 2 <= state.paddleX + halfW
          if (overlapsPaddle) {
            caught = true
            continue
          }
          if (y <= H) next.push({ ...p, y })
        }
        powerUps = next.concat(dropped)

        // Multiball: every ball in play fans into three, up to the cap. A
        // capsule caught on the last ball's way out still leaves nothing to
        // split, so the life is lost as usual.
        if (caught) {
          for (const ball of balls.slice()) {
            if (balls.length >= MAX_BALLS) break
            balls.push(...split(ball).slice(0, MAX_BALLS - balls.length))
          }
        }
      }

      // Every ball left the bottom of the board: that costs a life.
      if (balls.length === 0) {
        const lives = state.lives - 1
        const spent = { ...state, bricks, score, broken, powerUps: [] }
        if (lives <= 0) {
          return { ...spent, balls: [serveBall(state.paddleX)], lives: 0, status: 'over' }
        }
        return { ...spent, balls: [serveBall(state.paddleX)], lives, broken: 0 }
      }

      if (bricks.every((b) => !b.alive)) {
        return { ...state, balls, bricks, score, broken, powerUps, status: 'won' }
      }

      return { ...state, balls, bricks, score, broken, powerUps }
    }
  }
}

export function useArkanora(options: UseArkanoraOptions = {}): ArkanoraApi {
  const rows = options.rows ?? DEFAULTS.rows
  const cols = options.cols ?? DEFAULTS.cols
  const lives = options.lives ?? DEFAULTS.lives
  const speed = options.speed ?? DEFAULTS.speed
  // Turning power-ups off is the same thing as never reaching the drop cadence.
  const powerUpEvery =
    (options.powerUps ?? DEFAULTS.powerUps) ? (options.powerUpEvery ?? DEFAULTS.powerUpEvery) : 0

  const [state, dispatch] = useReducer(reducer, undefined, () =>
    makeInitial({ rows, cols, lives, powerUpEvery }),
  )

  // Re-seed the board whenever its configuration changes.
  useEffect(() => {
    dispatch({ type: 'configure', rows, cols, lives, powerUpEvery })
  }, [rows, cols, lives, powerUpEvery])

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
    balls: state.balls,
    ball: state.balls[0],
    ballRadius: BALL_R,
    paddleX: state.paddleX,
    paddleWidth: PADDLE_W,
    paddleHeight: PADDLE_H,
    paddleY: PADDLE_Y,
    bricks: state.bricks,
    powerUps: state.powerUps,
    powerUpWidth: POWERUP_W,
    powerUpHeight: POWERUP_H,
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
