'use strict'

const { Readable } = require('stream')
const ltgt = require('ltgt')

class Live extends Readable {
  constructor (db, opts) {
    super({ objectMode: true })

    this.db = db
    this.buf = []
    this.opts = opts

    this.onput = this.onput.bind(this)
    this.ondel = this.ondel.bind(this)
    this.onbatch = this.onbatch.bind(this)

    db.on('put', this.onput)
    db.on('del', this.ondel)
    db.on('batch', this.onbatch)

    db
      .createReadStream(opts)
      .on('data', ({ key, value }) => this.onput(key, value))
  }

  start () {
    while (this.buf.length) {
      if (!this.push(this.buf.shift())) {
        break
      }
    }
  }

  _read () {
    this.start()
  }

  op (op) {
    if (ltgt.contains(this.opts, op.key)) {
      this.buf.push(op)
      if (this.buf.length === 1) this.start()
    }
  }

  onput (key, value) {
    this.op({ type: 'put', key, value })
  }

  ondel (key) {
    this.op({ type: 'del', key })
  }

  onbatch (ops) {
    for (const op of ops) this.op(op)
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
