import { useEffect, useState } from "react";
import {
  useBalance,
  useConnectUI,
  useIsConnected,
  useWallet,
} from "@fuels/react";
import { ReclaimContract } from "./sway-api";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import QRCode from "react-qr-code";
import { bytesToHexString, getHash, getSerializedClaim } from "./utils/format";
import { transformForOnchain } from "@reclaimprotocol/js-sdk";
import { CONTRACT_ID, PROOF } from "./utils/constants";

export default function App() {
  const [contract, setContract] = useState<ReclaimContract>();
  const { connect, isConnecting } = useConnectUI();
  const { isConnected } = useIsConnected();
  const { wallet } = useWallet();
  const { balance } = useBalance({
    address: wallet?.address.toAddress(),
    // assetId: wallet?.provider.getBaseAssetId(),
  });

  const [ready, setReady] = useState(true);
  const [proof, setProof] = useState(PROOF);
  const [reclaimProofRequest, setReclaimProofRequest] =
    useState<ReclaimProofRequest>();
  const [requestUrl, setRequestUrl] = useState("");
  // const [statusUrl, setStatusUrl] = useState("");

  useEffect(() => {
    async function Initialize() {
      if (isConnected && wallet) {
        const counterContract = new ReclaimContract(CONTRACT_ID, wallet);
        setContract(counterContract);
      }
    }

    Initialize();
  }, [isConnected, wallet]);

  useEffect(() => {
    async function initializeReclaim() {
      // Kaggle, replace with your own metadata
      const APP_ID = "0x4c8e08f2B5AeD9504C888A327BaaCd6Ea617e18B";
      const APP_SECRET =
        "0x65507a8cf531019090e334630e74655168a7cbed6a95cc2c285a4d5653f8f7b4";
      const PROVIDER_ID = "c94476a0-8a75-4563-b70a-bf6124d7c59b";

      const proofRequest = await ReclaimProofRequest.init(
        APP_ID,
        APP_SECRET,
        PROVIDER_ID
      );
      setReclaimProofRequest(proofRequest);
    }

    initializeReclaim();
  }, []);

  async function generateVerificationRequest() {
    if (!reclaimProofRequest) {
      console.error("Reclaim Proof Request not initialized");
      return;
    }

    reclaimProofRequest.addContext(
      `user's address`,
      "for acmecorp.com on 1st january"
    );

    const url = await reclaimProofRequest.getRequestUrl();
    console.log(url)
    setRequestUrl(url);
    // const status = reclaimProofRequest.getStatusUrl();
    // setStatusUrl(status);

    await reclaimProofRequest.startSession({
      onSuccess: (proof: any) => {
        console.log("Verification success", proof);
        setReady(true);
        setProof(proof);
        // Your business logic here
      },
      onError: (error: any) => {
        console.error("Verification failed", error);
        // Your business logic here to handle the error
      },
    });
  }

  const onClick = async () => {
    if (!contract) {
      return alert("Contract not loaded");
    }
    try {
      //@ts-ignore
      const transformedProof = transformForOnchain(proof);

      const signatureWithRecid = transformedProof.signedClaim.signatures[0];
      const signatureWithoutRecid = signatureWithRecid
        .substring(1, 130)
        .substring(1, 130);

      //@ts-ignore
      const sig = new Uint8Array(Buffer.from(signatureWithoutRecid, "hex"));
      const signature = Array.from(sig);

      const serializedClaim = getSerializedClaim(transformedProof);
      const message = getHash(serializedClaim);

      const signature_r = bytesToHexString(signature.slice(0, 32)); 
      const signature_s = bytesToHexString(signature.slice(32, 64));

      console.log(signature, message);
      //@ts-ignore
      await contract.functions.verify_proof(message, signature_r, signature_s).call();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {isConnected ? (
          <>
            {balance && balance.toNumber() === 0 ? (
              <p>
                Get testnet funds from the{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://faucet-testnet.fuel.network/?address=${wallet?.address.toAddress()}`}
                >
                  Fuel Faucet
                </a>{" "}
                to verify.
              </p>
            ) : (
              <div>
                {!requestUrl && !ready && (
                  <button onClick={generateVerificationRequest}>
                    Create Claim QrCode
                  </button>
                )}
                {requestUrl && !ready && <QRCode value={requestUrl} />}
                {ready && (
                  <button onClick={onClick} style={styles.button}>
                    Verify
                  </button>
                )}
              </div>
            )}

            <p>Your Fuel Wallet address is:</p>
            <p>{wallet?.address.toAddress()}</p>
          </>
        ) : (
          <button
            onClick={() => {
              connect();
            }}
            style={styles.button}
          >
            {isConnecting ? "Connecting" : "Connect"}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: "grid",
    placeItems: "center",
    height: "100vh",
    width: "100vw",
    backgroundColor: "black",
  } as React.CSSProperties,
  container: {
    color: "#ffffffec",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  } as React.CSSProperties,
  label: {
    fontSize: "28px",
  },
  counter: {
    color: "#a0a0a0",
    fontSize: "48px",
  },
  button: {
    borderRadius: "8px",
    margin: "24px 0px",
    backgroundColor: "#707070",
    fontSize: "16px",
    color: "#ffffffec",
    border: "none",
    outline: "none",
    height: "60px",
    padding: "0 1rem",
    cursor: "pointer",
  },
};
