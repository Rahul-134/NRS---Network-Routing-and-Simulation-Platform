import Landing from './pages/Landing'
import Workspace from './pages/Workspace'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '')
  return path === '/app' ? <Workspace /> : <Landing />
}
