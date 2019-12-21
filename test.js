'use strict'

const { test } = require('tap')
const level = require('level-mem')
const Live = require('.')

test('level-live', t => {
  const db = level('db')

  db.put('m', 'm', () => {
    const stream = new Live(db, { gt: 'c' })

    stream.once('data', op => {
      t.deepEqual(op, { type: 'put', key: 'm', value: 'm' })

      stream.once('data', op => {
        t.deepEqual(op, { type: 'put', key: 'e', value: 'e' })

        stream.once('data', op => {
          t.deepEqual(op, { type: 'del', key: 'e' })

          stream.once('data', op => {
            t.deepEqual(op, { type: 'put', key: 'x', value: 'x' })

            stream.once('data', op => {
              t.deepEqual(op, { type: 'put', key: 'y', value: 'y' })

              stream.once('data', () => t.fail())
              stream.destroy()
              db.put('z', 'z', () => {
                t.end()
              })
            })
          })
          db
            .batch()
            .put('x', 'x')
            .put('y', 'y')
            .write()
        })
        db.del('e')
      })
      db.put('a', 'a')
      db.put('e', 'e')
    })
  })
})

test('no opts', t => {
  const db = level('no opts')
  const stream = new Live(db)
  stream.once('data', op => {
    t.deepEqual(op, { type: 'put', key: 'foo', value: 'bar' })
    t.end()
  })
  db.put('foo', 'bar')
})

test('ready event', t => {
  t.plan(5)
  const db = level('ready')
  db.put('a', 'a')
  db.put('b', 'b')
  setTimeout(() => {
    let i = 0
    const stream = new Live(db)
    stream.on('data', op => {
      i++
      if (i === 1) t.equal(op.key, 'a')
      if (i === 2) t.equal(op.key, 'b')
      if (i === 3) t.equal(op.key, 'c')
      if (i === 4) t.equal(op.key, 'd')
    })
    stream.on('sync', () => {
      t.equal(i, 2)
    })
    setTimeout(() => {
      db.put('c', 'c')
      db.put('d', 'd')
    }, 100)
  }, 10)
})

test('skip old', t => {
  t.plan(2)
  const db = level('skip old')
  db.put('a', 'a')
  db.put('b', 'b')
  let i = 0
  setTimeout(() => {
    const stream = new Live(db, { old: false })
    stream.on('data', op => {
      i++
      if (i === 1) t.equal(op.key, 'c')
      if (i === 2) t.equal(op.key, 'd')
    })
  }, 50)
  setTimeout(() => {
    db.put('c', 'c')
    db.put('d', 'd')
  }, 100)
})
