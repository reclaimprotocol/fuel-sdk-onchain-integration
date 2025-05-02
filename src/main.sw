contract;

pub mod lib;

use std::string::String;
use std::vm::evm::evm_address::EvmAddress;
use lib::{Witness, Proof, Epoch};

abi Prover {
    #[storage(read,write)]
    fn new();

    #[storage(read,write)]
    fn add_epoch(witness: EvmAddress);

    #[storage(read)]
    fn verify_proof(proof: Proof) -> bool;

    #[storage(read)]
    fn get_current_epoch() -> u64;

    #[storage(read)]
    fn get_current_witness() -> EvmAddress;

    #[storage(read)]
    fn get_owner() -> Address;
}

storage {
    owner: Address = Address::zero(),
    current_epoch: u64 = 0,
    current_witness: EvmAddress = EvmAddress::zero(),
}

impl Prover for Contract {
    #[storage(read,write)]
    fn new () {

        let owner = storage.owner.read();
        if (owner != Address::zero()) {
            return
        }
        
        let sender = msg_sender().unwrap();
        match sender {
            Identity::Address(addr) => storage.owner.write(addr),
            _ => revert(0),
        };
        storage.current_epoch.write(1);
    }

    #[storage(read,write)]
    fn add_epoch(witness: EvmAddress) {
        let sender = msg_sender().unwrap();
        match sender {
            Identity::Address(addr) => storage.owner.write(addr),
            _ => revert(0),
        };
        let current_epoch = storage.current_epoch.read();
        storage.current_epoch.write(current_epoch + 1);
        storage.current_witness.write(witness);
    }

    #[storage(read)]
    fn verify_proof (proof: Proof) -> bool {
        let hashed = proof.claim_info.hash();

        if (hashed != proof.signed_claim.claim.identifier) {
            return false;
        }
        let signed_witness = proof.signed_claim.recover_signer_of_signed_claim();

        return signed_witness == storage.current_witness.read()
    }

    #[storage(read)]
    fn get_current_epoch() -> u64 {
        storage.current_epoch.read()
    }

    #[storage(read)]
    fn get_current_witness() -> EvmAddress {
        storage.current_witness.read()
    }

    #[storage(read)]
    fn get_owner() -> Address {
        storage.owner.read()
    }

}

#[test]
fn test_add_epoch() {
    let caller = abi(Prover, CONTRACT_ID);
    caller.new {}();
    let current_epoch = caller.get_current_epoch{}();
    let owner = caller.get_owner{}();
    assert (current_epoch == 1);
    assert (owner != Address::zero());
}