import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useCalenStore } from "@/stores/useCalenStore";

export const useCategorySync = () => {
  const { isSignedIn, user } = useUser();
  const categories = useCalenStore((state) => state.categories);
  const syncCategoriesPending = useCalenStore((state) => state.syncCategoriesPending);
  const setSyncCategoriesPending = useCalenStore((state) => state.setSyncCategoriesPending);
  const replaceCategories = useCalenStore((state) => state.replaceCategories);
  const hasLoadedRef = useRef(false);
  const runningRef = useRef(false);

  // Load categories on sign in
  useEffect(() => {
    if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) return;
    if (hasLoadedRef.current) return;

    hasLoadedRef.current = true;

    const loadCategories = async () => {
      try {
        const response = await fetch(
          `/api/sync/categories?email=${encodeURIComponent(
            user.primaryEmailAddress!.emailAddress
          )}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.categories && data.categories.length > 0) {
            replaceCategories(data.categories);
          }
        }
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, [isSignedIn, user, replaceCategories]);

  // Sync categories when they change
  useEffect(() => {
    if (!isSignedIn || !user?.primaryEmailAddress?.emailAddress) return;
    if (!syncCategoriesPending || runningRef.current) return;

    runningRef.current = true;

    const syncCategories = async () => {
      try {
        const response = await fetch("/api/sync/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.primaryEmailAddress!.emailAddress,
            categories,
          }),
        });

        if (response.ok) {
          setSyncCategoriesPending(false);
        }
      } catch (error) {
        console.error("Failed to sync categories:", error);
      } finally {
        runningRef.current = false;
      }
    };

    syncCategories();
  }, [
    isSignedIn,
    user,
    categories,
    syncCategoriesPending,
    setSyncCategoriesPending,
  ]);
};
