import './style.css'
import { register, start } from './router.js'
import { GraphBuilder } from './pages/GraphBuilder.js'
import { Settings } from './pages/Settings.js'
import { BookPage } from './pages/BookPage.js'

const app = document.getElementById('app')

// Default page: Graph Builder with vis.js visualization
register('/', (params) => GraphBuilder(app, params))
register('/graph', (params) => GraphBuilder(app, params))
register('/book', (params) => BookPage(app, params))
register('/settings', () => Settings(app))

start()
