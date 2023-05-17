import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import {nodeResolve} from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: [
    {
      file: pkg.module,
      format: "esm",
    },
  ],
  plugins: [nodeResolve(), typescript()],
};
