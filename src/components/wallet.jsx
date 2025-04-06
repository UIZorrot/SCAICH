import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";

export const Wallet = ({ balance, isMobile }) => {
  const { publicKey } = useWallet();
  return (
    <>
      {/* 判断显示 */}

      {isMobile ? <WalletMultiButton className="wallet-button">{publicKey ? publicKey.toString().slice(0, 4) + "..." + publicKey.toString().slice(-4) : <img src="/wallet.png" style={{ height: "28px" }} />}</WalletMultiButton> : <WalletMultiButton className="wallet-button"></WalletMultiButton>}
      {/* Your app's components go here, nested within the context providers. */}
    </>
  );
};
