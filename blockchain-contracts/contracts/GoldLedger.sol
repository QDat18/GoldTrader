// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract GoldLedger is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Struct to store Proof of Custody (order info + pdf hash)
    struct OrderProof {
        string orderId;
        string pdfHash;
        uint256 timestamp;
        uint256 goldAmount; // In some denomination (e.g., mace, tael)
        string metadataURI; // URI to IPFS or off-chain metadata (optional)
    }

    // Mapping from tokenId to OrderProof
    mapping(uint256 => OrderProof) public orderProofs;
    // Mapping from orderId to tokenId to prevent duplicate minting for same order
    mapping(string => uint256) public orderToTokenId;

    event GoldMinted(address indexed to, uint256 indexed tokenId, string orderId, string pdfHash);

    constructor(address initialOwner) ERC721("GoldTrader Token", "GOLD") Ownable(initialOwner) {}

    function mintGold(
        address to,
        string memory orderId,
        string memory pdfHash,
        uint256 goldAmount,
        string memory uri
    ) public onlyOwner returns (uint256) {
        require(bytes(orderId).length > 0, "Order ID cannot be empty");
        require(bytes(pdfHash).length > 0, "PDF Hash cannot be empty");
        require(orderToTokenId[orderId] == 0, "Order already has a token");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        // Record proof
        orderProofs[tokenId] = OrderProof({
            orderId: orderId,
            pdfHash: pdfHash,
            timestamp: block.timestamp,
            goldAmount: goldAmount,
            metadataURI: uri
        });

        orderToTokenId[orderId] = tokenId;

        // Mint token
        _safeMint(to, tokenId);
        
        // (Optional) Set ERC721 token URI for NFT metadata
        if (bytes(uri).length > 0) {
            _setTokenURI(tokenId, uri);
        }

        emit GoldMinted(to, tokenId, orderId, pdfHash);

        return tokenId;
    }

    function getProofByOrderId(string memory orderId) public view returns (OrderProof memory) {
        uint256 tokenId = orderToTokenId[orderId];
        require(tokenId != 0, "Order not found");
        return orderProofs[tokenId];
    }

    // Verify if a hash matches the on-chain recorded hash for an order
    function verifyHash(string memory orderId, string memory hashToVerify) public view returns (bool) {
        uint256 tokenId = orderToTokenId[orderId];
        if (tokenId == 0) return false;
        
        // String comparison via keccak256
        return (keccak256(abi.encodePacked(orderProofs[tokenId].pdfHash)) == keccak256(abi.encodePacked(hashToVerify)));
    }

    // The following functions are overrides required by Solidity.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
