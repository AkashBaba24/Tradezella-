import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Supabase client initialization (server-side to keep key hidden)
let supabaseClient: any = null;

const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be set in environment variables");
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

app.use(express.json());

// API route to handle order form submission to Supabase
app.get("/api/diagnostics/supabase", async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  const diagnostics = {
    urlSet: !!url,
    serviceRoleKeySet: !!key,
    anonKeySet: !!anonKey,
    keyType: key ? "service_role" : (anonKey ? "anon" : "none"),
    connectionTest: "pending"
  };

  if (!url || (!key && !anonKey)) {
    return res.status(500).json({ 
      error: "Supabase environment variables are missing.", 
      diagnostics 
    });
  }

  try {
    const supabase = getSupabase();
    // Simple query to test connection (e.g., list tables or query a common table)
    // We'll try to fetch one row from 'orders' table (even if it's empty)
    const { data, error } = await supabase.from("orders").select("*").limit(1);
    
    if (error) {
      return res.status(500).json({ 
        error: "Supabase connection failed.", 
        details: error.message,
        diagnostics: { ...diagnostics, connectionTest: "failed" }
      });
    }

    res.json({ 
      message: "Supabase configuration is correct and connection is successful.", 
      diagnostics: { ...diagnostics, connectionTest: "success" }
    });
  } catch (err: any) {
    res.status(500).json({ 
      error: "Unexpected error during diagnostics.", 
      details: err.message,
      diagnostics: { ...diagnostics, connectionTest: "error" }
    });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, product, amount, status } = req.body;

  if (!customerName || !customerEmail || !product || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("orders")
      .insert([
        { 
          customer_name: customerName, 
          customer_email: customerEmail, 
          product, 
          amount, 
          status: status || "pending",
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error("Supabase error detail:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message, details: error });
    }

    res.status(201).json({ message: "Order stored successfully", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  console.log("Checking Supabase Environment Variables:");
  console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "NOT SET");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "NOT SET");
  console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "SET" : "NOT SET");

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
