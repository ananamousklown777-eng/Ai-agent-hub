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
