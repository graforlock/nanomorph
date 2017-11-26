var assert = require('assert')
var morph = require('./lib/morph')
var diffMyers = require('./lib/diff')

// var DEBUG = false

module.exports = nanomorph

// Morph one tree into another tree
//
// no parent
//   -> same: diff and walk children
//   -> not same: replace and return
// old node doesn't exist
//   -> insert new node
// new node doesn't exist
//   -> delete old node
// nodes are not the same
//   -> diff nodes and apply patch to old node
// nodes are the same
//   -> walk all child nodes and append to old node
function nanomorph (oldTree, newTree) {
  // if (DEBUG) {
  //   console.log(
  //   'nanomorph\nold\n  %s\nnew\n  %s',
  //   oldTree && oldTree.outerHTML,
  //   newTree && newTree.outerHTML
  // )
  // }
  assert.equal(typeof oldTree, 'object', 'nanomorph: oldTree should be an object')
  assert.equal(typeof newTree, 'object', 'nanomorph: newTree should be an object')
  var tree = walk(newTree, oldTree)
  // if (DEBUG) console.log('=> morphed\n  %s', tree.outerHTML)
  return tree
}

// Walk and morph a dom tree
function walk (newNode, oldNode) {
  // if (DEBUG) {
  //   console.log(
  //   'walk\nold\n  %s\nnew\n  %s',
  //   oldNode && oldNode.outerHTML,
  //   newNode && newNode.outerHTML
  // )
  // }

  if (!oldNode) {
    return newNode
  } else if (!newNode) {
    return null
  } else if (newNode.isSameNode && newNode.isSameNode(oldNode)) {
    return oldNode
  } else if (newNode.tagName !== oldNode.tagName) {
    var parent = oldNode.parentNode
    parent.replaceChild(newNode, oldNode)
    return newNode
  } else {
    updateChildren(newNode, oldNode)
    morph(newNode, oldNode)
    return oldNode
  }
}

// Update the children of elements
// (obj, obj) -> null
function updateChildren (newNode, oldNode) {
  // if (DEBUG) {
  //   console.log(
  //   'updateChildren\nold\n  %s\nnew\n  %s',
  //   oldNode && oldNode.outerHTML,
  //   newNode && newNode.outerHTML
  // )
  // }

  var newChildren = newNode.childNodes
  var oldChildren = oldNode.childNodes
  var newChild = newChildren[0]
  var oldChild = oldChildren[0]

  if (newChildren.length === 1 && oldChildren.length === 1) {
    if (canPatch(newChild, oldChild)) {
      walk(newChild, oldChild)
    } else {
      oldNode.replaceChild(newChild, oldChild)
    }
  } else if (newChildren.length && oldChildren.length) {
    if (newChildren === oldChildren) return

    // var prefix = diffPrefix(newChildren, oldChildren)
    // var suffix = diffSuffix(newChildren, oldChildren)

    // var newStart = prefix
    // var oldStart = prefix
    // var newEnd = newChildren.length - suffix
    // var oldEnd = oldChildren.length - suffix

    // if (newStart > newEnd && oldStart > oldEnd) return

    // if (newStart <= newEnd && oldStart > oldEnd) {
    //   appendChildren(oldNode, newChildren, newStart, newEnd, oldChildren[oldStart])
    // } else if (oldStart <= oldEnd && newStart > newEnd) {
    //   removeChildren(oldNode, oldChildren, oldStart, oldEnd)
    // } else {
    var diffPath = diffMyers(oldChildren, newChildren, canPatch)
    if (!diffPath) { // changes too expensive to run Myers
      diffPath = diffWithMap(oldNode, newChildren, oldChildren)
    }

    diffPath.forEach((d, i) => {

    })

    applyDiff(oldNode, oldChildren, newChildren, diffPath, walk)
  // }
  } else {
    removeChildren(oldNode, oldChildren)
    appendChildren(oldNode, newChildren)
  }
}

function applyDiff (parent, a, b, diff, update) {
  var offsetA = 0
  var offsetB = 0
  for (var i = 0; i < diff.length; i++) {
    if (diff[i] === 'DELETE') {
      parent.removeChild(a[i + offsetA])
      --offsetA
      --offsetB
    } else if (diff[i] === 'INSERT') {
      if (b[i + offsetB]) parent.insertBefore(b[i + offsetB], a[i + offsetA])
      --offsetB
    } else {
      update(b[i + offsetB], a[i + offsetA])
    }
  }
}

function diffPrefix (s1, s2) {
  var k = 0
  var start1 = 0
  var start2 = 0
  var end1 = s1.length - 1
  var end2 = s2.length - 1
  var c1, c2
  while (
    start1 <= end1 &&
    start2 <= end2 &&
    canPatch(c1 = s1[start1], c2 = s2[start2])
  ) {
    walk(c1, c2)
    start1++
    start2++
    k++
  }
  return k
}

function diffSuffix (s1, s2) {
  var k = 0
  var start1 = 0
  var start2 = 0
  var end1 = s1.length - 1
  var end2 = s2.length - 1
  var c1, c2
  while (
    start1 <= end1 &&
    start2 <= end2 &&
    canPatch(c1 = s1[end1], c2 = s2[end2])
  ) {
    walk(c1, c2)
    end1--
    end2--
    k++
  }
  return k
}

function appendChildren (
  parent,
  children, start = 0, end = children.length - 1,
  beforeNode
) {
  var ref = start
  while (start <= end) {
    var ch = children[ref]
    parent.insertBefore(ch, beforeNode)
    start++
  }
}

function removeChildren (
  parent,
  children, start = 0, end = children.length - 1
) {
  var cleared
  var ref = start
  if (parent.childNodes.length === end - start + 1) {
    parent.textContent = ''
    cleared = true
  }
  while (start <= end) {
    var ch = children[ref]
    if (!cleared) parent.removeChild(ch)
    start++
  }
}

function canPatch (nodeA, nodeB) {
  if (nodeA.tagName && nodeB.tagName) nodeA.tagName === nodeB.tagName
  if (nodeA === nodeB) return true

  return false
}

// function canUpdate (a, b) {
//   if (a.isSameNode) return a.isSameNode(b)
//   if (a.tagName === b.tagName) return true
//   return false
// }

// function same (a, b) {
//   if (a.id) return a.id === b.id
//   if (a.isSameNode) return a.isSameNode(b)
//   if (a.tagName !== b.tagName) return false
//   if (a.type === TEXT_NODE) return a.nodeValue === b.nodeValue
//   return false
// }

function diffWithMap (
  parent,
  children,
  oldChildren,
  newStart = 0,
  newEnd = children.length - 1,
  oldStart = 0,
  oldEnd = oldChildren.length - 1
) {
  var keymap = {}
  var unkeyed = []
  var idxUnkeyed = 0
  var ch
  var oldCh
  var k
  var idxInOld
  var key

  var newLen = newEnd - newStart + 1
  var oldLen = oldEnd - oldStart + 1
  var minLen = Math.min(newLen, oldLen)
  var tresh = Array(minLen + 1)
  tresh[0] = -1

  for (var i = 1; i < tresh.length; i++) {
    tresh[i] = oldEnd + 1
  }
  var link = Array(minLen)

  for (i = oldStart; i <= oldEnd; i++) {
    oldCh = oldChildren[i]
    key = oldCh.key
    // if (key != null) {
    //   keymap[key] = i
    // } else {
      unkeyed.push(i)
    // }
  }

  for (i = newStart; i <= newEnd; i++) {
    ch = children[i]
    idxInOld = ch.key /* == null */ ? unkeyed[idxUnkeyed++] : keymap[ch.key]
    if (idxInOld /* != null */) {
      k = findK(tresh, idxInOld)
      if (k >= 0) {
        tresh[k] = idxInOld
        link[k] = { newi: i, oldi: idxInOld, prev: link[k - 1] }
      }
    }
  }

  k = tresh.length - 1
  while (tresh[k] > oldEnd) k--

  var ptr = link[k]
  var diff = Array(oldLen + newLen - k)
  var curNewi = newEnd
  var curOldi = oldEnd
  var d = diff.length - 1
  while (ptr) {
    const { newi, oldi } = ptr
    while (curNewi > newi) {
      diff[d--] = 'INSERT'
      curNewi--
    }
    while (curOldi > oldi) {
      diff[d--] = 'DELETE'
      curOldi--
    }
    diff[d--] = 'UPDATE'
    curNewi--
    curOldi--
    ptr = ptr.prev
  }
  while (curNewi >= newStart) {
    diff[d--] = 'INSERT'
    curNewi--
  }
  while (curOldi >= oldStart) {
    diff[d--] = 'DELETE'
    curOldi--
  }
  return diff
}

function findK (ktr, j) {
  var lo = 1
  var hi = ktr.length - 1
  while (lo <= hi) {
    var mid = Math.ceil((lo + hi) / 2)
    if (j < ktr[mid]) hi = mid - 1
    else lo = mid + 1
  }
  return lo
}
