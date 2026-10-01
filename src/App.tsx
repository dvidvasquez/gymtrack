import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './components/SessionProvider'
import { AppRouter } from './router/AppRouter'

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </BrowserRouter>
  )
}

export default App
