import { useScaffoldReadContract } from "../scaffold-eth";

export default function useChainlinkArbUsdFeed() {
  const { data, isPending, refetch } = useScaffoldReadContract({
    contractName: "Chainlink_ARB_USD_DataFeed",
    functionName: "latestRoundData",
  });

  const [roundId, answer, startedAt, updatedAt, answeredInRound] = data ?? [];

  return { data: { roundId, answer, startedAt, updatedAt, answeredInRound }, isPending, refetch };
}
