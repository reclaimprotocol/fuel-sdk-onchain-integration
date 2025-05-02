library;

use std::hash::keccak256;
use std::bytes::Bytes;
use std::string::{String};
use std::bytes_conversions::u64::*;
use std::vm::evm::evm_address::EvmAddress;
use std::crypto::secp256k1::{Secp256k1};
use std::crypto::message::Message;

pub struct Witness {
    pub address: EvmAddress,
    pub host: String,
}

impl Witness {
    fn get_addresses(witnesses: Vec<Witness>) -> Vec<EvmAddress> {
        let mut vec_addresses = Vec::new();
        for wit in witnesses.iter() {
            vec_addresses.push(wit.address);
        }
        vec_addresses
    }
}

pub struct Epoch {
    id: u64,
    timestamp_start: u64,
    timestamp_end: u64,
    minimum_witness_for_claim_creation: u64,
    witnesses: Vec<Witness>,
}

struct ClaimInfo {
    provider: String,
    parameters: String,
    context: String,
}

impl ClaimInfo {
    pub fn hash(self) -> String {
        let sep = String::from("\n");
        let part1 = merge_two_strings(self.provider, sep);
        let part2 = merge_two_strings(part1, self.parameters);
        let part3 = merge_two_strings(part2, sep);
        let complete_str = merge_two_strings(part3, self.context);
        let hash_bytes = keccak256(complete_str);
        let bytes = Bytes::from(hash_bytes);
        return String::from(bytes);
    }
}

struct CompleteClaimData {
    pub identifier: String,
    owner: Address,
    epoch: u64,
    timestamp_s: u64,
}

impl CompleteClaimData {
    fn serialise(self) -> String {

        let owner_string = String::from(Bytes::from(self.owner.bits()));
        let timestamp_string = String::from(self.timestamp_s.to_le_bytes());
        let epoch_string = String::from(self.epoch.to_le_bytes());
        let sep = String::from("\n");
        let part1 = merge_two_strings(self.identifier, sep);
        let part2 = merge_two_strings(part1, owner_string);
        let part3 = merge_two_strings(part2, sep);
        let part4 = merge_two_strings(part3, timestamp_string);
        let part5 = merge_two_strings(part4, sep);
        let complete_str = merge_two_strings(part5, epoch_string);

        complete_str
    }
}

pub struct SignedClaim {
    pub claim: CompleteClaimData,
    pub signature: [u8; 64],
}

impl SignedClaim {
    pub fn recover_signer_of_signed_claim(self) -> EvmAddress {
        let serialised_claim = self.claim.serialise();
        let hash_bytes = keccak256(serialised_claim);
        let bytes = Bytes::from(hash_bytes);

        // let new_secp256k1 = Secp256k1::new();
        let signature = Secp256k1::from(self.signature);
        let message = Message::from(bytes);
        let result_address = signature.evm_address(message).unwrap();
            
        result_address
    }
}

pub struct Proof {
    pub claim_info: ClaimInfo,
    pub signed_claim: SignedClaim,
}

fn merge_two_strings (first_str: String, second_str: String) -> String {

    first_str.as_bytes().append(second_str.as_bytes());
    // for ind in second_str.as_bytes(). {
    //     second_str.as_bytes().get(ind)
    // }
    first_str
}

