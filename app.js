import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🚨 Reemplaza por tu URL y clave de Supabase
const SUPABASE_URL = "https://vnekfauzivwsyueeizvz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuZWtmYXV6aXZ3c3l1ZWVpenZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NTk3MzEsImV4cCI6MjA3MzAzNTczMX0.XWGEFAa8PbNNWVSBfwfEmscgDbaEASE8Z20DfTFeRlM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function qs(name, def=null){ return new URLSearchParams(location.search).get(name) ?? def }
