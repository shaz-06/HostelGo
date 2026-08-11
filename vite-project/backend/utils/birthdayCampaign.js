/**
 * Helper to get the current date/time in Asia/Kolkata (IST) timezone.
 */
function getISTDate() {
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  return new Date(dateStr);
}

/**
 * Checks if the user's birthday matches today's date (day + month) in Asia/Kolkata.
 * @param {Date|string} dob - User's date of birth
 * @returns {boolean} True if today is the user's birthday in IST
 */
function isBirthdayToday(dob) {
  if (!dob) return false;
  const dobDate = new Date(dob);
  if (isNaN(dobDate.getTime())) return false;

  const istToday = getISTDate();
  
  // Compare UTC day/month of saved DOB against local day/month of the current IST date.
  // Note: dob is saved as a date-only string/midnight UTC in Mongo.
  return (
    dobDate.getUTCDate() === istToday.getDate() &&
    dobDate.getUTCMonth() === istToday.getMonth()
  );
}

/**
 * Gets the current year in Asia/Kolkata timezone.
 * @returns {number} The current year
 */
function getISTYear() {
  return getISTDate().getFullYear();
}

module.exports = {
  getISTDate,
  isBirthdayToday,
  getISTYear
};
