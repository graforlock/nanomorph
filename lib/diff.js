function diff (a, b, cmp) {
  cmp = cmp || function (a, b) { return a === b }
  var n = a.length
  var m = b.length
  var max = n + m
  var v = Array(2 * max + 1)
  var len = v.length
  var trace = []
  var k, x, y, addK, remK, _k
  v[1] = 0

  for (var d = 0; d <= max; d++) {
    trace.push(v.slice(0))
    if (d > 50) return false
    for (k = -d; k <= d; k += 2) {
      addK = k + 1 < 0 ? len - Math.abs(k + 1) : k + 1
      remK = k - 1 < 0 ? len - Math.abs(k - 1) : k - 1
      _k = k < 0 ? len - Math.abs(k) : k

      if (k === -d || (k !== d && (v[remK] < v[addK]))) {
        x = v[addK]
      } else {
        x = v[remK] + 1
      }

      y = x - k

      while (x < n && y < m && cmp(a[x], b[y])) {
        x = x + 1
        y = y + 1
      }

      v[_k] = x

      if (x >= n && y >= m) return trace
    }
  }
}

function main (a, b, cmp, f) {
  f = f || _updateDiffPath
  var x = a.length
  var y = b.length
  var k, addK, remK, prevX, prevY, prevK, _prevK
  var diffPath = []

  var shortestEdit = diff(a, b, cmp)

  if (!shortestEdit) return false

  for (var d = shortestEdit.length - 1; d >= 0; d--) {
    var v = shortestEdit[d]
    var len = v.length

    k = x - y

    addK = k + 1 < 0 ? len - Math.abs(k + 1) : k + 1
    remK = k - 1 < 0 ? len - Math.abs(k - 1) : k - 1

    if (k === -d || (k !== d && (v[remK] < v[addK]))) {
      prevK = k + 1
      _prevK = addK
    } else {
      prevK = k - 1
      _prevK = remK
    }

    prevX = v[_prevK]
    prevY = prevX - prevK

    while (x > prevX && y > prevY) {
      f(x - 1, y - 1, x, y)
      x = x - 1
      y = y - 1
    }

    if (d > 0) f(prevX, prevY, x, y)

    x = prevX
    y = prevY
  }

  return diffPath

  function _updateDiffPath (px, py, x, y) {
    if (x === px) {
      diffPath.unshift('INSERT')
    } else if (y === py) {
      diffPath.unshift('DELETE')
    } else {
      diffPath.unshift('UPDATE')
    }
  }
}

module.exports = main
