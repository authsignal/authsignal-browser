import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import {nodeResolve} from "@rollup/plugin-node-resolve";

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
  plugins: [nodeResolve(), typescript()],
};
