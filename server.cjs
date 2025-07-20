@@ .. @@
 // In-memory storage (replace with database in production)
 let customers = [];
 let contactSubmissions = [];
+let consultationRequests = [];
 let adminUsers = [];
@@ .. @@
-// Create Stripe products and prices
-const createStripeProducts = async () => {
-  try {
-    // Check if products already exist
-    const existingProducts = await stripe.products.list({ limit: 10 });
-    const productNames = existingProducts.data.map(p => p.name);
-    
-    const plans = [
-      { name: 'Starter Plan', price: 55000, description: 'Perfect for small businesses starting their automation journey' },
-      { name: 'Growth Plan', price: 120000, description: 'Scale your reach with advanced automation and analytics' },
-      { name: 'Enterprise Plan', price: 225000, description: 'Enterprise-grade automation with dedicated support' }
-    ];
-
-    for (const plan of plans) {
-      if (!productNames.includes(plan.name)) {
-        const product = await stripe.products.create({
-          name: plan.name,
-          description: plan.description,
-        });
-
-        await stripe.prices.create({
-          unit_amount: plan.price,
-          currency: 'usd',
-          recurring: { interval: 'month' },
-          product: product.id,
-        });
-
-        console.log(`Created product: ${plan.name}`);
-      }
-    }
-  } catch (error) {
-    console.error('Error creating Stripe products:', error);
-  }
-};
-
 // Auth middleware
@@ .. @@
-// Get Stripe publishable key
-app.get('/api/stripe/config', (req, res) => {
-  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
-});
-
-// Get available plans
-app.get('/api/plans', async (req, res) => {
-  try {
-    const products = await stripe.products.list({ active: true });
-    const prices = await stripe.prices.list({ active: true });
-    
-    const plans = products.data.map(product => {
-      const price = prices.data.find(p => p.product === product.id);
-      return {
-        id: product.id,
-        name: product.name,
-        description: product.description,
-        price: price ? price.unit_amount : 0,
-        priceId: price ? price.id : null
-      };
-    });
-    
-    res.json(plans);
-  } catch (error) {
-    res.status(500).json({ error: 'Failed to fetch plans' });
-  }
-});
-
-// Create checkout session
-app.post('/api/create-checkout-session', async (req, res) => {
-  try {
-    const { priceId, customerEmail, customerName } = req.body;
-    
-    const session = await stripe.checkout.sessions.create({
-      payment_method_types: ['card'],
-      mode: 'subscription',
-      line_items: [{
-        price: priceId,
-        quantity: 1,
-      }],
-      customer_email: customerEmail,
-      metadata: {
-        customerName: customerName || ''
-      },
-      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
-      cancel_url: `${req.headers.origin}/#pricing`,
-    });
-
-    res.json({ sessionId: session.id });
-  } catch (error) {
-    console.error('Error creating checkout session:', error);
-    res.status(500).json({ error: 'Failed to create checkout session' });
-  }
-});
-
 // Contact form submission
 app.post('/api/contact', (req, res) => {
   try {
     const { name, email, companySize, message } = req.body;
     
     const submission = {
       id: Date.now(),
       name,
       email,
       companySize,
       message,
       timestamp: new Date().toISOString(),
       status: 'new'
     };
     
     contactSubmissions.push(submission);
     res.json({ success: true, message: 'Contact form submitted successfully' });
   } catch (error) {
     res.status(500).json({ error: 'Failed to submit contact form' });
   }
 });

+// Consultation request submission
+app.post('/api/consultation', (req, res) => {
+  try {
+    const { name, email, phone, company, companySize, budget, goals } = req.body;
+    
+    const request = {
+      id: Date.now(),
+      name,
+      email,
+      phone,
+      company,
+      companySize,
+      budget,
+      goals,
+      timestamp: new Date().toISOString(),
+      status: 'new',
+      type: 'consultation'
+    };
+    
+    consultationRequests.push(request);
+    res.json({ success: true, message: 'Consultation request submitted successfully' });
+  } catch (error) {
+    res.status(500).json({ error: 'Failed to submit consultation request' });
+  }
+});
+
 // Admin dashboard data
 app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
   try {
-    // Get Stripe data
-    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
-    const customers = await stripe.customers.list({ limit: 100 });
-    
-    // Calculate metrics
-    const totalRevenue = subscriptions.data.reduce((sum, sub) => {
-      return sum + (sub.items.data[0]?.price.unit_amount || 0);
-    }, 0);
-    
-    const activeSubscriptions = subscriptions.data.filter(sub => sub.status === 'active').length;
-    
-    const planDistribution = subscriptions.data.reduce((acc, sub) => {
-      const planName = sub.items.data[0]?.price.nickname || 'Unknown';
-      acc[planName] = (acc[planName] || 0) + 1;
-      return acc;
-    }, {});
+    // Calculate metrics from consultation requests and contacts
+    const totalConsultations = consultationRequests.length;
+    const pendingConsultations = consultationRequests.filter(req => req.status === 'new').length;
+    const totalContacts = contactSubmissions.length;
+    const recentRequests = [...consultationRequests, ...contactSubmissions]
+      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
+      .slice(0, 10);

     res.json({
       metrics: {
-        totalCustomers: customers.data.length,
-        activeSubscriptions,
-        totalRevenue: totalRevenue / 100, // Convert from cents
-        contactSubmissions: contactSubmissions.length
+        totalConsultations,
+        pendingConsultations,
+        totalContacts,
+        contactSubmissions: contactSubmissions.length
       },
-      recentCustomers: customers.data.slice(0, 10).map(customer => ({
-        id: customer.id,
-        email: customer.email,
-        name: customer.name,
-        created: customer.created
-      })),
-      recentSubmissions: contactSubmissions.slice(-10),
-      planDistribution
+      recentRequests,
+      recentSubmissions: contactSubmissions.slice(-10)
     });
   } catch (error) {
     console.error('Dashboard error:', error);
     res.status(500).json({ error: 'Failed to fetch dashboard data' });
   }
 });

-// Get all customers
-app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
-  try {
-    const customers = await stripe.customers.list({ limit: 100 });
-    const subscriptions = await stripe.subscriptions.list({ limit: 100 });
-    
-    const customersWithSubscriptions = customers.data.map(customer => {
-      const customerSubs = subscriptions.data.filter(sub => sub.customer === customer.id);
-      return {
-        ...customer,
-        subscriptions: customerSubs
-      };
-    });
-    
-    res.json(customersWithSubscriptions);
-  } catch (error) {
-    res.status(500).json({ error: 'Failed to fetch customers' });
-  }
+// Get consultation requests
+app.get('/api/admin/consultations', authenticateAdmin, (req, res) => {
+  res.json(consultationRequests);
 });

 // Get contact submissions
@@ -280,6 +215,16 @@ app.get('/api/admin/contacts', authenticateAdmin, (req, res) => {
   res.json(contactSubmissions);
 });

+// Update consultation request status
+app.put('/api/admin/consultations/:id', authenticateAdmin, (req, res) => {
+  const { id } = req.params;
+  const { status } = req.body;
+  
+  const request = consultationRequests.find(r => r.id === parseInt(id));
+  if (request) {
+    request.status = status;
+    res.json({ success: true });
+  } else {
+    res.status(404).json({ error: 'Consultation request not found' });
+  }
+});
+
 // Update contact submission status
@@ .. @@
-// Stripe webhook
-app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
-  const sig = req.headers['stripe-signature'];
-  let event;
-
-  try {
-    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
-  } catch (err) {
-    console.log(`Webhook signature verification failed.`, err.message);
-    return res.status(400).send(`Webhook Error: ${err.message}`);
-  }
-
-  // Handle the event
-  switch (event.type) {
-    case 'checkout.session.completed':
-      const session = event.data.object;
-      console.log('Payment successful:', session.id);
-      break;
-    case 'customer.subscription.created':
-      const subscription = event.data.object;
-      console.log('New subscription:', subscription.id);
-      break;
-    default:
-      console.log(`Unhandled event type ${event.type}`);
-  }
-
-  res.json({ received: true });
-});
-
 // Serve admin dashboard
@@ .. @@
-// Serve success page
-app.get('/success.html', (req, res) => {
-  res.sendFile(path.join(__dirname, 'success.html'));
-});
-
 // Initialize and start server
 const startServer = async () => {
   await initializeAdmin();
-  await createStripeProducts();
   
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
     console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
     console.log(`Main site: http://localhost:${PORT}`);
   });
 };