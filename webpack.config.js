const path = require("path");

const config = {
  entry: "./src/index.ts",
  mode: "development",
  devtool: 'inline-source-map',
  output: {
    library: "cloudform",
    libraryTarget: "umd",
    filename: "dist/cloudform.js"
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
