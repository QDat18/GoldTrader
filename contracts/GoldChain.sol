// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GoldChainToken (GCT)
 * @dev ERC-20 token representing digitized gold. 1 GCT = 1 Chi of physical gold.
 * Backed 1:1 by physical gold custody in Vault.
 */
contract GoldChainToken {
    string public name = "GoldChain Gold Token";
    string public symbol = "GCT";
    uint8 public decimals = 4; // Backed 1:1, supports up to 4 decimal places (e.g. 0.0001 chi)
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transfer(address to, uint256 value) public returns (bool success) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool success) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool success) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @dev Mint GCT when customer deposits physical gold or buys gold online.
     */
    function mint(address to, uint256 amount) public onlyOwner returns (bool) {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
        return true;
    }

    /**
     * @dev Burn GCT when customer withdraws physical gold at counter.
     */
    function burn(address from, uint256 amount) public onlyOwner returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance to burn");
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Burn(from, amount);
        emit Transfer(from, address(0), amount);
        return true;
    }
}

/**
 * @title GoldChainCustody (Proof of Custody Registry)
 * @dev Stores SHA-256 hashes of PDF contracts to guarantee document integrity.
 */
contract GoldChainCustody {
    address public owner;

    struct ContractRecord {
        string contractNumber;
        string buyerCCCD;
        string pdfSha256; // SHA-256 hash of the generated PDF invoice
        uint256 timestamp;
        bool isExist;
    }

    // Mapping from contract number to Record details
    mapping(string => ContractRecord) public contracts;
    
    // Mapping from pdf hash to verification state
    mapping(string => bool) public verifiedHashes;

    event ContractRecorded(string indexed contractNumber, string pdfSha256, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Record contract data and hash on-chain (Proof of Custody).
     */
    function recordContract(
        string memory _contractNumber,
        string memory _buyerCCCD,
        string memory _pdfSha256
    ) public returns (bool) {
        require(!contracts[_contractNumber].isExist, "Contract already recorded");
        
        contracts[_contractNumber] = ContractRecord({
            contractNumber: _contractNumber,
            buyerCCCD: _buyerCCCD,
            pdfSha256: _pdfSha256,
            timestamp: block.timestamp,
            isExist: true
        });

        verifiedHashes[_pdfSha256] = true;

        emit ContractRecorded(_contractNumber, _pdfSha256, block.timestamp);
        return true;
    }

    /**
     * @dev Verify if a PDF hash is authentic and registered on-chain.
     */
    function verifyHash(string memory _pdfSha256) public view returns (bool) {
        return verifiedHashes[_pdfSha256];
    }
}
