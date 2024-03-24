import { useEffect, useState } from 'react'
import './App.css'
import { render } from './render'

function App() {
  const [res, setRes] = useState('')

  useEffect(() => {
    render()
      .then(v => setRes(v))
      .catch(e => {
        console.error(e)
      })
  }, [])


  return (
    <div>
      {res}
    </div>
  )
}

export default App
