import { useState } from 'react'
import Navbar from './components/Navbar'
import Search from './components/Search'
import Content from './components/Content'  

import './App.css'

function App() {
  // const [count, setCount] = useState(0)

  return (
    <>
    <Navbar />
    <main>
        <Search />
        <div className="content-container">
          <Content />
        </div>
    </main>
    </>
  )
}

export default App
