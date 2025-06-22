import { useState, useEffect } from 'react'

const COLORS = ['red', 'blue', 'green']
const GRID_SIZE = 7
const CENTER = Math.floor(GRID_SIZE / 2)

export default function Game() {
    const [grid, setGrid] = useState([])
    const [path, setPath] = useState([])
    const [selectedColor, setSelectedColor] = useState(null)
    const [characterPos, setCharacterPos] = useState({ x: CENTER, y: CENTER })
    const [isDragging, setIsDragging] = useState(false)

    // Initialize the grid with random colored dots
    useEffect(() => {
        initializeGrid()
    }, [])

    const initializeGrid = () => {
        const newGrid = Array(GRID_SIZE).fill().map(() =>
            Array(GRID_SIZE).fill().map(() => ({
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                isEmpty: false
            }))
        )
        newGrid[CENTER][CENTER].isEmpty = true // Character starting position
        setGrid(newGrid)
    }

    const isAdjacent = (pos1, pos2) => {
        const dx = Math.abs(pos1.x - pos2.x)
        const dy = Math.abs(pos1.y - pos2.y)
        // Allow diagonal movement: adjacent if dx <= 1 and dy <= 1, but not the same cell
        return (dx <= 1 && dy <= 1) && !(dx === 0 && dy === 0)
    }

    const handleCellClick = (x, y) => {
        const cell = grid[y][x]
        
        // If cell is empty or we're clicking on a non-adjacent cell, ignore
        if (cell.isEmpty || (path.length > 0 && !isAdjacent(path[path.length - 1], { x, y }))) {
            return
        }

        // Starting a new path
        if (path.length === 0) {
            if (isAdjacent({ x: characterPos.x, y: characterPos.y }, { x, y })) {
                setPath([{ x, y }])
                setSelectedColor(cell.color)
            }
            return
        }

        // Continuing a path
        if (cell.color === selectedColor) {
            // Check if the cell is already in the path
            const cellInPath = path.some(pos => pos.x === x && pos.y === y)
            if (!cellInPath) {
                setPath([...path, { x, y }])
            }
        }
    }

    const confirmPath = () => {
        if (path.length === 0) return

        const newGrid = [...grid]
        
        // Remove dots from the path
        path.forEach(({ x, y }) => {
            newGrid[y][x].isEmpty = true
        })

        // Move character to the last position in the path
        const lastPos = path[path.length - 1]
        setCharacterPos({ x: lastPos.x, y: lastPos.y })

        // Make dots fall
        for (let x = 0; x < GRID_SIZE; x++) {
            let emptySpaces = []
            for (let y = GRID_SIZE - 1; y >= 0; y--) {
                if (newGrid[y][x].isEmpty) {
                    emptySpaces.push(y)
                } else if (emptySpaces.length > 0) {
                    const newY = emptySpaces[0]
                    newGrid[newY][x] = newGrid[y][x]
                    newGrid[y][x] = { isEmpty: true }
                    emptySpaces.shift()
                    emptySpaces.unshift(y)
                }
            }

            // Fill empty spaces at the top with new dots
            emptySpaces.forEach(y => {
                newGrid[y][x] = {
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    isEmpty: false
                }
            })
        }

        setGrid(newGrid)
        setPath([])
        setSelectedColor(null)
    }

    const cancelPath = () => {
        setPath([])
        setSelectedColor(null)
    }

    // Helper to get cell coordinates from event
    const getCellCoords = (event) => {
        const cellElem = event.target.closest('.cell')
        if (!cellElem) return null
        const [x, y] = cellElem.dataset.xy.split('-').map(Number)
        return { x, y }
    }

    // Mouse events
    const handleCellMouseDown = (x, y) => {
        handleCellClick(x, y)
        setIsDragging(true)
    }
    const handleCellMouseEnter = (x, y) => {
        if (isDragging) handleCellClick(x, y)
    }
    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Touch events
    const handleCellTouchStart = (e, x, y) => {
        handleCellClick(x, y)
        setIsDragging(true)
    }
    const handleCellTouchMove = (e) => {
        if (!isDragging) return
        const touch = e.touches[0]
        const elem = document.elementFromPoint(touch.clientX, touch.clientY)
        if (!elem) return
        const cellElem = elem.closest('.cell')
        if (cellElem && cellElem.dataset.xy) {
            const [x, y] = cellElem.dataset.xy.split('-').map(Number)
            handleCellClick(x, y)
        }
    }
    const handleTouchEnd = () => {
        setIsDragging(false)
    }

    // Attach mouseup/touchend listeners to window
    useEffect(() => {
        window.addEventListener('mouseup', handleMouseUp)
        window.addEventListener('touchend', handleTouchEnd)
        return () => {
            window.removeEventListener('mouseup', handleMouseUp)
            window.removeEventListener('touchend', handleTouchEnd)
        }
    }, [])

    return (
        <div className="game">
            <div
                className="grid"
                onMouseLeave={handleMouseUp}
                onTouchMove={handleCellTouchMove}
            >
                {grid.map((row, y) =>
                    row.map((cell, x) => (
                        <div
                            key={`${x}-${y}`}
                            data-xy={`${x}-${y}`}
                            className={`cell ${path.some(pos => pos.x === x && pos.y === y) ? 'path' : ''}`}
                            onClick={() => handleCellClick(x, y)}
                            onMouseDown={() => handleCellMouseDown(x, y)}
                            onMouseEnter={() => handleCellMouseEnter(x, y)}
                            onTouchStart={e => handleCellTouchStart(e, x, y)}
                        >
                            {!cell.isEmpty && (
                                <div className={`dot ${cell.color}`} />
                            )}
                            {characterPos.x === x && characterPos.y === y && (
                                <div className="character" />
                            )}
                        </div>
                    ))
                )}
            </div>
            {path.length > 0 && (
                <div className="controls">
                    <button onClick={confirmPath}>Confirm Path</button>
                    <button onClick={cancelPath}>Cancel</button>
                </div>
            )}
        </div>
    )
}