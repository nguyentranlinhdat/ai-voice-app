"use client";
import { Crown, Sparkles } from "lucide-react";
import React from "react";
import { Button } from "~/components/ui/button";
import { authClient } from "~/lib/auth-client";

export default function Upgrade() {
  const upgrade = async () => {
    await authClient.checkout({
      products: [
        "ee1cf832-02fd-4ca0-82dd-86d9ed11d7ab",
        "b6892222-d100-462e-b139-c920b0422240",
        "5b3bd9bc-a872-4725-b140-8430dcc88c2a",
      ],
    });
  };
  return (
    <Button
      variant="outline"
      size="sm"
      className="group hover: hover-shadow-lg relative ml-2 overflow-hidden border-orange-400/50 border-orange-500/70 bg-gradient-to-r from-orange-400/10 to-pink-500/10 text-orange-400 transition-all duration-300 hover:bg-gradient-to-r hover:from-orange-500 hover:to-pink-600 hover:text-white hover:shadow-orange-500/25"
      onClick={upgrade}
    >
      <div className="flex items-center gap-2">
        <Crown className="group-hover:rotated-12 h-4 w-4 transition-transform duration-300"></Crown>
        <span className="font-medium">Upgrade</span>
        <Sparkles className="group-hover: h-3 w-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      {/* subtle glow effect */}

      <div className="absolute inset-0 rounded-md bg-gradient-to-r from-orange-400/20 to-pink-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    </Button>
  );
}
