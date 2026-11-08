import type { SkillChainBackend } from "./types";

/**
 * Forwards every call to `demo` while `isDemo()` is true and to `base`
 * otherwise. The choice is made per call, so entering or leaving demo mode
 * needs no reload.
 */
export function createSwitchingBackend(
  base: SkillChainBackend,
  demo: SkillChainBackend,
  isDemo: () => boolean,
): SkillChainBackend {
  const current = () => (isDemo() ? demo : base);
  return {
    get isMock() {
      return current().isMock;
    },
    getProfile: (owner) => current().getProfile(owner),
    getNote: (owner) => current().getNote(owner),
    listProfiles: () => current().listProfiles(),
    initProfile: (ctx) => current().initProfile(ctx),
    completeLevel2: (ctx, recipient) => current().completeLevel2(ctx, recipient),
    completeLevel3: (ctx, message) => current().completeLevel3(ctx, message),
    buyItem: (ctx, itemId) => current().buyItem(ctx, itemId),
    equipItem: (ctx, itemId) => current().equipItem(ctx, itemId),
    unequipItem: (ctx, slot) => current().unequipItem(ctx, slot),
  };
}
