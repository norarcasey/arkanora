import { Arkanora } from './components/Arkanora'
import './App.css'

export default function App() {
  return (
    <main className="demo">
      <header className="demo__intro">
        <h1 className="demo__title">Arkanora 🧱</h1>
        <p className="demo__lede">
          Slide the paddle with your mouse (or the arrow keys / <kbd>A</kbd> <kbd>D</kbd>) to keep
          the ball alive and smash every brick. Miss the ball and you lose a life.
        </p>
      </header>

      <Arkanora />

      <p className="demo__credit">
        An embeddable React component. Drop <code>&lt;Arkanora /&gt;</code> anywhere.
      </p>
    </main>
  )
}
