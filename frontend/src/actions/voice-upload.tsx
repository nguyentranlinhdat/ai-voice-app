"use server";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { auth } from "~/lib/auth";
import { headers } from "next/headers";

import { env } from "~/env";
import { db } from "~/server/db";
import { cache } from "react";
import { success } from "zod";

const s3Client = new S3Client({
  region: env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

interface UploadVoiceResult {
  success: boolean;
  id?: string;
  s3Key?: string;
  url?: string;
  error?: string;
}

export async function uploadVoice(
  formData: FormData,
): Promise<UploadVoiceResult> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    if (
      !env.AWS_ACCESS_KEY_ID ||
      !env.AWS_SECRET_ACCESS_KEY ||
      !env.AWS_S3_BUCKET_NAME
    ) {
      return { success: false, error: "AWS S3 not configured!" };
    }
    // thÔng tin đăng nhập hợp lệ -> truy suất thông tin từ tệp dữ liệu biểu mẫu
    const file = formData.get("voice") as File;

    // check file tải lên thàng công hay chưa
    if (!file) {
      return { success: false, error: "No file uploaded!" };
    }
    // check file tải lên phải là file âm thanh
    if (!file.type.startsWith("audio/")) {
      return { success: false, error: "File must be audio!" };
    }
    // check size file <10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: "File size exceeds 10MB!" };
    }
    // định dạng tên tệp
    const fileExtension = file.name.split(".").pop();
    // lưu trữ tệp vào bucket S3 thư mục voices/(userId)/timestamp.extension
    const fileName = `voices/${session.user.id}/${Date.now()}.${fileExtension}`;

    // send method
    await s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME ?? "",
        Key: fileName,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    );

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME ?? "",
        Key: fileName,
      }),
      { expiresIn: 60 * 60 * 24 * 7 }, // link hợp lệ trong 7d
    );
    // -> lưu signedUrl vào Neon database
    //
    const uploadedVoice = await db.uploadedVoice.create({
      data: {
        name: file.name,
        s3Key: fileName,
        url: signedUrl,
        userId: session.user.id,
      },
    });
    return {
      success: true,
      id: uploadedVoice.id,
      s3Key: fileName,
      url: signedUrl,
    };
  } catch (error) {
    console.error("Voice upload error:", error);
    return { success: false, error: "Failed to upload voice file" };
  }
}

export const getUserUploadedVoices = cache(async () => {
  try {
    // check session user
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", voices: [] };
    }
    // truy xuất danh sách tệp âm thanh đã tải lên từ Neon database
    const uploadVoices = await db.uploadedVoice.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, voices: uploadVoices };
  } catch (error) {
    console.error("Error fetching uploaded voice:", error);
    return {
      success: false,
      error: "Failed to fetch uploaded voice",
      voices: [],
    };
  }
});
