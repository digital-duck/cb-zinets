const translations = {
  en: {
    'app.title': 'ZiNets ConceptBook',
    'app.tagline': 'Learn Chinese characters the LEGO way',
    'nav.about': 'About',
    'nav.settings': 'Settings',
    'home.subtitle': 'Explore the Chinese character graph',
    'home.filter.all': 'All',
    'home.filter.level': 'Level',
    'card.nodes': 'nodes',
    'card.edges': 'edges',
    'card.explore': 'Explore Concept-Graph',
    'card.read': 'Read book',
    'domain.back': '← Back',
    'domain.openFullscreen': 'Open fullscreen',
    'about.title': 'About ZiNets ConceptBook',
    'loading': 'Loading…',
  },
}

let _locale = localStorage.getItem('cb-lang') || 'en'

export function t(key) {
  return (translations[_locale] || translations.en)[key] ?? key
}

export function setLocale(lang) {
  _locale = lang
  localStorage.setItem('cb-lang', lang)
}

export function getLocale() {
  return _locale
}
