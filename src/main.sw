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
const DEFAULT_WITNESS: b256 = 0x000000000000000000000000244897572368aadf65bfbc5aec98d8e5443a9072;

abi ReclaimContract {
    #[storage(read, write)]
    fn constructor() -> Result<(), ReclaimError>;

    #[storage(read, write)]
    fn add_epoch(witness: b256) -> Result<(), ReclaimError>;

    #[storage(read)]
    fn verify_proof(message_digest: b256, signature: [u8; 64]) -> Result<(), ReclaimError>;
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
        let current_epoch_id = storage.current_epoch_id.read();
        if current_epoch_id != 0_u64 {
            return Err(ReclaimError::AlreadyInitialized);
        }

        storage.owner.write(msg_sender);

        let id = current_epoch_id + 1;
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
    fn verify_proof(message: b256, signature: [u8; 64]) -> Result<(), ReclaimError> {
        let current_epoch = storage.current_epoch.read();
        let witness = current_epoch.witness;

        let evm_address = EvmAddress::from(witness);
        let signature: Signature = Signature::Secp256k1(Secp256k1::from(signature));
        let message: Message = Message::from(message);

        let result_address = signature.evm_address(message).unwrap();

        assert(result_address == evm_address);

        Ok(())
    }
}

#[test(should_revert)]
fn verify_proof() {
    let sig = [
        40, 136, 72, 95, 101, 15, 142, 208, 45, 24, 227, 45, 217, 161, 81, 44, 160,
        95, 235, 131, 252, 44, 191, 45, 247, 47, 216, 170, 66, 70, 197, 238, 84, 31,
        165, 56, 117, 199, 14, 182, 77, 61, 233, 20, 52, 70, 34, 154, 37, 12, 122,
        118, 34, 2, 183, 204, 40, 158, 211, 27, 116, 179, 28, 129,
    ];

    let msg: b256 = 0xc32e57b71247c1aab4b93bb0a2bb373186acc2d5c9bd8dfcd046e1d0553fd421;

    let evm_address = EvmAddress::from(DEFAULT_WITNESS);
    let signature: Signature = Signature::Secp256k1(Secp256k1::from(sig));
    let message: Message = Message::from(msg);
    // A recovered evm address.
    let result_address = signature.evm_address(message).unwrap();
    assert(result_address == evm_address);
}
