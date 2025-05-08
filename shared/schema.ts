import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role_type", ["doctor", "patient"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("doctor"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const patientProfiles = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  doctorId: integer("doctor_id").references(() => users.id),
  age: integer("age"),
  cnp: text("cnp").unique(),
  address: text("address"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  profession: text("profession"),
  workplace: text("workplace"),
  medicalHistory: text("medical_history"),
  allergies: text("allergies"),
  consultations: text("consultations"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPatientProfileSchema = createInsertSchema(patientProfiles).pick({
  userId: true,
  doctorId: true,
  age: true,
  cnp: true,
  address: true,
  phoneNumber: true,
  email: true,
  profession: true,
  workplace: true,
  medicalHistory: true,
  allergies: true,
  consultations: true,
  isActive: true,
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  patientProfileId: integer("patient_profile_id").references(() => patientProfiles.id),
  type: text("type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRecommendationSchema = createInsertSchema(recommendations).pick({
  patientProfileId: true,
  type: true,
  description: true,
});

export const parameters = pgTable("parameters", {
  id: serial("id").primaryKey(),
  patientProfileId: integer("patient_profile_id").references(() => patientProfiles.id),
  ecg: real("ecg"),
  spo2: real("spo2"),
  temperature: real("temperature"),
  pulse: real("pulse"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertParameterSchema = createInsertSchema(parameters).pick({
  patientProfileId: true,
  ecg: true,
  spo2: true,
  temperature: true,
  pulse: true,
});

export const parameterLimits = pgTable("parameter_limits", {
  id: serial("id").primaryKey(),
  patientProfileId: integer("patient_profile_id").references(() => patientProfiles.id),
  parameterName: text("parameter_name").notNull(),
  minValue: real("min_value"),
  maxValue: real("max_value"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertParameterLimitSchema = createInsertSchema(parameterLimits).pick({
  patientProfileId: true,
  parameterName: true,
  minValue: true,
  maxValue: true,
});

export const alertStatusEnum = pgEnum("alert_status", ["active", "acknowledged"]);

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  patientProfileId: integer("patient_profile_id").references(() => patientProfiles.id),
  parameterName: text("parameter_name").notNull(),
  value: real("value"),
  limitValue: real("limit_value"),
  limitType: text("limit_type"),
  status: alertStatusEnum("status").notNull().default("active"),
  patientNote: text("patient_note"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  patientProfileId: true,
  parameterName: true,
  value: true,
  limitValue: true,
  limitType: true,
  status: true,
  patientNote: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;
export type PatientProfile = typeof patientProfiles.$inferSelect;

export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Recommendation = typeof recommendations.$inferSelect;

export type InsertParameter = z.infer<typeof insertParameterSchema>;
export type Parameter = typeof parameters.$inferSelect;

export type InsertParameterLimit = z.infer<typeof insertParameterLimitSchema>;
export type ParameterLimit = typeof parameterLimits.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
