import { StrictMode } from 'react'
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Arkanora } from './Arkanora'
import { useArkanora } from '../game/useArkanora'

describe('<Arkanora />', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a title, score, lives, and the idle overlay by default', () => {
    render(<Arkanora />)
    expect(screen.getByRole('heading', { name: 'Arkanora' })).toBeInTheDocument()
    expect(screen.getByText('Score: 0')).toBeInTheDocument()
    expect(screen.getByText('Lives: 3')).toBeInTheDocument()
    expect(screen.getByText('Break some bricks!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('hides the title when title is null', () => {
    render(<Arkanora title={null} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('starts on an arrow key and renders the full brick wall', () => {
    const { container } = render(<Arkanora rows={4} cols={6} />)
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.queryByText('Break some bricks!')).not.toBeInTheDocument()
    expect(container.querySelectorAll('.arkanora__brick')).toHaveLength(24)
  })
})

describe('useArkanora', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('moves the ball once running', () => {
    const { result } = renderHook(() => useArkanora())
    const before = { ...result.current.ball }

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(16 * 5))

    const after = result.current.ball
    expect(after.y).not.toBe(before.y)
  })

  it('breaks bricks and scores as the ball climbs into the wall (under StrictMode)', () => {
    // Deterministic: no randomness in the engine, fixed serve angle. The served
    // ball rises into a full-width wall it cannot slip through, so it must hit.
    const { result } = renderHook(() => useArkanora({ rows: 5, cols: 9 }), { wrapper: StrictMode })
    const total = result.current.bricks.length

    act(() => result.current.start())
    act(() => vi.advanceTimersByTime(16 * 150))

    expect(result.current.score).toBeGreaterThanOrEqual(1)
    expect(result.current.bricks.filter((b) => b.alive).length).toBeLessThan(total)
  })

  it('declares a win once the last brick is cleared', () => {
    const { result } = renderHook(() => useArkanora({ rows: 1, cols: 1 }))

    act(() => result.current.start())
    // One brick spanning the top: the rising ball clears it, then the board.
    act(() => vi.advanceTimersByTime(16 * 200))

    expect(result.current.status).toBe('won')
    expect(result.current.score).toBe(1)
  })

  it('clamps the paddle to the walls', () => {
    const { result } = renderHook(() => useArkanora())
    const half = result.current.paddleWidth / 2

    act(() => result.current.movePaddle(-50))
    expect(result.current.paddleX).toBe(half)

    act(() => result.current.movePaddle(999))
    expect(result.current.paddleX).toBe(result.current.width - half)
  })
})
