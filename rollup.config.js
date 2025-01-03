"use strict";
const { terser } = require("rollup-plugin-terser");
module.exports = {
  input: "./index.js",
  output: {
    file: "./lib/index.js",
    format: "cjs",
  },
  plugins: [terser()],
};
