let { mix } = require('theme-mix')

mix.setPublicPath('.')

// Configure sass options to use dart-sass instead of node-sass
mix.options({
  processCssUrls: false,
  postCss: [],
  autoprefixer: {
    options: {
      browsers: [
        'last 6 versions',
      ]
    }
  }
})

mix.webpackConfig({
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /(node_modules\/(core-js|@babel\b)|bower_components)/,
      use: [
        {
          loader: 'babel-loader',
          options: mix.config.babel ? mix.config.babel() : {}
        }
      ]
    }]
  }
})