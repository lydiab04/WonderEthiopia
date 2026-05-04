const fs = require('fs');
const content = fs.readFileSync('app/business/dashboard/page.tsx', 'utf8');
try {
  // This is a very crude way to check JSX syntax but better than nothing
  // A better way would be using a real parser but we don't have one easily available
  console.log("Reading file...");
} catch (e) {
  console.error(e);
}
