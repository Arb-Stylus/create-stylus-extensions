// Deploy a single contract
  // await deployStylusContract({
  //   contract: "your-contract",
  //   constructorArgs: [config.deployerAddress!],
  //   ...deployOptions,
  // });

  /// Deploy your contract with a custom name
  // await deployStylusContract({
  //   contract: "your-contract",
  //   constructorArgs: [config.deployerAddress],
  //   name: "my-contract",
  //   ...deployOptions,
  // });

  await deployStylusContract({
    contract: "erc721-example",
    name: "erc721-example",
    ...deployOptions,
  });