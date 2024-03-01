process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '387208538',
        'https://amazon.com/yes',
        'Wabi',
        'English',
        200,
        'Wabi Times',
        'my amazing life', 2018)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn;
});

describe("POST /books", function () {
  test("Create a new book", async function () {
    const response = await request(app).post(`/books`).send({
      isbn: "8748374297",
      amazon_url: "https://amazon.com/dog",
      author: "Welly",
      language: "english",
      pages: 150,
      publisher: "Welly Times",
      title: "My nose",
      year: 2010,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("title");
  });

  test("Error without required fields", async function () {
    const response = await request(app)
      .post(`/books`)
      .send({ author: "Welly", page: "150" });
    expect(response.statusCode).toBe(400);
  });
});

describe("GET /books", function () {
  test("Get a list of a book", async function () {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0]).toHaveProperty("title");
  });
});

describe("GET /books/:isbn", function () {
  test("Gets a specific book", async function () {
    const response = await request(app).get(`/books/${book_isbn}`);
    expect(response.body.book).toHaveProperty("title");
    expect(response.body.book.isbn).toBe(book_isbn);
  });

  test("Return 404 if the specific book wasn't found", async function () {
    const response = await request(app).get(`/books/1000`);
    expect(response.statusCode).toBe(404);
  });
});

describe("PUT /books/:id", function () {
  test("Updates a book", async function () {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      amazon_url: "https://amazon.com",
      author: "Elsie",
      language: "english",
      pages: 300,
      publisher: "Wabi Times",
      title: "My awsome life",
      year: 2018,
    });
    expect(response.body.book).toHaveProperty("title");
    expect(response.body.book.author).toBe("Elsie");
  });

  test("Return 404 if the specific book wasn't found", async function () {
    await request(app).delete(`/books/${book_isbn}`);
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(404);
  });
});

describe("DELETE /books/:id", function () {
  test("Deletes a book", async function () {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.body).toEqual({ message: "deleted" });
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});
