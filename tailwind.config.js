const plugin = require('tailwindcss/plugin')

module.exports = {
  purge: {
    content: [
      './src/**/*.njk',
      './src/**/*.js'
    ],
    options: {
      whitelist: ['data-top', 'false']
    }
  },
  theme: {
    extend: {
      screens: {
        img: '580px'
      },
      inset: {
        50: '50%'
      }
    }
  },
  variants: {
    margin: ['responsive', 'first'],
    opacity: ['disabled'],
    backgroundColor: ['responsive', 'hover', 'focus', 'even', 'disabled', 'scrolled'],
    borderColor: ['responsive', 'hover', 'focus', 'disabled'],
    cursor: ['hover', 'disabled'],
    boxShadow: ['scrolled'],
    textColor: ['scrolled'],
    display: ['responsive', 'group-hover']
  },
  plugins: [
    require('@tailwindcss/typography')({
      modifiers: ['lg', 'xl']
    }),
    plugin(function ({
      addVariant,
      e
    }) {
      addVariant('scrolled', ({
        modifySelectors,
        separator
      }) => {
        modifySelectors(({
          className
        }) => {
          return `html[data-top='false'] .${e(`scrolled${separator}${className}`)}`
        })
      })
    })
  ]
}
