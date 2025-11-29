const bcrypt = require("bcryptjs");

async function hashPasswords() {
  const passwords = {
    admin: "admin123",
    merchant: "merchant123",
    rider: "rider123",
    customer: "customer123",
  };

  console.log("🔐 Password Hashes for TownKart Users:\n");

  for (const [role, password] of Object.entries(passwords)) {
    const hashed = await bcrypt.hash(password, 12);
    console.log(`${role.toUpperCase()}:`);
    console.log(`  Plain: ${password}`);
    console.log(`  Hash:  ${hashed}\n`);
  }
}

hashPasswords().catch(console.error);
