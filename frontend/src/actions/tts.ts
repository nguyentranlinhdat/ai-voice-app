"use server";
// Đánh dấu đây là Server Action của Next.js
// Code chỉ chạy ở server, không bundle ra client → an toàn cho env, DB, API key

import { headers } from "next/headers";
// Dùng để lấy headers của request hiện tại (phục vụ auth session)

import { cache } from "react";
import { success } from "zod";
// cache(): giúp memo hóa kết quả server action
// → tránh query DB lại khi dữ liệu không đổi

import { env } from "~/env";
// Import biến môi trường đã được validate (zod / t3-env)

import { auth } from "~/lib/auth";
// Module xử lý authentication (getSession, login, logout...)

import { db } from "~/server/db";
// Prisma client để thao tác database

/* =======================
   INTERFACE ĐỊNH NGHĨA DATA
======================= */

// Data gửi từ client lên để tạo voice
interface GenerateSpeechData {
  text: string; // Nội dung văn bản cần chuyển thành giọng nói
  voice_S3_key: string; // Key file voice mẫu lưu trên S3
  language: string; // Ngôn ngữ đọc
  exaggeration: number; // Mức độ nhấn giọng
  cfg_weight: number; // Trọng số CFG cho model TTS
}

// Kết quả trả về cho client
interface GenerateSpeechResult {
  success: boolean; // Trạng thái xử lý
  s3_key?: string; // Key file audio kết quả trên S3
  audioUrl?: string; // URL public để nghe audio
  projectId?: string; // ID project audio trong DB
  error?: string; // Thông báo lỗi nếu có
}

// Base URL của bucket S3 để build link audio
const S3_BUCKET_URL =
  "https://ai-voice-app-datlinh02.s3.ap-southeast-2.amazonaws.com";

/* =====================================================
   HÀM CHÍNH: GENERATE SPEECH (TEXT → AUDIO)
===================================================== */

export async function generateSpeech(
  data: GenerateSpeechData,
): Promise<GenerateSpeechResult> {
  try {
    /* -------------------------
       1. XÁC THỰC NGƯỜI DÙNG
    -------------------------- */
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Nếu chưa đăng nhập → chặn
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    /* -------------------------
       2. VALIDATE INPUT
    -------------------------- */
    if (!data.text || !data.voice_S3_key || !data.language) {
      return { success: false, error: "Missing required fields" };
    }

    /* -------------------------
       3. TÍNH CREDIT CẦN DÙNG
       (100 ký tự = 1 credit)
    -------------------------- */
    const creditsNeeded = Math.max(1, Math.ceil(data.text.length / 100));

    /* -------------------------
       4. KIỂM TRA CREDIT USER
    -------------------------- */
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.credits < creditsNeeded) {
      return {
        success: false,
        error: `Insufficient credits. You need ${creditsNeeded}, have ${user.credits}`,
      };
    }

    /* -------------------------
       5. GỌI MODAL API (TTS)
    -------------------------- */
    const response = await fetch(env.MODAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Modal-Key": env.MODAL_API_KEY,
        "Modal-Secret": env.MODAL_API_SECRET,
      },
      body: JSON.stringify({
        text: data.text,
        voice_s3_key: data.voice_S3_key,
        language: data.language,
        exaggeration: data.exaggeration ?? 0.5,
        cfg_weight: data.cfg_weight ?? 0.5,
      }),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to generate speech" };
    }

    // Kết quả trả về từ Modal (chứa key file audio trên S3)
    const result = (await response.json()) as {
      s3_Key: string;
    };

    // Build URL public để nghe audio
    const audioUrl = `${S3_BUCKET_URL}/${result.s3_Key}`;

    /* -------------------------
       6. TRỪ CREDIT USER
    -------------------------- */
    await db.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: creditsNeeded } },
    });

    /* -------------------------
       7. LƯU PROJECT AUDIO
    -------------------------- */
    const audioProject = await db.audioProject.create({
      data: {
        text: data.text,
        audioUrl,
        s3Key: result.s3_Key,
        language: data.language,
        voiceS3Key: data.voice_S3_key,
        exaggeration: data.exaggeration,
        cfgWeight: data.cfg_weight,
        userId: session.user.id,
      },
    });

    /* -------------------------
       8. TRẢ KẾT QUẢ CHO CLIENT
    -------------------------- */
    return {
      success: true,
      s3_key: result.s3_Key,
      audioUrl,
      projectId: audioProject.id,
    };
  } catch (error) {
    console.error("Speech generation error", error);
    return { success: false, error: "Internal server error" };
  }
}

/* =====================================================
   LẤY DANH SÁCH AUDIO PROJECT CỦA USER
===================================================== */

export const getUserAudioProjects = cache(async () => {
  try {
    // Kiểm tra session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Lấy danh sách project audio của user
    const audioProjects = await db.audioProject.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" }, // Mới nhất lên trước
    });

    return { success: true, audioProjects };
  } catch (error) {
    console.error("Error fetching audio projects:", error);
    return { success: false, error: "Failed to fetch audio projects!" };
  }
});

/* =====================================================
   LẤY SỐ CREDIT CÒN LẠI CỦA USER
===================================================== */

export const getUserCredits = cache(async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", credits: 0 };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!user) {
      return { success: false, error: "User not found", credits: 0 };
    }

    return { success: true, credits: user.credits };
  } catch (error) {
    console.error("Error fetching user credits:", error);
    return { success: false, error: "Failed to fetch credits", credit: 0 };
  }
});

export async function deleteAudioProject(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", credits: 0 };
    }
    const project = await db.audioProject.findUnique({ where: { id } });
    if (!project || project.userId !== session.user.id) {
      return { success: false, error: "Not found or unauthorized" };
    }
    await db.audioProject.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting audio project:", error);
    return { success: false, error: "Failed to delete adido project" };
  }
}
