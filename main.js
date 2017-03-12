// ***** STATE GENERATOR *****
function State(initialState) {
  var state = initialState;
  var observers = [];

  // will call observer functions whenever there is a state change
  function executeObservers(state) {
    observers.forEach(function(observer) { observer(state) })
  }

  // accepts a state-altering action function
  // updates state if it is a new state
  function updateState(action) {
    const currentState = state,
          newState = action(state);

    if (newState !== currentState) {
      state = newState;
      executeObservers(newState);
    }
  }

  function getState() {
    return state;
  }

  // subscribes to an observar and executes it
  // observars execute whenever there is a state change
  function subscribe(observer) {
    observer(state);
    observers.push(observer);
  }

  return {
    updateState: updateState,
    getState: getState,
    subscribe: subscribe,
  };
}

// ***** RAW TILE GENERATOR MODULE *****
const rawTileGenerator = function() {
  // shuffles an array of tiles
  function shuffleTiles(tiles) {
    var currentIndex = tiles.length - 1,
        shuffledTiles = tiles.slice(0),
        tempIndex,
        currentValue;

    while(currentIndex > 0) {
      tempIndex = Math.floor(Math.random() * currentIndex);
      currentValue = shuffledTiles[currentIndex];

      shuffledTiles[currentIndex] = shuffledTiles[tempIndex];
      shuffledTiles[tempIndex] = currentValue;

      --currentIndex;
    }

    return shuffledTiles;
  }
  // turns an array of raw tiles into a 2d array
  function formatTiles(tiles, columns) {
    const formattedTiles = [];
    const tilesCopy = tiles.slice(0);

    while(tilesCopy.length > 0) {
      formattedTiles.push(tilesCopy.splice(0, columns));
    }

    return formattedTiles;
  }

  return {
    // generates a randomized, 2d array of raw tiles
    generate: function() {
      var tiles = [];

      const rows = 4;
      const columns = 4;
      const totalTiles = rows * columns;

      for(var i = 0; i < totalTiles; i++)  {
        tiles.push(i);
      }

      tiles = formatTiles(shuffleTiles(tiles), columns);

      return tiles;
    },
  };
}();

// ***** ACITON HELPERS *****
const boardActionHelpers = function() {
  // checks if a raw tile is blank
  function isBlankTile(rawTile) {
    return rawTile === 0;
  }
  // ensures that a move isn't outside of the grouping of tiles
  function validMove(tiles, move) {
    return (
      move >= 0 &&
      move < tiles.length
    );
  }
  // returns null unless it is a valid move in which case it returns an index
  function newIndex(args) {
    var newIndex = null;
        tiles = args.tiles,
        moves = args.moves,
        moveType = args.moveType,
        index = args.index;

    moves.forEach(function(move) {
      var tilesToCheck = moveType === 'row' ? tiles : tiles[index];

      if (validMove(tilesToCheck, move)) {
        const blankTile = moveType === 'row' ? tiles[move][index] : tiles[index][move];
        if (isBlankTile(blankTile)) {
          newIndex = move;
        }
      }
    })

    return newIndex;
  }

  return {
    // returns the row and column indexes of the clicked tile
    rawTileIndexes: function(tileRows, rawTile) {
      var rowIndex,
          columnIndex,
          tempColumnIndex;

      tileRows.forEach(function(tileRow, index) {
        tempColumnIndex = tileRow.indexOf(rawTile);
        if (tempColumnIndex !== -1) {
          rowIndex = index;
          columnIndex = tempColumnIndex;
        }
      })

      return {
        row: rowIndex,
        column: columnIndex,
      };
    },
    // returns valid or invalid row and column indexes
    newIndexes: function(rowIndex, columnIndex, rawTiles) {
      const indexes = {
        row: rowIndex,
        column: columnIndex,
      };

      indexes.row = newIndex({
        tiles: rawTiles,
        moves: [rowIndex - 1, rowIndex + 1],
        moveType: 'row',
        index: columnIndex,
      });

      if (indexes.row === null) {
        indexes.row = rowIndex;
        indexes.column = newIndex({
          tiles: rawTiles,
          moves: [columnIndex - 1, columnIndex + 1],
          moveType: 'column',
          index: rowIndex,
        });
      }

      return indexes;
    },
  };
}();

// ***** ACITONS *****
// actions that alter the board state
// actions can't return a mutated state
const boardActions = {
  moveTile: function(tile) {
    return function (state) {
      const rawTiles = state;
      const rawTile = Number(tile.textContent);
      const indexes = boardActionHelpers.rawTileIndexes(rawTiles, rawTile);
      var rowIndex = indexes.row,
          columnIndex = indexes.column,
          newRawTiles = rawTiles.slice(0),
          newIndexes = boardActionHelpers.newIndexes(rowIndex, columnIndex, rawTiles),
          newRowIndex = newIndexes.row,
          newColumnIndex = newIndexes.column;

      // if both indexes are valid, switch tile with blank tile
      if (newRowIndex !== null && newColumnIndex !== null) {
        counterState.updateState(counterActions.addCounter);
        newRawTiles[newRowIndex][newColumnIndex] = rawTiles[rowIndex][columnIndex];
        newRawTiles[rowIndex][columnIndex] = 0;
      }

      return newRawTiles;
    };
  },
  shuffle: function() {
    return rawTileGenerator.generate();
  },
};

const counterActions = {
  addCounter: function() {
    return counterState.getState() + 1;
  },
  removeCounters: function() {
    return 0;
  }
};

// ***** ELEMENT GENERATOR *****
function addElement(parent, tagName, attrs) {
  const newElement = document.createElement(tagName);

  Object.keys(attrs).forEach(function(attrName) {
    newElement[attrName] = attrs[attrName];
  })

  parent.appendChild(newElement);

  return newElement;
}

// ***** BOARD COMPONENT *****
// Renders a board component and tiles components
function Board(rawTilesRows) {
  const parent = document.getElementById('content');
  const board = document.getElementById('board');

  if (board) {
    parent.removeChild(board);
  }

  addElement(parent, 'div', { id: 'board' });

  rawTilesRows.forEach(function(rawTilesRow) {
    Tiles(rawTilesRow);
  })
}

// ***** TILES COMPONENT *****
// Renders a row of tile component
function Tiles(rawTiles)  {
  const attributes = {
          className: 'row',
        },
        parent = document.getElementById('board'),
        row = addElement(parent, 'div', attributes);

  rawTiles.forEach(function(rawTile) {
    Tile(rawTile, row);
  })
}

// ***** TILE COMPONENT *****
// Renders a tile component
function Tile(rawTile, row) {
  const attributes = {
          className: 'tile',
          id: rawTile === 0 ? 'blank' : '',
        },
        tileText = document.createTextNode(rawTile),
        tile = addElement(row, 'div', attributes);

  const tilesCount = row.childNodes.length;

  if (tilesCount === 1) {
    // changes a tile instance's left margin
    tile.classList.add('first');
  } else if (tilesCount === 4) {
    // changes a tile instance's right margin
    tile.classList.add('last');
  }

  rawTile !== 0 && tile.appendChild(tileText);

  tile.addEventListener('click', function(e) {
    boardState.updateState(boardActions.moveTile(e.target));
  });
}

// ***** COUNTER COMPONENT *****
// Renders a tile component
function Counter() {
  var parent = document.getElementById('count');
  var counterText = parent.firstChild;

  if (counterText) {
    parent.removeChild(counterText);
  }

  counterText = document.createTextNode(counterState.getState());
  parent.appendChild(counterText);
}

// ***** SHUFFLE BUTTON EVENT LISTENERS *****
// adds listener to shuffle button to execute a board action that shuffles the board
// and one that sets move counter state to 0
const shuffleButton = document.getElementById('shuffle');
shuffleButton.addEventListener('click', function() {
  counterState.updateState(counterActions.removeCounters);
  boardState.updateState(boardActions.shuffle);
});

// ***** INTIALIZES A STATE CONTAINER FOR THE BOARD COMPONENT *****
const boardState = State(rawTileGenerator.generate());

// ***** BOARD STATE SUBSCRIBES TO AN INSTANCE OF BOARD COMPONENT *****
// will rerender the board upon state change
boardState.subscribe(Board);

// ***** INTIALIZES A STATE CONTAINER FOR THE COUNTER COMPONENT *****
const counterState = State(0);

// ***** COUNTER STATE SUBSCRIBES TO AN INSTANCE OF COUNTER COMPONENT *****
// will rerender the counter upon state change
counterState.subscribe(Counter);
