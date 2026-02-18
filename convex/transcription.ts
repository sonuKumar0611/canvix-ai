"use node"
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import OpenAI, { toFile } from "openai";

const WHISPER_MAX_BYTES = 25 * 1024 * 1024; // 25 MB OpenAI limit

// Action to transcribe video/audio using OpenAI Whisper
export const transcribeVideoOpenAI = action({
  args: {
    videoId: v.id("videos"),
    storageId: v.id("_storage"),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; transcription: string; service?: string }> => {
    console.log("🎙️ OpenAI Whisper transcription started", {
      videoId: args.videoId,
      storageId: args.storageId,
      fileType: args.fileType,
      fileName: args.fileName,
    });

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      console.log("⚠️ No user identity - running from internal action (this is ok)");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔑 OpenAI API key status:", apiKey ? "Found" : "Not found");

    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your Convex environment variables.");
    }

    try {
      await ctx.runMutation(api.videos.updateTranscriptionStatus, {
        id: args.videoId,
        status: "processing",
        progress: "Starting transcription...",
      });

      const fileUrl = await ctx.storage.getUrl(args.storageId);
      if (!fileUrl) {
        throw new Error("Could not retrieve file URL from storage. The file may have been deleted.");
      }

      console.log("🌐 Starting OpenAI Whisper transcription");
      try {
        const nodeFetch = (await import("node-fetch")).default;
        const headResponse = await nodeFetch(fileUrl, { method: "HEAD" });
        if (!headResponse.ok) {
          throw new Error(`File URL is not accessible (${headResponse.status}). The file may have been deleted.`);
        }
        const contentLength = headResponse.headers.get("content-length");
        if (contentLength) {
          const sizeMB = parseInt(contentLength, 10) / (1024 * 1024);
          console.log(`✅ File URL is accessible. Size: ${sizeMB.toFixed(2)}MB`);
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("❌ Failed to validate file URL:", error);
        throw new Error("Could not validate file accessibility. " + msg);
      }

      await ctx.runMutation(api.videos.updateTranscriptionStatus, {
        id: args.videoId,
        status: "processing",
        progress: "Downloading file for transcription...",
      });

      const nodeFetch = (await import("node-fetch")).default;
      const response = await nodeFetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file (${response.status})`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const size = arrayBuffer.byteLength;
      const truncated = size > WHISPER_MAX_BYTES;
      const buffer = size > WHISPER_MAX_BYTES
        ? arrayBuffer.slice(0, WHISPER_MAX_BYTES)
        : arrayBuffer;
      if (truncated) {
        console.log(`⚠️ File is ${(size / (1024 * 1024)).toFixed(2)}MB; using first 25MB for Whisper (API limit).`);
      }

      const fileName = args.fileName || "audio.mp4";
      const file = await toFile(Buffer.from(buffer), fileName);

      await ctx.runMutation(api.videos.updateTranscriptionStatus, {
        id: args.videoId,
        status: "processing",
        progress: "Transcribing with OpenAI Whisper...",
      });

      const openai = new OpenAI({ apiKey });
      const whisperResponse = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });
      let transcriptionText = (whisperResponse as { text?: string }).text ?? "";

      if (truncated && transcriptionText) {
        transcriptionText += "\n\n[Transcription may be incomplete — file was truncated to 25 MB for OpenAI Whisper limit.]";
      }

      console.log(`📝 Transcription length: ${transcriptionText.length} characters`);

      if (!transcriptionText || transcriptionText.length === 0) {
        throw new Error("No speech detected in the file. Please ensure your video/audio contains clear speech.");
      }

      await ctx.runMutation(api.videos.updateTranscriptionStatus, {
        id: args.videoId,
        status: "processing",
        progress: "Processing transcription results...",
      });

      await ctx.runMutation(api.videos.updateVideoTranscription, {
        videoId: args.videoId,
        transcription: transcriptionText,
      });

      return { success: true, transcription: transcriptionText, service: "openai" };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("❌ OpenAI Whisper transcription error:", error);
      await ctx.runMutation(api.videos.updateTranscriptionStatus, {
        id: args.videoId,
        status: "failed",
        error: message,
      });
      throw error;
    }
  },
});

// Main transcription action - uses OpenAI Whisper
export const transcribeVideo = action({
  args: {
    videoId: v.id("videos"),
    storageId: v.id("_storage"),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; transcription: string; service?: string }> => {
    return ctx.runAction(api.transcription.transcribeVideoOpenAI, args);
  },
});
