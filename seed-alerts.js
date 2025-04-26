// Seed script to create sample active alerts
import { db, pool } from './server/db.js';
import { alerts, patientProfiles } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function createSampleAlerts() {
  try {
    // Get all patient profiles
    const profiles = await db.select().from(patientProfiles);
    
    if (profiles.length === 0) {
      console.log('No patient profiles found.');
      return;
    }
    
    console.log(`Found ${profiles.length} patient profiles.`);
    
    // First, let's delete existing active alerts
    await db.delete(alerts).where(eq(alerts.status, 'active'));
    console.log('Deleted existing active alerts.');
    
    // Create sample alerts for each patient profile
    const sampleParameters = [
      { name: 'temperature', minValue: 36, maxValue: 37.5 },
      { name: 'pulse', minValue: 60, maxValue: 100 },
      { name: 'spo2', minValue: 94, maxValue: 100 },
      { name: 'ecg', minValue: 60, maxValue: 90 }
    ];
    
    const sampleNames = [
      "Popescu Maria",
      "Ionescu Dan",
      "Dumitrescu Ana",
      "Popa Adrian",
      "Georgescu Elena"
    ];
    
    const alertPromises = [];
    
    // Create 5 sample alerts with specific dates
    const dates = [
      "2025-04-12T10:30:00.000Z",  // 12.04.2025
      "2025-04-15T14:45:00.000Z",  // 15.04.2025
      "2025-04-18T09:15:00.000Z",  // 18.04.2025
      "2025-04-20T16:20:00.000Z",  // 20.04.2025
      "2025-04-23T11:10:00.000Z",  // 23.04.2025
    ];
    
    for (let i = 0; i < Math.min(5, profiles.length); i++) {
      const profile = profiles[i];
      const parameter = sampleParameters[i % sampleParameters.length];
      const isHigh = Math.random() > 0.5;
      
      // Generate a value that's outside the normal range
      const value = isHigh 
        ? parameter.maxValue + Math.round((Math.random() * 10) * 10) / 10 
        : parameter.minValue - Math.round((Math.random() * 5) * 10) / 10;
      
      const limitValue = isHigh ? parameter.maxValue : parameter.minValue;
      
      const alert = {
        patientProfileId: profile.id,
        parameterName: parameter.name,
        value: value,
        limitValue: limitValue,
        limitType: isHigh ? 'max' : 'min',
        status: 'active',
        timestamp: dates[i]
      };
      
      alertPromises.push(db.insert(alerts).values(alert));
      console.log(`Created alert for ${parameter.name} with value ${value}`);
    }
    
    await Promise.all(alertPromises);
    console.log('Successfully created sample alerts.');
    
  } catch (error) {
    console.error('Error creating sample alerts:', error);
  } finally {
    await pool.end();
  }
}

// Run the function
createSampleAlerts();