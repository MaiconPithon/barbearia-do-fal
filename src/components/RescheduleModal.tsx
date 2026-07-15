import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import {
  format,
  getDay,
  isBefore,
  isAfter,
  isToday,
  startOfDay,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (mins: number) =>
  `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_id: string;
  total_duration: number | null;
  status: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  phone: string;
  onRescheduled?: () => void;
}

export function RescheduleModal({ open, onClose, appointment, phone, onRescheduled }: Props) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");

  useEffect(() => {
    if (open) {
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  }, [open]);

  // Service info for this appointment (duration/buffer)
  const { data: service } = useQuery({
    queryKey: ["reschedule_service", appointment?.service_id],
    enabled: !!appointment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("duration_minutes, buffer_minutes")
        .eq("id", appointment!.service_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const duration =
    appointment?.total_duration ||
    (service ? service.duration_minutes + (service.buffer_minutes || 0) : 30);

  const { data: scheduleConfig } = useQuery({
    queryKey: ["schedule_config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_config").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: scheduleOverrides } = useQuery({
    queryKey: ["schedule_overrides"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedule_overrides" as any).select("*");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: businessSettings } = useQuery({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
  });

  const slotInterval = Number(businessSettings?.slot_interval_minutes || 30);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data: appointmentsOnDate } = useQuery({
    queryKey: ["reschedule_appts", dateStr],
    enabled: !!dateStr,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_time, total_duration, status, actual_end_time, services(duration_minutes, buffer_minutes)")
        .eq("appointment_date", dateStr!)
        .in("status", ["pendente", "confirmado"]);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: blockedOnDate } = useQuery({
    queryKey: ["reschedule_blocked", dateStr],
    enabled: !!dateStr,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .eq("blocked_date", dateStr!);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allBlockedDates } = useQuery({
    queryKey: ["reschedule_blocked_calendar"],
    queryFn: async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const maxStr = format(addDays(new Date(), 7), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("blocked_date")
        .eq("full_day", true)
        .gte("blocked_date", todayStr)
        .lte("blocked_date", maxStr);
      if (error) throw error;
      return new Set((data || []).map((b) => b.blocked_date));
    },
  });

  const maxDate = addDays(startOfDay(new Date()), 7);

  const disabledDays = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    if (isAfter(date, maxDate)) return true;
    const ds = format(date, "yyyy-MM-dd");
    const override = (scheduleOverrides || []).find((o: any) => o.override_date === ds);
    if (override) return override.is_blocked;
    const dow = getDay(date);
    const config = scheduleConfig?.find((c) => c.day_of_week === dow);
    if (!config?.is_open) return true;
    if (allBlockedDates?.has(ds)) return true;
    return false;
  };

  // Compute available slots for selected date
  const slots = useMemo(() => {
    if (!selectedDate || !scheduleConfig) return [];
    const dow = getDay(selectedDate);
    const weekly = scheduleConfig.find((c) => c.day_of_week === dow);
    const override = (scheduleOverrides || []).find(
      (o: any) => o.override_date === format(selectedDate, "yyyy-MM-dd")
    );
    const cfg = override
      ? {
          is_open: !override.is_blocked,
          open_time: override.open_time || "08:00",
          close_time: override.close_time || "21:00",
          break_start: override.break_start,
          break_end: override.break_end,
        }
      : weekly;
    if (!cfg?.is_open) return [];

    const openMin = toMin(cfg.open_time.slice(0, 5));
    const closeMin = toMin(cfg.close_time.slice(0, 5));
    const breakStart = cfg.break_start ? toMin(cfg.break_start.slice(0, 5)) : null;
    const breakEnd = cfg.break_end ? toMin(cfg.break_end.slice(0, 5)) : null;

    const isFullDayBlocked = (blockedOnDate || []).some((b: any) => b.full_day);
    if (isFullDayBlocked) return [];

    const blockedTimes = new Set(
      (blockedOnDate || [])
        .filter((b: any) => b.blocked_time)
        .map((b: any) => b.blocked_time.slice(0, 5))
    );

    // Booked intervals (excluding self)
    const booked: { start: number; end: number }[] = [];
    (appointmentsOnDate || [])
      .filter((a: any) => a.id !== appointment?.id)
      .forEach((a: any) => {
        const st = toMin(a.appointment_time.slice(0, 5));
        let en: number;
        if (a.actual_end_time) en = toMin(a.actual_end_time.slice(0, 5));
        else if (a.total_duration) en = st + a.total_duration;
        else {
          const d = a.services?.duration_minutes ?? 30;
          const b = a.services?.buffer_minutes ?? 0;
          en = st + d + b;
        }
        booked.push({ start: st, end: en });
      });

    const nowMin = isToday(selectedDate)
      ? new Date().getHours() * 60 + new Date().getMinutes()
      : -1;

    const result: { time: string; available: boolean }[] = [];
    const step = Math.max(duration, slotInterval, 15);

    for (let m = openMin; m + duration <= closeMin; m += step) {
      const slotEnd = m + duration;
      let ok = true;

      if (m < nowMin) ok = false;
      if (blockedTimes.has(toTime(m))) ok = false;

      if (breakStart !== null && breakEnd !== null) {
        if (m < breakEnd && slotEnd > breakStart) ok = false;
      }

      for (const b of booked) {
        if (m < b.end && slotEnd > b.start) { ok = false; break; }
      }

      result.push({ time: toTime(m), available: ok });
    }
    return result;
  }, [selectedDate, scheduleConfig, scheduleOverrides, appointmentsOnDate, blockedOnDate, duration, slotInterval, appointment?.id]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!appointment || !selectedDate || !selectedTime) throw new Error("Selecione data e horário.");
      const { data, error } = await supabase.rpc("reschedule_appointment_by_phone" as any, {
        _appointment_id: appointment.id,
        _phone: phone,
        _new_date: format(selectedDate, "yyyy-MM-dd"),
        _new_time: selectedTime,
      } as any);
      if (error) throw error;
      const status = data as string;
      if (status === "ok") return true;
      const messages: Record<string, string> = {
        not_found: "Agendamento não encontrado ou telefone incorreto.",
        not_pending: "Apenas agendamentos pendentes podem ser reagendados.",
        conflict: "Este horário acabou de ser ocupado. Escolha outro.",
        invalid_phone: "Telefone inválido.",
      };
      throw new Error(messages[status] || "Não foi possível reagendar.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Horário reagendado com sucesso!");
      onRescheduled?.();
      onClose();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao reagendar."),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-background border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Reagendar horário
          </DialogTitle>
          <DialogDescription>
            Escolha uma nova data e horário. Apenas agendamentos pendentes podem ser alterados.
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
            Atual:{" "}
            <span className="text-foreground font-medium">
              {format(new Date(appointment.appointment_date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} ·{" "}
              {appointment.appointment_time.slice(0, 5)}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">Nova data</p>
            <div className="flex justify-center rounded-lg border border-white/10 bg-white/5 p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedTime(""); }}
                disabled={disabledDays}
                locale={ptBR}
                className={cn("pointer-events-auto")}
              />
            </div>
          </div>

          {selectedDate && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Novo horário</p>
              {slots.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum horário disponível nesta data.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs font-medium transition",
                        s.available
                          ? selectedTime === s.time
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/20 bg-white/5 text-foreground hover:border-primary/50"
                          : "border-white/5 bg-white/[0.02] text-muted-foreground/40 cursor-not-allowed line-through"
                      )}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              style={{ backgroundColor: "#d1b122", color: "#000" }}
              disabled={!selectedDate || !selectedTime || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Reagendando...</>
              ) : (
                "Confirmar reagendamento"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
