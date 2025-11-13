const mix = require('laravel-mix');

mix.setPublicPath('.');

// Configure sass options to use dart-sass instead of node-sass
mix.options({
  processCssUrls: false,
  postCss: [],
  autoprefixer: {
    options: {
      overrideBrowserslist: [
        'last 6 versions',
      ]
    }
  }
});

// Compile JavaScript
mix.js('src/js/app.js', 'dist/assets/js')
   .js('src/js/objectives.js', 'dist/assets/js')
   .js('src/js/rollup.js', 'dist/assets/js');

// Compile Sass
mix.sass('src/sass/app.scss', 'dist/assets/css');

mix.webpackConfig({
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /(node_modules[\\/](core-js|@babel[\\/])|bower_components)/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: 'last 6 versions'
              }]
            ]
          }
        }
      ]
    }]
  }
});
