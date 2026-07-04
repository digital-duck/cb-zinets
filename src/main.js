import './style.css'
import { register, start, navigate } from './router.js'
import { Home } from './pages/Home.js'
import { Domain } from './pages/Domain.js'
import { About } from './pages/About.js'
import { Resources } from './pages/Resources.js'
import { Settings } from './pages/Settings.js'
import { BookPage } from './pages/BookPage.js'
import { Login } from './pages/Login.js'
import { checkAuth } from './services/auth.js'

const app = document.getElementById('app')

async function guarded(fn) {
  const user = await checkAuth()
  if (!user) { navigate('/login'); return }
  fn()
}

register('/', () => guarded(() => Home(app)))
register('/graph', () => guarded(() => Domain(app, {})))
register('/about', () => guarded(() => About(app)))
register('/resources', () => guarded(() => Resources(app)))
register('/settings', () => guarded(() => Settings(app)))
register('/domain/:id', (params) => guarded(() => Domain(app, params)))
register('/book', (params) => guarded(() => BookPage(app, params)))
register('/login', () => Login(app))

start()
