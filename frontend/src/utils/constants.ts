export const PROOF = {
  claimData: {
    provider: "http",
    parameters:
      '{"body":"","method":"GET","responseMatches":[{"type":"regex","value":"\\\\{\\"ethereum\\":\\\\{\\"usd\\":(?<price>[\\\\d\\\\.]+)\\\\}\\\\}"}],"responseRedactions":[],"url":"https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"}',
    owner: "0x381994d6b9b08c3e7cfe3a4cd544c85101b8f201",
    timestampS: 1752056698,
    context:
      '{"extractedParameters":{"price":"2612.54"},"providerHash":"0x5dbe58ad866070178af5c86d8caac49014934f9499a5ebd9599961325bfc347d"}',
    identifier:
      "0x5ecb7fed5a589b5d6babcf5cc6134b6323eb2b201a3d2a40c2318b6dc8ad8403",
    epoch: 1,
  },
  identifier:
    "0x5ecb7fed5a589b5d6babcf5cc6134b6323eb2b201a3d2a40c2318b6dc8ad8403",
  signatures: [
    "0xa8dbc31a5b368e4fde90f01430c69a4682cff4d145538d54120ff4430c214be967f06d6e142cf4e6f74b26eacb4bdae33e2327b3aabe107ea5fe56df2d8bfeb81b",
  ],
  extractedParameterValues: { price: "2612.54" },
  witnesses: [
    {
      id: "0x244897572368eadf65bfbc5aec98d8e5443a9072",
      url: "wss://attestor.reclaimprotocol.org:447/ws",
    },
  ],
};

export const CONTRACT_ID =
  "0x7100b7811bfdb3ffad2a7863bc96383be888f5a9c6cb2df30f4b519733b9ea54";
