const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: path.resolve(__dirname, './settings/src/index.js'),
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['*', '.js', '.jsx'],
  },
  output: {
    path: path.resolve(__dirname, './settings'),
    filename: 'index.js',
  },
  devServer: {
    static: path.resolve(__dirname, './settings'),
    devMiddleware: {
        writeToDisk: true,  // This will force Webpack to write the bundle to disk
      },
  },
};