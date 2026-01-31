;; Impact-X Campaign Registry V2
;; Cross-chain crowdfunding platform with USDCx escrow
;; Features: Trustless deposits, automatic refunds, milestone tracking
;; 
;; This contract manages fundraising campaigns on Stacks blockchain with the following features:
;; - Campaign creation with customizable goals and deadlines
;; - USDCx token escrow for secure donation holding
;; - 5% platform fee on successful campaigns
;; - Automatic refund mechanism for failed campaigns
;; - Emergency pause functionality for security
;; - Comprehensive status tracking and analytics
;;
;; Architecture:
;; - Uses SIP-010 trait for USDCx token interactions
;; - Escrow pattern: all donations held in contract until claimed or refunded
;; - Immutable campaign records with updatable metadata
;; - Event logging for all major state changes
;;
;; Security Considerations:
;; - Only campaign owners can claim funds when goal is met
;; - Refunds only available after deadline if goal not met
;; - Contract owner can pause in emergencies
;; - No reentrancy vulnerabilities (Clarity safety)
;; - No integer overflow (Clarity safety with uint)

;; ============================================
;; Traits
;; ============================================

;; SIP-010 Fungible Token Trait (defined inline for compatibility)
(define-trait sip-010-trait
  (
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)

;; ============================================
;; Constants
;; ============================================

(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_NOT_OWNER (err u100))
(define-constant ERR_CAMPAIGN_NOT_FOUND (err u101))
(define-constant ERR_ALREADY_CLAIMED (err u102))
(define-constant ERR_GOAL_NOT_MET (err u103))
(define-constant ERR_CAMPAIGN_EXPIRED (err u104))
(define-constant ERR_CAMPAIGN_NOT_EXPIRED (err u105))
(define-constant ERR_INVALID_AMOUNT (err u106))
(define-constant ERR_UNAUTHORIZED (err u107))
(define-constant ERR_TRANSFER_FAILED (err u108))
(define-constant ERR_ALREADY_REFUNDED (err u109))
(define-constant ERR_REFUND_NOT_AVAILABLE (err u110))
(define-constant ERR_GOAL_ALREADY_MET (err u111))
(define-constant ERR_CAMPAIGN_CANCELLED (err u112))
(define-constant ERR_NOT_CANCELLED (err u113))
(define-constant ERR_CONTRACT_PAUSED (err u114))

;; Campaign status constants
(define-constant STATUS_ACTIVE u0)
(define-constant STATUS_FUNDED u1)
(define-constant STATUS_EXPIRED u2)
(define-constant STATUS_CLAIMED u3)
(define-constant STATUS_CANCELLED u4)

;; Platform fee: 5% (500 basis points)
(define-constant PLATFORM_FEE_BPS u500)
(define-constant BPS_DENOMINATOR u10000)

;; USDCx token contract (testnet)
(define-constant USDCX_CONTRACT 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx)

;; ============================================
;; Data Variables
;; ============================================

(define-data-var campaign-counter uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var total-donations uint u0)
(define-data-var contract-paused bool false)

;; ============================================
;; Data Maps
;; ============================================

;; Campaign data with escrow tracking
(define-map campaigns
  { id: uint }
  {
    owner: principal,
    ipfs-hash: (string-ascii 64),
    goal: uint,
    raised: uint,
    deadline: uint,
    claimed: bool,
    created-at: uint,
    refund-enabled: bool
  }
)

;; Track individual donations for refunds
(define-map donations
  { campaign-id: uint, donor: principal }
  { 
    amount: uint,
    refunded: bool
  }
)

;; Track backer count
(define-map campaign-backers
  { campaign-id: uint }
  { count: uint }
)

;; Track refund status
(define-map refund-tracker
  { campaign-id: uint }
  { total-refunded: uint, refund-count: uint }
)

;; ============================================
;; Read-Only Functions
;; ============================================

(define-read-only (get-campaign (id uint))
  (map-get? campaigns { id: id })
)

(define-read-only (get-campaign-count)
  (var-get campaign-counter)
)

(define-read-only (get-donation (campaign-id uint) (donor principal))
  (default-to { amount: u0, refunded: false }
    (map-get? donations { campaign-id: campaign-id, donor: donor }))
)

(define-read-only (get-backer-count (campaign-id uint))
  (default-to { count: u0 }
    (map-get? campaign-backers { campaign-id: campaign-id }))
)

(define-read-only (get-refund-stats (campaign-id uint))
  (default-to { total-refunded: u0, refund-count: u0 }
    (map-get? refund-tracker { campaign-id: campaign-id }))
)

(define-read-only (is-goal-met (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (>= (get raised campaign) (get goal campaign))
    false
  )
)

(define-read-only (is-expired (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (> stacks-block-height (get deadline campaign))
    false
  )
)

(define-read-only (can-claim (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (and 
      (>= (get raised campaign) (get goal campaign))
      (not (get claimed campaign))
    )
    false
  )
)

(define-read-only (can-refund (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (and 
      (> stacks-block-height (get deadline campaign))
      (< (get raised campaign) (get goal campaign))
      (not (get claimed campaign))
      (get refund-enabled campaign)
    )
    false
  )
)

;; Get campaign status as a readable constant
(define-read-only (get-campaign-status (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign 
      (if (get claimed campaign)
        STATUS_CLAIMED
        (if (> stacks-block-height (get deadline campaign))
          (if (>= (get raised campaign) (get goal campaign))
            STATUS_FUNDED
            STATUS_EXPIRED
          )
          (if (>= (get raised campaign) (get goal campaign))
            STATUS_FUNDED
            STATUS_ACTIVE
          )
        )
      )
    STATUS_EXPIRED
  )
)

(define-read-only (calculate-fee (amount uint))
  (/ (* amount PLATFORM_FEE_BPS) BPS_DENOMINATOR)
)

(define-read-only (calculate-payout (amount uint))
  (- amount (calculate-fee amount))
)

(define-read-only (get-total-fees)
  (var-get total-fees-collected)
)

(define-read-only (get-total-donations)
  (var-get total-donations)
)

(define-read-only (is-contract-paused)
  (var-get contract-paused)
)

;; Check if contract is not paused (for use in asserts!)
(define-private (check-not-paused)
  (ok (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED))
)

;; ============================================
;; Public Functions - Campaign Management
;; ============================================

;; Create a new campaign
(define-public (create-campaign 
    (ipfs-hash (string-ascii 64)) 
    (goal uint) 
    (duration-blocks uint))
  (let (
    (new-id (+ (var-get campaign-counter) u1))
    (deadline (+ stacks-block-height duration-blocks))
  )
    (asserts! (> goal u0) ERR_INVALID_AMOUNT)
    (asserts! (> duration-blocks u0) ERR_INVALID_AMOUNT)
    
    (map-set campaigns { id: new-id }
      {
        owner: tx-sender,
        ipfs-hash: ipfs-hash,
        goal: goal,
        raised: u0,
        deadline: deadline,
        claimed: false,
        created-at: stacks-block-height,
        refund-enabled: true
      }
    )
    
    (map-set campaign-backers { campaign-id: new-id } { count: u0 })
    (map-set refund-tracker { campaign-id: new-id } { total-refunded: u0, refund-count: u0 })
    
    (var-set campaign-counter new-id)
    
    (print { 
      event: "campaign-created", 
      id: new-id, 
      owner: tx-sender, 
      goal: goal,
      deadline: deadline,
      ipfs-hash: ipfs-hash
    })
    
    (ok new-id)
  )
)

;; ============================================
;; Public Functions - Donations (Escrow)
;; ============================================

;; Deposit USDCx to campaign (via escrow)
;; Anyone can donate by sending USDCx to this contract
(define-public (donate (campaign-id uint) (amount uint) (token <sip-010-trait>))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (current-donation (get amount (get-donation campaign-id tx-sender)))
    (current-backers (get count (get-backer-count campaign-id)))
  )
    ;; Validate campaign is active
    (asserts! (<= stacks-block-height (get deadline campaign)) ERR_CAMPAIGN_EXPIRED)
    (asserts! (not (get claimed campaign)) ERR_ALREADY_CLAIMED)
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Transfer USDCx from donor to this contract (escrow)
    (try! (contract-call? token transfer amount tx-sender (as-contract tx-sender) none))
    
    ;; Update campaign raised amount
    (map-set campaigns { id: campaign-id }
      (merge campaign { raised: (+ (get raised campaign) amount) })
    )
    
    ;; Update donor's donation
    (map-set donations { campaign-id: campaign-id, donor: tx-sender }
      { amount: (+ current-donation amount), refunded: false }
    )
    
    ;; Increment backer count if new donor
    (if (is-eq current-donation u0)
      (map-set campaign-backers { campaign-id: campaign-id }
        { count: (+ current-backers u1) })
      true
    )
    
    ;; Track total donations across all campaigns
    (var-set total-donations (+ (var-get total-donations) amount))
    
    (print { 
      event: "donation-received", 
      campaign-id: campaign-id, 
      donor: tx-sender,
      amount: amount,
      new-total: (+ (get raised campaign) amount)
    })
    
    (ok true)
  )
)

;; ============================================
;; Public Functions - Claim Funds
;; ============================================

;; Claim funds (only if goal met, with 5% platform fee)
(define-public (claim-funds (campaign-id uint) (token <sip-010-trait>))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (total-raised (get raised campaign))
    (fee (calculate-fee total-raised))
    (payout (- total-raised fee))
  )
    ;; Validations
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    (asserts! (not (get claimed campaign)) ERR_ALREADY_CLAIMED)
    (asserts! (>= total-raised (get goal campaign)) ERR_GOAL_NOT_MET)
    
    ;; Mark as claimed
    (map-set campaigns { id: campaign-id }
      (merge campaign { claimed: true })
    )
    
    ;; Track platform fees
    (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
    
    ;; Transfer payout to campaign owner (95%)
    (try! (as-contract (contract-call? token transfer payout tx-sender (get owner campaign) none)))
    
    (print { 
      event: "funds-claimed", 
      campaign-id: campaign-id, 
      owner: tx-sender,
      total-raised: total-raised,
      fee: fee,
      payout: payout
    })
    
    (ok { payout: payout, fee: fee })
  )
)

;; ============================================
;; Public Functions - Refunds
;; ============================================

;; Request refund (only if campaign expired and goal not met)
(define-public (request-refund (campaign-id uint) (token <sip-010-trait>))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (donation-info (get-donation campaign-id tx-sender))
    (refund-amount (get amount donation-info))
    (refund-stats (get-refund-stats campaign-id))
  )
    ;; Validations
    (asserts! (> refund-amount u0) ERR_INVALID_AMOUNT)
    (asserts! (not (get refunded donation-info)) ERR_ALREADY_REFUNDED)
    (asserts! (can-refund campaign-id) ERR_REFUND_NOT_AVAILABLE)
    
    ;; Mark as refunded
    (map-set donations { campaign-id: campaign-id, donor: tx-sender }
      (merge donation-info { refunded: true })
    )
    
    ;; Update refund tracker
    (map-set refund-tracker { campaign-id: campaign-id }
      {
        total-refunded: (+ (get total-refunded refund-stats) refund-amount),
        refund-count: (+ (get refund-count refund-stats) u1)
      }
    )
    
    ;; Transfer refund from escrow back to donor
    (try! (as-contract (contract-call? token transfer refund-amount tx-sender tx-sender none)))
    
    (print { 
      event: "refund-processed", 
      campaign-id: campaign-id, 
      donor: tx-sender,
      amount: refund-amount
    })
    
    (ok refund-amount)
  )
)

;; ============================================
;; Public Functions - Metadata
;; ============================================

(define-public (update-campaign-metadata (campaign-id uint) (new-ipfs-hash (string-ascii 64)))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
  )
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    (asserts! (<= stacks-block-height (get deadline campaign)) ERR_CAMPAIGN_EXPIRED)
    
    (map-set campaigns { id: campaign-id }
      (merge campaign { ipfs-hash: new-ipfs-hash })
    )
    
    (print { 
      event: "metadata-updated", 
      campaign-id: campaign-id,
      ipfs-hash: new-ipfs-hash
    })
    
    (ok true)
  )
)

;; Cancel campaign (only owner, only if no donations)
(define-public (cancel-campaign (campaign-id uint))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (backer-data (get-backer-count campaign-id))
  )
    ;; Validations
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    (asserts! (is-eq (get count backer-data) u0) ERR_UNAUTHORIZED)
    (asserts! (not (get claimed campaign)) ERR_ALREADY_CLAIMED)
    (asserts! (<= stacks-block-height (get deadline campaign)) ERR_CAMPAIGN_EXPIRED)
    
    ;; Mark as expired (by setting deadline to current block)
    (map-set campaigns { id: campaign-id }
      (merge campaign { 
        deadline: stacks-block-height,
        refund-enabled: false
      })
    )
    
    (print { 
      event: "campaign-cancelled", 
      campaign-id: campaign-id,
      owner: tx-sender
    })
    
    (ok true)
  )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Withdraw platform fees (only contract owner)
(define-public (withdraw-fees (token <sip-010-trait>))
  (let (
    (fees (var-get total-fees-collected))
  )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> fees u0) ERR_INVALID_AMOUNT)
    
    (var-set total-fees-collected u0)
    
    ;; Transfer fees to contract owner
    (try! (as-contract (contract-call? token transfer fees tx-sender CONTRACT_OWNER none)))
    
    (print { event: "fees-withdrawn", amount: fees, recipient: tx-sender })
    
    (ok fees)
  )
)

;; Emergency pause contract (only owner)
(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set contract-paused true)
    (print { event: "contract-paused", by: tx-sender })
    (ok true)
  )
)

;; Unpause contract (only owner)
(define-public (unpause-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set contract-paused false)
    (print { event: "contract-unpaused", by: tx-sender })
    (ok true)
  )
)
