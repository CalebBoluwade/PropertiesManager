import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/db/schema';

const sqlite = new Database('sqlite.db');
sqlite.pragma('journal_mode = WAL');

const db = drizzle(sqlite, { schema });

async function seedData() {
  console.log("Seeding data...");

  try {
    // 1. Insert Property Types
    const residential = db.insert(schema.propertyTypes).values({
      id: crypto.randomUUID(),
      name: "Residential",
      description: "Houses, apartments and residential estates",
    }).run();

    const land = db.insert(schema.propertyTypes).values({
      id: crypto.randomUUID(),
      name: "Land",
      description: "Land and undeveloped property",
    }).run();

    db.insert(schema.propertyTypes).values({
      id: crypto.randomUUID(),
      name: "Commercial",
      description: "Offices, shops and commercial buildings",
    }).run();

    // 2. Get property types to get IDs
    const types = db.select().from(schema.propertyTypes).all();
    const residentialType = types.find(t => t.name === "Residential");
    const landType = types.find(t => t.name === "Land");

    // 3. Insert Property Type Fields for Land
    if (landType) {
      db.insert(schema.propertyTypeFields).values({
        id: crypto.randomUUID(),
        propertyTypeId: landType.id,
        name: "Plot Size",
        key: "plotSize",
        fieldType: "number",
        required: false,
      }).run();

      db.insert(schema.propertyTypeFields).values({
        id: crypto.randomUUID(),
        propertyTypeId: landType.id,
        name: "Title Document",
        key: "titleDocument",
        fieldType: "text",
        required: false,
      }).run();
    }

    // 4. Create Property
    if (residentialType) {
      const propertyId = crypto.randomUUID();
      db.insert(schema.properties).values({
        id: propertyId,
        name: "Lekki Residential Estate",
        address: "Lekki Phase 1",
        city: "Lagos",
        state: "Lagos",
        propertyTypeId: residentialType.id,
        numberOfUnits: 12,
        purchasePrice: 250000000,
        currentValue: 300000000,
        currency: "NGN",
        status: "PARTIALLY_OCCUPIED",
      }).run();

      // 5. Create Units for the Property
      db.insert(schema.units).values([
        {
          id: crypto.randomUUID(),
          propertyId: propertyId,
          unitNumber: "A01",
          unitType: "2 Bedroom",
          monthlyRent: 2500000,
          status: "OCCUPIED",
        },
        {
          id: crypto.randomUUID(),
          propertyId: propertyId,
          unitNumber: "A02",
          unitType: "2 Bedroom",
          monthlyRent: 2500000,
          status: "VACANT",
        }
      ]).run();
    }

    console.log("Seed complete 🌱");
  } catch (err) {
    console.error("Seed failed!", err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

seedData();
