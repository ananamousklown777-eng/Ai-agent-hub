function isNegatedBefore(text, index) {
  const prefix = text.slice(Math.max(0, index - 100), index);
  return /\b(?:do not|don't|never|avoid|not recommend|shouldn't|should not|without|skip|exclude|forbid|prohibit)\b[^.!?;]{0,85}$/i.test(prefix);
}
function hasActionVerb(sentence) {
  return /\b(?:recommend|suggest|try|use|print|hand out|buy|run|pay for|invest in|offer|give|launch|boost|spend on|hire|consider|start|create|distribute|advertise with|promote through|implement|encourage|ask|request|remind|include|provide|perform|send|write|track|measure|record|count|monitor|log|leverage)\b/i.test(sentence);
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
  const tactics = [
    ["paid advertising", /\b(?:paid ads?|paid advertising|paid promotions?|paid boosts?|boosted posts?)\b/i],
    ["discounts", /\bdiscounts?\b/i],
    ["giveaways", /\bgiveaways?\b/i],
    ["referral rewards", /\b(?:referral rewards?|referral incentives?|commissions?)\b/i],
    ["cross-promotions", /\b(?:cross-promotions?|cross-posting|flyer partnerships?)\b/i],
    ["free services or samples", /\b(?:free(?:[\s,.:;()\u0022\u0027“”\-–—]+(?:short|brief|quick|first[- ]time|small|mini|sample|exterior|interior|full|basic|car|vehicle)\b){0,3}[\s,.:;()\u0022\u0027“”\-–—]*(?:car )?(?:details?|services?|samples?|demos?|consultations?|wash(?:es)?)|complimentary services?)\b/i]
  ];
  const evaluatePromotion = /\b(?:should i|is it worth|evaluate (?:the option of|whether|using|running|offering|printing|paying for)?|compare (?:the costs|the pros and cons|options for)?|assess whether|analy[sz]e whether|would it make sense to)\b.{0,120}\b(?:flyers?|paid ads?|paid advertising|paid promotions?|paid boosts?|boosted posts?|cross-promotions?|discounts?|referral rewards?|commissions?|giveaways?|free sample services?|free demos?|free consultations?|free (?:first[- ]time )?(?:car )?details?|complimentary services?|free services?|local SEO packages?|SEO agencies?)\b/i.test(userQuestion);
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
    const duration = /\b(?:a short period|short period|one month|a month|two weeks|three weeks|four weeks|30 days|next week|next month|within \d+ days|for \d+ weeks|over the next month|over the next few weeks|daily|weekly|monthly|quarterly|annually|every day|every week|each week|once a week|twice a week|every month|each month|once a month|every quarter|each quarter|every monday|every tuesday|every wednesday|every thursday|every friday|every saturday|every sunday|on mondays|on tuesdays|on wednesdays|on thursdays|on fridays|on saturdays|on sundays)\b/i.exec(sentence);
    if (duration && !isNegatedBefore(sentence, duration.index) && !String(userQuestion).toLowerCase().includes(duration[0].toLowerCase())) violations.push("unsupported fixed timeframe");
    const reviewSolicitation = /\b(?:ask|tell|encourage|have|get|request)\b.{0,100}\b(?:friends?|family|neighbors?|former coworkers?|non-customers?)\b.{0,100}\b(?:reviews?|ratings?)\b|\b(?:friends?|family|neighbors?|former coworkers?|non-customers?)\b.{0,100}\b(?:leave|post|write)\b.{0,50}\b(?:reviews?|ratings?)\b/i.exec(sentence);
    if (reviewSolicitation && !isNegatedBefore(sentence, reviewSolicitation.index)) violations.push("review solicitation from non-customers");
    const reviewReward = /\b(?:reward|incentive|discount|gift|giveaway|freebie|compensation)\b.{0,60}\b(?:reviews?|ratings?)\b|\b(?:reviews?|ratings?)\b.{0,60}\b(?:reward|incentive|discount|gift|giveaway|freebie|compensation)\b/i.exec(sentence);
    if (reviewReward && !isNegatedBefore(sentence, reviewReward.index)) violations.push("incentivized reviews");
    const freeWork = /\b(?:free (?:demo|service|detail(?:ing)?|sample)|detail(?:ing)? (?:a|their|the) car for free)\b.{0,160}\b(?:in exchange for|for a|to get|to receive)\b.{0,50}\btestimonials?\b|\btestimonials?\b.{0,100}\b(?:in exchange for|in return for)\b.{0,50}\bfree\b/i.exec(sentence);
    if (freeWork && !evaluatePromotion) violations.push("free work offered in exchange for a testimonial");
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
    const numbered = [...source.matchAll(/^\s*\d+[.)]\s+/gm)].length;
    if (numbered !== 3) violations.push("Delta must provide exactly three numbered findings");
    if (!/\b(?:correction|corrected|correct|replace|revise|instead|remove|change|check|verify|measure|track|confirm|avoid|use|recommend|set|calculate|compare|limit|clarify|separate|record|test|ask|identify|require|state|explain)\b/i.test(source)) violations.push("critique does not provide concrete corrections");
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
