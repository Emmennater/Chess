
let selectedSquare = null;
let possibleMoveSquares = [];

function squareClicked(square) {
    if (!square.elem) return;

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
    };
    animationQueue.push(new CustomAnimation(0.22, lerpFun, onComplete));
}