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
import { getHash, getSerializedClaim } from "./utils/format";

const CONTRACT_ID =
  "0x6a4c7d255869a59323dd41016e1ecb980cda9744214540f8c7ab52975543e0d0";

export default function App() {
  const [contract, setContract] = useState<ReclaimContract>();
  const { connect, isConnecting } = useConnectUI();
  const { isConnected } = useIsConnected();
  const { wallet } = useWallet();
  const { balance } = useBalance({
    address: wallet?.address.toAddress(),
    // assetId: wallet?.provider.getBaseAssetId(),
  });

  const [ready, setReady] = useState(false);
  const [proof, setProof] = useState({});
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
      const APP_ID = "0x6E0338a6D8594101Ea9e13840449242015d71B19"; // This is an example App Id Replace it with your App Id.
      const APP_SECRET =
        "0x1e0d6a6548b72286d747b4ac9f2ad6b07eba8ad6a99cb1191890ea3f77fae48f"; // This is an example App Secret Replace it with your App Secret.
      const PROVIDER_ID = "6d3f6753-7ee6-49ee-a545-62f1b1822ae5"; // This is GitHub Provider Id Replace it with the provider id you want to use.

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
      const signature = Buffer.from(proof.signedClaim.signatures[0], "hex");

      const serializedClaim = getSerializedClaim(proof);

      const message = getHash(serializedClaim);

      //@ts-ignore
      await contract.functions.verify_proof(message, signature).call();
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
                {!requestUrl && (
                  <button onClick={generateVerificationRequest}>
                    Create Claim QrCode
                  </button>
                )}
                {requestUrl && <QRCode value={requestUrl} />}
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
