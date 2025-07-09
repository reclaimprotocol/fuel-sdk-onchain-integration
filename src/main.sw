contract;

use std::storage::storage_vec::StorageVec;
use std::string::String;
use std::block::*;

use std::{
    crypto::{
        message::Message,
        secp256k1::Secp256k1,
        signature::Signature,
    },
    vm::evm::evm_address::EvmAddress,
};

// Error definitions
enum ReclaimError {
    OnlyOwner: (),
    AlreadyInitialized: (),
    HashMismatch: (),
    LengthMismatch: (),
    SignatureMismatch: (),
}

// Epoch struct with StorageVec for witnesses
struct Epoch {
    id: u64,
    timestamp_start: u64,
    timestamp_end: u64,
    witness: b256,
}

const ZERO_B256: b256 = b256::min();
const ZERO_ADDRESS = Address::from(ZERO_B256);
const DEFAULT_WITNESS: b256 = 0x000000000000000000000000244897572368eadf65bfbc5aec98d8e5443a9072;

abi ReclaimContract {
    #[storage(read, write)]
    fn constructor() -> Result<(), ReclaimError>;

    #[storage(read, write)]
    fn add_epoch(witness: b256) -> Result<(), ReclaimError>;

    #[storage(read)]
    fn verify_proof(
        message_digest: b256,
        signature_r: b256,
        signature_s: b256,
    ) -> Result<(), ReclaimError>;

    #[storage(read)]
    fn current_epoch_id() -> u64;
}

// Persistent storage
storage {
    owner: Identity = Identity::Address(ZERO_ADDRESS),
    current_epoch_id: u64 = 0_64,
    current_epoch: Epoch = Epoch {
        id: 0_u64,
        timestamp_start: 0_u64,
        timestamp_end: 0_u64,
        witness: ZERO_B256,
    },
}

impl ReclaimContract for Contract {
    #[storage(read, write)]
    fn constructor() -> Result<(), ReclaimError> {
        let msg_sender = msg_sender().unwrap();

        storage.owner.write(msg_sender);

        let id = 1;
        storage.current_epoch_id.write(id);

        let timestamp_start = timestamp();
        let timestamp_end = timestamp_start + 1000;
        let witness: b256 = DEFAULT_WITNESS;

        let epoch = Epoch {
            id,
            timestamp_start,
            timestamp_end,
            witness,
        };

        storage.current_epoch.write(epoch);
        Ok(())
    }

    #[storage(read, write)]
    fn add_epoch(new_witness: b256) -> Result<(), ReclaimError> {
        require(
            storage
                .owner
                .read() == msg_sender()
                .unwrap(),
            ReclaimError::OnlyOwner,
        );

        let current_epoch_id = storage.current_epoch_id.read();
        let id = current_epoch_id + 1;
        storage.current_epoch_id.write(id);
        let timestamp_start = timestamp();
        let timestamp_end = timestamp_start + 1000;
        let witness: b256 = new_witness;

        let epoch = Epoch {
            id,
            timestamp_start,
            timestamp_end,
            witness,
        };

        storage.current_epoch.write(epoch);

        Ok(())
    }

    #[storage(read)]
    fn verify_proof(message: b256, signature_r: b256, signature_s: b256) -> Result<(), ReclaimError> {
        let evm_address = EvmAddress::from(DEFAULT_WITNESS);

        let signature: Signature = Signature::Secp256k1(Secp256k1::from((signature_r, signature_s)));
        let message: Message = Message::from(message);

        let result_address = signature.evm_address(message).unwrap();

        assert(result_address == evm_address);

        Ok(())
    }

    #[storage(read)]
    fn current_epoch_id() -> u64 {
        storage.current_epoch_id.read()
    }
}

#[test]
fn constructor() {
    let caller = abi(ReclaimContract, CONTRACT_ID);
    let result = caller.constructor {    }();
    assert(result.is_ok());

    let current_epoch_id = caller.current_epoch_id();
    assert(current_epoch_id == 1_u64);
}

#[test]
fn add_epoch() {
    let caller = abi(ReclaimContract, CONTRACT_ID);
    let _ = caller.constructor {    }();
    let result = caller.add_epoch(DEFAULT_WITNESS);

    assert(result.is_ok());

    let current_epoch_id = caller.current_epoch_id();
    assert(current_epoch_id == 2_u64);
}

#[test]
fn verify_proof() {
    let caller = abi(ReclaimContract, CONTRACT_ID);
    let _ = caller.constructor {    }();
    let _ = caller.add_epoch(DEFAULT_WITNESS);

    let message = 0xfd0772db3aa93d91c285afae67f7ba70d978eb0075a4fe480dd0073f349ea592;
    let signature_r = 0xa8dbc31a5b368e4fde90f01430c69a4682cff4d145538d54120ff4430c214be9;
    let signature_s = 0x67f06d6e142cf4e6f74b26eacb4bdae33e2327b3aabe107ea5fe56df2d8bfeb8;

    let result = caller.verify_proof(message, signature_r, signature_s);
    assert(result.is_ok());
}
