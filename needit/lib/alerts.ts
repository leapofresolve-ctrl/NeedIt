/**
 * Free-tier limits for seller demand alerts.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * `demand_alerts` shipped as unlimited + instant + specific: the moment a
 * matching need was published, the seller got an email naming the card and
 * telling them to hurry. That is, in substance, the thing M2 (Lane 1) is meant
 * to sell — "Exprifi tells you when someone wants your stuff" — given away in
 * the MVP. Selling "we tell you, but faster" is a far weaker pitch than selling
 * "we tell you" to someone who currently has to come and look.
 *
 * Kyle's call (Aug 1): keep the feature, trim the free version so the paid one
 * has somewhere to go. Nothing is removed from anyone; the free version is
 * slower, smaller and deliberately vague.
 *
 *   FREE  — up to 3 saved alerts; at most one email every few days; that email
 *           says only that there is new matching demand, never what it is.
 *   M2    — unlimited alerts, instant, specific, matched against real
 *           inventory, with the broadcast/claim-race mechanic.
 *
 * This also reconciles the alert feature with the standing boundary rule
 * ("free = you come look, paid = it comes to you"): a vague nudge that sends
 * you to the board is still *you coming to look*. Naming the card in the email
 * is doing the matching work for the seller, and that is the paid product.
 *
 * The in-app bell is NOT throttled and NOT vague. It is on-site, so it costs
 * nothing against the boundary — you only see it once you've already arrived.
 *
 * Both numbers live here so the UI copy, the server action and the email route
 * can never disagree about them.
 */

/** Maximum saved demand alerts on a free account. Enforced in the server
 *  action for a friendly message, and again by a DB trigger (0017) because the
 *  action is not the only path to an insert. */
export const FREE_ALERT_LIMIT = 3;

/** Minimum days between demand-alert emails to the same seller. The bell is
 *  unaffected. */
export const DIGEST_INTERVAL_DAYS = 3;

/** Human phrasing for the cadence, used in UI copy and in the email footer so
 *  the promise we make is the promise the code keeps. */
export const DIGEST_CADENCE_COPY = "at most once every few days";
