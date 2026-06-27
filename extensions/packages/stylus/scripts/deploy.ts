import { DeployOptions } from "./utils/type";

export default async function deployScript(deployOptions: DeployOptions) {
  void deployOptions;
  console.log(
    "ℹ️  chainlink-data-feed has no Stylus contract to deploy — this extension reads an existing on-chain Chainlink price feed (see packages/nextjs/contracts/externalContracts.ts). Nothing to deploy. Run yarn start to use the UI.",
  );
}
