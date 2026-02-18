import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

export const chat = httpAction(async (ctx, req) => {
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    async onFinish({ text }) {
      // implement your own logic here, e.g. for storing messages
      // or recording token usage
      console.log(text);
    },
  });

  // Respond with the stream
  return result.toDataStreamResponse({
    headers: {
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
      Vary: "origin",
    },
  });
});

const http = httpRouter();

http.route({
  path: "/api/chat",
  method: "POST",
  handler: chat,
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

http.route({
  path: "/api/auth/webhook",
  method: "POST",
  handler: httpAction(async (_, request) => {
    // Make sure the necessary headers are present
    // for this to be a valid pre-flight request
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});


// Transcription proxy endpoint (OpenAI Whisper)
http.route({
  path: "/api/transcribe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      if (file) {
        console.log("📎 Transcription request:", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
        });

        const MAX_SIZE = 25 * 1024 * 1024; // 25MB Whisper limit
        if (file.size > MAX_SIZE) {
          return new Response(
            JSON.stringify({
              error: "File size exceeds 25MB limit (OpenAI Whisper). Please use a smaller file or compress the audio.",
              details: {
                fileSize: file.size,
                maxSize: MAX_SIZE,
                fileSizeMB: (file.size / 1024 / 1024).toFixed(2),
                maxSizeMB: 25,
              },
            }),
            {
              status: 413,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }
      }

      const whisperFormData = new FormData();
      whisperFormData.append("file", file);
      whisperFormData.append("model", "whisper-1");

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: whisperFormData,
      });

      const responseData = await response.text();

      if (!response.ok) {
        console.error("❌ OpenAI Whisper error:", {
          status: response.status,
          statusText: response.statusText,
          response: responseData,
        });
      } else {
        console.log("✅ OpenAI Whisper transcription successful");
        try {
          const result = JSON.parse(responseData);
          if (!result.text || result.text.trim() === "") {
            console.warn("⚠️ No speech detected in the file");
          }
        } catch {
          // Not JSON, that's okay
        }
      }

      return new Response(responseData, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (error: unknown) {
      console.error("Transcription proxy error:", error);
      return new Response(JSON.stringify({ error: "Failed to process transcription request" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  }),
});

// OPTIONS handler for transcription endpoint
http.route({
  path: "/api/transcribe",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Log that routes are configured
console.log("HTTP routes configured");

// Convex expects the router to be the default export of `convex/http.js`.
export default http;
