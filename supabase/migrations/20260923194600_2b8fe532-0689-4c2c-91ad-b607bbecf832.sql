REVOKE EXECUTE ON FUNCTION public.is_ngo_admin(uuid), public.is_any_kitchen_admin(), public.record_safety_check(uuid,int,text,numeric,text),
 public.upsert_recipient_profile(uuid,text,text[],int,time,time,text,text,boolean), public.create_recipient_offer(uuid,uuid,int,date,time,time),
 public.advance_recipient_offer(uuid,text,timestamp,text,text,int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ngo_admin(uuid), public.is_any_kitchen_admin(), public.record_safety_check(uuid,int,text,numeric,text),
 public.upsert_recipient_profile(uuid,text,text[],int,time,time,text,text,boolean), public.create_recipient_offer(uuid,uuid,int,date,time,time),
 public.advance_recipient_offer(uuid,text,timestamp,text,text,int) TO authenticated;