const mongoose = require("mongoose");
const User = require("../models/User");
const { sendBirthdayNotification } = require("../services/notificationService");
const { getISTDate } = require("../utils/birthdayCampaign");

async function runBirthdayNotificationJob() {
  console.log("=== STARTING BIRTHDAY NOTIFICATION JOB ===");
  try {
    const istToday = getISTDate();
    const todayDay = istToday.getDate();
    const todayMonth = istToday.getMonth(); // 0-indexed

    // Fetch all users with dateOfBirth populated
    const usersWithDob = await User.find({ dateOfBirth: { $ne: null } });
    console.log(`Found ${usersWithDob.length} users with Date of Birth configured.`);

    let sentCount = 0;
    for (const user of usersWithDob) {
      const dobDate = new Date(user.dateOfBirth);
      if (!isNaN(dobDate.getTime())) {
        if (dobDate.getUTCDate() === todayDay && dobDate.getUTCMonth() === todayMonth) {
          console.log(`User ${user.name} (${user.phone}) has birthday today! Dispatching notification...`);
          await sendBirthdayNotification(user);
          sentCount++;
        }
      }
    }
    console.log(`Birthday notification job completed. Dispatched to ${sentCount} user(s).`);
  } catch (error) {
    console.error("Error in runBirthdayNotificationJob:", error);
  }
}

module.exports = runBirthdayNotificationJob;

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      await runBirthdayNotificationJob();
      process.exit();
    })
    .catch(err => {
      console.error("Job database connection error:", err);
      process.exit(1);
    });
}
