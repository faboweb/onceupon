const webpack = require("webpack")

module.exports = {
  pwa: {
    name: 'My App',
    themeColor: '#4DBA87',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    iconPaths: {
      faviconSVG: null,
      favicon32: 'assets/armchair.png',
      favicon16: 'assets/armchair.png',
      appleTouchIcon: 'assets/armchair.png',
      maskIcon: null,
      msTileImage: 'assets/armchair.png'
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
    ],
  },
    chainWebpack: config => {
      config.resolve.set('fallback', {"crypto": require.resolve('crypto-browserify'), "path": false, "stream": require.resolve("stream-browserify")});
      config.module
        .rule('vue')
        .use('vue-loader')
          .tap(options => {
            // modify the options...
            return options
          })
    },
  }
  