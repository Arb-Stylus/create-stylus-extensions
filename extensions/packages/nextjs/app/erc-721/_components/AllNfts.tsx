"use client";

import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useScaffoldContract, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export interface Collectible {
  id: number;
  uri: string;
  owner: string;
  image: string;
  name: string;
}

export const AllNfts = () => {
  const [allNfts, setAllNfts] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: nftContract } = useScaffoldContract({
    contractName: "erc721-example",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "erc721-example",
    functionName: "totalSupply",
    watch: true,
  });

  useEffect(() => {
    const updateAllNfts = async (): Promise<void> => {
      if (totalSupply === undefined || nftContract === undefined) return;

      setLoading(true);
      const collectibleUpdate: Collectible[] = [];
      for (let tokenIndex = 0; tokenIndex < parseInt(totalSupply.toString()); tokenIndex++) {
        try {
          const tokenId = await nftContract.read.tokenByIndex([BigInt(tokenIndex)]);

          const tokenURI = await nftContract.read.tokenURI([tokenId]);
          const owner = await nftContract.read.ownerOf([tokenId]);

          const tokenMetadata = await fetch(tokenURI);
          const metadata = await tokenMetadata.json();

          collectibleUpdate.push({
            id: parseInt(tokenId.toString()),
            uri: tokenURI,
            owner,
            image: metadata.image,
            name: metadata.name,
          });
        } catch (e) {
          notification.error("Error fetching NTFs");
          setLoading(false);
          console.log(e);
        }
      }
      collectibleUpdate.sort((a, b) => a.id - b.id);
      setAllNfts(collectibleUpdate);
      setLoading(false);
    };

    updateAllNfts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSupply]);

  if (loading)
    return (
      <div className="flex justify-center items-center mt-10">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );

  return (
    <>
      <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
        <p className="y-2 mr-2 font-bold text-2xl my-2">Total Supply:</p>
        <p className="text-xl">{totalSupply ? totalSupply.toString() : 0} tokens</p>
      </div>
      {allNfts.length > 0 && (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {allNfts.map(item => (
            <NFTCard nft={item} key={item.id} />
          ))}
        </div>
      )}
    </>
  );
};
