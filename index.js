'use strict'

const { Readable } = require('stream')

class Live extends Readable {
  constructor (db, opts) {
    super(opts)

    this.db = db
    this.buf = []

    this.onput = this.onput.bind(this)
    this.ondel = this.ondel.bind(this)
    this.onbatch = this.onbatch.bind(this)

    db.on('put', this.onput)
    db.on('del', this.ondel)
    db.on('batch', this.onbatch)

    db.createReadStream(opts).on('data', this.onput)
  }

  _read () {
    if (this.buf.length) this.push(this.buf.shift())
  }

  push (op) {
    this.buf.push(op)
    this.emit('readable')
  }

  onput ({ key, value }) {
    this.push({ type: 'put', key, value })
  }

  ondel ({ key }) {
    this.push({ type: 'del', key })
  }

  onbatch (ops) {
    for (const op of ops) this.push(op)
  }

  _destroy (_, cb) {
    this.db.removeListener('put', this.onput)
    this.db.removeListener('del', this.ondel)
    this.db.removeListener('batch', this.onbatch)
    this.buf = []
    cb()
  }
}

module.exports = Live
