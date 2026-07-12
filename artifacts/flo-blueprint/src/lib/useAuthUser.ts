import { useUser } from "@clerk/react";

const E2E_USER_KEY = "__flo_e2e_user_id__";

type AuthUserResult = ReturnType<typeof useUser>;

export function useAuthUser(): AuthUserResult {
  const clerk = useUser();

  if (import.meta.env.DEV) {
    const testId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(E2E_USER_KEY)
        : null;
    if (testId) {
      return {
        user: { id: testId } as NonNullable<AuthUserResult["user"]>,
        isLoaded: true,
        isSignedIn: true,
      };
    }
  }

  return clerk;
}

export { E2E_USER_KEY };
