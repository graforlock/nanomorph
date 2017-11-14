var assert = require('assert')
var morph = require('./lib/morph')

var TEXT_NODE = 3
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
    return newNode
  } else {
    morph(newNode, oldNode)
    updateChildren(newNode, oldNode)
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

  if (newChildren.length === 1 && oldChildren.length === 1) {
    var newChild = newChildren[0]
    var oldChild = oldChildren[0]
    walk(newChild, oldChild)
  } else if (newChildren.length && oldChildren.length) {
    if (newChildren === oldChildren) return

    var prefix = diffPrefix(newChildren, oldChildren)
    var suffix = diffSuffix(newChildren, oldChildren)

    var newStart = prefix
    var oldStart = prefix
    var newEnd = newChildren.length - suffix
    var oldEnd = oldChildren.length - suffix

    if (newStart > newEnd && oldStart > oldEnd) return

  } else {
    removeChildren(oldNode, oldChildren)
    appendChildren(oldNode, newChildren)
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
    canUpdate(c1 = s1[start1], c2 = s2[start2])
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
    canUpdate(c1 = s1[end1], c2 = s2[end2])
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
  children,
  start = 0,
  end = children.length - 1,
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
  children,
  start = 0,
  end = children.length - 1
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

function canUpdate (a, b) {
  if (a.isSameNode) return a.isSameNode(b)
  if (a.tagName === b.tagName) return true
  return false
}

// function same (a, b) {
//   if (a.id) return a.id === b.id
//   if (a.isSameNode) return a.isSameNode(b)
//   if (a.tagName !== b.tagName) return false
//   if (a.type === TEXT_NODE) return a.nodeValue === b.nodeValue
//   return false
// }
