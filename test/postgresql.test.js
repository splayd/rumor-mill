/* @flow */
import test from 'ava'
import { startContainer, removeContainer } from 'sidelifter'
import {
  openDatabase,
  closeDatabase,
  columnTypes,
  createTables,
  insertRows,
  selectRows
} from 'rumor-mill'

let container, port

test.before(async () => {
  container = await startContainer({
    image: 'postgres:latest',
    env: {
      POSTGRES_DB: 'database',
      POSTGRES_USER: 'user',
      POSTGRES_PASSWORD: 'password'
    }
  })

  port = container.ports.get(5432)
})

test.after.always(async () => {
  await removeContainer(container)
})

test('interacting with a PostgreSQL database', async t => {
  const database1 = await openDatabase(
    `postgresql://user:password@127.0.0.1:${String(port)}/database`
  )

  const database2 = await createTables(database1, {
    articles: { id: columnTypes.primaryKey, title: columnTypes.string }
  })
  await insertRows(database2, 'articles', [
    { title: 'Post 1' },
    { title: 'Post 2' }
  ])

  const articles = await selectRows(database2, 'articles')
  t.deepEqual(articles, [
    { id: 1, title: 'Post 1' },
    { id: 2, title: 'Post 2' }
  ])

  await closeDatabase(database2)
})

test('attempting to connect with incorrect credentials', async t => {
  await t.throwsAsync(
    openDatabase(`postgresql://user:wrong@127.0.0.1:${String(port)}/database`),
    {
      message: 'password authentication failed for user "user"'
    }
  )
})
