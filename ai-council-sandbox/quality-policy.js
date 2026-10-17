function isNegatedBefore(text, index) {
  const prefix = text.slice(Math.max(0, index - 100), index);
  return /\b(?:do not|don't|never|avoid|not recommend|shouldn't|should not|without|skip|exclude|forbid|prohibit)\b[^.!?;]{0,85}$/i.test(prefix);
}
function hasActionVerb(sentence) {
  return /\b(?:recommend|suggest|try|use|print|hand out|walk|drive|travel|buy|host|run|organize|organise|pay for|invest in|offer|give|launch|boost|spend on|hire|consider|start|create|distribute|advertise with|promote through|implement|encourage|ask|request|remind|include|provide|perform|invite|send|write|track|measure|record|count|monitor|log|leverage)\b/i.test(sentence);
}
function userBans(userQuestion, pattern) {
  const ban = /\b(?:do not|don't|never|avoid|must not|prohibit|forbid)\b[^.!?]{0,500}/ig;
  for (const m of String(userQuestion).matchAll(ban)) if (pattern.test(m[0])) return true;
  return false;
}

export function findBusinessPolicyViolations(text, userQuestion = "") {
  const violations = [];
  const source = String(text ?? "");
  const sentences = source.split(/(?<=[.!?;])\s+|\n+/);
  const mentionsGBP = /\bgoogle business profile\b|\bg-business profile\b/i.test(source);
  const mentionsPhysicalEligibility = /\b(?:physical (?:address|location|presence)|storefront|in-person (?:business|service)|business licensing rules|local address)\b/i.test(source);
  const includesServiceAreaNuance = /\b(?:service[- ]area business(?:es)?|service area|travels? to customers|visits? customers|mobile detailing|mobile business)\b/i.test(source);
  if (mentionsGBP && !includesServiceAreaNuance) {
    violations.push("Google Business Profile eligibility omits service-area business nuance");
  }
  const tactics = [
    ["paid advertising", /\b(?:paid ads?|paid advertising|paid promotions?|paid boosts?|boosted posts?)\b/i],
    ["discounts", /\b(?:discounts?|coupons?|promotional pricing|special offers?)\b/i],
    ["giveaways", /\bgiveaways?\b/i],
    ["referral rewards", /\b(?:referral rewards?|referral incentives?|commissions?)\b/i],
    ["cross-promotions", /\b(?:cross-promotions?|cross-posting|flyer partnerships?)\b/i],
    ["free services, sessions, or samples", /\b(?:free(?:[\s,.:;()\u0022\u0027“”\-–—]+(?:short|brief|quick|first[- ]time|small|mini|sample|informational|community|online|introductory|exterior|interior|full|basic|car|vehicle)\b){0,3}[\s,.:;()\u0022\u0027“”\-–—]*(?:car )?(?:details?|services?|samples?|demos?|consultations?|inspections?|assessments?|wash(?:es)?|workshops?|sessions?|events?|q&as?|question-and-answer sessions?)|complimentary services?)\b/i]
  ];
  const evaluatePromotion = /\b(?:should i|is it worth|evaluate (?:the option of|whether|using|running|offering|printing|paying for)?|compare (?:the costs|the pros and cons|options for)?|assess whether|analy[sz]e whether|would it make sense to)\b.{0,120}\b(?:flyers?|paid ads?|paid advertising|paid promotions?|paid boosts?|boosted posts?|cross-promotions?|discounts?|coupons?|promotional pricing|special offers?|referral rewards?|commissions?|giveaways?|free sample services?|free demos?|free consultations?|free inspections?|free assessments?|free workshops?|free informational sessions?|free sessions?|free events?|free q&as?|free (?:first[- ]time )?(?:car )?details?|complimentary services?|free services?|local SEO packages?|SEO agencies?)\b/i.test(userQuestion);
  for (const sentence of sentences) {
    for (const [label, pattern] of tactics) {
      const match = pattern.exec(sentence);
      if (match && hasActionVerb(sentence) && !isNegatedBefore(sentence, match.index) && !evaluatePromotion) {
        violations.push("prohibited promotional recommendation: " + label);
      }
    }
    const freePhoto = /\bfree (?:photos?|pictures?|content|videos?|deliverables?)\b/i.exec(sentence);
    if (freePhoto && /\b(?:in exchange for|in return for|for promotion|to promote|for a shout[- ]?out|for exposure)\b/i.test(sentence) &&
        !isNegatedBefore(sentence, freePhoto.index) && !evaluatePromotion) {
      violations.push("free content offered in exchange for promotion");
    }
    if (userBans(userQuestion, /\bthank[- ]you notes?|handwritten notes?\b/i)) {
      const note = /\b(?:handwritten )?thank[- ]you notes?|handwritten notes?\b/i.exec(sentence);
      if (note && hasActionVerb(sentence) && !isNegatedBefore(sentence, note.index)) violations.push("user-prohibited thank-you-note tactic");
    }
    if (userBans(userQuestion, /\b(?:referral requests?(?:\/prompts?)?|referral prompts?|asking for referrals?|ask customers to refer)\b/i)) {
      const referral = /\b(?:ask|encourage|remind|request|prompt)\b.{0,140}\b(?:refer(?:ral)?|recommend you|recommend your business|send you customers|tell (?:their |your )?friends|friends or family|name a friend|name someone who might need)\b|\b(?:referral prompts?|referral requests?)\b/i.exec(sentence);
      if (referral && !isNegatedBefore(sentence, referral.index)) violations.push("user-prohibited referral solicitation tactic");
    }
    if (userBans(userQuestion, /\b(?:referrals?|referral-related actions?|referral requests?(?:\/prompts?)?)\b/i)) {
      const referralActivity = /\b(?:referrals?|word[- ]of[- ]mouth)\b/i.exec(sentence);
      if (referralActivity && hasActionVerb(sentence) && !isNegatedBefore(sentence, referralActivity.index)) violations.push("user-prohibited referral-related recommendation or tracking");
    }
    const duration = /\b(?:a short period|short period|one month|a month|two weeks|three weeks|four weeks|30 days|next week|next month|within \d+ days|for \d+ weeks|over the next month|over the next few weeks)\b/i.exec(sentence);
    if (duration && !isNegatedBefore(sentence, duration.index) && !String(userQuestion).toLowerCase().includes(duration[0].toLowerCase())) violations.push("unsupported fixed timeframe");
    const reviewSolicitation = /\b(?:ask|tell|encourage|have|get|request)\b.{0,100}\b(?:friends?|family|neighbors?|former coworkers?|non-customers?)\b.{0,100}\b(?:reviews?|ratings?)\b|\b(?:friends?|family|neighbors?|former coworkers?|non-customers?)\b.{0,100}\b(?:leave|post|write)\b.{0,50}\b(?:reviews?|ratings?)\b/i.exec(sentence);
    if (reviewSolicitation && !isNegatedBefore(sentence, reviewSolicitation.index)) violations.push("review solicitation from non-customers");
    const reviewReward = /\b(?:reward|incentive|discount|gift|giveaway|freebie|compensation)\b.{0,60}\b(?:reviews?|ratings?)\b|\b(?:reviews?|ratings?)\b.{0,60}\b(?:reward|incentive|discount|gift|giveaway|freebie|compensation)\b/i.exec(sentence);
    if (reviewReward && !isNegatedBefore(sentence, reviewReward.index) && !/\b(?:without|no|never|do not|don't|not)\b[^.!?;]{0,70}\b(?:reward|incentive|discount|gift|giveaway|freebie|compensation)\b/i.test(sentence) && !/\b(?:do not|don't|never|avoid|without)\b[^.!?;]{0,70}\b(?:incentivized|incentivised|rewarded)\b/i.test(sentence)) violations.push("incentivized reviews");
    const freeWork = /\b(?:free (?:demo|service|detail(?:ing)?|sample)|detail(?:ing)? (?:a|their|the) car for free)\b.{0,160}\b(?:in exchange for|for a|to get|to receive)\b.{0,50}\btestimonials?\b|\btestimonials?\b.{0,100}\b(?:in exchange for|in return for)\b.{0,50}\bfree\b/i.exec(sentence);
    if (freeWork && !evaluatePromotion) violations.push("free work offered in exchange for a testimonial");
  }
  // A zero-budget constraint is stricter than merely avoiding paid ads: flag actions that predictably require supplies, printing, postage, fuel, or purchases. Warnings against these actions are allowed.
  // Enforce explicit user bans on free offers, including estimates described as "free" or "no-obligation".
  // These checks intentionally scan the full response and fail closed; a policy violation must not be approved.
  const userBansFreeWork = /\b(?:do not|don't|never|avoid|must not|prohibit|forbid)\b[^.!?]{0,700}\b(?:free services?|free samples?|free demos?|free estimates?|no[- ]obligation estimates?|free washes?|free car details?|giveaways?|anything that costs money)\b/i.test(String(userQuestion));
  if (userBansFreeWork) {
    const freeOffer = /\b(?:free|complimentary|no[- ]obligation)\b[^.!?]{0,60}\b(?:estimates?|quotes?|consultations?|assessments?|inspections?|washes?|details?|detailing|services?|samples?|demos?|work|labor|labour)\b|\b(?:offer|give|provide|include|promise|advertise|promote|perform|do)\b[^.!?]{0,140}\b(?:free|complimentary|no[- ]obligation)\b[^.!?]{0,100}\b(?:estimate|quote|consultation|assessment|inspection|wash|detail|service|sample|demo|work)\b|\bfirst\s+\d+\s+(?:replies|respondents|customers|people|clients)\b[^.!?]{0,100}\b(?:free|complimentary|no[- ]cost|at no extra cost)\b/i;
    for (const sentence of sentences) {
      const match = freeOffer.exec(sentence);
      const explicitlyWarnsAgainstFreeOffer = /\b(?:do not|don't|never|avoid|must not|prohibit|forbid)\b[^.!?;]{0,120}\b(?:free|complimentary|no[- ]obligation)\b/i.test(sentence);
      if (match && !explicitlyWarnsAgainstFreeOffer && !isNegatedBefore(sentence, match.index)) {
        violations.push("user-prohibited free service, estimate, or giveaway");
      }
    }
  }
  // Never recommend logging names, contact details, vehicle identifiers, or other identifying details
  // unless the user explicitly asks for that data collection.
  const userRequestsPersonalData = /\b(?:collect|record|store|log|track)\b[^.!?]{0,100}\b(?:personal information|contact details|customer names|phone numbers|email addresses|vehicle registration|license plates)\b/i.test(String(userQuestion)) &&
    !/\b(?:without|do not|don't|never|avoid|must not|prohibit|forbid)\b[^.!?]{0,150}\b(?:collect|record|store|log|track)\b[^.!?]{0,100}\b(?:personal information|contact details|customer names|phone numbers|email addresses|vehicle registration|license plates)\b/i.test(String(userQuestion));
  if (!userRequestsPersonalData) {
    const personalLog = /\b(?:spreadsheet|sheet|table|tracker|log|record|collect|store|track)\b[^.!?]{0,120}\b(?:customer names?|contact details?|phone numbers?|email addresses?|vehicle (?:make|model|details|registration|license plates?)|inquiry details?|personal information)\b|\b(?:record|collect|store|log|track)\b[^.!?]{0,80}\b(?:customer names?|contact details?|phone numbers?|email addresses?|vehicle (?:make|model|details|registration|license plates?)|inquiry details?|personal information)\b/i;
    for (const sentence of sentences) {
      const match = personalLog.exec(sentence);
      if (match && !isNegatedBefore(sentence, match.index)) {
        violations.push("unnecessary collection of personal or identifying details");
      }
    }
  }
  // Catch no-cost offers phrased without the word "free" (for example, "a wash at no cost").
  const userBansFreeOffers = /\b(?:do not|don't|never|avoid|must not|prohibit|forbid)\b[^.!?]{0,700}\b(?:free services?|free samples?|free demos?|free estimates?|no[- ]obligation estimates?|free washes?|free car details?|anything that costs money)\b/i.test(String(userQuestion));
  if (userBansFreeOffers) {
    const noCostOffer = /\b(?:at no cost|no cost to (?:the )?(?:customer|client)|free of charge|at no charge)\b/i;
    for (const sentence of sentences) {
      if (noCostOffer.test(sentence) && /\b(?:wash(?:es)?|detail(?:ing)?|service|estimate|quote|consultation|inspection|assessment|work)\b/i.test(sentence) &&
          /\b(?:offer(?:ing)?|provide|promote|recommend|advertise|include|give|do|post|suggest)\b/i.test(sentence) &&
          !/\b(?:do not|don't|never|avoid|not offer|not provide|without offering)\b[^.!?]{0,100}\b(?:at no cost|no cost|free of charge|at no charge)\b/i.test(sentence)) {
        violations.push("user-prohibited free service or offer phrased as no-cost");
      }
    }
  }
  // If the user forbids collecting personal information, asking for a phone number or email is also a violation,
  // even when the answer says not to store those details in a spreadsheet.
  const userBansPersonalData = /\b(?:without collecting personal information|do not collect personal information|don't collect personal information|avoid collecting personal information|no personal information|without collecting personal data|do not collect personal data|don't collect personal data)\b/i.test(String(userQuestion));
  if (userBansPersonalData) {
    const asksForContact = /\b(?:ask|request|collect|get|obtain|have|invite|tell)\b[^.!?]{0,100}\b(?:phone number|email address|email|contact method|contact details|contact information|phone or email)\b|\b(?:phone number|email address|contact details|contact information)\b[^.!?]{0,100}\b(?:to confirm|for booking|for appointment|to book|send|provide)\b/i;
    for (const sentence of sentences) {
      const match = asksForContact.exec(sentence);
      if (match && !isNegatedBefore(sentence, match.index)) {
        violations.push("user-prohibited request for personal contact information");
      }
    }
  }
  const noSpend = /\b(?:free tools? only|no money to spend|no budget|zero[- ]budget|without spending (?:any )?money|anything that requires spending money|do not spend money|don't spend money|no-cost only|at no cost)\b/i.test(String(userQuestion));
  if (noSpend) {
    const costActions = [
      ["printing or physical flyers", /\b(?:print(?:ing|ed)?\b.{0,40}\b(?:flyers?|handouts?|posters?|leaflets?)|(?:hand out|pass out|distribute)\b.{0,25}\b(?:flyers?|handouts?|posters?|leaflets?)|(?:flyers?|handouts?|posters?|leaflets?)\b.{0,25}\b(?:to print|printed|print and distribute)|pay for printing|printing costs?)\b/i],
      ["purchases or paid services", /\b(?:buy|purchase|pay for|hire|subscribe to|paid plan|membership fee|service fee|postage|shipping fee|boosted post|paid ad|paid advertising|paid promotion)\b/i],
      ["fuel or travel expense", /\b(?:drive around|drive through|travel to multiple locations|fuel costs?|gas money|paid parking)\b/i]
    ];
    for (const sentence of sentences) {
      for (const [label, pattern] of costActions) {
        const match = pattern.exec(sentence);
        if (match && hasActionVerb(sentence) && !isNegatedBefore(sentence, match.index)) {
          violations.push("zero-budget constraint violated: " + label);
        }
      }
    }
  }
  const numericTarget = /\b(?:reach|target|achieve|secure|convert|generate|obtain|book|close|collect|get|aim for|at least)\s+(?:about\s+|around\s+)?(\d+)\s+(?:new\s+)?(?:inquir(?:y|ies)|leads?|appointments?|paying customers?|customers?|sales|bookings?)\b|\b(\d+)\s+(?:new\s+)?(?:inquir(?:y|ies)|leads?|appointments?|paying customers?|customers?|sales|bookings?)\s+(?:in|by|during|per)\s+(?:week|day|month)\b/ig;
  for (const match of source.matchAll(numericTarget)) {
    const n = match[1] || match[2];
    if (n && !new RegExp("\\b" + n + "\\b").test(String(userQuestion))) {
      violations.push("unsupported numeric business target");
      break;
    }
  }
  return [...new Set(violations)];
}

export function findAgentFormatViolations(text, agentId) {
  const violations = [];
  const source = String(text ?? "");
  if (agentId === "delta") {
    const numbered = [...source.matchAll(/^\s*\d+[.)]\s+/gm)];
    if (numbered.length !== 3) violations.push("Delta must provide exactly three numbered findings");
    if (!/\b(?:correction|corrected|correct|replace|revise|instead|remove|change|check|verify|measure|track|confirm|avoid|use|recommend|set|calculate|compare|limit|clarify|separate|record|test|ask|identify|require|state|explain)\b/i.test(source)) violations.push("critique does not provide concrete corrections");
    // Delta findings are deliberately short; reject cut-off sentences instead of showing fragments as a successful review.
    for (let i = 0; i < numbered.length; i++) {
      const start = numbered[i].index;
      const end = i + 1 < numbered.length ? numbered[i + 1].index : source.length;
      const finding = source.slice(start, end).trim().replace(/\s+/g, " ");
      if (!/[.!?](?:[”’"')\]]*)?$/.test(finding)) violations.push("Delta finding " + (i + 1) + " appears incomplete");
    }
  }
  if (agentId === "sol") {
    const required = ["Best recommendation", "Three concrete actions", "Main risk", "What we still don't know", "How to measure success"];
    for (const heading of required) {
      if (!new RegExp("^\\s*#{0,6}\\s*(?:\\*\\*)?" + heading + "(?:\\*\\*)?\\s*$", "im").test(source)) violations.push("missing Sol heading: " + heading);
    }
    const section = source.match(/(?:^|\n)\s*#{0,6}\s*(?:\*\*)?Three concrete actions(?:\*\*)?\s*\n([\s\S]*?)(?=\n\s*#{0,6}\s*(?:\*\*)?(?:Main risk|What we still don't know|How to measure success)(?:\*\*)?\s*\n|$)/i);
    const count = section ? [...section[1].matchAll(/^\s*\d+[.)]\s+/gm)].length : 0;
    if (count !== 3) violations.push("Sol must provide exactly three numbered actions");
  }
  return violations;
}
