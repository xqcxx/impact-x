;; Impact-X Campaign Registry V1 (DEPRECATED)
;; WARNING: This contract is deprecated. Use campaign-registry-v2.clar for new deployments.
;; V1 lacks true escrow (uses optimistic register-deposit pattern)
;; V2 implements proper SIP-010 token transfers with automatic refunds
;; 
;; A cross-chain crowdfunding platform for the Bitcoin economy
;; Stores campaigns with IPFS metadata hashes and tracks funding progress

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

;; Platform fee: 5% (500 basis points)
(define-constant PLATFORM_FEE_BPS u500)
(define-constant BPS_DENOMINATOR u10000)

;; ============================================
;; Data Variables
;; ============================================

;; Counter for generating unique campaign IDs
(define-data-var campaign-counter uint u0)

;; Total platform fees collected (in micro-USDCx)
(define-data-var total-fees-collected uint u0)

;; ============================================
;; Data Maps
;; ============================================

;; Campaign data storage
;; ipfs-hash: IPFS CID containing title, description, images, story
;; goal: funding goal in micro-USDCx (6 decimals)
;; raised: amount raised so far
;; deadline: block height deadline
;; claimed: whether funds have been claimed
(define-map campaigns
  { id: uint }
  {
    owner: principal,
    ipfs-hash: (string-ascii 64),
    goal: uint,
    raised: uint,
    deadline: uint,
    claimed: bool,
    created-at: uint
  }
)

;; Track donations per campaign per donor (for potential refunds)
(define-map donations
  { campaign-id: uint, donor: principal }
  { amount: uint }
)

;; Track total number of backers per campaign
(define-map campaign-backers
  { campaign-id: uint }
  { count: uint }
)

;; ============================================
;; Read-Only Functions
;; ============================================

;; Get campaign by ID
(define-read-only (get-campaign (id uint))
  (map-get? campaigns { id: id })
)

;; Get total number of campaigns
(define-read-only (get-campaign-count)
  (var-get campaign-counter)
)

;; Get donation amount for a specific donor
(define-read-only (get-donation (campaign-id uint) (donor principal))
  (default-to { amount: u0 }
    (map-get? donations { campaign-id: campaign-id, donor: donor }))
)

;; Get backer count for a campaign
(define-read-only (get-backer-count (campaign-id uint))
  (default-to { count: u0 }
    (map-get? campaign-backers { campaign-id: campaign-id }))
)

;; Check if campaign goal is met
(define-read-only (is-goal-met (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (>= (get raised campaign) (get goal campaign))
    false
  )
)

;; Check if campaign is expired
(define-read-only (is-expired (campaign-id uint))
  (match (map-get? campaigns { id: campaign-id })
    campaign (> stacks-block-height (get deadline campaign))
    false
  )
)

;; Calculate platform fee for an amount
(define-read-only (calculate-fee (amount uint))
  (/ (* amount PLATFORM_FEE_BPS) BPS_DENOMINATOR)
)

;; Get total fees collected
(define-read-only (get-total-fees)
  (var-get total-fees-collected)
)

;; ============================================
;; Public Functions
;; ============================================

;; Create a new campaign
;; @param ipfs-hash: IPFS CID for campaign metadata (max 64 chars)
;; @param goal: funding goal in micro-USDCx
;; @param duration-blocks: number of blocks until deadline (~10 min per block on Stacks)
(define-public (create-campaign 
    (ipfs-hash (string-ascii 64)) 
    (goal uint) 
    (duration-blocks uint))
  (let (
    (new-id (+ (var-get campaign-counter) u1))
    (deadline (+ stacks-block-height duration-blocks))
  )
    ;; Validate goal is positive
    (asserts! (> goal u0) ERR_INVALID_AMOUNT)
    
    ;; Store campaign
    (map-set campaigns { id: new-id }
      {
        owner: tx-sender,
        ipfs-hash: ipfs-hash,
        goal: goal,
        raised: u0,
        deadline: deadline,
        claimed: false,
        created-at: stacks-block-height
      }
    )
    
    ;; Initialize backer count
    (map-set campaign-backers { campaign-id: new-id } { count: u0 })
    
    ;; Increment counter
    (var-set campaign-counter new-id)
    
    ;; Emit event
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

;; Register a deposit (called by creator after bridge completes)
;; In a production system, this would verify the actual USDCx transfer
;; For MVP, we trust the creator to register honest amounts
;; @param campaign-id: ID of the campaign
;; @param amount: amount in micro-USDCx
;; @param donor: the donor's Stacks address (derived from bridge)
(define-public (register-deposit (campaign-id uint) (amount uint) (donor principal))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (current-donation (get amount (get-donation campaign-id donor)))
    (current-backers (get count (get-backer-count campaign-id)))
  )
    ;; Only owner can register deposits for their campaign
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    
    ;; Campaign must not be expired
    (asserts! (<= stacks-block-height (get deadline campaign)) ERR_CAMPAIGN_EXPIRED)
    
    ;; Validate amount
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    
    ;; Update campaign raised amount
    (map-set campaigns { id: campaign-id }
      (merge campaign { raised: (+ (get raised campaign) amount) })
    )
    
    ;; Update donor's total donation
    (map-set donations { campaign-id: campaign-id, donor: donor }
      { amount: (+ current-donation amount) }
    )
    
    ;; Increment backer count if this is a new donor
    (if (is-eq current-donation u0)
      (map-set campaign-backers { campaign-id: campaign-id }
        { count: (+ current-backers u1) })
      true
    )
    
    ;; Emit event
    (print { 
      event: "deposit-registered", 
      campaign-id: campaign-id, 
      donor: donor,
      amount: amount,
      new-total: (+ (get raised campaign) amount)
    })
    
    (ok true)
  )
)

;; Claim funds (only if goal met)
;; In production, this would transfer USDCx tokens
;; For MVP, this just marks the campaign as claimed
(define-public (claim-funds (campaign-id uint))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
    (fee (calculate-fee (get raised campaign)))
    (payout (- (get raised campaign) fee))
  )
    ;; Only owner can claim
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    
    ;; Must not be already claimed
    (asserts! (not (get claimed campaign)) ERR_ALREADY_CLAIMED)
    
    ;; Goal must be met
    (asserts! (>= (get raised campaign) (get goal campaign)) ERR_GOAL_NOT_MET)
    
    ;; Mark as claimed
    (map-set campaigns { id: campaign-id }
      (merge campaign { claimed: true })
    )
    
    ;; Track fees
    (var-set total-fees-collected (+ (var-get total-fees-collected) fee))
    
    ;; Emit event
    (print { 
      event: "funds-claimed", 
      campaign-id: campaign-id, 
      owner: tx-sender,
      total-raised: (get raised campaign),
      fee: fee,
      payout: payout
    })
    
    (ok { payout: payout, fee: fee })
  )
)

;; Update campaign IPFS hash (only owner, only before deadline)
(define-public (update-campaign-metadata (campaign-id uint) (new-ipfs-hash (string-ascii 64)))
  (let (
    (campaign (unwrap! (map-get? campaigns { id: campaign-id }) ERR_CAMPAIGN_NOT_FOUND))
  )
    ;; Only owner can update
    (asserts! (is-eq tx-sender (get owner campaign)) ERR_NOT_OWNER)
    
    ;; Campaign must not be expired
    (asserts! (<= stacks-block-height (get deadline campaign)) ERR_CAMPAIGN_EXPIRED)
    
    ;; Update metadata
    (map-set campaigns { id: campaign-id }
      (merge campaign { ipfs-hash: new-ipfs-hash })
    )
    
    ;; Emit event for indexers
    (print { 
      event: "metadata-updated", 
      campaign-id: campaign-id,
      ipfs-hash: new-ipfs-hash
    })
    
    (ok true)
  )
)

;; ============================================
;; Admin Functions
;; ============================================

;; Withdraw collected platform fees (only contract owner)
(define-public (withdraw-fees)
  (let (
    (fees (var-get total-fees-collected))
  )
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> fees u0) ERR_INVALID_AMOUNT)
    
    ;; Reset fees
    (var-set total-fees-collected u0)
    
    ;; Emit event
    (print { event: "fees-withdrawn", amount: fees, recipient: tx-sender })
    
    (ok fees)
  )
)
