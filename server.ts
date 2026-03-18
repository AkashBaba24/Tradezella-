import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = 3000;

// Supabase client initialization (server-side to keep key hidden)
let supabaseClient: any = null;

const getSupabase = () => {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
};

app.use(express.json());

// API route to handle order form submission to Supabase
app.post("/api/orders", async (req, res) => {
  const { customerName, customerEmail, product, amount, status } = req.body;

  if (!customerName || !customerEmail || !product || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ 
      error: "Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment variables.",
      details: "Missing environment variables on server."
    });
  }

  try {
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

// API route to fetch all orders (for admin)
app.get("/api/orders", async (req, res) => {
  console.log("GET /api/orders hit");
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase is not configured." });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// API route to update order status (approve/reject)
app.patch("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Missing status" });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase is not configured." });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Order updated successfully", data });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

if (process.env.NODE_ENV !== "production" || !process.env.NETLIFY) {
  startServer();
}
