import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function test() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  console.log("Checking Environment Variables (System):");
  console.log("SUPABASE_URL:", url ? "SET" : "NOT SET");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", key ? "SET" : "NOT SET");
  console.log("SUPABASE_ANON_KEY:", anonKey ? "SET" : "NOT SET");

  if (!url || (!key && !anonKey)) {
    console.error("Error: Missing environment variables.");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  try {
    console.log("Testing connection to Supabase...");
    const { data, error } = await supabase.from("orders").select("*").limit(1);

    if (error) {
      console.error("Connection failed:", error.message);
      process.exit(1);
    }

    console.log("Success: Connection established and query successful.");
    process.exit(0);
  } catch (err: any) {
    console.error("Unexpected error:", err.message);
    process.exit(1);
  }
}

test();
