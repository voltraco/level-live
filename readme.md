# level-live

Simple, light and correct [LevelDB](https://github.com/level/level) live read stream implementation.

## Usage

```js
const stream = new Live(db, { gt: 'prefix' })

stream.on('data', ({ type, key, value }) => {
  // ...
})
```

## Installation

```bash
$ npm install voltraco/level-live
```

## API

### stream = new Live(db, opts)

`opts` is a levelup style range object with those possible options:

- `gt`
- `gte`
- `lt`
- `lte`
- `start`
- `end`

## License

Private.