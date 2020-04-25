var Util       = require('../core/Util');
var Heap       = require('heap');
var DiagonalMovement = require('../core/DiagonalMovement');
var Heuristic  = require('../core/Heuristic');

function SpimBotFinder(opt) {
    opt = opt || {};
    this.allowDiagonal = opt.allowDiagonal;
    this.dontCrossCorners = opt.dontCrossCorners;
    this.heuristic = opt.heuristic || Heuristic.manhattan;
    this.weight = opt.weight || 1;
    this.diagonalMovement = opt.diagonalMovement;

    if (!this.diagonalMovement) {
        if (!this.allowDiagonal) {
            this.diagonalMovement = DiagonalMovement.Never;
        } else {
            if (this.dontCrossCorners) {
                this.diagonalMovement = DiagonalMovement.OnlyWhenNoObstacles;
            } else {
                this.diagonalMovement = DiagonalMovement.IfAtMostOneObstacle;
            }
        }
    }

    // When diagonal movement is allowed the manhattan heuristic is not
    //admissible. It should be octile instead
    if (this.diagonalMovement === DiagonalMovement.Never) {
        this.heuristic = opt.heuristic || Heuristic.manhattan;
    } else {
        this.heuristic = opt.heuristic || Heuristic.octile;
    }
}

/**
 * Find and return the the path.
 * @return {Array<Array<number>>} The path, including both start and
 *     end positions.
 */
SpimBotFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
  // use opened and closed when node is opened and closed
  var startNode = grid.getNodeAt(startX, startY);
  var endNode = grid.getNodeAt(endX, endY);
  var heuristic = this.heuristic;
  var diagonalMovement = this.diagonalMovement;
  var weight = this.weight;
  var abs = Math.abs;
  var SQRT2 = Math.SQRT2;

  var openList = new Heap(function(a, b) {
    return heuristic(abs(a.x - endX), abs(a.y - endY))- heuristic(abs(b.x - endX), abs(b.y - endY));
  });
  openList.push(startNode);
  startNode.opened = true;
  while (!openList.empty()) {
    var top = openList.pop();
    top.closed=true;
    var ns = grid.getNeighbors(top, diagonalMovement);
    for (var i = 0; i < ns.length; i++) {
      if (ns[i] == endNode) {
        ns[i].parent = top;
        return Util.backtrace(ns[i]);
      } else if (!(ns[i].opened || ns[i].closed)) {
        ns[i].parent = top;
        openList.push(ns[i]);
        ns[i].opened = true;
      }
    }
  }
  return [];
};

module.exports = SpimBotFinder;
