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
