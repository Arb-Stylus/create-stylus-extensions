#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::string::String;

use openzeppelin_stylus::{
    token::erc721::{
        self,
        extensions::{
            enumerable, Erc721Enumerable, Erc721Metadata, IErc721Enumerable, IErc721Metadata,
        },
        Erc721, IErc721,
    },
    utils::introspection::erc165::IErc165,
};
use stylus_sdk::{
    abi::Bytes,
    alloy_primitives::{aliases::B32, Address, U256},
    prelude::*,
};

#[entrypoint]
#[storage]
struct Erc721MetadataExample {
    erc721: Erc721,
    metadata: Erc721Metadata,
    enumerable: Erc721Enumerable,
}

#[public]
#[implements(IErc721<Error = erc721::Error>, IErc721Metadata<Error = erc721::Error>, IErc721Enumerable<Error = enumerable::Error>, IErc165)]
impl Erc721MetadataExample {
    #[constructor]
    fn constructor(&mut self, name: String, symbol: String, base_uri: String) {
        self.metadata.constructor(name, symbol);
        self.metadata.base_uri.set_str(base_uri);
    }

    fn mint(&mut self, to: Address) -> Result<(), erc721::Error> {
        let token_id = self.enumerable.total_supply() + U256::from(1);

        match self.erc721._mint(to, token_id) {
            Ok(()) => {
                // update per-owner enumeration
                let _ = self
                    .enumerable
                    ._add_token_to_owner_enumeration(to, token_id, &self.erc721);
                // update global enumeration
                self.enumerable
                    ._add_token_to_all_tokens_enumeration(token_id);
                Ok(())
            }
            Err(e) => Err(e),
        }
    }

    #[selector(name = "totalSupply")]
    fn total_supply(&self) -> U256 {
        self.enumerable.total_supply()
    }

    fn balance_of(&self, owner: Address) -> Result<U256, erc721::Error> {
        self.erc721.balance_of(owner)
    }

    fn owner_of(&self, token_id: U256) -> Result<Address, erc721::Error> {
        self.erc721.owner_of(token_id)
    }

    fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), erc721::Error> {
        // Get the current owner before transfer
        let previous_owner = self.erc721.owner_of(token_id)?;

        // Perform the transfer
        self.erc721.safe_transfer_from(from, to, token_id)?;

        // Update enumerations only if owner actually changed
        if previous_owner != to {
            // Remove from previous owner's enumeration
            let _ = self.enumerable._remove_token_from_owner_enumeration(
                previous_owner,
                token_id,
                &self.erc721,
            );
            // Add to new owner's enumeration
            let _ = self
                .enumerable
                ._add_token_to_owner_enumeration(to, token_id, &self.erc721);
        }
        Ok(())
    }

    fn safe_transfer_from_with_data(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
        data: Bytes,
    ) -> Result<(), erc721::Error> {
        // Get the current owner before transfer
        let previous_owner = self.erc721.owner_of(token_id)?;

        // Perform the transfer
        self.erc721
            .safe_transfer_from_with_data(from, to, token_id, data)?;

        // Update enumerations only if owner actually changed
        if previous_owner != to {
            // Remove from previous owner's enumeration
            let _ = self.enumerable._remove_token_from_owner_enumeration(
                previous_owner,
                token_id,
                &self.erc721,
            );
            // Add to new owner's enumeration
            let _ = self
                .enumerable
                ._add_token_to_owner_enumeration(to, token_id, &self.erc721);
        }
        Ok(())
    }

    fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), erc721::Error> {
        // Get the current owner before transfer
        let previous_owner = self.erc721.owner_of(token_id)?;

        // Perform the transfer
        self.erc721.transfer_from(from, to, token_id)?;

        // Update enumerations only if owner actually changed
        if previous_owner != to {
            // Remove from previous owner's enumeration
            let _ = self.enumerable._remove_token_from_owner_enumeration(
                previous_owner,
                token_id,
                &self.erc721,
            );
            // Add to new owner's enumeration
            let _ = self
                .enumerable
                ._add_token_to_owner_enumeration(to, token_id, &self.erc721);
        }
        Ok(())
    }

    fn approve(&mut self, to: Address, token_id: U256) -> Result<(), erc721::Error> {
        self.erc721.approve(to, token_id)
    }

    fn set_approval_for_all(&mut self, to: Address, approved: bool) -> Result<(), erc721::Error> {
        self.erc721.set_approval_for_all(to, approved)
    }

    fn get_approved(&self, token_id: U256) -> Result<Address, erc721::Error> {
        self.erc721.get_approved(token_id)
    }

    fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.erc721.is_approved_for_all(owner, operator)
    }

    fn name(&self) -> String {
        self.metadata.name()
    }

    fn symbol(&self) -> String {
        self.metadata.symbol()
    }

    #[selector(name = "tokenURI")]
    fn token_uri(&self, token_id: U256) -> Result<String, erc721::Error> {
        // Compute URI based on token_id % 3 without storing per-token strings
        let r = token_id % U256::from(3);
        let cid = if r == U256::from(0) {
            "QmVHi3c4qkZcH3cJynzDXRm5n7dzc9R9TUtUcfnWQvhdcw"
        } else if r == U256::from(1) {
            "QmfVMAmNM1kDEBYrC2TPzQDoCRFH6F5tE1e9Mr4FkkR5Xr"
        } else {
            "QmcvcUaKf6JyCXhLD1by6hJXNruPQGs3kkLg2W1xr7nF1j"
        };
        Ok(self.metadata.base_uri() + cid)
    }

    #[selector(name = "tokenOfOwnerByIndex")]
    fn token_of_owner_by_index(
        &self,
        owner: Address,
        index: U256,
    ) -> Result<U256, enumerable::Error> {
        Ok(self.enumerable.token_of_owner_by_index(owner, index)?)
    }

    #[selector(name = "tokenByIndex")]
    fn token_by_index(&self, index: U256) -> Result<U256, enumerable::Error> {
        Ok(self.enumerable.token_by_index(index)?)
    }
}

#[public]
impl IErc721 for Erc721MetadataExample {
    type Error = erc721::Error;

    fn balance_of(&self, owner: Address) -> Result<U256, Self::Error> {
        self.erc721.balance_of(owner)
    }

    fn owner_of(&self, token_id: U256) -> Result<Address, Self::Error> {
        self.erc721.owner_of(token_id)
    }

    fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), Self::Error> {
        self.erc721.safe_transfer_from(from, to, token_id)
    }

    fn safe_transfer_from_with_data(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
        data: Bytes,
    ) -> Result<(), Self::Error> {
        self.erc721
            .safe_transfer_from_with_data(from, to, token_id, data)
    }

    fn transfer_from(
        &mut self,
        from: Address,
        to: Address,
        token_id: U256,
    ) -> Result<(), Self::Error> {
        self.erc721.transfer_from(from, to, token_id)
    }

    fn approve(&mut self, to: Address, token_id: U256) -> Result<(), Self::Error> {
        self.erc721.approve(to, token_id)
    }

    fn set_approval_for_all(&mut self, to: Address, approved: bool) -> Result<(), Self::Error> {
        self.erc721.set_approval_for_all(to, approved)
    }

    fn get_approved(&self, token_id: U256) -> Result<Address, Self::Error> {
        self.erc721.get_approved(token_id)
    }

    fn is_approved_for_all(&self, owner: Address, operator: Address) -> bool {
        self.erc721.is_approved_for_all(owner, operator)
    }
}

#[public]
impl IErc721Metadata for Erc721MetadataExample {
    type Error = erc721::Error;

    fn name(&self) -> String {
        self.metadata.name()
    }

    fn symbol(&self) -> String {
        self.metadata.symbol()
    }

    #[selector(name = "tokenURI")]
    fn token_uri(&self, token_id: U256) -> Result<String, Self::Error> {
        Ok(self.metadata.token_uri(token_id, &self.erc721)?)
    }
}

#[public]
impl IErc721Enumerable for Erc721MetadataExample {
    type Error = enumerable::Error;

    fn total_supply(&self) -> U256 {
        self.enumerable.total_supply()
    }

    fn token_by_index(&self, index: U256) -> Result<U256, Self::Error> {
        Ok(self.enumerable.token_by_index(index)?)
    }

    fn token_of_owner_by_index(&self, owner: Address, index: U256) -> Result<U256, Self::Error> {
        Ok(self.enumerable.token_of_owner_by_index(owner, index)?)
    }
}

#[public]
impl IErc165 for Erc721MetadataExample {
    fn supports_interface(&self, interface_id: B32) -> bool {
        self.erc721.supports_interface(interface_id)
            || <Self as IErc721Metadata>::interface_id() == interface_id
            || <Self as IErc721Enumerable>::interface_id() == interface_id
    }
}
