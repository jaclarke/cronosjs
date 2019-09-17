module.exports = {
  title: 'CronosJS',
  description: 'Cron library',

  head: [
    // ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    // ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    // ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }]
  ],

  themeConfig: {
    repo: 'jaclarke/cronosjs',
    editLinks: false,
    docsDir: '',
    editLinkText: '',
    lastUpdated: true,
    displayAllHeaders: true,
    nav: [
      { text: 'Docs', link: '/docs/' },
      { text: 'API', link: '/api/' },
    ],
  },

  plugins: [
    '@vuepress/plugin-back-to-top',
  ]
}
