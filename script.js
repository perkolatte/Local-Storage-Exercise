document.addEventListener("DOMContentLoaded", function () {
  const noteContainer = document.getElementById("note-container");
  const newNoteButton = document.getElementById("new-note-button");
  const colorForm = document.getElementById("color-form");
  const colorInput = document.getElementById("color-input");

  let noteColor = localStorage.getItem("notes-color") || "#ffc"; // Provide a default color

  // TODO: Load the note ID counter from the local storage.
  let noteIdCounter =
    parseInt(localStorage.getItem("notes-id-counter"), 10) || 0; // Counter for assigning unique IDs to new notes.
  // TODO: Load the notes from the local storage.
  const notesFromStorage =
    JSON.parse(localStorage.getItem("notes-content")) || [];
  let notes = notesFromStorage.map((note) => ({
    ...note,
    width: note.width || 120,
    height: note.height || 120,
  }));

  /**
   * Throws an error if a condition is not met. Used for internal consistency checks.
   * @param {boolean} condition The condition to check.
   * @param {string} message The error message if the condition is false.
   */
  function assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
  }

  /**
   * Creates a debounced function that delays invoking `func` until after `wait`
   * milliseconds have elapsed since the last time the debounced function was invoked.
   * @param {Function} func The function to debounce.
   * @param {number} wait The number of milliseconds to delay.
   * @returns {Function} Returns the new debounced function.
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  /**
   * Saves the notes array to localStorage.
   */
  function saveNotes() {
    localStorage.setItem("notes-content", JSON.stringify(notes));
  }

  /**
   * Saves the note ID counter to localStorage.
   */
  function saveCounter() {
    localStorage.setItem("notes-id-counter", noteIdCounter.toString());
  }

  /**
   * Saves the note color to localStorage.
   */
  function saveColor() {
    localStorage.setItem("notes-color", noteColor);
  }

  /**
   * Creates a note element and appends it to the container.
   * @param {object} noteData - The note object { id, content }.
   */
  function createNoteElement(noteData) {
    assert(
      noteData && typeof noteData === "object",
      "noteData must be an object."
    );
    assert(typeof noteData.id === "number", "noteData.id must be a number.");
    assert(
      typeof noteData.content === "string",
      "noteData.content must be a string."
    );
    assert(
      typeof noteData.width === "number",
      "noteData.width must be a number."
    );
    assert(
      typeof noteData.height === "number",
      "noteData.height must be a number."
    );

    const noteElement = document.createElement("textarea");
    noteElement.setAttribute("data-note-id", noteData.id.toString());
    noteElement.value = noteData.content;
    noteElement.className = "note";
    noteElement.style.backgroundColor = noteColor;
    noteElement.style.width = `${noteData.width}px`;
    noteElement.style.height = `${noteData.height}px`;
    noteContainer.appendChild(noteElement);
  }

  /**
   * Renders all notes from the notesContent array to the DOM.
   */
  function renderNotes() {
    noteContainer.innerHTML = ""; // Clear container to prevent duplicates in test env
    notes.forEach(createNoteElement);
  }

  function addNewNote() {
    const id = noteIdCounter;
    const content = `Note ${id}`;
    const newNote = { id, content, width: 120, height: 120 };

    noteIdCounter++; // Increments the counter since the ID is used for this note.
    saveCounter();

    notes.push(newNote);
    saveNotes();
    renderNotes();
  }

  colorForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevents the default event.

    const newColor = colorInput.value.trim(); // Removes whitespaces.
    if (!newColor) return;

    noteColor = newColor; // Updates the stored note color with the new selection.
    saveColor();

    renderNotes(); // Re-render notes to apply the new color

    colorInput.value = ""; // Clears the color input field after form submission.
  });

  newNoteButton.addEventListener("click", function () {
    addNewNote();
  });

  /**
   * Finds a note in the state array, updates its content if changed, and saves.
   * @param {HTMLTextAreaElement} noteElement The textarea element to save.
   */
  function updateAndSaveNote(noteElement) {
    const noteIdToUpdate = parseInt(noteElement.dataset.noteId, 10);
    const noteToUpdate = notes.find((note) => note.id === noteIdToUpdate);

    // Design by Contract: Precondition check.
    // The provided noteElement MUST correspond to a note in our state.
    if (!noteToUpdate) {
      console.error(
        "State inconsistency: Attempted to update a note that does not exist in the state.",
        { noteId: noteIdToUpdate }
      );
      throw new Error(
        "Cannot update a note that is not tracked in the application state."
      );
    }

    const updatedContent = noteElement.value;
    const updatedWidth = noteElement.offsetWidth;
    const updatedHeight = noteElement.offsetHeight;

    const hasChanged =
      noteToUpdate.content !== updatedContent ||
      noteToUpdate.width !== updatedWidth ||
      noteToUpdate.height !== updatedHeight;

    if (hasChanged) {
      noteToUpdate.content = updatedContent;
      noteToUpdate.width = updatedWidth;
      noteToUpdate.height = updatedHeight;
      saveNotes();
    }
  }

  const debouncedSave = debounce(updateAndSaveNote, 300);

  noteContainer.addEventListener("dblclick", function (event) {
    if (event.target.classList.contains("note")) {
      const noteIdToRemove = parseInt(event.target.dataset.noteId, 10);
      notes = notes.filter((note) => note.id !== noteIdToRemove);
      saveNotes();
      renderNotes();
    }
  });

  noteContainer.addEventListener("focusout", function (event) {
    if (event.target.classList.contains("note")) {
      updateAndSaveNote(event.target);
    }
  });

  noteContainer.addEventListener("mouseup", function (event) {
    if (event.target.classList.contains("note")) {
      updateAndSaveNote(event.target);
    }
  });

  noteContainer.addEventListener("keydown", function (event) {
    if (
      event.target.classList.contains("note") &&
      event.key === "Enter" &&
      !event.altKey
    ) {
      event.preventDefault(); // Prevent adding a new line.
      updateAndSaveNote(event.target);
      event.target.blur(); // Unfocus the element for a better user experience.
    }
  });

  noteContainer.addEventListener("input", function (event) {
    if (event.target.classList.contains("note")) {
      debouncedSave(event.target);
    }
  });

  window.addEventListener("keydown", function (event) {
    /* Ignores key presses made for color and note content inputs. */
    const activeElement = document.activeElement;
    if (
      activeElement.id === "color-input" ||
      activeElement.tagName === "TEXTAREA"
    ) {
      return;
    }

    /* Adds a new note when the "n" key is pressed. */
    if (event.key === "n" || event.key === "N") {
      addNewNote(); // Adds a new note.
    }
  });

  // Initial render of notes from local storage.
  renderNotes();
});
