const puppeteer = require("puppeteer-core");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });

  try {
    const page = await browser.newPage();

    // Navigate to Letterboxd profile page
    const profileUrl = `https://letterboxd.com/${process.env.LETTERBOXD_USERNAME}/`;
    await page.goto(profileUrl);

    // Retrieve list of followers
    const followersLink = await page.waitForSelector("a[href='/layodi/followers/']", { visible: true });
    await followersLink.click();
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    let followers = [];
    while (true) {
      const newFollowers = await page.evaluate(() => {
        const followersList = Array.from(document.querySelectorAll(".table-person .name"));
        return followersList.map((item) => item.getAttribute("href").split("/")[1]);
      });

      followers = followers.concat(newFollowers);

      const nextButton = await page.$("a.next");
      if (!nextButton) break;

      await nextButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    }

    // Retrieve list of following users
    const followingLink = await page.waitForSelector("a[href='/layodi/following/']", { visible: true });
    await followingLink.click();
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    let following = [];
    while (true) {
      const newFollowing = await page.evaluate(() => {
        const followingList = Array.from(document.querySelectorAll(".table-person .name"));
        return followingList.map((item) => item.getAttribute("href").split("/")[1]);
      });

      following = following.concat(newFollowing);

      const nextButton = await page.$("a.next");
      if (!nextButton) break;

      await nextButton.click();
      await page.waitForNavigation({ waitUntil: "networkidle0" });
    }

    // Retrieve list of ignored users from environment variable
    const ignoredUsers = process.env.IGNORED_USERS.split(",");

    // Find users who don't appear in either list or the ignored list
    const followersSet = new Set(followers);
    const followingSet = new Set(following);
    const nonFollowersSet = new Set([...followingSet].filter((x) => !followersSet.has(x)).filter((user) => !ignoredUsers.includes(user)));
    const nonFollowers = [...nonFollowersSet];

    // Print out the results
    console.log(`Number of followers: ${followers.length}`);
    console.log(`Number of following: ${following.length}`);
    console.log(`Number of ignored users: ${ignoredUsers.length}`);
    console.log(`Number of non-followers: ${nonFollowers.length}`);
    console.log(`Non-followers: ${nonFollowers}`);
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
