import React, { useState, useEffect } from "react";

const ROWS = 6;
const COLS = 8;

const START = { r: 0, c: 0 };
const EXIT = { r: 5, c: 7 };

const HAZARDS = [
  [1, 2],
  [2, 4],
  [3, 1],
  [4, 5],
  [5, 3],
];

// 🔥 BFS PATHFINDING
const bfs = (start, exit, hazards) => {
  const queue = [[start]];
  const visited = new Set([`${start.r},${start.c}`]);
  const hazardSet = new Set(hazards.map(([r, c]) => `${r},${c}`));

  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  while (queue.length) {
    const path = queue.shift();
    const { r, c } = path[path.length - 1];

    if (r === exit.r && c === exit.c) return path;

    for (let [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;

      const key = `${nr},${nc}`;

      if (
        nr >= 0 &&
        nr < ROWS &&
        nc >= 0 &&
        nc < COLS &&
        !visited.has(key) &&
        !hazardSet.has(key)
      ) {
        visited.add(key);
        queue.push([...path, { r: nr, c: nc }]);
      }
    }
  }

  return [];
};

export default function Navigation() {
  const [path, setPath] = useState([]);

  useEffect(() => {
    const result = bfs(START, EXIT, HAZARDS);
    setPath(result);
  }, []);

  const isPath = (r, c) => path.some((p) => p.r === r && p.c === c);
  const isHazard = (r, c) =>
    HAZARDS.some(([hr, hc]) => hr === r && hc === c);

  return (
    <div className="p-6 bg-gray-900 rounded-2xl">
      <h2 className="text-white text-lg mb-4 font-bold">
        🔥 Evacuation Path
      </h2>

      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((_, c) => {
            let bg = "bg-gray-700";

            if (r === START.r && c === START.c) bg = "bg-blue-500";
            else if (r === EXIT.r && c === EXIT.c) bg = "bg-green-500";
            else if (isHazard(r, c)) bg = "bg-red-600";
            else if (isPath(r, c)) bg = "bg-yellow-400";

            return (
              <div
                key={`${r}-${c}`}
                className={`w-10 h-10 rounded ${bg} flex items-center justify-center text-xs text-white`}
              >
                {r === START.r && c === START.c
                  ? "YOU"
                  : r === EXIT.r && c === EXIT.c
                  ? "EXIT"
                  : ""}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}