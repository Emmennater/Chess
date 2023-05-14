
const rows = 8;
const cols = 8;

function getPieceSrcUrl(letter) {
    let side = letter.toUpperCase() == letter ? "b" : "w";
    return `https://images.chesscomfiles.com/chess-themes/pieces/icy_sea/150/${side + letter.toLowerCase()}.png`;
}

function loadFen(chessboard, fen) {
    const board = chessboard.boardElem;
    let row = 0;
    let col = 0;
    let idx = 0;

    while (idx < fen.length) {
        let ch = fen[idx];
        let digit = parseFloat(ch);

        if (ch == ' ') {
            // Only set up position
            break;
        } else if (!isNaN(digit)) {
            col += digit;
        } else if (ch === '/') {
            row++;
            col = 0;
        } else {
            // Set piece
            let square = board.children[(rows - row - 1) * rows + col];
            let piece = document.createElement("div");
            piece.setAttribute("class", "piece");
            piece.setAttribute("style", `background-image: url(${getPieceSrcUrl(ch)});`);
            square.appendChild(piece);
            col++;
        }

        idx++;
    }

}

function updateChessboardElem(chessboard) {
    // Set piece
    // let square = board.children[(rows - row - 1) * rows + col];
    // let piece = document.createElement("div");
    // piece.setAttribute("class", "piece");
    // piece.setAttribute("style", `background-image: url(${getPieceSrcUrl(ch)});`);
    // square.appendChild(piece);

    const elem = chessboard.boardElem;
    for (let r = 0; r < chessboard.rows; r++) {
        for (let c = 0; c < chessboard.cols; c++) {
            const square = chessboard.squares[r][c];
            const piece = square.piece;
            let squareElem = elem.children[(chessboard.rows - r - 1) * chessboard.cols + c];
            if (!squareElem) continue;
            let pieceElem = squareElem.children[0];

            // Remove the piece from the board if there isn't one
            if (piece === null) { if (pieceElem) pieceElem.remove(); continue; }

            // If the piece element doesn't exist then create one
            if (!pieceElem) {
                pieceElem = document.createElement("div");
                pieceElem.setAttribute("class", "piece");
                pieceElem.setAttribute("draggable", "false");
                squareElem.appendChild(pieceElem);
            }

            // Set the piece elem image
            pieceElem.setAttribute("style", `background-image: url(${getPieceSrcUrl(piece.name)});`);
        }
    }

}

function updatePieceElem(piece) {
    if (!piece) return;
    if (piece.name == '') piece.square.elem.children[0].setAttribute("style", `background-image: none;`);
    else piece.square.elem.children[0].setAttribute("style", `background-image: url(${getPieceSrcUrl(piece.name)});`);
}

function setupListeners(chessboard) {
    const elem = chessboard.boardElem;
    for (let r = 0; r < chessboard.rows; r++) {
        for (let c = 0; c < chessboard.cols; c++) {
            const square = chessboard.squares[r][c];
            const squareElem = elem.children[(chessboard.rows - r - 1) * chessboard.cols + c];
            if (!squareElem) continue;

            square.elem = squareElem;
            squareElem.addEventListener("mousedown", () => squareClicked(square));
            squareElem.addEventListener("mouseup", () => { squareReleased(square); });
            squareElem.addEventListener("mouseover", () => { squareHovered(square); });
            squareElem.addEventListener("mouseout", () => { if (hoveredSquare == square) hoveredSquare = null; });
        }
    }
}

function setupBoard(rows, cols) {
    let ratio_r = cols > rows ? rows / cols : 1;
    let ratio_c = rows > cols ? cols / rows : 1;
    let boardElem = document.getElementById("chessboard");
    boardElem.setAttribute("style", `
    grid-template-columns: repeat(${cols}, 1fr); grid-template-rows: repeat(${rows}, 1fr);
    width: calc(var(--board-size) * ${ratio_c}); height: calc(var(--board-size) * ${ratio_r});`);

    // Create squares
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let square = document.createElement("div");
            square.setAttribute("class", "square");
            square.setAttribute("draggable", "false");

            // Odd and even squares
            square.classList.add((r + c) % 2 ? "even-square" : "odd-square");

            boardElem.appendChild(square);
        }
    }

    return boardElem;
}

let previousTimestamp = performance.now();
function loop(timestamp) {
    const deltaTime = (timestamp - previousTimestamp) / 1000; // Convert to seconds
    previousTimestamp = timestamp;
    moveToNextHovered = false;

    updateAnimations(deltaTime);
    requestAnimationFrame(loop);
}

(function start() {
    initListeners();

    chessboard = new ChessBoard(8, 8);
    chessboard.loadFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");

    requestAnimationFrame(loop);
})();
