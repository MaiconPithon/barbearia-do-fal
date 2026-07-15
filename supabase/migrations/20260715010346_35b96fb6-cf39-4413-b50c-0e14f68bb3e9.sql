
CREATE OR REPLACE FUNCTION public.reschedule_appointment_by_phone(
  _appointment_id uuid,
  _phone text,
  _new_date date,
  _new_time time
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_phone_suffix text;
  v_appt public.appointments%ROWTYPE;
  v_duration int;
  v_new_start int;
  v_new_end int;
  v_conflict boolean;
BEGIN
  v_phone_suffix := right(regexp_replace(coalesce(_phone, ''), '\D', '', 'g'), 8);
  IF length(v_phone_suffix) < 8 THEN
    RETURN 'invalid_phone';
  END IF;

  SELECT * INTO v_appt
  FROM public.appointments
  WHERE id = _appointment_id
    AND right(regexp_replace(coalesce(client_phone, ''), '\D', '', 'g'), 8) = v_phone_suffix;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF v_appt.status <> 'pendente' THEN
    RETURN 'not_pending';
  END IF;

  -- Determine duration (fallback to service duration + buffer)
  v_duration := COALESCE(
    v_appt.total_duration,
    (SELECT duration_minutes + COALESCE(buffer_minutes, 0)
     FROM public.services WHERE id = v_appt.service_id),
    30
  );

  v_new_start := EXTRACT(HOUR FROM _new_time) * 60 + EXTRACT(MINUTE FROM _new_time);
  v_new_end := v_new_start + v_duration;

  -- Conflict check against other active appointments on same date
  SELECT EXISTS (
    SELECT 1 FROM public.appointments a
    LEFT JOIN public.services s ON s.id = a.service_id
    WHERE a.id <> _appointment_id
      AND a.appointment_date = _new_date
      AND a.status IN ('pendente', 'confirmado')
      AND v_new_start < (
        EXTRACT(HOUR FROM a.appointment_time) * 60 + EXTRACT(MINUTE FROM a.appointment_time)
        + COALESCE(a.total_duration, s.duration_minutes + COALESCE(s.buffer_minutes, 0), 30)
      )
      AND v_new_end > (
        EXTRACT(HOUR FROM a.appointment_time) * 60 + EXTRACT(MINUTE FROM a.appointment_time)
      )
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN 'conflict';
  END IF;

  UPDATE public.appointments
  SET appointment_date = _new_date,
      appointment_time = _new_time,
      updated_at = now()
  WHERE id = _appointment_id;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION public.reschedule_appointment_by_phone(uuid, text, date, time) TO anon, authenticated;
