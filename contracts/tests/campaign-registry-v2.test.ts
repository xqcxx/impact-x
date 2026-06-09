import { Cl } from "@stacks/transactions";
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const charlie = accounts.get("wallet_3")!;

// Mock USDCx token contract address (using test token)
const MOCK_TOKEN = `${deployer}.token-abtc`;

describe("Campaign Registry V2 - Escrow Tests", () => {
  const CAMPAIGN_GOAL = 1000_000000; // 1000 USDCx (6 decimals)
  const DURATION = 1440; // ~10 days in blocks
  const IPFS_HASH = "QmTest123456789";

  beforeEach(() => {
    // Reset simnet state for each test
    simnet.setEpoch("3.0");
  });

  describe("Campaign Creation", () => {
    it("should create a campaign successfully", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should fail with zero goal", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [Cl.stringAscii(IPFS_HASH), Cl.uint(0), Cl.uint(DURATION)],
        alice
      );

      expect(result).toBeErr(Cl.uint(106)); // ERR_INVALID_AMOUNT
    });

    it("should fail with zero duration", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [Cl.stringAscii(IPFS_HASH), Cl.uint(CAMPAIGN_GOAL), Cl.uint(0)],
        alice
      );

      expect(result).toBeErr(Cl.uint(106)); // ERR_INVALID_AMOUNT
    });

    it("should initialize campaign with correct data", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );

      const campaign = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-campaign",
        [Cl.uint(1)],
        alice
      );

      expect(campaign.result).toBeSome(
        Cl.tuple({
          owner: Cl.principal(alice),
          "ipfs-hash": Cl.stringAscii(IPFS_HASH),
          goal: Cl.uint(CAMPAIGN_GOAL),
          raised: Cl.uint(0),
          deadline: Cl.uint(simnet.blockHeight + DURATION),
          claimed: Cl.bool(false),
          "created-at": Cl.uint(simnet.blockHeight),
          "refund-enabled": Cl.bool(true),
        })
      );
    });
  });

  describe("Donations (Escrow)", () => {
    beforeEach(() => {
      // Create a campaign
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );
    });

    it("should accept donation and update raised amount", () => {
      const donationAmount = 100_000000; // 100 USDCx

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(donationAmount), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeOk(Cl.bool(true));

      // Check campaign raised amount
      const campaign = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-campaign",
        [Cl.uint(1)],
        bob
      );

      const campaignData = campaign.result.expectSome();
      expect(campaignData["raised"]).toEqual(Cl.uint(donationAmount));
    });

    it("should track individual donations", () => {
      const donationAmount = 50_000000;

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(donationAmount), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const donation = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-donation",
        [Cl.uint(1), Cl.principal(bob)],
        bob
      );

      expect(donation.result).toEqual(
        Cl.tuple({
          amount: Cl.uint(donationAmount),
          refunded: Cl.bool(false),
        })
      );
    });

    it("should increment backer count for new donors", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(10_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(20_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        charlie
      );

      const backerCount = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-backer-count",
        [Cl.uint(1)],
        alice
      );

      expect(backerCount.result).toEqual(Cl.tuple({ count: Cl.uint(2) }));
    });

    it("should not increment backer count for repeat donors", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(10_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(10_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const backerCount = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-backer-count",
        [Cl.uint(1)],
        alice
      );

      expect(backerCount.result).toEqual(Cl.tuple({ count: Cl.uint(1) }));
    });

    it("should fail donation to expired campaign", () => {
      // Fast-forward past deadline
      simnet.mineEmptyBlocks(DURATION + 1);

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(10_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeErr(Cl.uint(104)); // ERR_CAMPAIGN_EXPIRED
    });
  });

  describe("Claim Funds (with 5% fee)", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );

      // Donate to meet goal
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(CAMPAIGN_GOAL), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );
    });

    it("should allow owner to claim when goal met", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        alice
      );

      expect(result).toBeOk(
        Cl.tuple({
          payout: Cl.uint(950_000000), // 95% of 1000 USDCx
          fee: Cl.uint(50_000000), // 5% fee
        })
      );
    });

    it("should calculate 5% platform fee correctly", () => {
      const fee = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "calculate-fee",
        [Cl.uint(1000_000000)],
        alice
      );

      expect(fee.result).toEqual(Cl.uint(50_000000)); // 5% of 1000
    });

    it("should fail if goal not met", () => {
      // Create underfunded campaign
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        charlie
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(2), Cl.uint(500_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(2), Cl.contractPrincipal(deployer, "token-abtc")],
        charlie
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR_GOAL_NOT_MET
    });

    it("should fail if non-owner tries to claim", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_OWNER
    });

    it("should prevent double claiming", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        alice
      );

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        alice
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR_ALREADY_CLAIMED
    });
  });

  describe("Refunds", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );

      // Donate but don't meet goal
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(500_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );
    });

    it("should allow refund when campaign expired and goal not met", () => {
      // Fast-forward past deadline
      simnet.mineEmptyBlocks(DURATION + 1);

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeOk(Cl.uint(500_000000));
    });

    it("should mark donation as refunded", () => {
      simnet.mineEmptyBlocks(DURATION + 1);

      simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const donation = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-donation",
        [Cl.uint(1), Cl.principal(bob)],
        bob
      );

      expect(donation.result).toEqual(
        Cl.tuple({
          amount: Cl.uint(500_000000),
          refunded: Cl.bool(true),
        })
      );
    });

    it("should prevent double refunds", () => {
      simnet.mineEmptyBlocks(DURATION + 1);

      simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeErr(Cl.uint(109)); // ERR_ALREADY_REFUNDED
    });

    it("should fail refund if campaign not expired", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeErr(Cl.uint(110)); // ERR_REFUND_NOT_AVAILABLE
    });

    it("should fail refund if goal was met", () => {
      // Add more donations to meet goal
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(500_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        charlie
      );

      simnet.mineEmptyBlocks(DURATION + 1);

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      expect(result).toBeErr(Cl.uint(110)); // ERR_REFUND_NOT_AVAILABLE
    });

    it("should track refund statistics", () => {
      simnet.mineEmptyBlocks(DURATION + 1);

      simnet.callPublicFn(
        "campaign-registry-v2",
        "request-refund",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      const stats = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-refund-stats",
        [Cl.uint(1)],
        alice
      );

      expect(stats.result).toEqual(
        Cl.tuple({
          "total-refunded": Cl.uint(500_000000),
          "refund-count": Cl.uint(1),
        })
      );
    });
  });

  describe("Campaign Endorsements", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );
    });

    it("should allow a user to endorse a campaign", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(1)],
        bob
      );

      expect(result).toBeOk(Cl.bool(true));

      const hasEndorsed = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "has-endorsed",
        [Cl.uint(1), Cl.principal(bob)],
        bob
      );

      expect(hasEndorsed.result).toBeBool(true);
    });

    it("should increment endorsement count", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(1)],
        bob
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(1)],
        charlie
      );

      const count = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-endorsement-count",
        [Cl.uint(1)],
        alice
      );

      expect(count.result).toEqual(Cl.tuple({ count: Cl.uint(2) }));
    });

    it("should prevent duplicate endorsements", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(1)],
        bob
      );

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(1)],
        bob
      );

      expect(result).toBeErr(Cl.uint(112)); // ERR_ALREADY_ENDORSED
    });

    it("should fail for missing campaign", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "endorse-campaign",
        [Cl.uint(99)],
        bob
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR_CAMPAIGN_NOT_FOUND
    });
  });

  describe("Campaign Updates", () => {
    const UPDATE_HASH = "QmUpdate123456789";

    beforeEach(() => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );
    });

    it("should allow campaign owner to post an update", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(1), Cl.stringAscii(UPDATE_HASH)],
        alice
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("should store posted update details", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(1), Cl.stringAscii(UPDATE_HASH)],
        alice
      );

      const update = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-campaign-update",
        [Cl.uint(1), Cl.uint(1)],
        alice
      );

      expect(update.result).toBeSome(
        Cl.tuple({
          author: Cl.principal(alice),
          "ipfs-hash": Cl.stringAscii(UPDATE_HASH),
          "created-at": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("should increment update count", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(1), Cl.stringAscii(UPDATE_HASH)],
        alice
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(1), Cl.stringAscii("QmUpdate987654321")],
        alice
      );

      const count = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "get-campaign-update-count",
        [Cl.uint(1)],
        alice
      );

      expect(count.result).toEqual(Cl.tuple({ count: Cl.uint(2) }));
    });

    it("should fail if non-owner posts an update", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(1), Cl.stringAscii(UPDATE_HASH)],
        bob
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_OWNER
    });

    it("should fail update for missing campaign", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "post-campaign-update",
        [Cl.uint(99), Cl.stringAscii(UPDATE_HASH)],
        alice
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR_CAMPAIGN_NOT_FOUND
    });
  });

  describe("Read-Only Helper Functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );
    });

    it("should check if goal is met", () => {
      let result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "is-goal-met",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(false);

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(CAMPAIGN_GOAL), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "is-goal-met",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(true);
    });

    it("should check if campaign is expired", () => {
      let result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "is-expired",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(false);

      simnet.mineEmptyBlocks(DURATION + 1);

      result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "is-expired",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(true);
    });

    it("should check if can claim", () => {
      let result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "can-claim",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(false);

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(CAMPAIGN_GOAL), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "can-claim",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(true);
    });

    it("should check if can refund", () => {
      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(500_000000), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      let result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "can-refund",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(false);

      simnet.mineEmptyBlocks(DURATION + 1);

      result = simnet.callReadOnlyFn(
        "campaign-registry-v2",
        "can-refund",
        [Cl.uint(1)],
        alice
      );
      expect(result.result).toBeBool(true);
    });
  });

  describe("Admin Functions", () => {
    it("should allow contract owner to withdraw fees", () => {
      // Create campaign and complete it
      simnet.callPublicFn(
        "campaign-registry-v2",
        "create-campaign",
        [
          Cl.stringAscii(IPFS_HASH),
          Cl.uint(CAMPAIGN_GOAL),
          Cl.uint(DURATION),
        ],
        alice
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "donate",
        [Cl.uint(1), Cl.uint(CAMPAIGN_GOAL), Cl.contractPrincipal(deployer, "token-abtc")],
        bob
      );

      simnet.callPublicFn(
        "campaign-registry-v2",
        "claim-funds",
        [Cl.uint(1), Cl.contractPrincipal(deployer, "token-abtc")],
        alice
      );

      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "withdraw-fees",
        [Cl.contractPrincipal(deployer, "token-abtc")],
        deployer
      );

      expect(result).toBeOk(Cl.uint(50_000000)); // 5% of 1000 USDCx
    });

    it("should fail if non-owner tries to withdraw fees", () => {
      const { result } = simnet.callPublicFn(
        "campaign-registry-v2",
        "withdraw-fees",
        [Cl.contractPrincipal(deployer, "token-abtc")],
        alice
      );

      expect(result).toBeErr(Cl.uint(107)); // ERR_UNAUTHORIZED
    });
  });
});
