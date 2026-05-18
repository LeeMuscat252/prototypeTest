export const themes = {
  'simple-light': {
    name: 'Simple Light Theme',
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    navigationBg: '#ffffff',
    navigationLink: '#333333',
    navigationBorder: '#e0e0e0',
    buttonBg: '#0066ff',
    buttonText: '#ffffff',
    buttonHover: '#0052cc',
    cardBg: '#ffffff',
    cardBorder: '#e0e0e0',
    shadow: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '4px',
    border: '#cccccc',
  },

  'dark': {
    name: 'Dark Theme',
    background: '#1a1a1a',
    backgroundSecondary: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#cccccc',
    navigationBg: '#0d0d0d',
    navigationLink: '#ffffff',
    navigationBorder: '#444444',
    buttonBg: '#00a8ff',
    buttonText: '#ffffff',
    buttonHover: '#0088cc',
    cardBg: '#2d2d2d',
    cardBorder: '#444444',
    shadow: 'rgba(0, 0, 0, 0.5)',
    borderRadius: '8px',
    border: '#444444',
  },
}

export const getThemeVars = (themeName) => {
  return themes[themeName] || themes['simple-light']
}
