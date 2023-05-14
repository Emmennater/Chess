
let selectedSquare = null;
let checkedSquare = null;
let justSelected = false;
let possibleMoveSquares = [];

function initListeners() {
    document.addEventListener("mousedown", () => {
        if (justSelected) {
            justSelected = false;
            return;
        }
        if (selectedSquare) {
            selectedSquare.elem.classList.remove("selected");
            deselectSquare();
        }
    });
}

function squareClicked(square) {
    if (!square.elem) return;
    justSelected = true;

    // Move piece
    if (selectedSquare) {
        let success = selectedSquare.piece.moveTo(square);
        selectedSquare.elem.classList.remove("selected");
        deselectSquare();
        if (success != 2) return;
    }
    
    // Only select squares with pieces on them
    if (square.piece === null) return;
    
    // Set the elem to selected
    deselectSquare();
    selectedSquare = square;
    square.elem.classList.add("selected");

    // Show possible moves
    // possibleMoveSquares = selectedSquare.piece.calculatePossibleMoves();
    possibleMoveSquares = selectedSquare.piece.possibleMoves;
    for (let square of possibleMoveSquares) {
        if (square == null) continue;
        if (square.piece !== null) square.elem.classList.add("possible-capture");
        else square.elem.classList.add("possible-move");
    }
}

function deselectSquare() {
    for (let move of possibleMoveSquares) {
        if (move === null) continue;
        move.elem.classList.remove("possible-move");
        move.elem.classList.remove("possible-capture");
    }
    possibleMoveSquares = [];
    selectedSquare = null;
}

function movePieceElem(pieceElem, fromSquareElem, toSquareElem, callback = () => {}) {
    // Schedule animation
    let fromRect = fromSquareElem.getClientRects()[0];
    let toRect = toSquareElem.getClientRects()[0];
    let diffx = toRect.left - fromRect.left;
    let diffy = toRect.top - fromRect.top;
    let oldStyle = pieceElem.getAttribute("style");
    pieceElem.setAttribute("style", `
    ${oldStyle};
    transform: translateX(${diffx}px) translateY(${diffy}px);
    `);
    
    let lerpFun = (time) => {
        
    };
    let onComplete = () => {
        pieceElem.setAttribute("style", oldStyle);
        pieceElem.remove();
        toSquareElem.innerHTML = '';
        toSquareElem.appendChild(pieceElem);
        callback();
        chessboard.updateChecks();
    };
    animationQueue.push(new CustomAnimation(0.22, lerpFun, onComplete));
}

function showPromotionOptions(square, piece, callback) {
    const promoPieces = "qnrb";
    
    // Dim the board
    let boardElem = square.board.boardElem;
    boardElem.classList.add("dim");
    let rect = square.elem.getClientRects()[0];

    let promoteElems = document.getElementsByClassName("promotion-wrapper");
    
    for (let i = 0; i < promoPieces.length; i++) {
        let promotePiece = promoPieces[i];
        let promoteElem = promoteElems[0];
        let promoteWrapper = promoteElem;

        // Black or white promotion
        let promoteName = piece.side == 'w' ? promotePiece : promotePiece.toUpperCase();
        let listDirection = piece.side == 'w' ? 1 : -1;

        promoteWrapper.setAttribute("class", "promotion-wrapper");
        promoteWrapper.setAttribute("style", `
        display: block;
        width: ${rect.width}px;
        height: ${rect.height}px;
        left: ${rect.left}px;
        top: ${rect.top + rect.height * i * listDirection}px;
        `);

        let promoteTile = promoteElem.children[0];
        promoteTile.setAttribute("class", "promotion");
        promoteTile.setAttribute("style", `
        background-image: url(${getPieceSrcUrl(promoteName)});
        `);

        // Select promotion option (dont add more than one of these!)
        promoteWrapper.onclick = () => {
            for (let promoElem of promoteElems) {
                promoElem.setAttribute("style", "display:none");
            }
            boardElem.classList.remove("dim");
            callback(promotePiece);
            chessboard.updateChecks();
        };

        promoteWrapper.appendChild(promoteTile);
        document.body.appendChild(promoteWrapper);
    }
}

function setCheckedSquare(square) {
    checkedSquare = square;
    checkedSquare.elem.classList.add("check");
}

function removeCheckedSquare() {
    if (checkedSquare === null) return;
    checkedSquare.elem.classList.remove("check");
    checkedSquare = null;
}
