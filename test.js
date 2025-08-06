let testsHaveRun = false;
document.addEventListener("DOMContentLoaded", async function () {
  if (testsHaveRun) return; // Prevent recursive execution
  testsHaveRun = true;

  const resultsContainer = document.getElementById("test-results");
  let testsPassed = 0;
  let testsFailed = 0;

  // Global report object for the terminal runner
  window.testReport = {
    results: [],
    isComplete: false,
  };

  /**
   * A simple assertion function.
   * @param {boolean} condition - The condition to check.
   * @param {string} message - The message to display on failure.
   */
  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  /**
   * Runs a test case.
   * @param {string} name - The name of the test.
   * @param {function} testFn - The test function to execute.
   */
  async function test(name, testFn) {
    const result = document.createElement("div");
    const reportEntry = { name, passed: false, message: "" };

    try {
      // Cleanup before each test
      localStorage.clear();
      document.getElementById("note-container").innerHTML = "";
      // Re-trigger DOMContentLoaded for the main script to reload from a clean state
      document.dispatchEvent(new Event("DOMContentLoaded"));

      await testFn();
      reportEntry.passed = true;
      testsPassed++;
    } catch (error) {
      reportEntry.message = error.message;
      testsFailed++;
    } finally {
      window.testReport.results.push(reportEntry);

      if (reportEntry.passed) {
        result.textContent = `✅ PASS: ${name}`;
        result.className = "pass";
      } else {
        result.innerHTML = `❌ FAIL: ${name}<br><pre>   ${reportEntry.message}</pre>`;
        result.className = "fail";
      }
      resultsContainer.appendChild(result);
    }
  }

  // --- Test Suite ---

  await test("should create a new note on button click", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();

    const noteElement = document.querySelector(".note");
    assert(noteElement !== null, "Note element was not added to the DOM.");
    assert(
      noteElement.value === "Note 0",
      `Expected default content "Note 0", but got "${noteElement.value}".`
    );
  });

  await test("should persist a new note after page reload", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();

    // Simulate page reload
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const noteElements = document.querySelectorAll(".note");
    assert(
      noteElements.length === 1,
      `Expected 1 note after reload, but found ${noteElements.length}.`
    );
    assert(
      noteElements[0].value === "Note 0",
      `Expected note content to be "Note 0" after reload.`
    );
  });

  await test("should update a note's content and persist it", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();

    let noteElement = document.querySelector(".note");
    noteElement.value = "Updated content";
    noteElement.dispatchEvent(new Event("focusout", { bubbles: true }));

    // Simulate page reload
    document.dispatchEvent(new Event("DOMContentLoaded"));

    noteElement = document.querySelector(".note");
    assert(
      noteElement.value === "Updated content",
      `Expected updated content to persist, but got "${noteElement.value}".`
    );
  });

  await test("should delete a note on double-click and persist the deletion", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();
    newNoteButton.click();

    const firstNote = document.querySelector('.note[data-note-id="0"]');
    firstNote.dispatchEvent(new Event("dblclick", { bubbles: true }));

    assert(
      document.querySelectorAll(".note").length === 1,
      "Expected 1 note to remain in DOM after deletion."
    );

    // Simulate page reload
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const noteElements = document.querySelectorAll(".note");
    assert(
      noteElements.length === 1,
      `Expected 1 note after reload, but found ${noteElements.length}.`
    );
    assert(
      noteElements[0].value === "Note 1",
      "Expected the correct note to remain after deletion and reload."
    );
  });

  await test("should update the color for new notes and persist it", () => {
    const colorForm = document.getElementById("color-form");
    const colorInput = document.getElementById("color-input");
    const newNoteButton = document.getElementById("new-note-button");

    colorInput.value = "blue";
    colorForm.dispatchEvent(new Event("submit"));

    newNoteButton.click();
    let noteElement = document.querySelector('.note[data-note-id="0"]');
    assert(
      noteElement.style.backgroundColor === "blue",
      `Expected new note to be blue, but got ${noteElement.style.backgroundColor}.`
    );

    // Simulate page reload
    document.dispatchEvent(new Event("DOMContentLoaded"));

    newNoteButton.click(); // Create a second note after reload
    noteElement = document.querySelector('.note[data-note-id="1"]');
    assert(
      noteElement.style.backgroundColor === "blue",
      `Expected color to persist for new notes after reload, but got ${noteElement.style.backgroundColor}.`
    );
  });

  await test("Creates a new note with 'n' key shortcut", () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "n" }));

    const noteElements = document.querySelectorAll(".note");
    assert(
      noteElements.length === 1,
      "Note element was not added to the DOM via shortcut."
    );
  });

  await test("Ignores 'n' key shortcut when an input is focused", () => {
    const colorInput = document.getElementById("color-input");
    colorInput.focus();
    // The event must bubble and be dispatched on the document for the target to be correctly identified
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "n", bubbles: true })
    );

    let noteElements = document.querySelectorAll(".note");
    assert(
      noteElements.length === 0,
      `Expected 0 notes when color input is focused, but found ${noteElements.length}.`
    );

    // Test with textarea
    document.getElementById("new-note-button").click(); // Create one note
    const noteElement = document.querySelector(".note");
    noteElement.focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "n", bubbles: true })
    );

    noteElements = document.querySelectorAll(".note");
    assert(
      noteElements.length === 1,
      `Expected 1 note when textarea is focused, but found ${noteElements.length}.`
    );
  });

  // --- Final Summary ---
  const summary = document.createElement("h3");
  if (testsFailed > 0) {
    summary.textContent = `Finished: ${testsPassed} passed, ${testsFailed} failed.`;
    summary.className = "fail";
  } else {
    summary.textContent = `All ${testsPassed} tests passed!`;
    summary.className = "pass";
  }
  resultsContainer.prepend(summary);

  // Signal completion for the terminal runner
  window.testReport.isComplete = true;
});
