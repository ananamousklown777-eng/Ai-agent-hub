import test from "node:test";
import assert from "node:assert/strict";
import { findBusinessPolicyViolations, findAgentFormatViolations } from "./quality-policy.js";

const question = "Use free tools only. Do not suggest discounts, paid advertising, free services, giveaways, free photos in exchange for promotion, referral rewards, handwritten thank-you notes, or referral requests/prompts.";

test("flags recommended discounts", () => assert.ok(findBusinessPolicyViolations("Offer a discount to new customers.", question).some(x => x.includes("discounts"))));
test("flags free services", () => assert.ok(findBusinessPolicyViolations("Give a free detail to the first customers.", question).some(x => x.includes("free services"))));
test("flags free photos offered for promotion", () => assert.ok(findBusinessPolicyViolations("Provide free photos to influencers in exchange for promotion.", question).some(x => x.includes("free content"))));
test("flags handwritten thank-you notes when forbidden", () => assert.ok(findBusinessPolicyViolations("Implement a handwritten thank-you note after each job.", question).some(x => x.includes("thank-you-note"))));
test("flags referral prompts when forbidden", () => assert.ok(findBusinessPolicyViolations("Remind customers to recommend you to their friends.", question).some(x => x.includes("referral solicitation"))));
test("does not flag clear prohibitions", () => assert.deepEqual(findBusinessPolicyViolations("Do not offer discounts, free services, or referral rewards.", question), []));
test("flags invented weekly targets", () => assert.ok(findBusinessPolicyViolations("Aim for 10 new customers per week.", question).some(x => x.includes("numeric business target"))));
test("flags incomplete Sol structure", () => assert.ok(findAgentFormatViolations("Best recommendation\nOnly one action.", "sol").length > 0));
test("accepts three numbered Delta findings with corrections", () => assert.deepEqual(findAgentFormatViolations("1. Verify the facts.\n2. Track the results.\n3. Correct the plan.", "delta"), []));

test("flags paid advertising", () => assert.ok(findBusinessPolicyViolations("Run paid ads to attract customers.", question).some(x => x.includes("paid advertising"))));
test("flags giveaways", () => assert.ok(findBusinessPolicyViolations("Launch a giveaway for new customers.", question).some(x => x.includes("giveaways"))));
test("flags referral rewards", () => assert.ok(findBusinessPolicyViolations("Offer referral rewards to customers.", question).some(x => x.includes("referral rewards"))));
test("flags cross-promotions", () => assert.ok(findBusinessPolicyViolations("Use cross-promotions with local businesses.", question).some(x => x.includes("cross-promotions"))));
test("flags review requests to non-customers", () => assert.ok(findBusinessPolicyViolations("Ask friends and neighbors to leave reviews.", question).some(x => x.includes("non-customers"))));
test("flags incentivized reviews", () => assert.ok(findBusinessPolicyViolations("Offer a gift in exchange for reviews.", question).some(x => x.includes("incentivized reviews"))));
test("flags unsupported fixed timelines", () => assert.ok(findBusinessPolicyViolations("You should see results within 30 days.", question).some(x => x.includes("fixed timeframe"))));

test("flags asking customers to name friends who may need the service", () => assert.ok(findBusinessPolicyViolations("Ask each satisfied client to name a friend or family member who might need detailing.", question).some(x => x.includes("referral solicitation"))));
test("flags asking customers to recommend the business to friends", () => assert.ok(findBusinessPolicyViolations("Ask each satisfied customer to recommend you to friends or family.", question).some(x => x.includes("referral solicitation"))));
