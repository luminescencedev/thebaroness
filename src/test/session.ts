import { sessionStore } from "@/api/session";
import { DEMO_TOKEN } from "@/mocks/scenarios";

export const DEMO_USER = {
  id: "507f1f77bcf86cd799439011",
  steamId: "76561198000000000",
  displayName: "Corvid",
  avatarUrl: null,
};

/** Ouvre une session valable pour les handlers MSW. */
export const signIn = () => sessionStore.set({ token: DEMO_TOKEN, user: DEMO_USER });
