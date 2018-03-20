const path = require('path');

const config = {
  entry: './src/index.js',
  mode: 'development',
  output: {
    library: "cloudform",
    libraryTarget: "umd",
    filename: 'dist/cloudform.js'
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  }
};

module.exports = config;