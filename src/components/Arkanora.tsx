import { useEffect } from 'react'
import { PADDLE_STEP, useArkanora } from '../game/useArkanora'
import { Board } from './Board'
import './Arkanora.css'

export interface ArkanoraProps {
  /** Number of brick rows. Default `5`. */
  rows?: number
  /** Number of brick columns. Default `9`. */
  cols?: number
  /** Lives before the game is over. Default `3`. */
  lives?: number
  /** Milliseconds between physics ticks; lower is smoother/faster. Default `16`. */
  speed?: number
  /** Steer the paddle with the arrow keys / A,D. Default `true`. */
  enableKeyboard?: boolean
  /** Heading shown above the board. Pass `null` to hide it. */
  title?: string | null
  /** Extra class on the root element. */
  className?: string
}

export function Arkanora({
  rows,
  cols,
  lives,
  speed,
  enableKeyboard = true,
  title = 'Arkanora',
  className,
}: ArkanoraProps) {
  const game = useArkanora({ rows, cols, lives, speed })
  const { status, start, nudgePaddle } = game

  useEffect(() => {
    if (!enableKeyboard) return

    const onKeyDown = (e: KeyboardEvent) => {
      const left = e.key === 'ArrowLeft' || e.key === 'a'
      const right = e.key === 'ArrowRight' || e.key === 'd'
      if (!left && !right) return
      e.preventDefault()
      if (status !== 'running') start()
      nudgePaddle(left ? -PADDLE_STEP : PADDLE_STEP)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enableKeyboard, status, start, nudgePaddle])

  // Pointer/touch: the paddle follows the cursor across the board.
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    game.movePaddle(((e.clientX - rect.left) / rect.width) * game.width)
  }

  const isOver = status === 'over' || status === 'won'

  return (
    <section
      className={`arkanora${className ? ` ${className}` : ''}`}
      aria-label={title ?? 'Breakout game'}
    >
      <header className="arkanora__header">
        {title !== null && <h2 className="arkanora__title">{title}</h2>}
        <span className="arkanora__stat" aria-live="polite">
          Score: {game.score}
        </span>
        <span className="arkanora__stat" aria-live="polite">
          Lives: {game.lives}
        </span>
      </header>

      <div className="arkanora__stage" onPointerMove={onPointerMove}>
        <Board
          width={game.width}
          height={game.height}
          ball={game.ball}
          ballRadius={game.ballRadius}
          paddleX={game.paddleX}
          paddleWidth={game.paddleWidth}
          paddleHeight={game.paddleHeight}
          paddleY={game.paddleY}
          bricks={game.bricks}
        />

        {status !== 'running' && (
          <div className="arkanora__overlay" role="status">
            {status === 'idle' && <p className="arkanora__message">Break some bricks!</p>}
            {status === 'over' && (
              <p className="arkanora__message">Game over — score {game.score}</p>
            )}
            {status === 'won' && <p className="arkanora__message">You cleared the board! 🏆</p>}
            <button type="button" className="arkanora__button" onClick={start}>
              {isOver ? 'Play again' : 'Start'}
            </button>
            <p className="arkanora__hint">Move with the mouse, or arrow keys / A,D</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default Arkanora
