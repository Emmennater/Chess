
class ChessBoard {
    constructor(rows, cols, elements = true) {
        this.setup(rows, cols, elements);
        this.kingAttacked = null;
    }

    setup(rows, cols, elements) {
        if (elements) this.boardElem = setupBoard(rows, cols);
        this.rows = rows;
        this.cols = cols;
        this.moves = 0;
        this.squares = Array(rows);
        for (let r = 0; r < rows; r++) {
            this.squares[r] = Array(cols);
            for (let c = 0; c < cols; c++) {
                this.squares[r][c] = new Square(this, r, c);
            }
        }

        // Clicking on squares
        if (elements) setupListeners(this);
    }

    debug() {
        let out = "";
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const piece = this.squares[(this.rows - r - 1)][c].piece;
                if (piece === null) { out += " "; continue; }
                out += piece.name;
            }
            out += '\n';
        }
        console.log(out);
    }

    loadFen(fen) {

        this.moves = 0;
        this.turn = 0;

        // Clear squares
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.squares[r][c].removePiece();
            }
        }

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
                let square = this.squares[row][col];
                square.setPiece(new Piece(square, ch));
                col++;
            }

            idx++;
        }

        this.calculateAllAttacks();
        updateChessboardElem(this);
    }

    getSquare(row, col) {
        if (row < 0 || row >= this.rows ||
            col < 0 || col >= this.cols) return null;
        return this.squares[row][col];
    }

    isKingAttacked() {
        
    }

    updateChecks() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = this.squares[r][c].piece;
                if (piece === null) continue;
                if (piece.piece != 'k') continue;

                // Find attacks on king
                let opposingAttackers = piece.square.attackers.find(e => e.side != piece.side)
                if (opposingAttackers !== undefined) {
                    setCheckedSquare(piece.square);
                }
            }
        }
    }

    calculateAllAttacks() {
        this.resetAttackedSquares();
        removeCheckedSquare();

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = this.squares[r][c].piece;
                if (piece === null) continue;
                piece.calculatePossibleMoves();
            }
        }

        // Test move issues that lead to a king being captured
        let sideToMove = this.turn == 0 ? 'w' : 'b';
        let movesToCheck = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const piece = this.squares[r][c].piece;
                if (piece === null || piece.side != sideToMove) continue;
                for (let i = 0; i < piece.possibleMoves.length; i++) {
                    let move = piece.possibleMoves[i];
                    movesToCheck.push({from:{r, c}, to:{r:move.row, c:move.col}, index:i});
                }
            }
        }

        let illegalMoves = [];
        for (let move of movesToCheck) {
            let legal = true;

            // Create a new fake chessboard to simulate every move
            // to test for check (this is going to be expensive)
            let fakeBoard = new ChessBoard(this.rows, this.cols, false);
            fakeBoard.turn = this.turn;
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const square = fakeBoard.squares[r][c];
                    if (this.squares[r][c].piece === null) continue;

                    // Set the piece
                    const piece = new Piece(square, this.squares[r][c].piece.name);
                    square.setPiece(piece);

                    // Set the possible moves
                    for (let possibleMove of this.squares[r][c].piece.possibleMoves) {
                        piece.possibleMoves.push(fakeBoard.getSquare(possibleMove.row, possibleMove.col));
                    }
                }
            }

            // Play the move on the fake board
            let pieceToMove = fakeBoard.getSquare(move.from.r, move.from.c).piece;
            pieceToMove.moveTo(fakeBoard.getSquare(move.to.r, move.to.c), false);

            // fakeBoard.debug();

            // Check if the king is under attack (calculate all attacks)
            let kings2 = [];
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    const square = fakeBoard.squares[r][c];
                    const piece = square.piece;
                    if (piece === null) continue;

                    if (piece.piece == 'k') kings2.push(piece);
                    piece.calculatePossibleMoves();
                }
            }

            for (let king of kings2) {
                // Check
                let opposingAttackers = king.square.attackers.find(e => e.side != king.side)
                if (opposingAttackers !== undefined) {
                    // If the king being checked is the same from before this is not a legal move
                    if (king.side == sideToMove) {
                        legal = false;
                        break;
                    }
                }
            }

            // Remove the illegal move
            if (!legal) {
                let piece = this.getSquare(move.from.r, move.from.c).piece;
                illegalMoves.push({piece, index:move.index});
            }
        }

        for (let move of illegalMoves) {
            const { piece, index } = move;
            piece.possibleMoves[index] = null;
        }

    }

    resetAttackedSquares() {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.squares[r][c].removeAttackers();
            }
        }
    }
}

class Square {
    constructor(board, row, col) {
        this.board = board;
        this.row = row;
        this.col = col;
        this.piece = null;
        this.elem = null;
        this.attackers = [];
    }

    setPiece(piece) {
        this.piece = piece;
    }

    removePiece() {
        this.piece = null;
    }

    addAttacker(piece) {
        this.attackers.push(piece);
        // this.elem.classList.add("attacked");
    }

    removeAttackers() {
        this.attackers.length = 0;
        // this.elem.classList.remove("attacked");
    }
}

class Piece {
    constructor(square, name) {
        this.square = square;
        this.name = name;
        this.piece = name.toLowerCase();
        this.side = this.piece == name ? 'w' : 'b';
        this.possibleMoves = [];
        this.lastUpdated = -1;
        this.moves = 0;
    }

    calculatePossibleMoves() {
        // Check if on the right turn
        let sideToMove = this.square.board.turn == 0 ? 'w' : 'b';
        let possibleMoves = [];

        if (this.lastUpdated != this.square.board.moves) {
            this.lastUpdated = this.square.board.moves;
            possibleMoves = getPossibleMoves(this);
        }

        if (sideToMove == this.side) {
            this.possibleMoves = possibleMoves;
        } else {
            this.possibleMoves = [];
        }

        return this.possibleMoves;
    }

    promote(piece = 'q') {
        this.name = this.side == 'w' ? piece : piece.toUpperCase();
        this.piece = piece;
    }

    canMoveTo(square) {
        if (square == this.square) return false;
        if (square.piece !== null && square.piece.side == this.side) return false;
        if (!this.possibleMoves.find(e => e === square && e !== null)) return false;
        return true;
    }

    moveTo(square, updateElems = true, promotionPiece = null) {
        if (square == this.square) return 1;
        if (square.piece !== null && square.piece.side == this.side) return 2;

        const board = this.square.board;

        // Find possible moves
        // this.calculatePossibleMoves();
        if (!this.canMoveTo(square)) return 0;
        let callback = () => {};
        let promoting = false;

        // En passant and prompotion for pawns
        // (this code is so cursed xD)
        if (this.piece == 'p') {
            // Check if double move
            let distance = Math.abs(square.row - this.square.row);
            if (distance == 2) {
                this.enPassantMove = board.moves;
            } else {
                // Check if en passanting
                if (Math.abs(square.col - this.square.col) && square.piece === null) {
                    // Remove en passanted piece from the board
                    let direction = this.side == 'w' ? 1 : -1;
                    let targetSquare = board.getSquare(square.row - direction, square.col);
                    targetSquare.removePiece();
                    callback = () => {
                        targetSquare.elem.children[0].remove();
                    }
                } else {
                    // Check if on promotion square
                    let promoRank = this.side == 'w' ? board.rows - 1 : 0;
                    if (square.row == promoRank) {
                        // Promote the pawn
                        promoting = true;
                        if (updateElems) {
                            if (promotionPiece == null) {
                                this.piece = '';
                                this.name = '';
                                showPromotionOptions(square, this, (piece) => {
                                    this.promote(piece);
                                    updatePieceElem(this);
                                    board.calculateAllAttacks();
                                });
                            }
                            callback = () => {
                                updatePieceElem(this);
                            }
                        } else {
                            this.promote(promotionPiece ? promotionPiece : 'q');
                        }
                    }
                }
            }
        }

        // Castling for kings
        if (this.piece == 'k') {
            let distance = square.col - this.square.col;
            if (distance == 2) {
                // King side castle
                let kingRookSquare = board.getSquare(this.square.row, board.cols - 1);
                let kingRook = kingRookSquare.piece;
                let newPos = board.getSquare(this.square.row, board.cols - 3);
                kingRook.square.removePiece();
                kingRook.square = newPos;
                newPos.setPiece(kingRook);

                if (updateElems) {
                    movePieceElem(kingRookSquare.elem.children[0], kingRookSquare.elem, newPos.elem);
                }
            } else if (distance == -2) {
                // Queen side castle
                let queenRookSquare = board.getSquare(this.square.row, 0);
                let queenRook = queenRookSquare.piece;
                let newPos = board.getSquare(this.square.row, 3);
                queenRook.square.removePiece();
                queenRook.square = newPos;
                newPos.setPiece(queenRook);

                if (updateElems) {
                    movePieceElem(queenRookSquare.elem.children[0], queenRookSquare.elem, newPos.elem);
                }
            }
        }

        board.moves++;
        board.turn = (board.turn + 1) % 2;
        this.moves++;
        let oldSquare = this.square;
        this.square.removePiece();
        this.square = square;
        square.setPiece(this);

        if (!updateElems) return;

        movePieceElem(oldSquare.elem.children[0], oldSquare.elem, this.square.elem, callback);

        // Calculate next attacked squares
        if (!promoting || promotionPiece !== null)
            board.calculateAllAttacks();

        return true;
    }
}

function getPossibleMoves(piece) {
    let pieceName = piece.name.toLowerCase();
    let possibleMoves = [];
    const board = piece.square.board;

    function addMoveVector(rowStep, colStep, range = 1, attacking = true) {
        let row = piece.square.row;
        let col = piece.square.col;
        let steps = 0;
        while (steps++ < range) {
            row += rowStep;
            col += colStep;
            const square = board.getSquare(row, col);
            
            // Edge of board
            if (square === null) break;
            
            // Same side
            if (attacking) square.addAttacker(piece);
            if (square.piece !== null && square.piece.side == piece.side) break;
            
            // if (piece.piece == 'k' && square.attackers.find(e => e.side != piece.side) !== undefined) break;
            possibleMoves.push(square);
            
            // Opposite side
            if (square.piece !== null) break;
        }
    }

    switch (pieceName) {
        case 'k':
            addMoveVector(1, 0);
            addMoveVector(0, 1);
            addMoveVector(-1, 0);
            addMoveVector(0, -1);
            addMoveVector(1, -1);
            addMoveVector(1, 1);
            addMoveVector(-1, 1);
            addMoveVector(-1, -1);

            if (piece.moves != 0) break;
            let kingRook = board.getSquare(piece.square.row, board.cols - 1);
            let queenRook = board.getSquare(piece.square.row, 0);    
            
            // Castling (king side)
            if (kingRook.piece != null && kingRook.piece.moves == 0 &&
                board.getSquare(piece.square.row, board.cols - 2).piece === null &&
                board.getSquare(piece.square.row, board.cols - 3).piece === null) {
                    addMoveVector(0, 2);
            }

            // Castling (queen side)
            if (queenRook.piece != null && queenRook.piece.moves == 0 &&
                board.getSquare(piece.square.row, 1).piece === null &&
                board.getSquare(piece.square.row, 2).piece === null &&
                board.getSquare(piece.square.row, 3).piece === null) {
                    addMoveVector(0, -2);
            }


            break;
        case 'q':
            addMoveVector(1, 0, Infinity);
            addMoveVector(0, 1, Infinity);
            addMoveVector(-1, 0, Infinity);
            addMoveVector(0, -1, Infinity);
            addMoveVector(1, -1, Infinity);
            addMoveVector(1, 1, Infinity);
            addMoveVector(-1, 1, Infinity);
            addMoveVector(-1, -1, Infinity);
            break;
        case 'r':
            addMoveVector(1, 0, Infinity);
            addMoveVector(0, 1, Infinity);
            addMoveVector(-1, 0, Infinity);
            addMoveVector(0, -1, Infinity);
            break;
        case 'b':
            addMoveVector(1, -1, Infinity);
            addMoveVector(1, 1, Infinity);
            addMoveVector(-1, 1, Infinity);
            addMoveVector(-1, -1, Infinity);
            break;
        case 'n':
            addMoveVector(-2, -1);
            addMoveVector(-2, 1);
            addMoveVector(-1, 2);
            addMoveVector(1, 2);
            addMoveVector(2, 1);
            addMoveVector(2, -1);
            addMoveVector(1, -2);
            addMoveVector(-1, -2);
            break;
        case 'p':
            // Movement vector
            let direction, startRank;
            if (piece.side == 'w') {
                direction = 1;
                startRank = 1;
            } else {
                direction = -1;
                startRank = board.rows - 2;
            }
            
            // Double move
            if (piece.square.row == startRank && board.getSquare(piece.square.row + direction * 2, piece.square.col).piece === null) {
                addMoveVector(direction * 2, 0, 1, false);
            }

            // Single move
            if (board.getSquare(piece.square.row + direction, piece.square.col).piece === null) {
                addMoveVector(direction, 0, 1, false);
            }

            // Attacking
            let diagonalLeft = board.getSquare(piece.square.row + direction, piece.square.col - 1);
            let diagonalRight = board.getSquare(piece.square.row + direction, piece.square.col + 1);
            if (diagonalLeft !== null) {
                diagonalLeft.addAttacker(piece);
                if (diagonalLeft.piece !== null) {
                    addMoveVector(direction, -1);
                }
            }
            if (diagonalRight !== null) {
                diagonalRight.addAttacker(piece);
                if (diagonalRight.piece !== null) {
                    addMoveVector(direction, 1);
                }
            }

            // En passant
            let left = board.getSquare(piece.square.row, piece.square.col - 1);
            let right = board.getSquare(piece.square.row, piece.square.col + 1);
            if (left !== null && left.piece !== null && left.piece.piece == 'p' && left.piece.enPassantMove == board.moves - 1) {
                addMoveVector(direction, -1);
            }
            if (right !== null && right.piece !== null && right.piece.piece == 'p' && right.piece.enPassantMove == board.moves - 1) {
                addMoveVector(direction, 1);
            }

            break;
    }

    return possibleMoves;
}
