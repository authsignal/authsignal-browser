import type {RollupOptions} from "rollup";
import ts from "rollup-plugin-ts";
import {nodeResolve} from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json";

const isWatchMode = process.env.ROLLUP_WATCH === "true";

const input = "src/index.ts";
const plugins = [nodeResolve(), commonjs(), ts({browserslist: false})];
const watch: RollupOptions["watch"] = {include: ["src/**"], clearScreen: false};
const sourcemap = isWatchMode ? false : true;
const onwarn: RollupOptions["onwarn"] = (warning) => {
  throw new Error(warning.message);
};

const cjs: RollupOptions = {
  ...{input, watch, plugins, onwarn},
  output: {file: pkg.main, format: "cjs", sourcemap},
};

const esm: RollupOptions = {
  ...{input, watch, plugins, onwarn},
  output: {file: pkg.module, format: "esm", sourcemap},
};

const config = isWatchMode ? esm : [cjs, esm];

export default config;
