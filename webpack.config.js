const path = require("path");

const config = {
  entry: "./src/index.ts",
  mode: "development",
  target: "node",
  devtool: 'inline-source-map',
  output: {
    library: "cloudform",
    filename: "cloudform.js"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  }
};

module.exports = config;
