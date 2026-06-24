"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_MESSAGE =
  "نعتذر، المطعم مغلق حالياً ولا يستقبل طلبات. يمكنك تصفح القائمة وسنعود قريباً!";

function isOutsideWorkingHours(openingTime: string, closingTime: string): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const [openH, openM]   = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);
  const openMinutes  = openH  * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  if (closeMinutes < openMinutes) {
    // spans midnight — open from openMinutes until closeMinutes next day
    return current >= closeMinutes && current < openMinutes;
  }
  return current < openMinutes || current >= closeMinutes;
}

export interface StoreSettingsState {
  ordersPaused: boolean;
  pauseMessage: string;
  loading: boolean;
  outsideHours: boolean;
  openingTime: string;
}

export function useStoreSettings(): StoreSettingsState {
  const [ordersPaused,      setOrdersPaused]      = useState(false);
  const [pauseMessage,      setPauseMessage]      = useState(DEFAULT_MESSAGE);
  const [loading,           setLoading]           = useState(true);
  const [openingTime,       setOpeningTime]       = useState("10:00");
  const [closingTime,       setClosingTime]       = useState("03:00");
  const [autoCloseEnabled,  setAutoCloseEnabled]  = useState(true);

  // Unique channel name per hook instance so multiple pages don't collide.
  const channelId = useRef(`store-settings-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    supabase
      .from("store_settings")
      .select("orders_paused, pause_message, opening_time, closing_time, auto_close_enabled")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setOrdersPaused(Boolean(data.orders_paused));
          setPauseMessage(String(data.pause_message ?? DEFAULT_MESSAGE));
          setOpeningTime(String(data.opening_time ?? "10:00:00").slice(0, 5));
          setClosingTime(String(data.closing_time ?? "03:00:00").slice(0, 5));
          setAutoCloseEnabled(Boolean(data.auto_close_enabled ?? true));
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(channelId.current)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "store_settings", filter: "id=eq.1" },
        (payload) => {
          const d = payload.new as Record<string, unknown>;
          setOrdersPaused(Boolean(d.orders_paused));
          setPauseMessage(String(d.pause_message ?? DEFAULT_MESSAGE));
          setOpeningTime(String(d.opening_time ?? "10:00:00").slice(0, 5));
          setClosingTime(String(d.closing_time ?? "03:00:00").slice(0, 5));
          setAutoCloseEnabled(Boolean(d.auto_close_enabled ?? true));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const outsideHours = useMemo(
    () => autoCloseEnabled && isOutsideWorkingHours(openingTime, closingTime),
    [autoCloseEnabled, openingTime, closingTime],
  );

  return { ordersPaused, pauseMessage, loading, outsideHours, openingTime };
}
