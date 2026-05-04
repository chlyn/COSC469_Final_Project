if (process.env.NODE_ENV !== "test") {
  throw new Error("Tests must run with NODE_ENV=test");
}

const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../server");
const { sequelize, User } = require("../models");

describe("Auth API", () => {
  beforeAll(async () => {
    expect(sequelize.config.database).toBe("cosc469_final_project_test");

    await sequelize.sync({ force: true });

    const password_hash = await bcrypt.hash("Password123!", 10);

    await User.create({
      firstname: "Test",
      lastname: "User",
      email: "test@example.com",
      password_hash,
      accountType: "patient",
      emailVerified: true,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("logs in with valid credentials", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "Password123!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.user.email).toBe("test@example.com");
  });

  test("rejects invalid password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        email: "test@example.com",
        password: "WrongPassword",
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.ok).toBe(false);
  });
});
