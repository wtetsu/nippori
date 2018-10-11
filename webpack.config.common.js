const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");

module.exports = {
  mode: process.env.NODE_ENV || "development",
  entry: {
    options: "./src/options.js",
    content: "./src/content.js",
    popup: "./src/popup.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader"
        }
      },
      {
        test: /\.jsx$/,
        use: [
          {
            loader: "babel-loader",
            options: { presets: ["@babel/env"] }
          }
        ]
      },
      {
        test: /\.vue$/,
        use: [
          {
            loader: "vue-loader"
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: [".js", ".vue"],
    alias: {
      vue$: "vue/dist/vue.esm.js"
    }
  },
  optimization:
    process.env.NODE_ENV === "production"
      ? {
          minimizer: [
            new UglifyJsPlugin({
              uglifyOptions: {
                compress: true,
                ecma: 6,
                mangle: true
              },
              sourceMap: false
            })
          ]
        }
      : {},
  plugins: [new CopyWebpackPlugin([{ from: "static", to: "." }]), new VueLoaderPlugin()],
  devtool: process.env.NODE_ENV === "production" ? false : "cheap-module-source-map"
};
