"use client";

import React, { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    initAnalytics()
      .then((analytics) => {
        if (analytics) {
          console.log("Firebase Analytics initialized (scmain-ae18f)");
        }
      })
      .catch((err) => {
        console.error("Firebase Analytics init error:", err);
      });
  }, []);

  return <>{children}</>;
};
