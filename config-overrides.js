const webpack = require("webpack");

module.exports = function override(config, env) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert"),
    http: require.resolve("stream-http"),
    https: require.resolve("https-browserify"),
    os: require.resolve("os-browserify"),
    zlib: require.resolve("browserify-zlib"),
    url: require.resolve("url"),
    "process/browser": require.resolve("process/browser.js"),
  });
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      "process/browser": "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ]);

  // 配置 devServer 以解决 allowedHosts 问题
  if (env === "development") {
    config.devServer = {
      ...config.devServer,
      allowedHosts: "all",
      historyApiFallback: true,
      hot: true,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    };
  }

  return config;
};
