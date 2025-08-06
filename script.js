document.addEventListener("DOMContentLoaded", function () {
  const noteContainer = document.getElementById("note-container");
  const newNoteButton = document.getElementById("new-note-button");
  const colorForm = document.getElementById("color-form");
  const colorInput = document.getElementById("color-input");

  // TODO: Load the note color from the local storage.
  let noteColor = localStorage.getItem("notes-color") || "#ffc"; // Provide a default color
  // TODO: Load the note ID counter from the local storage.
  let noteIdCounter =
    parseInt(localStorage.getItem("notes-id-counter"), 10) || 0; // Counter for assigning unique IDs to new notes.
  // TODO: Load the notes from the local storage.
  let notesContent = JSON.parse(localStorage.getItem("notes-content")) || [];

  /**
   * Saves the notes array to localStorage.
   */
  function saveNotes() {
    localStorage.setItem("notes-content", JSON.stringify(notesContent));
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
    const noteElement = document.createElement("textarea");
    noteElement.setAttribute("data-note-id", noteData.id.toString());
    noteElement.value = noteData.content;
    noteElement.className = "note";
    noteElement.style.backgroundColor = noteColor;
    noteContainer.appendChild(noteElement);
  }

  /**
   * Renders all notes from the notesContent array to the DOM.
   */
  function renderInitialNotes() {
    noteContainer.innerHTML = ""; // Clear container to prevent duplicates in test env
    notesContent.forEach(createNoteElement);
  }

  function addNewNote() {
    const id = noteIdCounter;
    const content = `Note ${id}`;
    const newNote = { id, content };

    createNoteElement(newNote);

    noteIdCounter++; // Increments the counter since the ID is used for this note.
    saveCounter();

    notesContent.push(newNote);
    saveNotes();
  }

  colorForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevents the default event.

    const newColor = colorInput.value.trim(); // Removes whitespaces.
    if (!newColor) return;

    noteColor = newColor; // Updates the stored note color with the new selection.
    saveColor();

    renderInitialNotes(); // Re-render notes to apply the new color

    colorInput.value = ""; // Clears the color input field after form submission.
  });

  newNoteButton.addEventListener("click", function () {
    addNewNote();
  });

  document.addEventListener("dblclick", function (event) {
    if (event.target.classList.contains("note")) {
      event.target.remove(); // Removes the clicked note.

      const noteIdToRemove = parseInt(event.target.dataset.noteId, 10);
      notesContent = notesContent.filter((note) => note.id !== noteIdToRemove);
      saveNotes();
    }
  });

  /**
   * Finds a note in the state array, updates its content if changed, and saves.
   * @param {HTMLTextAreaElement} noteElement The textarea element to save.
   */
  function updateAndSaveNote(noteElement) {
    const noteIdToUpdate = parseInt(noteElement.dataset.noteId, 10);
    const updatedNoteContent = noteElement.value;
    const noteToUpdate = notesContent.find(
      (note) => note.id === noteIdToUpdate
    );

    if (noteToUpdate && noteToUpdate.content !== updatedNoteContent) {
      noteToUpdate.content = updatedNoteContent;
      saveNotes();
    }
  }

  noteContainer.addEventListener("focusout", function (event) {
    if (event.target.classList.contains("note")) {
      updateAndSaveNote(event.target);
    }
  });

  noteContainer.addEventListener("mouseout", function (event) {
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

  window.addEventListener("keydown", function (event) {
    /* Ignores key presses made for color and note content inputs. */
    if (
      event.target.id === "color-input" ||
      event.target.tagName === "TEXTAREA"
    ) {
      return;
    }

    /* Adds a new note when the "n" key is pressed. */
    if (event.key === "n" || event.key === "N") {
      addNewNote(); // Adds a new note.
    }
  });

  // Initial render of notes from local storage.
  renderInitialNotes();
});
