import { useState } from 'react'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <nav>
         <h1>susha.gg</h1>
         <ul>
          <li><a href="">Stats</a></li>
          <li><a href="">Builds</a></li>
          <li><a href="">Patch Notes</a></li>
          <li><a href="">Best Players</a></li>
         </ul>
      </nav>
    </div>
  )
}

export default App
