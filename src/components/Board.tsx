import type { CSSProperties } from 'react'
import type { Ball, Brick, PowerUp } from '../game/types'

interface BoardProps {
  width: number
  height: number
  balls: Ball[]
  ballRadius: number
  paddleX: number
  paddleWidth: number
  paddleHeight: number
  paddleY: number
  bricks: Brick[]
  powerUps: PowerUp[]
  powerUpWidth: number
  powerUpHeight: number
}

/**
 * Renders the playfield. Everything is positioned as a percentage of the
 * board's unit space, so the whole thing scales fluidly to any pixel size.
 */
export function Board({
  width,
  height,
  balls,
  ballRadius,
  paddleX,
  paddleWidth,
  paddleHeight,
  paddleY,
  bricks,
  powerUps,
  powerUpWidth,
  powerUpHeight,
}: BoardProps) {
  const pct = (value: number, span: number) => `${(value / span) * 100}%`

  const boardStyle: CSSProperties = { aspectRatio: `${width} / ${height}` }

  const paddleStyle: CSSProperties = {
    left: pct(paddleX - paddleWidth / 2, width),
    top: pct(paddleY, height),
    width: pct(paddleWidth, width),
    height: pct(paddleHeight, height),
  }

  return (
    <div className="arkanora__board" style={boardStyle} data-testid="board">
      {bricks.map((b, i) =>
        b.alive ? (
          <div
            key={i}
            className="arkanora__brick"
            style={{
              left: pct(b.x, width),
              top: pct(b.y, height),
              width: pct(b.w, width),
              height: pct(b.h, height),
              // Color rows along a hue ramp for a retro rainbow wall.
              backgroundColor: `hsl(${(b.y * 7) % 360} 80% 58%)`,
            }}
            aria-hidden
          />
        ) : null,
      )}
      {powerUps.map((p, i) => (
        <div
          key={i}
          className="arkanora__powerup"
          style={{
            left: pct(p.x - powerUpWidth / 2, width),
            top: pct(p.y, height),
            width: pct(powerUpWidth, width),
            height: pct(powerUpHeight, height),
          }}
          aria-hidden
          data-testid="powerup"
        />
      ))}
      <div className="arkanora__paddle" style={paddleStyle} aria-hidden />
      {balls.map((ball, i) => (
        <div
          key={i}
          className="arkanora__ball"
          style={{
            left: pct(ball.x - ballRadius, width),
            top: pct(ball.y - ballRadius, height),
            width: pct(ballRadius * 2, width),
            height: pct(ballRadius * 2, height),
          }}
          aria-hidden
        />
      ))}
    </div>
  )
}
