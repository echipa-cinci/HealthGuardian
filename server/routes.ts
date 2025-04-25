import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { 
  insertUserSchema, 
  insertPatientProfileSchema, 
  insertParameterSchema,
  insertParameterLimitSchema,
  insertRecommendationSchema,
  insertAlertSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'healthguardian-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Setup passport with local strategy
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return done(null, false, { message: 'Incorrect email' });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Incorrect password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Middleware to check authentication
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
  };
  
  // Helper function to handle validation
  const validateRequest = (schema: z.ZodSchema<any>) => (req: Request, res: Response, next: Function) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(400).json({ message: 'Invalid request data' });
      }
    }
  };
  
  // Authentication routes
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: Error, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        });
      });
    })(req, res, next);
  });
  
  app.post('/api/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        authenticated: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        } 
      });
    } else {
      res.json({ authenticated: false });
    }
  });
  
  // Register route - for creating new users
  app.post('/api/register', validateRequest(insertUserSchema.extend({
    password: z.string().min(6)
  })), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ 
        email, 
        password: hashedPassword,
        firstName,
        lastName,
        role
      });
      
      res.status(201).json({ 
        id: user.id, 
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Error creating user' });
    }
  });
  
  // User routes for role-based queries
  app.get('/api/users/role/:role', isAuthenticated, async (req, res) => {
    try {
      const role = req.params.role;
      if (role !== 'doctor' && role !== 'patient') {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({ message: 'Error fetching users by role' });
    }
  });
  
  // Patient Profile routes
  app.get('/api/patient-profiles', isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const patientProfiles = await storage.getPatientProfiles(limit, offset);
      res.json(patientProfiles);
    } catch (error) {
      console.error('Error fetching patient profiles:', error);
      res.status(500).json({ message: 'Error fetching patient profiles' });
    }
  });
  
  app.get('/api/patient-profiles/count', isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getPatientProfilesCount();
      res.json({ count });
    } catch (error) {
      console.error('Error fetching patient profiles count:', error);
      res.status(500).json({ message: 'Error fetching patient profiles count' });
    }
  });
  
  app.get('/api/patient-profiles/doctor/:doctorId', isAuthenticated, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const patientProfiles = await storage.getPatientProfilesByDoctorId(doctorId, limit, offset);
      res.json(patientProfiles);
    } catch (error) {
      console.error('Error fetching patient profiles by doctor:', error);
      res.status(500).json({ message: 'Error fetching patient profiles by doctor' });
    }
  });
  
  app.get('/api/patient-profiles/count/doctor/:doctorId', isAuthenticated, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const count = await storage.getPatientProfilesCountByDoctorId(doctorId);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching doctor patient profiles count:', error);
      res.status(500).json({ message: 'Error fetching doctor patient profiles count' });
    }
  });
  
  app.get('/api/patient-profiles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientProfile = await storage.getPatientProfile(id);
      
      if (!patientProfile) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      res.json(patientProfile);
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      res.status(500).json({ message: 'Error fetching patient profile' });
    }
  });
  
  app.get('/api/patient-profiles/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const patientProfile = await storage.getPatientProfileByUserId(userId);
      
      if (!patientProfile) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      res.json(patientProfile);
    } catch (error) {
      console.error('Error fetching patient profile by user id:', error);
      res.status(500).json({ message: 'Error fetching patient profile by user id' });
    }
  });
  
  app.post('/api/patient-profiles', isAuthenticated, validateRequest(insertPatientProfileSchema), async (req, res) => {
    try {
      // Check if patient is already allocated to a doctor
      const existingProfile = await storage.getPatientProfileByUserId(req.body.userId);
      if (existingProfile) {
        return res.status(400).json({ message: 'Patient is already allocated to a doctor' });
      }
      
      // Set doctorId to the authenticated doctor's ID
      const doctorId = (req.user as any)?.id;
      if (!doctorId) {
        return res.status(401).json({ message: 'Doctor ID not found' });
      }
      
      const patientProfile = await storage.createPatientProfile({
        ...req.body,
        doctorId
      });
      res.status(201).json(patientProfile);
    } catch (error) {
      console.error('Error creating patient profile:', error);
      res.status(500).json({ message: 'Error creating patient profile' });
    }
  });
  
  app.put('/api/patient-profiles/:id', isAuthenticated, validateRequest(insertPatientProfileSchema.partial()), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patientProfile = await storage.updatePatientProfile(id, req.body);
      
      if (!patientProfile) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      // Notify the patient about the profile update
      if (patientProfile.userId) {
        if ((global as any).notifyProfileUpdate) {
          (global as any).notifyProfileUpdate(patientProfile.userId, patientProfile.id);
        }
      }
      
      res.json(patientProfile);
    } catch (error) {
      console.error('Error updating patient profile:', error);
      res.status(500).json({ message: 'Error updating patient profile' });
    }
  });
  
  // Delete patient profile (unassign from doctor)
  app.delete('/api/patient-profiles/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const doctorId = (req.user as any)?.id;
      
      if (!doctorId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Get the patient profile first to verify doctor has access
      const patientProfile = await storage.getPatientProfile(id);
      
      if (!patientProfile) {
        return res.status(404).json({ message: 'Patient profile not found' });
      }
      
      if (patientProfile.doctorId !== doctorId) {
        return res.status(403).json({ message: 'You are not authorized to delete this patient' });
      }
      
      // Update patient profile to set doctorId to null (unassign from doctor)
      const updatedProfile = await storage.deletePatientProfile(id);
      
      res.json({ message: 'Patient successfully removed from your list' });
    } catch (error) {
      console.error('Error deleting patient profile:', error);
      res.status(500).json({ message: 'Error deleting patient profile' });
    }
  });
  
  // Parameter routes
  app.get('/api/parameters/:patientProfileId', isAuthenticated, async (req, res) => {
    try {
      const patientProfileId = parseInt(req.params.patientProfileId);
      const parameters = await storage.getParametersByPatientProfileId(patientProfileId);
      res.json(parameters);
    } catch (error) {
      console.error('Error fetching parameters:', error);
      res.status(500).json({ message: 'Error fetching parameters' });
    }
  });

  app.post('/api/parameters', isAuthenticated, validateRequest(insertParameterSchema), async (req, res) => {
    try {
      const parameter = await storage.createParameter(req.body);
      
      // Check if parameter exceeds any limits and create alerts if needed
      const patientProfileId = req.body.patientProfileId;
      const parameterLimits = await storage.getParameterLimitsByPatientProfileId(patientProfileId);
      
      // Check each parameter value against its limits
      for (const limit of parameterLimits) {
        const paramName = limit.parameterName;
        const paramValue = parameter[paramName as keyof typeof parameter];
        
        if (typeof paramValue === 'number') {
          // Check min value
          if (paramValue < limit.minValue) {
            await storage.createAlert({
              patientProfileId,
              parameterName: paramName,
              value: paramValue,
              limitValue: limit.minValue,
              limitType: 'minimum',
              status: 'active'
            });
          }
          
          // Check max value
          if (paramValue > limit.maxValue) {
            await storage.createAlert({
              patientProfileId,
              parameterName: paramName,
              value: paramValue,
              limitValue: limit.maxValue,
              limitType: 'maximum',
              status: 'active'
            });
          }
        }
      }
      
      res.status(201).json(parameter);
    } catch (error) {
      console.error('Error creating parameter:', error);
      res.status(500).json({ message: 'Error creating parameter' });
    }
  });

  // Parameter Limits routes
  app.get('/api/parameter-limits/:patientProfileId', isAuthenticated, async (req, res) => {
    try {
      const patientProfileId = parseInt(req.params.patientProfileId);
      const parameterLimits = await storage.getParameterLimitsByPatientProfileId(patientProfileId);
      res.json(parameterLimits);
    } catch (error) {
      console.error('Error fetching parameter limits:', error);
      res.status(500).json({ message: 'Error fetching parameter limits' });
    }
  });

  app.post('/api/parameter-limits', isAuthenticated, validateRequest(insertParameterLimitSchema), async (req, res) => {
    try {
      const parameterLimit = await storage.createParameterLimit(req.body);
      
      // Check all existing parameters against this new limit
      const patientProfileId = req.body.patientProfileId;
      const parameterName = req.body.parameterName;
      const minValue = req.body.minValue;
      const maxValue = req.body.maxValue;
      
      console.log(`New limit created - PatientId: ${patientProfileId}, Parameter: ${parameterName}, Min: ${minValue}, Max: ${maxValue}`);
      
      // Get all parameters for this patient
      const parameters = await storage.getParametersByPatientProfileId(patientProfileId);
      console.log(`Found ${parameters.length} parameters to check against the new limit`);
      
      // Check each parameter against the new limit
      for (const parameter of parameters) {
        const paramValue = parameter[parameterName as keyof typeof parameter];
        console.log(`Checking parameter ${parameterName}: ${paramValue}`);
        
        if (typeof paramValue === 'number') {
          // Check min value
          if (paramValue < minValue) {
            console.log(`Alert! ${parameterName} value ${paramValue} is below minimum ${minValue}`);
            const alert = await storage.createAlert({
              patientProfileId,
              parameterName,
              value: paramValue,
              limitValue: minValue,
              limitType: 'minimum',
              status: 'active'
            });
            console.log(`Created alert: ${JSON.stringify(alert)}`);
          }
          
          // Check max value
          if (paramValue > maxValue) {
            console.log(`Alert! ${parameterName} value ${paramValue} is above maximum ${maxValue}`);
            const alert = await storage.createAlert({
              patientProfileId,
              parameterName,
              value: paramValue,
              limitValue: maxValue,
              limitType: 'maximum',
              status: 'active'
            });
            console.log(`Created alert: ${JSON.stringify(alert)}`);
          }
        }
      }
      
      res.status(201).json(parameterLimit);
    } catch (error) {
      console.error('Error creating parameter limit:', error);
      res.status(500).json({ message: 'Error creating parameter limit' });
    }
  });
  
  app.put('/api/parameter-limits/:id', isAuthenticated, validateRequest(insertParameterLimitSchema.partial()), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const parameterLimit = await storage.updateParameterLimit(id, req.body);
      
      if (!parameterLimit) {
        return res.status(404).json({ message: 'Parameter limit not found' });
      }
      
      res.json(parameterLimit);
    } catch (error) {
      console.error('Error updating parameter limit:', error);
      res.status(500).json({ message: 'Error updating parameter limit' });
    }
  });
  
  app.delete('/api/parameter-limits/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteParameterLimit(id);
      res.status(200).json({ message: 'Parameter limit deleted successfully' });
    } catch (error) {
      console.error('Error deleting parameter limit:', error);
      res.status(500).json({ message: 'Error deleting parameter limit' });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations/:patientProfileId', isAuthenticated, async (req, res) => {
    try {
      const patientProfileId = parseInt(req.params.patientProfileId);
      const recommendations = await storage.getRecommendationsByPatientProfileId(patientProfileId);
      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ message: 'Error fetching recommendations' });
    }
  });

  app.post('/api/recommendations', isAuthenticated, validateRequest(insertRecommendationSchema), async (req, res) => {
    try {
      const recommendation = await storage.createRecommendation(req.body);
      
      // Get the patient profile to find the user ID
      if (recommendation.patientProfileId) {
        const patientProfile = await storage.getPatientProfile(recommendation.patientProfileId);
        
        // Notify the patient about the new recommendation
        if (patientProfile && patientProfile.userId) {
          if ((global as any).notifyProfileUpdate) {
            (global as any).notifyProfileUpdate(patientProfile.userId, patientProfile.id);
          }
        }
      }
      
      res.status(201).json(recommendation);
    } catch (error) {
      console.error('Error creating recommendation:', error);
      res.status(500).json({ message: 'Error creating recommendation' });
    }
  });
  
  app.put('/api/recommendations/:id', isAuthenticated, validateRequest(insertRecommendationSchema.partial()), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recommendation = await storage.updateRecommendation(id, req.body);
      
      if (!recommendation) {
        return res.status(404).json({ message: 'Recommendation not found' });
      }
      
      res.json(recommendation);
    } catch (error) {
      console.error('Error updating recommendation:', error);
      res.status(500).json({ message: 'Error updating recommendation' });
    }
  });

  // Alerts routes
  app.get('/api/alerts/:patientProfileId', isAuthenticated, async (req, res) => {
    try {
      const patientProfileId = parseInt(req.params.patientProfileId);
      const alerts = await storage.getAlertsByPatientProfileId(patientProfileId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ message: 'Error fetching alerts' });
    }
  });
  
  app.get('/api/alerts/doctor/:doctorId', isAuthenticated, async (req, res) => {
    try {
      const doctorId = parseInt(req.params.doctorId);
      const alerts = await storage.getActiveAlertsByDoctorId(doctorId);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching active alerts for doctor:', error);
      res.status(500).json({ message: 'Error fetching active alerts for doctor' });
    }
  });

  app.post('/api/alerts', isAuthenticated, validateRequest(insertAlertSchema), async (req, res) => {
    try {
      const alert = await storage.createAlert(req.body);
      
      // Get the patient profile to find the user ID
      if (alert.patientProfileId) {
        const patientProfile = await storage.getPatientProfile(alert.patientProfileId);
        
        // Notify the patient about the new alert
        if (patientProfile && patientProfile.userId) {
          if ((global as any).notifyProfileUpdate) {
            (global as any).notifyProfileUpdate(patientProfile.userId, patientProfile.id);
          }
        }
      }
      
      res.status(201).json(alert);
    } catch (error) {
      console.error('Error creating alert:', error);
      res.status(500).json({ message: 'Error creating alert' });
    }
  });

  app.put('/api/alerts/:id', isAuthenticated, validateRequest(insertAlertSchema.partial()), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const alert = await storage.updateAlert(id, req.body);
      
      if (!alert) {
        return res.status(404).json({ message: 'Alert not found' });
      }
      
      res.json(alert);
    } catch (error) {
      console.error('Error updating alert:', error);
      res.status(500).json({ message: 'Error updating alert' });
    }
  });

  app.delete('/api/alerts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAlert(id);
      res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
      console.error('Error deleting alert:', error);
      res.status(500).json({ message: 'Error deleting alert' });
    }
  });

  // Dashboard stats
  app.get('/api/stats/dashboard', isAuthenticated, async (req, res) => {
    try {
      // Get doctor ID from authenticated user
      const doctorId = (req.user as any)?.id;
      
      if (!doctorId) {
        return res.json({
          totalPatients: 0,
          activeAlertsCount: 0
        });
      }
      
      // Get all available patients count (assigned + unassigned)
      const patientCount = await storage.getPatientProfilesCountByDoctorId(doctorId);
      
      // Get active alerts for doctor's patients
      const activeAlerts = await storage.getActiveAlertsByDoctorId(doctorId);
      
      res.json({
        totalPatients: patientCount,
        activeAlertsCount: activeAlerts.length
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
  });
  
  // API endpoint for patients listing and count
  app.get('/api/patients', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get all patient users first
      const patientUsers = await storage.getUsersByRole('patient');
      
      // Get patient profiles, including those not yet assigned
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      // Get profiles that either belong to this doctor or have no doctor assigned
      const patientProfiles = await storage.getPatientProfilesForDoctor(user.id, limit, offset);
      
      // Combine user and profile information
      const patientsWithUserInfo = [];
      for (const profile of patientProfiles) {
        const user = patientUsers.find(u => u.id === profile.userId);
        if (user) {
          patientsWithUserInfo.push({
            ...profile,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          });
        }
      }
      
      res.json(patientsWithUserInfo);
    } catch (error) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ message: 'Error fetching patients' });
    }
  });
  
  app.get('/api/patients/count', isAuthenticated, async (req, res) => {
    try {
      const doctorId = (req.user as any)?.id;
      if (!doctorId) {
        return res.json(0);
      }
      
      const count = await storage.getPatientProfilesCountByDoctorId(doctorId);
      res.json(count);
    } catch (error) {
      console.error('Error fetching patients count:', error);
      res.status(500).json({ message: 'Error fetching patients count' });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  // Store connected clients
  const clients = new Map<number, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    // Handle connection
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'register' && data.userId) {
          // Register this connection for a specific user
          clients.set(data.userId, ws);
          console.log(`WebSocket client registered for user ${data.userId}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove client when connection closes
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`WebSocket client for user ${userId} disconnected`);
          break;
        }
      }
    });
  });
  
  // Add a function to the global scope to notify clients about updates
  (global as any).notifyProfileUpdate = (userId: number, patientProfileId: number) => {
    const ws = clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'profile_update',
        patientProfileId
      }));
      console.log(`Notified user ${userId} about profile update for ${patientProfileId}`);
    }
  };
  
  return server;
}