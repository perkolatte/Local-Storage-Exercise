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

  const STORAGE_KEYS = {
    NOTES: "notes-app-notes",
    COLOR: "notes-app-color",
    COUNTER: "notes-app-counter",
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

  /**
   * Helper to get notes from localStorage.
   * @returns {Array}
   */
  function getStoredNotes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTES)) || [];
  }

  // --- Test Suite ---

  await test("Adds a new note and persists state", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();

    const notesInStorage = getStoredNotes();
    assert(
      notesInStorage.length === 1,
      `Expected 1 note in storage, but found ${notesInStorage.length}`
    );
    assert(
      notesInStorage[0].content === "Note 0",
      `Expected note content to be "Note 0", but got "${notesInStorage[0].content}"`
    );

    const counter = localStorage.getItem(STORAGE_KEYS.COUNTER);
    assert(counter === "1", `Expected counter to be "1", but got "${counter}"`);

    const noteElement = document.querySelector(".note");
    assert(noteElement !== null, "Note element was not added to the DOM");
  });

  await test("Updates a note's content on focusout (blur)", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();

    const noteElement = document.querySelector(".note");
    noteElement.value = "Updated content";
    noteElement.dispatchEvent(new Event("focusout", { bubbles: true }));

    const notesInStorage = getStoredNotes();
    assert(notesInStorage.length === 1, "Expected 1 note in storage");
    assert(
      notesInStorage[0].content === "Updated content",
      `Expected updated content, but got "${notesInStorage[0].content}"`
    );
  });

  await test("Deletes a note on double-click", () => {
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();
    newNoteButton.click();

    assert(
      getStoredNotes().length === 2,
      "Setup failed: Expected 2 notes in storage"
    );

    const firstNote = document.querySelector(".note");
    firstNote.dispatchEvent(new Event("dblclick", { bubbles: true }));

    const notesInStorage = getStoredNotes();
    assert(
      notesInStorage.length === 1,
      `Expected 1 note in storage after delete, but found ${notesInStorage.length}`
    );
    assert(
      notesInStorage[0].id === 1,
      `Expected note with ID 1 to remain, but found ID ${notesInStorage[0].id}`
    );
    assert(
      document.querySelectorAll(".note").length === 1,
      "Note element was not removed from the DOM"
    );
  });

  await test("Sets and persists note color", () => {
    const colorForm = document.getElementById("color-form");
    const colorInput = document.getElementById("color-input");

    colorInput.value = "blue";
    colorForm.dispatchEvent(new Event("submit"));

    const storedColor = localStorage.getItem(STORAGE_KEYS.COLOR);
    assert(
      storedColor === "blue",
      `Expected "blue" in storage, but got "${storedColor}"`
    );
  });

  await test("Loads all data from localStorage on startup", () => {
    // 1. Setup localStorage
    const mockNotes = [{ id: 0, content: "Test Note" }];
    localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(mockNotes));
    localStorage.setItem(STORAGE_KEYS.COLOR, "red");
    localStorage.setItem(STORAGE_KEYS.COUNTER, "1");

    // 2. Trigger script initialization
    document.dispatchEvent(new Event("DOMContentLoaded"));

    // 3. Assert
    const noteElement = document.querySelector(".note");
    assert(noteElement !== null, "Note was not rendered from storage");
    assert(
      noteElement.value === "Test Note",
      `Note content should be "Test Note", but was "${noteElement.value}"`
    );
    assert(
      noteElement.style.backgroundColor === "red",
      `Note color should be "red", but was "${noteElement.style.backgroundColor}"`
    );

    // Check if counter is correctly loaded for the *next* note
    const newNoteButton = document.getElementById("new-note-button");
    newNoteButton.click();
    const newNoteElement = document.querySelector('.note[data-note-id="1"]');
    assert(
      newNoteElement !== null,
      "New note was not created with the correct ID from the loaded counter"
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
