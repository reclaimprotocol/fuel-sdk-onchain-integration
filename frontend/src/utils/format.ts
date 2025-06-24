import { keccak256 } from "@ethersproject/keccak256";

export const getSerializedClaim = (proof: any) => {
  return proof.signedClaim.claim.identifier +
    "\n" +
    proof.signedClaim.claim.owner +
    "\n" +
    proof.signedClaim.claim.timestampS +
    "\n" +
    proof.signedClaim.claim.epoch;
}

export const getHash = (serializedClaim: any) => {
  let ethPrefix = "\x19Ethereum Signed Message:\n";
  ethPrefix = ethPrefix + serializedClaim.length;

  const message = ethPrefix + serializedClaim;
  let digest = keccak256(Buffer.from(message));
  
  return digest
}

export function bytesToHexString(bytes: any[]) {
    return '0x' + bytes.map(byte => {
        // Convert number to hex, pad with '0' if single digit
        return ('0' + byte.toString(16)).slice(-2);
    }).join('');
}