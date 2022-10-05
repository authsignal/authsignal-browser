import typescript from "@rollup/plugin-typescript";
import {nodeResolve} from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.ts",
  output: [
    {
      dir: "dist",
      format: "cjs",
    },
    {
      file: "dist/index.mjs",
      format: "esm",
    },
  ],
  plugins: [nodeResolve(), typescript()],
};
