"use strict";
import { terser } from "rollup-plugin-terser";
module.exports = {
  input: "./index.js",
  output: {
    file: "./lib/index.js",
    format: "cjs",
  },
  plugins: [terser()],
};
