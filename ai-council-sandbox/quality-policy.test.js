import test from "node:test";
import assert from "node:assert/strict";
import { findBusinessPolicyViolations, findAgentFormatViolations } from "./quality-policy.js";

const question = "Use free tools only. Do not suggest discounts, paid advertising, free services, giveaways, free photos in exchange for promotion, referral rewards, handwritten thank-you notes, or referral requests/prompts.";

test("flags recommended discounts", () => assert.ok(findBusinessPolicyViolations("Offer a discount to new customers.", question).some(x => x.includes("discounts"))));
test("flags coupons as prohibited discounts", () => assert.ok(findBusinessPolicyViolations("Offer a first-time service coupon.", question).some(x => x.includes("discounts"))));
test("flags free services", () => assert.ok(findBusinessPolicyViolations("Give a free detail to the first customers.", question).some(x => x.includes("free services"))));
test("flags free demos with descriptive words and punctuation", () => assert.ok(findBusinessPolicyViolations("Offer a free, short “demo” of a quick exterior wash to passersby.", question).some(x => x.includes("free services"))));
test("flags a free quick wash as a prohibited free service", () => assert.ok(findBusinessPolicyViolations("Offer a free quick exterior wash at a local event.", question).some(x => x.includes("free services"))));
test("does not flag a clearly prohibited free demo when stated as a warning", () => assert.deepEqual(findBusinessPolicyViolations("Do not offer a free, short “demo” of a quick exterior wash.", question), []));
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
test("does not flag a routine weekly posting cadence as an unsupported deadline", () => assert.deepEqual(findBusinessPolicyViolations("Post a weekly before-and-after photo.", question), []));
test("does not flag a routine daily marketing cadence as an unsupported deadline", () => assert.deepEqual(findBusinessPolicyViolations("Publish before-and-after photos every day.", question), []));
test("does not flag a warning against an invented weekly schedule", () => assert.deepEqual(findBusinessPolicyViolations("Do not recommend posting weekly without knowing the business capacity.", question), []));

test("flags asking customers to name friends who may need the service", () => assert.ok(findBusinessPolicyViolations("Ask each satisfied client to name a friend or family member who might need detailing.", question).some(x => x.includes("referral solicitation"))));
test("flags asking customers to recommend the business to friends", () => assert.ok(findBusinessPolicyViolations("Ask each satisfied customer to recommend you to friends or family.", question).some(x => x.includes("referral solicitation"))));

test("flags tracking referrals when referral activity is forbidden", () => assert.ok(findBusinessPolicyViolations("Track how many emails lead to repeat bookings or referrals.", question).some(x => x.includes("referral-related"))));
test("flags non-handwritten thank-you notes when thank-you notes are forbidden", () => assert.ok(findBusinessPolicyViolations("Send a brief thank-you note after each job.", "Do not recommend thank-you notes or referral requests/prompts.").some(x => x.includes("thank-you-note"))));

test("flags word-of-mouth recommendations when referral-related actions are forbidden", () => assert.ok(findBusinessPolicyViolations("Leverage word-of-mouth through customer interaction.", question).some(x => x.includes("referral-related"))));

test("flags Google Business Profile advice that mentions physical eligibility without service-area nuance", () => {
  assert.ok(findBusinessPolicyViolations("Check Google Business Profile eligibility and physical presence requirements.").some(x => x.includes("service-area business nuance")));
});
test("flags in-person business wording that omits service-area nuance", () => {
  assert.ok(findBusinessPolicyViolations("Verify eligibility for a Google Business Profile for an in-person business.").some(x => x.includes("service-area business nuance")));
});
test("flags local-address eligibility wording without service-area nuance", () => {
  assert.ok(findBusinessPolicyViolations("Check the Google Business Profile rules and confirm the local address requirement.").some(x => x.includes("service-area business nuance")));
});
test("accepts Google Business Profile advice that includes service-area businesses", () => {
  assert.deepEqual(findBusinessPolicyViolations("Check Google Business Profile eligibility. Eligible service-area businesses that travel to customers may qualify under Google's rules."), []);
});

test("flags a free inspection offered as a lead-generation service", () => assert.ok(findBusinessPolicyViolations("Invite potential customers for a quick, free inspection.", question).some(x => x.includes("free services"))));


test("flags free informational sessions and workshops under strict no-free-offers rule", () => {
  assert.ok(findBusinessPolicyViolations("Host a free informational session at a local community center.", question).some(x => x.includes("free services")));
  assert.ok(findBusinessPolicyViolations("Offer a free workshop to attract new customers.", question).some(x => x.includes("free services")));
});
test("requires service-area eligibility nuance whenever Google Business Profile is recommended", () => {
  assert.ok(findBusinessPolicyViolations("Set up a Google Business Profile and check eligibility for in-person businesses.").some(x => x.includes("service-area business nuance")));
});


test("flags printing in a zero-budget plan", () => assert.ok(findBusinessPolicyViolations("Print a one-page flyer and hand it out locally.", "Use free tools only; I have no money to spend.").some(x => x.includes("zero-budget constraint"))));
test("does not flag a warning against printing in a zero-budget plan", () => assert.deepEqual(findBusinessPolicyViolations("Do not print flyers; share a digital post instead.", "Use free tools only; I have no money to spend."), []));
test("flags paid services in a zero-budget plan", () => assert.ok(findBusinessPolicyViolations("Hire a marketing service to promote the business.", "No budget; use free tools only.").some(x => x.includes("zero-budget constraint"))));
test("flags an incomplete Delta finding", () => assert.ok(findAgentFormatViolations("1. Verify the active account before Day\n2. Track inquiries daily.\n3. Review bookings at the end.", "delta").some(x => x.includes("finding 1 appears incomplete"))));
test("accepts three complete Delta findings", () => assert.deepEqual(findAgentFormatViolations("1. Verify the account before posting.\n2. Track inquiries in a free notes app.\n3. Review confirmed bookings at the end.", "delta"), []));

test("flags physical flyer distribution in a zero-budget plan", () => assert.ok(findBusinessPolicyViolations("Hand out flyers in nearby neighborhoods.", "Free tools only; no money to spend.").some(x => x.includes("zero-budget constraint"))));

test("flags fuel-dependent outreach in a zero-budget plan", () => assert.ok(findBusinessPolicyViolations("Drive through nearby residential areas to find prospects.", "Free tools only; no money to spend.").some(x => x.includes("zero-budget constraint"))));


const strictQuestion = "I run a local car detailing business and have no money to spend on marketing. Create a practical 7-day plan to help me aim for three new paying customers using only free tools. Track inquiries and bookings without collecting personal information. Do not recommend paid advertising, printing flyers, physical flyer distribution, discounts, free services, free estimates, free consultations, giveaways, or anything that costs money. Do not assume I have a website, social media following, or customer list.";

test("flags no-cost wording for a service explicitly prohibited by the user", () => {
  assert.ok(findBusinessPolicyViolations("Offer a mobile wash at no cost to the customer's location.", strictQuestion).some(x => x.includes("no-cost")));
});
test("flags asking for a phone number or email when personal information is forbidden", () => {
  assert.ok(findBusinessPolicyViolations("Ask each interested customer for a phone number or email address to confirm the booking.", strictQuestion).some(x => x.includes("personal contact information")));
});
test("flags logging contact details despite a promise not to store names", () => {
  assert.ok(findBusinessPolicyViolations("Use a private sheet with Contact Method (phone or email), but do not store names.", strictQuestion).some(x => x.includes("personal or identifying details") || x.includes("personal contact information")));
});
test("does not flag a clear warning against no-cost service offers", () => {
  assert.deepEqual(findBusinessPolicyViolations("Do not offer a wash at no cost to the customer.", strictQuestion), []);
});
