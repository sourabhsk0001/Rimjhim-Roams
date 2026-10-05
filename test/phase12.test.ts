import { before, test } from "node:test";
import assert from "node:assert";
import { createTrip, getTripById, getUserTrips } from "../src/lib/services/trip-service";
import { collaborationService } from "../src/lib/services/collaboration-service";
import { groupPollService } from "../src/lib/services/group-poll-service";
import { expenseSplittingService } from "../src/lib/services/expense-splitting-service";
import { settlementEngine } from "../src/lib/engines/settlement-engine";
import { toMinorUnits } from "../src/lib/budget/money";

const userA = "user-alice";
const userB = "user-bob";
const userC = "user-charlie";
const intruder = "user-intruder";

let testTripId = "";

before(async () => {
  // Create test trip owned by User A (Alice)
  const tripRes = await createTrip(
    {
      origin: "Mumbai",
      destination: "Goa",
      start_date: "2026-12-01",
      end_date: "2026-12-07",
      budget: 35000,
      currency: "INR",
      traveller_count: 3,
      traveller_type: "friends",
      travel_pace: "moderate",
      preferences: { themes: ["beaches", "adventure", "food"] },
    },
    userA
  );

  assert.ok(tripRes.data);
  testTripId = tripRes.data.id;
});

// ==============================================================================
// 1. Trip Membership, Roles & Authorization
// ==============================================================================

test("Collaboration: Trip owner is automatically authorized with 'owner' role", async () => {
  const role = await collaborationService.getUserTripRole(testTripId, userA);
  assert.strictEqual(role, "owner");

  const authRes = await getTripById(testTripId, userA);
  assert.strictEqual(authRes.isAuthorized, true);
  assert.ok(authRes.trip);
});

test("Collaboration: Non-member intruder is unauthorized", async () => {
  const role = await collaborationService.getUserTripRole(testTripId, intruder);
  assert.strictEqual(role, null);

  const authRes = await getTripById(testTripId, intruder);
  assert.strictEqual(authRes.isAuthorized, false);
  assert.strictEqual(authRes.trip, null);

  const membersRes = await collaborationService.getTripMembers(testTripId, intruder);
  assert.strictEqual(membersRes.success, false);
  assert.strictEqual(membersRes.members.length, 0);
});

test("Collaboration: Owner adds Bob as editor and Charlie as viewer", async () => {
  const addBob = await collaborationService.addTripMember(testTripId, userA, userB, "editor", {
    full_name: "Bob",
    email: "bob@example.com",
  });
  assert.strictEqual(addBob.success, true);
  assert.strictEqual(addBob.member?.role, "editor");

  const addCharlie = await collaborationService.addTripMember(testTripId, userA, userC, "viewer", {
    full_name: "Charlie",
    email: "charlie@example.com",
  });
  assert.strictEqual(addCharlie.success, true);
  assert.strictEqual(addCharlie.member?.role, "viewer");

  // Verify membership list
  const membersRes = await collaborationService.getTripMembers(testTripId, userA);
  assert.strictEqual(membersRes.success, true);
  assert.ok(membersRes.members.length >= 3);

  // Bob can now access the trip
  const bobAuth = await getTripById(testTripId, userB);
  assert.strictEqual(bobAuth.isAuthorized, true);

  // Charlie can now access the trip
  const charlieAuth = await getTripById(testTripId, userC);
  assert.strictEqual(charlieAuth.isAuthorized, true);
});

test("Collaboration: Trip appears in member's trip list", async () => {
  const bobTrips = await getUserTrips(userB);
  const found = [...bobTrips.upcoming, ...bobTrips.previous].some((t) => t.id === testTripId);
  assert.strictEqual(found, true, "Trip should appear in Bob's trip list");
});

test("Collaboration: Role permission enforcement (Viewer cannot add members)", async () => {
  const failAdd = await collaborationService.addTripMember(
    testTripId,
    userC, // Charlie is viewer
    "user-david",
    "editor"
  );
  assert.strictEqual(failAdd.success, false);
  assert.ok(failAdd.error?.includes("Only trip owners or editors"));
});

// ==============================================================================
// 2. Invitations Flow
// ==============================================================================

test("Collaboration: Create and accept invitation token", async () => {
  const inviteRes = await collaborationService.createInvitation(
    testTripId,
    userA,
    "david@example.com",
    "editor"
  );
  assert.strictEqual(inviteRes.success, true);
  assert.ok(inviteRes.invitation);
  assert.strictEqual(inviteRes.invitation.status, "pending");

  const token = inviteRes.invitation.token;
  assert.ok(token.startsWith("inv_"));

  // David accepts invitation
  const acceptRes = await collaborationService.acceptInvitation(token, "user-david", "david@example.com");
  assert.strictEqual(acceptRes.success, true);
  assert.strictEqual(acceptRes.tripId, testTripId);

  // David is now a member
  const role = await collaborationService.getUserTripRole(testTripId, "user-david");
  assert.strictEqual(role, "editor");

  // Clean up David for subsequent 3-person tests
  await collaborationService.removeTripMember(testTripId, userA, "user-david");
});

// ==============================================================================
// 3. Group Decisions & Voting
// ==============================================================================

test("Group Voting: Create poll with options [Beach, Trek, Museum]", async () => {
  const pollRes = await groupPollService.createPoll(
    testTripId,
    userA,
    "What should we do on Day 2 afternoon?",
    ["Beach", "Trek", "Museum"],
    "Free schedule window between 3 PM and 6 PM"
  );

  assert.strictEqual(pollRes.success, true);
  assert.ok(pollRes.poll);
  assert.strictEqual(pollRes.poll.options.length, 3);
  assert.strictEqual(pollRes.poll.status, "active");
  assert.strictEqual(pollRes.poll.total_votes, 0);

  const optTitles = pollRes.poll.options.map((o) => o.title);
  assert.ok(optTitles.includes("Beach"));
  assert.ok(optTitles.includes("Trek"));
  assert.ok(optTitles.includes("Museum"));
});

test("Group Voting: Members vote and live tallies/winner are computed", async () => {
  const pollsRes = await groupPollService.getPolls(testTripId, userA);
  assert.strictEqual(pollsRes.success, true);
  const poll = pollsRes.polls[0];
  assert.ok(poll);

  const beachOpt = poll.options.find((o) => o.title === "Beach")!;
  const trekOpt = poll.options.find((o) => o.title === "Trek")!;

  // Alice votes for Beach
  const voteA = await groupPollService.castVote(testTripId, poll.id, userA, beachOpt.id);
  assert.strictEqual(voteA.success, true);

  // Bob votes for Beach
  const voteB = await groupPollService.castVote(testTripId, poll.id, userB, beachOpt.id);
  assert.strictEqual(voteB.success, true);

  // Charlie votes for Trek
  const voteC = await groupPollService.castVote(testTripId, poll.id, userC, trekOpt.id);
  assert.strictEqual(voteC.success, true);

  // Fetch updated poll
  const updatedPolls = await groupPollService.getPolls(testTripId, userA);
  const updatedPoll = updatedPolls.polls.find((p) => p.id === poll.id)!;

  assert.strictEqual(updatedPoll.total_votes, 3);
  assert.strictEqual(updatedPoll.winning_option?.title, "Beach");

  const beachTally = updatedPoll.options.find((o) => o.title === "Beach");
  assert.strictEqual(beachTally?.votes_count, 2);

  const trekTally = updatedPoll.options.find((o) => o.title === "Trek");
  assert.strictEqual(trekTally?.votes_count, 1);

  // Alice checks her own vote
  assert.strictEqual(updatedPoll.user_voted_option_id, beachOpt.id);
});

test("Group Voting: Member can switch vote dynamically", async () => {
  const pollsRes = await groupPollService.getPolls(testTripId, userA);
  const poll = pollsRes.polls[0];
  const museumOpt = poll.options.find((o) => o.title === "Museum")!;

  // Bob switches vote from Beach to Museum
  const switchVote = await groupPollService.castVote(testTripId, poll.id, userB, museumOpt.id);
  assert.strictEqual(switchVote.success, true);

  const updatedPoll = switchVote.poll!;
  assert.strictEqual(updatedPoll.total_votes, 3);

  const beachTally = updatedPoll.options.find((o) => o.title === "Beach")!;
  assert.strictEqual(beachTally.votes_count, 1); // Reduced from 2 to 1

  const museumTally = updatedPoll.options.find((o) => o.title === "Museum")!;
  assert.strictEqual(museumTally.votes_count, 1); // Increased from 0 to 1
});

test("Group Voting: Unauthorized user cannot vote", async () => {
  const pollsRes = await groupPollService.getPolls(testTripId, userA);
  const poll = pollsRes.polls[0];

  const intruderVote = await groupPollService.castVote(
    testTripId,
    poll.id,
    intruder,
    poll.options[0].id
  );
  assert.strictEqual(intruderVote.success, false);
  assert.ok(intruderVote.error?.includes("Only authorized trip members"));
});

// ==============================================================================
// 4. Deterministic Expense Splitting & Settlement (Example: Hotel ₹6,000)
// ==============================================================================

test("Expense Splitting: Baseline Example — Hotel ₹6,000 paid by A split equally among A, B, C", async () => {
  // Amount: ₹6,000 (600,000 paise)
  const amountMinor = toMinorUnits(6000);

  const expRes = await expenseSplittingService.createSplitExpense(
    {
      trip_id: testTripId,
      paid_by: userA, // Alice paid ₹6,000
      title: "Resort Accommodation (3 Nights)",
      category: "hotel",
      amount_minor_units: amountMinor,
      currency: "INR",
      split_type: "equal",
      participants: [{ user_id: userA }, { user_id: userB }, { user_id: userC }],
    },
    userA
  );

  assert.strictEqual(expRes.success, true);
  assert.ok(expRes.expense);
  assert.strictEqual(expRes.expense.amount_minor_units, 600000);
  assert.strictEqual(expRes.expense.participants.length, 3);

  // Each participant must have exactly ₹2,000 (200,000 paise)
  for (const part of expRes.expense.participants) {
    assert.strictEqual(part.share_amount_minor_units, 200000);
  }

  // Sum of shares strictly equals total
  const sumShares = expRes.expense.participants.reduce((s, p) => s + p.share_amount_minor_units, 0);
  assert.strictEqual(sumShares, amountMinor);

  // Compute settlement
  const settleRes = await expenseSplittingService.getTripSettlement(testTripId, userA);
  assert.strictEqual(settleRes.success, true);
  assert.ok(settleRes.settlement);

  const settlements = settleRes.settlement.settlements;
  assert.strictEqual(settlements.length, 2);

  // B owes A ₹2,000
  const bOwesA = settlements.find((s) => s.from_user_id === userB && s.to_user_id === userA);
  assert.ok(bOwesA, "B must owe A");
  assert.strictEqual(bOwesA.amount_minor, 200000);
  assert.ok(bOwesA.description.includes("2,000") || bOwesA.amount_formatted.includes("2,000"));

  // C owes A ₹2,000
  const cOwesA = settlements.find((s) => s.from_user_id === userC && s.to_user_id === userA);
  assert.ok(cOwesA, "C must owe A");
  assert.strictEqual(cOwesA.amount_minor, 200000);
  assert.ok(cOwesA.description.includes("2,000") || cOwesA.amount_formatted.includes("2,000"));
});

test("Expense Splitting: Equal split with odd remainder distributes remainder pennies with zero drift", () => {
  // Amount ₹100 split among 3 people: 10,000 paise / 3 = 3,333 paise each with 1 paise remainder
  const shares = settlementEngine.calculateParticipantShares(10000, "equal", [
    { user_id: "u1" },
    { user_id: "u2" },
    { user_id: "u3" },
  ]);

  assert.strictEqual(shares.length, 3);
  const totalAllocated = shares.reduce((acc, s) => acc + s.share_amount_minor_units, 0);
  assert.strictEqual(totalAllocated, 10000, "Sum of shares must strictly equal 10,000 paise");
});

test("Expense Splitting: Custom split validates exact total match", () => {
  const customShares = settlementEngine.calculateParticipantShares(500000, "custom", [
    { user_id: "u1", share_amount_minor_units: 300000 },
    { user_id: "u2", share_amount_minor_units: 150000 },
    { user_id: "u3", share_amount_minor_units: 50000 },
  ]);

  assert.strictEqual(customShares.length, 3);
  assert.strictEqual(customShares[0].share_amount_minor_units, 300000);
  assert.strictEqual(customShares[1].share_amount_minor_units, 150000);
  assert.strictEqual(customShares[2].share_amount_minor_units, 50000);

  // Mismatch throws error
  assert.throws(() => {
    settlementEngine.calculateParticipantShares(500000, "custom", [
      { user_id: "u1", share_amount_minor_units: 300000 },
      { user_id: "u2", share_amount_minor_units: 100000 },
    ]);
  });
});

test("Expense Splitting: Percentage split distributes minor units with zero drift", () => {
  // ₹10,000 (1,000,000 paise) split 50%, 25%, 25%
  const pctShares = settlementEngine.calculateParticipantShares(1000000, "percentage", [
    { user_id: "u1", share_percentage: 50 },
    { user_id: "u2", share_percentage: 25 },
    { user_id: "u3", share_percentage: 25 },
  ]);

  assert.strictEqual(pctShares[0].share_amount_minor_units, 500000);
  assert.strictEqual(pctShares[1].share_amount_minor_units, 250000);
  assert.strictEqual(pctShares[2].share_amount_minor_units, 250000);

  const sumPct = pctShares.reduce((s, p) => s + p.share_amount_minor_units, 0);
  assert.strictEqual(sumPct, 1000000);
});

test("Expense Splitting: Multi-payer debt simplification generates minimal cash flow transfers", () => {
  // Scenario:
  // Alice paid ₹6,000 for Hotel (A: 2000, B: 2000, C: 2000) -> Net: A (+4000), B (-2000), C (-2000)
  // Bob paid ₹3,000 for Dinner (A: 1000, B: 1000, C: 1000) -> Net: B (+2000), A (-1000), C (-1000)
  // Combined Net:
  // Alice: +4000 - 1000 = +3,000 (Creditor)
  // Bob: -2000 + 2000 = 0 (Settled!)
  // Charlie: -2000 - 1000 = -3,000 (Debtor)
  // Optimal transfer: Only 1 transaction! Charlie pays Alice ₹3,000!

  const members = [
    { id: "m1", trip_id: "t1", user_id: userA, role: "owner" as const, full_name: "Alice", created_at: "" },
    { id: "m2", trip_id: "t1", user_id: userB, role: "editor" as const, full_name: "Bob", created_at: "" },
    { id: "m3", trip_id: "t1", user_id: userC, role: "viewer" as const, full_name: "Charlie", created_at: "" },
  ];

  const expenses = [
    {
      id: "e1",
      trip_id: "t1",
      paid_by: userA,
      title: "Hotel",
      category: "hotel",
      amount_minor_units: 600000,
      amount_formatted: "₹6,000",
      currency: "INR",
      split_type: "equal" as const,
      paid_at: "",
      participants: [
        { id: "p1", expense_id: "e1", trip_id: "t1", user_id: userA, share_amount_minor_units: 200000, has_settled: false, created_at: "" },
        { id: "p2", expense_id: "e1", trip_id: "t1", user_id: userB, share_amount_minor_units: 200000, has_settled: false, created_at: "" },
        { id: "p3", expense_id: "e1", trip_id: "t1", user_id: userC, share_amount_minor_units: 200000, has_settled: false, created_at: "" },
      ],
      created_at: "",
    },
    {
      id: "e2",
      trip_id: "t1",
      paid_by: userB,
      title: "Dinner",
      category: "food",
      amount_minor_units: 300000,
      amount_formatted: "₹3,000",
      currency: "INR",
      split_type: "equal" as const,
      paid_at: "",
      participants: [
        { id: "p4", expense_id: "e2", trip_id: "t1", user_id: userA, share_amount_minor_units: 100000, has_settled: false, created_at: "" },
        { id: "p5", expense_id: "e2", trip_id: "t1", user_id: userB, share_amount_minor_units: 100000, has_settled: false, created_at: "" },
        { id: "p6", expense_id: "e2", trip_id: "t1", user_id: userC, share_amount_minor_units: 100000, has_settled: false, created_at: "" },
      ],
      created_at: "",
    },
  ];

  const settlement = settlementEngine.computeTripSettlement("t1", expenses, members, "INR");

  // Net balances
  const aliceBalance = settlement.balances.find((b) => b.user_id === userA);
  const bobBalance = settlement.balances.find((b) => b.user_id === userB);
  const charlieBalance = settlement.balances.find((b) => b.user_id === userC);

  assert.strictEqual(aliceBalance?.net_balance_minor, 300000); // +₹3,000
  assert.strictEqual(bobBalance?.net_balance_minor, 0); // ₹0 (settled)
  assert.strictEqual(charlieBalance?.net_balance_minor, -300000); // -₹3,000

  // Optimal transfers: exactly 1 transfer
  assert.strictEqual(settlement.settlements.length, 1);
  const transfer = settlement.settlements[0];
  assert.strictEqual(transfer.from_user_id, userC);
  assert.strictEqual(transfer.to_user_id, userA);
  assert.strictEqual(transfer.amount_minor, 300000);
});
