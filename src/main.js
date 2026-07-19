import './style.css'
import { register, start, navigate } from './router.js'
import { Home } from './pages/Home.js'
import { DomainGraph } from './pages/DomainGraph.js'
import { About } from './pages/About.js'
import { Resources } from './pages/Resources.js'
import { Settings } from './pages/Settings.js'
import { BookContent } from './pages/BookContent.js'
import { Login } from './pages/Login.js'
import { checkAuth, setToken } from './services/auth.js'

const app = document.getElementById('app')

// The Pages static build (no backend — see docs/DEV/readme-pub-github.md)
// sets this so the read-only viewer pages don't redirect to a login screen
// that can never succeed without an API to call.
const PUBLIC_READONLY = import.meta.env.VITE_PUBLIC_READONLY === 'true'

async function guarded(fn) {
  if (PUBLIC_READONLY) { fn(); return }
  const user = await checkAuth()
  if (!user) { navigate('/login'); return }
  fn()
}

register('/', () => guarded(() => Home(app)))
register('/graph', () => guarded(() => DomainGraph(app, {})))
register('/about', () => guarded(() => About(app)))
register('/resources', () => guarded(() => Resources(app)))
register('/settings', () => guarded(() => Settings(app)))
register('/domain/:id', (params) => guarded(() => DomainGraph(app, params)))
register('/book', (params) => guarded(() => BookContent(app, params)))
register('/login', (params) => Login(app, params))

// Google OAuth lands here: /api/auth/google/callback redirects to
// {frontend_url}#/auth/callback?token=<cb_sessions token>
register('/auth/callback', async (params) => {
  if (params.token) {
    setToken(params.token)
    await checkAuth()  // fetch + store the user object
    navigate('/')
  } else {
    navigate('/login')
  }
})

start()
