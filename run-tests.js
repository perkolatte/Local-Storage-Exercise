const puppeteer = require("puppeteer");
const path = require("path");

async function runTests() {
  console.log("Launching headless browser to run tests...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // Forward browser console logs to the terminal for better debugging
  page.on("console", (msg) => {
    const text = msg.text();
    // Ignore the test report object log to keep the output clean
    if (text.includes("testReport")) return;
    console.log(`  \x1b[90mBROWSER LOG: ${text}\x1b[0m`); // Dim color
  });

  const filePath = `file://${path.join(__dirname, "test.html")}`;
  await page.goto(filePath, { waitUntil: "networkidle0" });

  // Wait for the test script to signal that all tests are complete
  await page.waitForFunction(
    "window.testReport && window.testReport.isComplete",
    {
      timeout: 15000,
    }
  );

  const report = await page.evaluate(() => window.testReport);
  await browser.close();

  // --- Render verbose results to the terminal ---
  console.log("\n--- Notes App Test Suite ---");
  let failures = 0;
  report.results.forEach((result) => {
    if (result.passed) {
      console.log(`\x1b[32m✅ PASS:\x1b[0m ${result.name}`); // Green
    } else {
      failures++;
      console.log(`\x1b[31m❌ FAIL:\x1b[0m ${result.name}`); // Red
      console.log(
        `     \x1b[90m${result.message.replace(/\n/g, "\n     ")}\x1b[0m`
      );
    }
  });

  console.log("----------------------------");
  if (failures > 0) {
    const passedCount = report.results.length - failures;
    console.log(
      `\x1b[31mFinished: ${passedCount} passed, ${failures} failed.\x1b[0m`
    );
    process.exit(1); // Exit with a non-zero code to indicate failure
  } else {
    console.log(`\x1b[32mAll ${report.results.length} tests passed!\x1b[0m`);
  }
}

runTests().catch((error) => {
  console.error("\x1b[31mTest runner failed:\x1b[0m", error);
  process.exit(1);
});
