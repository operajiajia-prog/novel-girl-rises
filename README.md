# novel-girl-rises · 崛起吧小说妹

A personal library and social reading app for Chinese web novels. You upload the
`.txt` files you already have, read them on any device with your position kept,
annotate as you go, and see what your friends are reading.

Next.js App Router · TypeScript · Prisma/PostgreSQL · Auth.js · Cloudflare R2
**68 commits · 158 source files · 63 test files**

---

## The problem it solves

Chinese web novels circulate as bare `.txt` files — often several megabytes, no
metadata, no chapter structure, and encoded in whatever the original site used.
Generic e-readers handle them badly: the text arrives as mojibake, the whole
book is one endless scroll, and your position is lost the moment you switch
device.

So the app has to do three unglamorous things well before any feature matters:
decode the file correctly, find the chapters, and remember where you were.

### Decoding

Chinese `.txt` files are commonly GB18030, GBK or BIG5 rather than UTF-8, and
they rarely say so. `lib/txt-parser/encoding.ts` checks for a UTF-8 BOM first,
falls back to `chardet` detection, strips the BOM before decoding, and hands the
buffer to `iconv-lite`. Getting this wrong is not a subtle bug — the reader
shows a page of garbage.

### Chapters

`lib/txt-parser/chapters.ts` splits on Chinese chapter headings:

```
/^(第[零〇一二三四五六七八九十百千万\d]+[章节回篇卷][^\n]*)/gm
```

It accepts Chinese numerals and Arabic digits, and all five common chapter
words (章 / 节 / 回 / 篇 / 卷). A file with no recognisable headings is not an
error — it becomes a single chapter titled 正文, so an unstructured book still
opens and still reads.

### Position

Reading progress is stored as `(chapterIndex, charOffset)` on the `Book` row,
not as a scroll percentage. Character offsets survive re-parsing and re-rendering
at a different font size or screen width, so picking the book up on a phone lands
you on the same sentence you left on a laptop.

---

## What is in it

Nine Prisma models, which is roughly the shape of the product:

| Model | What it carries |
|---|---|
| `User`, `Friendship` | Accounts, and friend requests with a pending/accepted state |
| `Book` | The file plus its shelf metadata — status, genre, tags, an emotion tag, synopsis, private notes, archive flag |
| `Bookmark`, `Annotation`, `ReadingNote` | Three different things people do while reading, kept separate on purpose |
| `Booklist`, `BooklistEntry` | Curated lists, so a shelf can be shared as a thing rather than a pile |
| `ActivityFeed` | What friends have been reading, finishing and recommending |

Routes cover a reader (`/reader/[bookId]`), a library with filtering and bulk
actions, profiles, and a social feed. Uploads go to Cloudflare R2, single or
batch.

---

## Testing

63 test files, organised by what they are protecting rather than by file
structure:

```
__tests__/api/          22 route handlers, one file each
__tests__/components/   24 components
__tests__/journeys/     four end-to-end user flows (upload, reading, library, social)
__tests__/edge-cases/   concurrency, reader boundaries, upload failures
__tests__/a11y/         accessibility assertions on components
__tests__/lib/          the txt parser: encoding, chapters, metadata
e2e/                    5 Playwright specs, including a dedicated a11y spec
```

The `journeys/` and `edge-cases/` split is deliberate. Journey tests answer
"can a person actually get through this"; edge-case tests answer "what happens
when two of them do it at once, or the file is broken". Unit tests on the parser
answer neither, which is why they are separate again.

---

## Running it

```bash
cp .env.local.example .env.local   # Postgres, Auth.js secret, Cloudflare R2
npm install
npx prisma migrate dev
npm run dev
```

```bash
npm test                 # vitest, watch mode
npm run test:run         # vitest, single pass
npx playwright test      # the e2e specs
```
