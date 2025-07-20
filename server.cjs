// In-memory storage (replace with database in production)
let customers = [];
let contactSubmissions = [];
let consultationRequests = [];
let adminUsers = [];

// Auth middleware

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

// Consultation request submission
app.post('/api/consultation', (req, res) => {
  try {
    const { name, email, phone, company, companySize, budget, goals } = req.body;
    
    const request = {
      id: Date.now(),
      name,
      email,
      phone,
      company,
      companySize,
      budget,
      goals,
      timestamp: new Date().toISOString(),
      status: 'new',
      type: 'consultation'
    };
    
    consultationRequests.push(request);
    res.json({ success: true, message: 'Consultation request submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit consultation request' });
  }
});

app.get('/api/admin/dashboard', authenticateAdmin, (req, res) => {
  try {
    // Calculate metrics from consultation requests and contacts
    const totalConsultations = consultationRequests.length;
    const pendingConsultations = consultationRequests.filter(r => r.status === 'new').length;
    const totalContacts = contactSubmissions.length;
    const recentRequests = [...consultationRequests, ...contactSubmissions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    res.json({
      totalConsultations,
      pendingConsultations,
      totalContacts,
      recentRequests,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get consultation requests
app.get('/api/admin/consultations', authenticateAdmin, (req, res) => {
  res.json(consultationRequests);
});

// Get contact submissions
app.get('/api/admin/contacts', authenticateAdmin, (req, res) => {
  res.json(contactSubmissions);
});

// Update consultation request status
app.put('/api/admin/consultations/:id', authenticateAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const request = consultationRequests.find(r => r.id === parseInt(id));
  if (request) {
    request.status = status;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Consultation request not found' });
  }
});

// Update contact submission status

// Serve admin dashboard

// Initialize and start server
const startServer = async () => {
  await initializeAdmin();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`Main site: http://localhost:${PORT}`);
  });
};

startServer();