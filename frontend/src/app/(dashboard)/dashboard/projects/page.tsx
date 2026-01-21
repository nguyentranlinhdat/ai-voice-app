"use client";
import { RedirectToSignIn, SignedIn } from "@daveyplate/better-auth-ui";
import {
  Loader2,
  Search,
  Calendar,
  Music,
  Trash2,
  Download,
  Plus,
} from "lucide-react";

import { authClient } from "~/lib/auth-client";

import { useEffect, useState } from "react";

import { getUserAudioProjects, deleteAudioProject } from "~/actions/tts";

import { Card, CardContent } from "~/components/ui/card";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { useRouter } from "next/navigation";

export default function ProjectPage() {
  return <div>ProjectPage</div>;
}
