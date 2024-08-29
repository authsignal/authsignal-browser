import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "esm",
    },
    {
      file: "dist/index.min.js",
      format: "iife",
      name: "authsignal",
      plugins: [terser()],
    },
  ],
  plugins: [nodeResolve(), typescript(), json()],
};
