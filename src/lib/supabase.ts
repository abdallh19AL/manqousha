import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    // Run the heartbeat in a Web Worker so background-tab throttling
    // does not silently kill the WebSocket connection.
    worker: true,
    heartbeatIntervalMs: 15000,
    // If the heartbeat detects a disconnect, automatically reconnect.
    heartbeatCallback: (status) => {
      if (status === "disconnected" || status === "error") {
        try {
          supabase.realtime.connect();
        } catch (e) {
          console.warn("[Realtime] reconnect attempt failed:", e);
        }
      }
    },
  },
});
