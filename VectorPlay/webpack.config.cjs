//const path = require('path');
//import path from 'path';

module.exports = {
  entry: { 
    main: "./js/main.ts",
    //'silly-shader': './js/silly-shader.ts',
   //     vendor: []
  },
  output: {
    //why does this go to ./dist/dist/bundle.js ?
    //filename: "./dist/bundle.js",
    filename: "./[name]-bundle.js",
  },
  mode: "development",
  // Enable sourcemaps for debugging webpack's output.
  devtool: "eval-source-map",
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    alias: {
    }
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: "ts-loader" },
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" },
    ],
  },
  watchOptions: {
    poll: true,
    ignored: /node_modules/
  }
  // Other options...
};
