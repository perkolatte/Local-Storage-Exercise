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
  let notesJson = localStorage.getItem("notes-content");
  let notesContent = [];
  if (notesJson !== null) {
    notesContent = JSON.parse(notesJson);
  }

  /**
   * Renders all notes from the notesContent array to the DOM.
   */
  function renderInitialNotes() {
    notesContent.forEach((noteData) => {
      const note = document.createElement("textarea");
      note.setAttribute("data-note-id", noteData.id.toString());
      note.value = noteData.content;
      note.className = "note";
      note.style.backgroundColor = noteColor;
      noteContainer.appendChild(note);
    });
  }

  function addNewNote() {
    const id = noteIdCounter;
    const content = `Note ${id}`;

    const note = document.createElement("textarea");
    note.setAttribute("data-note-id", id.toString()); // Stores the note ID to its data attribute.
    note.value = content; // Sets the note ID as value.
    note.className = "note"; // Sets a CSS class.
    note.style.backgroundColor = noteColor; // Sets the note's background color using the last selected note color.
    noteContainer.appendChild(note); // Appends it to the note container element as its child.

    noteIdCounter++; // Increments the counter since the ID is used for this note.
    localStorage.setItem("notes-id-counter", noteIdCounter.toString());

    // TODO: Add new note to the saved notes in the local storage.
    const newNote = { id: id, content: content };
    notesContent.push(newNote);
    notesJson = JSON.stringify(notesContent);
    localStorage.setItem("notes-content", notesJson);
  }

  colorForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevents the default event.

    const newColor = colorInput.value.trim(); // Removes whitespaces.

    const notes = document.querySelectorAll(".note");
    for (const note of notes) {
      note.style.backgroundColor = newColor;
    }

    colorInput.value = ""; // Clears the color input field after form submission.

    noteColor = newColor; // Updates the stored note color with the new selection.

    // TODO: Update the note color in the local storage.
    localStorage.setItem("notes-color", noteColor);
  });

  newNoteButton.addEventListener("click", function () {
    addNewNote();
  });

  document.addEventListener("dblclick", function (event) {
    if (event.target.classList.contains("note")) {
      event.target.remove(); // Removes the clicked note.

      const noteIdToRemove = parseInt(event.target.dataset.noteId, 10);
      notesContent = notesContent.filter((note) => note.id !== noteIdToRemove);
      localStorage.setItem("notes-content", JSON.stringify(notesContent));
    }
  });

  noteContainer.addEventListener("focusout", function (event) {
    if (event.target.classList.contains("note")) {
      // TODO: Update the note from the saved notes in the local storage.
      const noteIdToUpdate = parseInt(event.target.dataset.noteId, 10);
      const updatedNoteContent = event.target.value;
      const noteToUpdate = notesContent.find(
        (note) => note.id === noteIdToUpdate
      );
      if (noteToUpdate && noteToUpdate.content !== updatedNoteContent) {
        noteToUpdate.content = updatedNoteContent;
        localStorage.setItem("notes-content", JSON.stringify(notesContent));
      }
    }
  });

  window.addEventListener("keydown", function (event) {
    /* Ignores key presses made for color and note content inputs. */
    if (event.target.id === "color-input" || event.target.type === "textarea") {
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
