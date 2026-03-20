import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import admin from "firebase-admin";

console.log("Starting server.ts...");
dotenv.config();

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}
const firestore = admin.firestore();

// Catch unhandled errors to prevent silent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION (v3):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION (v3) at:', promise, 'reason:', reason);
});

console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

export const app = express();
const PORT = 3000;

// Check if we should be in development or production mode
const distPath = path.join(process.cwd(), 'dist');
const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));
const isDev = process.env.NODE_ENV !== "production";

console.log(`Mode: ${isDev ? 'Development (Vite)' : 'Production (Static)'}`);

// Early test route
app.get("/api/v3-test", (req, res) => {
  console.log("GET /api/v3-test hit");
  res.json({ message: "v3 test successful", env: process.env.NODE_ENV });
});

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

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  console.log("GET /api/health hit (v3)");
  res.json({ 
    status: "ok", 
    version: "v3",
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
    supabaseConfigured: !!process.env.SUPABASE_URL && (!!process.env.SUPABASE_SERVICE_ROLE_KEY || !!process.env.SUPABASE_ANON_KEY)
  });
});

// API route to handle order form submission to Supabase
app.post("/api/orders", async (req, res) => {
  console.log("POST /api/orders hit (v3)");
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
      // Better error for missing table
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return res.status(400).json({ 
          error: "Database table 'orders' not found.", 
          details: "Please ensure you have created the 'orders' table in your Supabase project." 
        });
      }
      return res.status(500).json({ error: error.message, details: error });
    }

    res.status(201).json({ message: "Order stored successfully", data });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API route to fetch all orders (for admin)
app.get("/api/test", (req, res) => {
  console.log("GET /api/test hit (v3)");
  res.json({ message: "API is working", time: new Date().toISOString() });
});

app.get("/api/orders", async (req, res) => {
  console.log(`GET /api/orders hit (v3) [${new Date().toISOString()}]`);
  const supabase = getSupabase();
  if (!supabase) {
    console.error("Supabase not configured in GET /api/orders");
    return res.status(503).json({ error: "Supabase is not configured. Check your environment variables." });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error fetching orders (v3):", JSON.stringify(error, null, 2));
      // If table doesn't exist, return empty array instead of error to avoid crashing UI
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation "orders" does not exist')) {
        console.warn("Table 'orders' does not exist. Returning empty array.");
        return res.json([]);
      }
      return res.status(500).json({ error: error.message, details: error });
    }

    console.log(`Successfully fetched ${data?.length || 0} orders (v3)`);
    res.json(data || []);
  } catch (err) {
    console.error("Unexpected error fetching orders (v3):", err);
    res.status(500).json({ error: "Internal server error", details: err instanceof Error ? err.message : String(err) });
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
    // 1. Get the current order first to know the details
    const { data: orderData, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !orderData) {
      return res.status(404).json({ error: "Order not found" });
    }

    // 2. Update status in Supabase
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // 3. If approved, activate subscription in Firestore
    if (status === 'approved') {
      try {
        const userEmail = orderData.customer_email.toLowerCase();
        const productName = orderData.product;
        
        // Find user in Firestore
        const usersRef = firestore.collection('users');
        const userSnapshot = await usersRef.where('email', '==', userEmail).get();
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          
          // Get product duration from Supabase
          const { data: productData } = await supabase
            .from("products")
            .select("duration")
            .eq("name", productName)
            .single();
            
          const durationStr = productData?.duration || "30 Days";
          const daysToAdd = parseDurationToDays(durationStr);
          
          const now = new Date();
          let currentExpiry = userData.subscriptionExpiry ? new Date(userData.subscriptionExpiry) : now;
          
          // If current expiry is in the past, start from now
          if (currentExpiry < now) {
            currentExpiry = now;
          }
          
          const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
          
          const purchasedPlans = userData.purchasedPlans || [];
          purchasedPlans.push({
            planName: productName,
            duration: durationStr,
            purchasedAt: now.toISOString(),
            expiryDate: newExpiry.toISOString()
          });
          
          await userDoc.ref.update({
            subscriptionPlan: productName,
            subscriptionExpiry: newExpiry.toISOString(),
            purchasedPlans: purchasedPlans,
            isPremium: true
          });
          
          console.log(`Subscription activated for ${userEmail}: ${productName}, expires ${newExpiry.toISOString()}`);
        } else {
          console.warn(`User with email ${userEmail} not found in Firestore. Subscription not activated.`);
        }
      } catch (fsError) {
        console.error("Error activating subscription in Firestore:", fsError);
        // We don't return error here because the Supabase update was successful
      }
    }

    res.json({ message: "Order updated successfully", data });
  } catch (err) {
    console.error("Unexpected error in PATCH /api/orders/:id:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

function parseDurationToDays(duration: string): number {
  const match = duration.match(/(\d+)\s*Days?/i);
  if (match) return parseInt(match[1]);
  if (duration.toLowerCase().includes('month')) return 30;
  if (duration.toLowerCase().includes('year')) return 365;
  if (duration.toLowerCase().includes('week')) return 7;
  return 30; // Default
}

// API route to fetch all products
app.get("/api/products", async (req, res) => {
  console.log(`GET /api/products hit (v3) [${new Date().toISOString()}]`);
  const supabase = getSupabase();
  if (!supabase) {
    console.error("Supabase not configured in GET /api/products");
    return res.status(503).json({ error: "Supabase is not configured." });
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase error fetching products (v3):", JSON.stringify(error, null, 2));
      // If table doesn't exist, return empty array instead of error to avoid crashing UI
      if (error.code === 'PGRST116' || error.message.includes('does not exist') || error.message.includes('relation "products" does not exist')) {
        console.warn("Table 'products' does not exist. Returning empty array.");
        return res.json([]);
      }
      return res.status(500).json({ error: error.message });
    }

    console.log(`Successfully fetched ${data?.length || 0} products (v3)`);
    res.json(data);
  } catch (err) {
    console.error("Unexpected error fetching products (v3):", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API route to update or create a product (POST for legacy/compatibility)
app.post("/api/products", async (req, res) => {
  return handleProductSave(req, res);
});

// API route to update a product (Standard PUT)
app.put("/api/products", async (req, res) => {
  return handleProductSave(req, res);
});

async function handleProductSave(req: any, res: any) {
  console.log(`${req.method} /api/products hit (v3) [${new Date().toISOString()}]`);
  const { id, name, price, description, duration } = req.body;
  console.log(`Product data:`, { id, name, price, description, duration });

  if (!name || price === undefined) {
    return res.status(400).json({ error: "Missing name or price" });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase is not configured." });
  }

  try {
    let result;
    if (id) {
      // Update
      result = await supabase
        .from("products")
        .update({ name, price, description, duration })
        .eq("id", id)
        .select();
    } else {
      // Create
      result = await supabase
        .from("products")
        .insert([{ name, price, description, duration }])
        .select();
    }

    if (result.error) {
      console.error("Supabase error saving product:", result.error);
      if (result.error.code === 'PGRST116' || result.error.message.includes('does not exist')) {
        return res.status(400).json({ 
          error: "Database table 'products' not found.", 
          details: "Please ensure you have created the 'products' table in your Supabase project." 
        });
      }
      // If duration column is missing, try without it
      if (result.error.message.includes('column "duration" of relation "products" does not exist')) {
        console.warn("Duration column missing in Supabase, falling back to name/price/description only");
        if (id) {
          result = await supabase
            .from("products")
            .update({ name, price, description })
            .eq("id", id)
            .select();
        } else {
          result = await supabase
            .from("products")
            .insert([{ name, price, description }])
            .select();
        }
        
        if (result.error) {
          return res.status(500).json({ error: result.error.message });
        }
      } else {
        return res.status(500).json({ error: result.error.message });
      }
    }

    res.json({ message: "Product saved successfully", data: result.data });
  } catch (err) {
    console.error("Unexpected error in handleProductSave:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// API route to delete a product
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;

  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase is not configured." });
  }

  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Catch-all for undefined API routes to prevent them from returning HTML via Vite
app.all("/api/*", (req, res) => {
  console.log(`404 API route hit (v3): ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: `API route not found (v3): ${req.method} ${req.url}`,
    method: req.method,
    path: req.path,
    query: req.query
  });
});

async function startServer() {
  // Vite middleware for development
  if (isDev && process.env.VERCEL !== '1') {
    console.log("Initializing Vite middleware (v3)...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!isDev) {
    console.log(`Serving static files from ${distPath} (v3)...`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Avoid serving index.html for API routes that reached here
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running as a Vercel function
  if (process.env.VERCEL !== '1') {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT} (v3)`);
    });
  }
}

// Export for Vercel
export default app;

if (process.env.VERCEL !== '1') {
  startServer();
}
