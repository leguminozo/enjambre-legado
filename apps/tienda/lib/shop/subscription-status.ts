/** Re-exporta estados compartidos desde @enjambre/pricing. */
export {
  SUBSCRIPTION_BLOCKING_STATUSES,
  SUBSCRIPTION_VISIBLE_STATUSES,
  canPauseReplenishment,
  canResumeReplenishment,
  isPastDue,
  isReplenishmentLive,
  type SubscriptionBlockingStatus,
  type SubscriptionVisibleStatus,
} from '@enjambre/pricing';