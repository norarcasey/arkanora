import type { CSSProperties } from 'react'
import type { Ball, Brick } from '../game/types'

interface BoardProps {
  width: number
  height: number
  ball: Ball
  ballRadius: number
  paddleX: number
  paddleWidth: number
  paddleHeight: number
  paddleY: number
  bricks: Brick[]
}

/**
 * Renders the playfield. Everything is positioned as a percentage of the
 * board's unit space, so the whole thing scales fluidly to any pixel size.
 */
export function Board({
  width,
  height,
  ball,
  ballRadius,
  paddleX,
  paddleWidth,
  paddleHeight,
  paddleY,
  bricks,
}: BoardProps) {
  const pct = (value: number, span: number) => `${(value / span) * 100}%`

  const boardStyle: CSSProperties = { aspectRatio: `${width} / ${height}` }

  const ballStyle: CSSProperties = {
    left: pct(ball.x - ballRadius, width),
    top: pct(ball.y - ballRadius, height),
    width: pct(ballRadius * 2, width),
    height: pct(ballRadius * 2, height),
  }

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
      <div className="arkanora__paddle" style={paddleStyle} aria-hidden />
      <div className="arkanora__ball" style={ballStyle} aria-hidden />
    </div>
  )
}
