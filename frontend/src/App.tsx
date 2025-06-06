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
import { transformForOnchain } from "@reclaimprotocol/js-sdk";

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

  const [ready, setReady] = useState(true);
  const [proof, setProof] = useState({
  "identifier": "0x1d50794efd618226678a1791ff0a62ebce951543e2715b57a4371870f1e21364",
  "claimData": {
      "provider": "http",
      "parameters": "{\"body\":\"\",\"geoLocation\":\"in\",\"method\":\"GET\",\"paramValues\":{\"CLAIM_DATA\":\"76561199614512180\"},\"responseMatches\":[{\"type\":\"contains\",\"value\":\"_steamid\\\">Steam ID: {{CLAIM_DATA}}</div>\"}],\"responseRedactions\":[{\"jsonPath\":\"\",\"regex\":\"_steamid\\\">Steam\\\\ ID:\\\\ (.*)</div>\",\"xPath\":\"id(\\\"responsive_page_template_content\\\")/div[@class=\\\"page_header_ctn\\\"]/div[@class=\\\"page_content\\\"]/div[@class=\\\"youraccount_steamid\\\"]\"}],\"url\":\"https://store.steampowered.com/account/\"}",
      "owner": "0x8e87e3605b15a028188fde5f4ce03e87d55a2b4f",
      "timestampS": 1724909052,
      "context": "{\"contextAddress\":\"user's address\",\"contextMessage\":\"for acmecorp.com on 1st january\",\"extractedParameters\":{\"CLAIM_DATA\":\"76561199614512180\"},\"providerHash\":\"0x61433e76ff18460b8307a7e4236422ac66c510f0f9faff2892635c12b7c1076e\"}",
      "identifier": "0x1d50794efd618226678a1791ff0a62ebce951543e2715b57a4371870f1e21364",
      "epoch": 1
  },
  "signatures": [
      "0x4a2441b35b1457e4c314dc20f727e59bb72d0679cca3699b5c1988777d6700114167bff4bd8d40bcf755b7f75704517f6c261db7118d8e17269f5bd10a208f221c"
  ],
  "witnesses": [
      {
          "id": "0x244897572368eadf65bfbc5aec98d8e5443a9072",
          "url": "wss://witness.reclaimprotocol.org/ws"
      }
  ],
  "publicData": null
});
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
      const transformedProof = transformForOnchain(proof)
      
      const signatureWithRecid = transformedProof.signedClaim.signatures[0]
      const signatureWithoutRecid = signatureWithRecid.substring(1, 130).substring(1, 130);

      //@ts-ignore
      const sig = new Uint8Array(Buffer.from(signatureWithoutRecid, "hex"));
      const signature = Array.from(sig);

      const serializedClaim = getSerializedClaim(transformedProof);
      const message = getHash(serializedClaim);

      console.log(signature, message)
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
                {!requestUrl && !ready && (
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
