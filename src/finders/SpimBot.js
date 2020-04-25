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
// Basic best first reference https://aimaterials.blogspot.com/p/best-first-search.html
SpimBotFinder.prototype.findPath = function(startX, startY, endX, endY, grid) {
  // convienece stuff
  var heuristic = this.heuristic;
  var diagonalMovement = this.diagonalMovement;
  var abs = Math.abs;

  // initialize the grid representatoin (not totally faithful to mips
  // implementation to facilitate pathfinding.js visualization)
  // it is a 2d (represented as a 1d) array of search_node_struct
  // struct search_node_struct {
  //    search_node_struct* open_list_next, parent;
  //    bool closed, opened;
  //    int x, y, heuristic, size;
  // }
  var nodes = [];
  for (var i = 0; i < grid.height; i++) {
    for (var j = 0; j < grid.width; j++) {
      nn = {};
      nn.open_list_next = -1; // will be an index in array in js
      nn.parent = null; // will be an index in array in js
      nn.size = 0; // will be an index in array in js
      nn.closed = false;
      nn.opened = false;
      nn.x = j;
      nn.y = i;
      nn.heuristic = 100000;
      nn.real = grid.getNodeAt(j, i);
      nodes.push(nn);
    }
  }

  // Don't worry about list being empty. That should never happen
  // list_ind should be pointer to pointer so that we can insert into head of lsit
  function push(list_ind, ind) {
    if (list_ind == -1) {
      return ind;
    }
    var ff = list_ind;
    if (nodes[list_ind].heuristic > nodes[ind].heuristic) {
      nodes[ind].open_list_next = list_ind;
      return ind;
    }
    var last_ind = list_ind;
    while (list_ind != -1 && nodes[list_ind].heuristic <= nodes[ind].heuristic) {
      last_ind = list_ind;
      list_ind = nodes[list_ind].open_list_next;
    }
    nodes[last_ind].open_list_next = ind;
    nodes[ind].open_list_next = list_ind;
    return ff;
  }
  function backtrace(ind) {
    var arr = [];
    var s = nodes[ind].size;
    for (var i = 0; i < s; i++) { // loop idea same as mips but inside of loop is specific to pathfinding.js
      arr.push([nodes[ind].x, nodes[ind].y]);
      ind = nodes[ind].parent;
    }
    return arr;
  }

  var startNode = nodes[startY*grid.width + startX];
  var openList = startY*grid.width + startX;
  startNode.opened = true;
  startNode.heuristic = heuristic(abs(startNode.x - endX), abs(startNode.y - endY));
  startNode.size = 1;

  while (openList != -1) {
    var topi = openList;
    openList = nodes[openList].open_list_next;
    var top = nodes[topi];
    var tx = top.x, ty = top.y;
    top.closed=true;
    top.real.closed = true;

    // in mips make sure each neighbor is not a wall and not out of bounds then consider it
    var ns = grid.getNeighbors(top, diagonalMovement); // This will just have to be unrolled in mips
    for (var i = 0; i < ns.length; i++) {
      // make this smoething like a considerChild procedure that takes an ind/pointer
      var ind = grid.width * ns[i].y + ns[i].x;
      var n = nodes[ind];
      if (n.x == endX && n.y == endY) {
        n.parent = topi;
        n.size = top.size + 1;
        return backtrace(ind);
      } else if (!(n.opened || n.closed)) {
        n.heuristic = heuristic(abs(n.x - endX), abs(n.y - endY));
        n.parent = topi;
        n.size = top.size + 1;

        openList = push(openList, ind);
        n.opened = true;
        n.real.opened = true;
      }
    }
  }
  return [];
};

module.exports = SpimBotFinder;
