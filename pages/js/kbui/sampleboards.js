// kbdisplay.js
//
////////////////////////////////////
//
//  setupSample Boards: Set up the input keyboards. QWERTY, etc.
//
//  - Add click events to display different sample boards.
//  - Everything that has a data-shifted should copy its innerText to data-normal
//  - When a shift is toggled on, switch the sample boards to shift mode.
//  - Set the modifier keys to toggle.
//  - When any key with data-key is clicked, report it to GUI.assignKey
//
////////////////////////////////////
function setupSampleBoards(kbinfo) {
  function displayBoard(name) {
    // Board selection.
    const allboards = getAll('div.board-map');
    for (const board of allboards) {
      board.style['display'] = 'none';
    }
    get('#board-' + name).style['display'] = 'block';
  }

  displayBoard('qwerty');

  const boardsels = getAll('div.board-sel');
  for (const boardsel of boardsels) {
    boardsel.onclick = () => {
      displayBoard(boardsel.dataset.board);
    }
  }

  if (kbinfo.custom_keycodes) {
    const customboard = get('#custom')
    let row = null;
    for (let i = 0; i < kbinfo.custom_keycodes.length; i++) {
      const custom = kbinfo.custom_keycodes[i];
      if ((i % 10) === 0) {
        row = EL('div', {class: 'kb-row'});
        appendChildren(customboard, EL('div', {class: 'kb-row'}, row));
      }
      appendChildren(row, EL('div',
        {
          class: 'key',
          'data-bind': 'key',
          'data-key': custom.name,
          title: custom.name + ' - ' + custom.title,
        },
        custom.shortName)
      );
    }
  }

  const allKeys = getAll('[data-key]')
  const shiftableKeys = getAll('[data-shifted]')

  // Copy orig innerHTMLs to data-normal
  for (const key of shiftableKeys) {
    key.dataset.normal = key.innerHTML;
  }

  const modsSelected = {
    SHIFT: false,
    CTRL: false,
    GUI: false,
    ALT: false,
    RHS: false,
  };

  const modMasks = {
    CTRL: 0x0100,
    SHIFT: 0x0200,
    ALT: 0x0400,
    GUI: 0x0800,
    RHS: 0x1000,
  }

  let modmask = 0;

  // Most board keys have modifiers. macros, combos, etc don't.
  function updateModifiers(which) {
    modmask = 0;
    for (const keymod of getAll('[data-modifier]')) {
      for (const [mod, enabled] of Object.entries(modsSelected)) {
        if (enabled) {
          modmask = modmask | modMasks[mod];
        }
      }
    }

    if (which === 'SHIFT') {
      if ((modmask & modMasks.SHIFT) === modMasks.SHIFT) {
        for (const key of shiftableKeys) {
          key.innerHTML = key.dataset.shifted;
        }
      } else {
        for (const key of shiftableKeys) {
          key.innerHTML = key.dataset.normal;
        }
      }
    }
  }

  const modifierKeys = getAll('.key-mod[data-modifier]');

  for (const key of modifierKeys) {
    const mod = key.dataset.modifier;
    let val = modsSelected[mod];
    key.onclick = () => {
      val = !val;
      if (val) {
        key.classList.add('selected');
      } else {
        key.classList.remove('selected');
      }
      modsSelected[mod] = val;
      updateModifiers(mod);
    };
  }

  const allBoardKeys = getAll('[data-bind]');
  for (const keyimage of allBoardKeys) {
    if (keyimage.dataset.bind === 'key') {
      keyimage.onclick = (ev) => {
          ACTION.trigger('keySelect', keyimage.dataset.key);
      }
    } else if (keyimage.dataset.bind === 'keymask') {
      keyimage.onclick = (ev) => {
        const keyid = KEY.parse(keyimage.dataset.key);
        if (modmask) {
          console.log("Got keypress modded", keyid, modmask);
          const keystr = KEY.stringify(keyid + modmask);
          ACTION.trigger('keySelect', keystr);
        } else {
          console.log("Got keypress unmodded", keyid);
          ACTION.trigger('keySelect', keyimage.dataset.key);
        }
      }
    } else {
      alertUser('unknown dataset.bind', keyimage.dataset.bind);
    }
  }
}

// Don't run until site is loaded
addInitializer('ui', setupSampleBoards, 1000);