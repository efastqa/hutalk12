# Security Specification: HUTA.lk Real-Time Chat

## 1. Data Invariants
1. A conversation document can only be accessed (read/write) by authenticated participants (`buyerId == request.auth.uid || sellerId == request.auth.uid`).
2. When creating a conversation, the initiator MUST be authenticated and their `request.auth.uid` MUST match `buyerId`.
3. A message in `/conversations/{conversationId}/messages/{messageId}` can only be created by an authenticated user who is a valid participant of the parent conversation (`request.auth.uid == buyerId || request.auth.uid == sellerId`).
4. A message's `senderId` MUST strictly equal `request.auth.uid`.
5. Message text must be non-empty and limited to 2000 characters to prevent denial-of-wallet resource attacks.
6. Messages cannot be modified or deleted by users once sent (immutable log).
7. Document IDs must be alphanumeric strings bounded to 128 characters (`isValidId`).
8. The root database defaults to deny-all.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated conversation creation**: Attempting to create a conversation with no auth.
2. **Identity Spoofing in Conversation**: Authenticated user 'userA' creating conversation with `buyerId: 'userB'`.
3. **Ghost / Shadow Field Injection**: Conversation creation with injected unlisted key `isAdmin: true`.
4. **Oversized Message String Attack**: Creating a message with 100KB string to exhaust storage.
5. **Unauthorized Conversation Reading**: Authenticated user 'userC' attempting to read conversation between 'userA' and 'userB'.
6. **Malicious Message Sender Spoofing**: Authenticated user 'userA' posting message with `senderId: 'userB'`.
7. **Cross-Conversation Message Injection**: Creating a message in conversation 'conv1' with `conversationId: 'conv2'`.
8. **Unauthorized Message List**: Third party querying `/conversations/{convId}/messages`.
9. **Message Tampering (Update)**: Attempting to update a sent message text.
10. **Message Deletion Attack**: Attempting to delete messages from the subcollection.
11. **ID Poisoning Attack**: Passing a 2KB garbage string or path-traversal characters as `conversationId` or document ID.
12. **Blank Text Payload**: Creating a message with empty string `text: ""` violating minLength.

## 3. Marketplace & Domain Collection Schema Invariants
- All document IDs across `listings`, `events`, `hero_ads`, `video_reels`, `estores`, `reviews`, `reports`, `buyer_requests`, `donations`, `travel_bookings`, `travel_config`, `users`, and `admin_config` MUST match `^[A-Za-z0-9_.:@-]+$` and be <= 128 characters (`isValidId`).
- `listings`: Enforces bounded strings (`title <= 200`, `category <= 100`, `phone <= 50`, `location <= 100`, `description <= 20000`), non-negative numeric `price`, `status` enum (`approved`, `pending`, `rejected`), `availabilityStatus` enum (`available`, `reserved`, `sold`), and `images` array cap (`<= 10`).
- `estores`, `video_reels`, `events`, `hero_ads`: Enforce bounded names/titles/descriptions and bounded nested lists (`products <= 80`, `ads <= 40`, `slides <= 40`) to prevent oversized write abuse while preserving public directory & admin workflows.
- `reviews` & `reports`: Enforce rating range (`1..5`), bounded comment/details (`<= 2000`), and strict `reason` / `status` enums.
- `buyer_requests`, `donations`, `travel_bookings`, `travel_config`: Enforce enum checks, positive bounds on budgets/days/adults, and list caps (`pledges <= 200`, `offers <= 100`).
- `society_requests`: Enforces `isValidId`, bounded strings (`beneficiaryName <= 120`, `title <= 200`, `story <= 5000`, `bankOrPayDetails <= 1000`, `contactPhone <= 50`), strict `category` / `urgency` / `status` enums, non-negative `neededAmountLkr` & `receivedAmountLkr`, bounded attachment arrays (`images <= 6`, `proofs <= 6`, `offers <= 200`), and immutable `id`/`createdAt` after creation.
