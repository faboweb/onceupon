const webpack = require("webpack");

module.exports = {
  pwa: {
    name: "My App",
    themeColor: "#4DBA87",
    msTileColor: "#000000",
    appleMobileWebAppCapable: "yes",
    appleMobileWebAppStatusBarStyle: "black",
    iconPaths: {
      faviconSVG: null,
      favicon32: "assets/onceupon-logo-feather-lite.png",
      favicon16: "assets/onceupon-logo-feather-lite.png",
      appleTouchIcon: "assets/onceupon-logo-feather-lite.png",
      maskIcon: null,
      msTileImage: "assets/onceupon-logo-feather-lite.png",
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
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/theme/custom.scss";`,
      },
    },
  },
  chainWebpack: (config) => {
    config.resolve.set("fallback", {
      crypto: require.resolve("crypto-browserify"),
      path: false,
      stream: require.resolve("stream-browserify"),
    });
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        // modify the options...
        return options;
      });
  },
};
