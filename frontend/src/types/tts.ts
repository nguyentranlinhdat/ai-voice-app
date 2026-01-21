// định nghĩa các kiểu dữ liệu liên quan đến TTS\
export interface GeneratedAudio {
  s3_key: string; // Key file voice mẫu lưu trên S3
  audioUrl: string; // URL public để nghe audio
  text: string; // Nội dung văn bản cần chuyển thành giọng nói
  language: string; // Ngôn ngữ đọc
  timestamp: Date; // Mốc thời gian tạo file audio
}

export interface VoiceFile {
  name: string; // Tên file
  s3_key: string; // Key file voice mẫu lưu trên S3
}

export interface UploadedVoice {
  id: string; // ID file voice đã upload
  name: string; // Tên file
  s3Key: string; // Key file voice mẫu lưu trên S3
  url: string; // URL public để nghe file voice đã upload
  userId: string; // ID người dùng đã upload file voice
  createdAt: Date; // Mốc thời gian tạo file voice
  updatedAt: Date; // Mốc thời gian cập nhật file voice
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}
