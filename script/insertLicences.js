const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://mationprogram54:1xTPUIggcdTGUmHN@factureapp.tdsmwtk.mongodb.net/factureDB?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const licences = [
  { code: "FVH5-49O6-XS3F-2KDJ", expiresAt: new Date("2025-07-02") },
  { code: "CFPA-GAIY-KD1J-52VS", expiresAt: new Date("2025-07-02") },
  { code: "QLOJ-ZGJK-DC9E-Q29N", expiresAt: new Date("2025-07-02") },
  { code: "NZT5-MPU9-2WG1-CQH2", expiresAt: new Date("2025-07-02") },
  { code: "T36N-AN4Z-9SDC-2YSX", expiresAt: new Date("2025-07-02") },
  { code: "U4BU-NKMG-P70K-WFN8", expiresAt: new Date("2025-07-02") },
  { code: "Q3P7-GB8L-J2LO-VOEQ", expiresAt: new Date("2025-07-02") },
  { code: "97KR-0Z3K-5VZZ-19MH", expiresAt: new Date("2025-07-02") },
  { code: "TBYL-FKXV-2FOO-ODRB", expiresAt: new Date("2025-07-02") },
  { code: "WE54-1S8U-VB9P-SE12", expiresAt: new Date("2025-07-02") },
  { code: "0KSM-HHMP-L6WK-ZZHV", expiresAt: new Date("2025-07-02") },
  { code: "MJ9W-PT54-GNRC-SJ6V", expiresAt: new Date("2025-07-02") },
  { code: "M8N5-B03H-3HOS-9OQQ", expiresAt: new Date("2025-07-02") },
  { code: "HM2Z-4CEN-DV3O-V54M", expiresAt: new Date("2025-07-02") },
  { code: "S8DX-Y1HD-0UZR-7HMF", expiresAt: new Date("2025-07-02") },
  { code: "HUC4-0GQI-KVE1-RZIB", expiresAt: new Date("2025-07-02") },
  { code: "5EET-R0L4-8BU9-30HZ", expiresAt: new Date("2025-07-02") },
  { code: "V9NW-JEAN-6PRB-Z3SA", expiresAt: new Date("2025-07-02") },
  { code: "YAZR-LWHW-C6PJ-MCPP", expiresAt: new Date("2025-07-02") },
  { code: "L20L-MG5B-XHMZ-2RIT", expiresAt: new Date("2025-07-02") },
];

async function run() {
  try {
    await client.connect();
    const db = client.db("factureDB");
    const collection = db.collection("licences");
    const result = await collection.insertMany(licences);
    console.log(`${result.insertedCount} licences insérées !`);
  } catch (e) {
    console.error("Erreur :", e);
  } finally {
    await client.close();
  }
}

run();
