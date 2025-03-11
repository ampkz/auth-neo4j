import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  verbose: false,
  globalSetup: "./jestGlobalConfigs/globalSetup.ts",
  globalTeardown: "./jestGlobalConfigs/globalTeardown.ts",
};

export default config;
