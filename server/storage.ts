import { 
  users, type User, type InsertUser,
  patientProfiles, type PatientProfile, type InsertPatientProfile,
  parameters, type Parameter, type InsertParameter,
  parameterLimits, type ParameterLimit, type InsertParameterLimit,
  recommendations, type Recommendation, type InsertRecommendation,
  alerts, type Alert, type InsertAlert
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, or, isNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;

  // PatientProfile operations
  getPatientProfile(id: number): Promise<PatientProfile | undefined>;
  getPatientProfileByUserId(userId: number): Promise<PatientProfile | undefined>;
  getPatientProfiles(limit?: number, offset?: number): Promise<PatientProfile[]>;
  getPatientProfilesForDoctor(doctorId: number, limit?: number, offset?: number): Promise<any[]>;
  createPatientProfile(patientProfile: InsertPatientProfile): Promise<PatientProfile>;
  updatePatientProfile(id: number, patientProfile: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined>;
  getPatientProfilesCount(): Promise<number>;
  getPatientProfilesCountByDoctorId(doctorId: number): Promise<number>;
  getPatientsWithAllergiesCountByDoctorId(doctorId: number): Promise<number>;
  getPatientsUnderMedicationCountByDoctorId(doctorId: number): Promise<number>;

  // Parameter operations
  getParametersByPatientProfileId(patientProfileId: number): Promise<Parameter[]>;
  createParameter(parameter: InsertParameter): Promise<Parameter>;

  // ParameterLimit operations
  getParameterLimitsByPatientProfileId(patientProfileId: number): Promise<ParameterLimit[]>;
  createParameterLimit(parameterLimit: InsertParameterLimit): Promise<ParameterLimit>;
  updateParameterLimit(id: number, parameterLimit: Partial<InsertParameterLimit>): Promise<ParameterLimit | undefined>;
  deleteParameterLimit(id: number): Promise<void>;

  // Recommendation operations
  getRecommendationsByPatientProfileId(patientProfileId: number): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendation(id: number, recommendation: Partial<InsertRecommendation>): Promise<Recommendation | undefined>;

  // Alert operations
  getAlertsByPatientProfileId(patientProfileId: number): Promise<Alert[]>;
  getActiveAlertsByDoctorId(doctorId: number): Promise<Alert[]>;
  getActiveAlertsWithPatientInfoByDoctorId(doctorId: number): Promise<any[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<InsertAlert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, role as "doctor" | "patient"));
  }

  // PatientProfile operations
  async getPatientProfile(id: number): Promise<PatientProfile | undefined> {
    const [patientProfile] = await db.select().from(patientProfiles).where(eq(patientProfiles.id, id));
    return patientProfile;
  }

  async getPatientProfileByUserId(userId: number): Promise<PatientProfile | undefined> {
    const [patientProfile] = await db.select().from(patientProfiles).where(eq(patientProfiles.userId, userId));
    return patientProfile;
  }

  async getPatientProfiles(limit: number = 10, offset: number = 0): Promise<PatientProfile[]> {
    return await db
      .select()
      .from(patientProfiles)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(patientProfiles.createdAt));
  }

  async getPatientProfilesForDoctor(doctorId: number, limit: number = 10, offset: number = 0): Promise<any[]> {
    // Get patient profiles assigned to this doctor
    const profiles = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.doctorId, doctorId))
      .limit(limit)
      .offset(offset);

    // Get user data for each patient
    const enhancedProfiles = [];
    for (const profile of profiles) {
      if (profile.userId) {
        const user = await this.getUser(profile.userId);
        if (user) {
          enhancedProfiles.push({
            ...profile,
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role
            }
          });
          continue;
        }
      }
      enhancedProfiles.push(profile);
    }

    return enhancedProfiles;
  }

  async createPatientProfile(insertPatientProfile: InsertPatientProfile): Promise<PatientProfile> {
    const [patientProfile] = await db
      .insert(patientProfiles)
      .values(insertPatientProfile)
      .returning();
    return patientProfile;
  }

  async updatePatientProfile(id: number, patientProfileData: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined> {
    const [patientProfile] = await db
      .update(patientProfiles)
      .set({
        ...patientProfileData,
        updatedAt: new Date()
      })
      .where(eq(patientProfiles.id, id))
      .returning();
    return patientProfile;
  }

  async deletePatientProfile(patientProfileId: number): Promise<void> {
    try {
      // Delete in the correct order to resolve foreign key constraints
      // Delete parameter limits first as it references the patient profile
      await db.delete(parameterLimits).where(eq(parameterLimits.patientProfileId, patientProfileId));
      
      // Delete remaining related data
      await db.delete(parameters).where(eq(parameters.patientProfileId, patientProfileId));
      await db.delete(recommendations).where(eq(recommendations.patientProfileId, patientProfileId));
      await db.delete(alerts).where(eq(alerts.patientProfileId, patientProfileId));
      
      // Finally delete the patient profile itself
      await db.delete(patientProfiles).where(eq(patientProfiles.id, patientProfileId));
      
      console.log(`Successfully deleted patient profile with ID: ${patientProfileId}`);
    } catch (error) {
      console.error(`Error deleting patient profile: ${error}`);
      throw error;
    }
  }

  async getPatientProfilesCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(patientProfiles);
    return result.count;
  }

  async getPatientProfilesCountByDoctorId(doctorId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(patientProfiles)
      .where(
        or(
          eq(patientProfiles.doctorId, doctorId),
          isNull(patientProfiles.doctorId)
        )
      );
    return result.count;
  }
  
  async getPatientsWithAllergiesCountByDoctorId(doctorId: number): Promise<number> {
    const profiles = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.doctorId, doctorId));
    
    // Filter profiles that have non-empty allergies field that's not "none" or "None"
    const profilesWithAllergies = profiles.filter(profile => {
      const allergies = profile.allergies?.trim().toLowerCase();
      return allergies && allergies !== "" && allergies !== "none" && allergies !== "n/a";
    });
    
    return profilesWithAllergies.length;
  }
  
  async getPatientsUnderMedicationCountByDoctorId(doctorId: number): Promise<number> {
    // First get all patient profiles for this doctor
    const profiles = await db
      .select()
      .from(patientProfiles)
      .where(eq(patientProfiles.doctorId, doctorId));
    
    // Get count of patients with medication recommendations
    let count = 0;
    for (const profile of profiles) {
      // Get recommendations for this patient
      const patientRecommendations = await db
        .select()
        .from(recommendations)
        .where(eq(recommendations.patientProfileId, profile.id));
      
      // Check if any recommendation is a medication recommendation with content
      const hasMedication = patientRecommendations.some(rec => {
        const type = rec.type?.trim().toLowerCase();
        const description = rec.description?.trim().toLowerCase();
        
        // Check if it's a medication type recommendation and has non-empty description
        return (type === 'medication' || type === 'drug' || type === 'medicine') && 
               description && 
               description !== '' && 
               description !== 'none' && 
               description !== 'n/a';
      });
      
      if (hasMedication) {
        count++;
      }
    }
    
    return count;
  }

  // Parameter operations
  async getParametersByPatientProfileId(patientProfileId: number): Promise<Parameter[]> {
    return await db
      .select()
      .from(parameters)
      .where(eq(parameters.patientProfileId, patientProfileId))
      .orderBy(desc(parameters.timestamp));
  }

  async createParameter(insertParameter: InsertParameter): Promise<Parameter> {
    const [parameter] = await db
      .insert(parameters)
      .values(insertParameter)
      .returning();
    return parameter;
  }

  // ParameterLimit operations
  async getParameterLimitsByPatientProfileId(patientProfileId: number): Promise<ParameterLimit[]> {
    return await db
      .select()
      .from(parameterLimits)
      .where(eq(parameterLimits.patientProfileId, patientProfileId));
  }

  async createParameterLimit(insertParameterLimit: InsertParameterLimit): Promise<ParameterLimit> {
    const [parameterLimit] = await db
      .insert(parameterLimits)
      .values(insertParameterLimit)
      .returning();
    return parameterLimit;
  }

  async updateParameterLimit(id: number, parameterLimitData: Partial<InsertParameterLimit>): Promise<ParameterLimit | undefined> {
    const [parameterLimit] = await db
      .update(parameterLimits)
      .set({
        ...parameterLimitData,
        updatedAt: new Date()
      })
      .where(eq(parameterLimits.id, id))
      .returning();
    return parameterLimit;
  }
  
  async deleteParameterLimit(id: number): Promise<void> {
    await db
      .delete(parameterLimits)
      .where(eq(parameterLimits.id, id));
  }

  // Recommendation operations
  async getRecommendationsByPatientProfileId(patientProfileId: number): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.patientProfileId, patientProfileId))
      .orderBy(desc(recommendations.createdAt));
  }

  async createRecommendation(insertRecommendation: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db
      .insert(recommendations)
      .values(insertRecommendation)
      .returning();
    return recommendation;
  }

  async updateRecommendation(id: number, recommendationData: Partial<InsertRecommendation>): Promise<Recommendation | undefined> {
    const [recommendation] = await db
      .update(recommendations)
      .set({
        ...recommendationData,
        updatedAt: new Date()
      })
      .where(eq(recommendations.id, id))
      .returning();
    return recommendation;
  }

  // Alert operations
  async getAlertsByPatientProfileId(patientProfileId: number): Promise<Alert[]> {
    return await db
      .select()
      .from(alerts)
      .where(eq(alerts.patientProfileId, patientProfileId))
      .orderBy(desc(alerts.timestamp));
  }

  async getActiveAlertsByDoctorId(doctorId: number): Promise<Alert[]> {
    return await db
      .select({
        alert: alerts,
        patientProfile: patientProfiles
      })
      .from(alerts)
      .innerJoin(patientProfiles, eq(alerts.patientProfileId, patientProfiles.id))
      .where(
        and(
          eq(patientProfiles.doctorId, doctorId),
          eq(alerts.status, "active")
        )
      )
      .orderBy(desc(alerts.timestamp))
      .then(rows => rows.map(row => row.alert));
  }
  
  async getActiveAlertsWithPatientInfoByDoctorId(doctorId: number): Promise<any[]> {
    // First get active alerts with patient profiles
    const results = await db
      .select({
        alert: alerts,
        patientProfile: patientProfiles
      })
      .from(alerts)
      .innerJoin(patientProfiles, eq(alerts.patientProfileId, patientProfiles.id))
      .where(
        and(
          eq(patientProfiles.doctorId, doctorId),
          eq(alerts.status, "active")
        )
      )
      .orderBy(desc(alerts.timestamp));
    
    // For each result, get the user information for the patient
    const alertsWithPatientInfo = [];
    for (const result of results) {
      const { alert, patientProfile } = result;
      
      if (patientProfile.userId) {
        // Get user data for this patient
        const user = await this.getUser(patientProfile.userId);
        
        if (user) {
          alertsWithPatientInfo.push({
            ...alert,
            patientName: `${user.firstName} ${user.lastName}`
          });
          continue;
        }
      }
      
      // If no user found, just add the alert as is
      alertsWithPatientInfo.push(alert);
    }
    
    return alertsWithPatientInfo;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db
      .insert(alerts)
      .values(insertAlert)
      .returning();
    return alert;
  }

  async updateAlert(id: number, alertData: Partial<InsertAlert>): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set(alertData)
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }
  
  async deleteAlert(id: number): Promise<void> {
    await db
      .delete(alerts)
      .where(eq(alerts.id, id));
  }
}

export const storage = new DatabaseStorage();